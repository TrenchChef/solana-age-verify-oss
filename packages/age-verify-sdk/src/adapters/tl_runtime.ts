import * as ort from 'onnxruntime-web';

/** Fetch and session create timeout (ms). */
const TIMEOUT_MS = 15_000;
/** Delay (ms) before retry after extreme timeout. */
const RETRY_AFTER_MS = 10_000;

/** Same model, alternate filenames (MODEL_MAPPING: model_core_v1/model_core_v2 are legacy names for model_core). */
const LOGIC_CORE_ALT_NAMES = ['model_core_v2.bin', 'model_core_v1.bin'];

export class LogicCoreL {
    private session: ort.InferenceSession | null = null;
    private inputName: string = 'input_1';

    async load(modelUrl: string) {
        const isWorker = typeof (self as any).importScripts === 'function';
        const origin = isWorker ? self.location.origin : (typeof window !== 'undefined' ? window.location.origin : '');

        ort.env.wasm.wasmPaths = origin + '/assets/';

        const candidateUrls = this.candidateUrls(modelUrl);
        console.log(`LogicEngine: Synchronizing core from ${candidateUrls[0]} (will try alternates if missing).`);

        const bytes = await this.fetchFirstAvailable(candidateUrls);
        const magic = Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ');
        console.log(`LogicEngine: Fetched ${bytes.length} bytes. Magic: ${magic}`);

        // Single primary path: WASM in worker (reliable), full providers in main thread. No fallbacks except extreme timeout.
        const providers = isWorker ? ['wasm'] : (['webgpu', 'webgl', 'wasm'] as const);

        try {
            this.session = await this.createSessionWithTimeout(bytes, providers as any);
        } catch (e: any) {
            const isTimeout = /timeout|abort|deadline/i.test(e?.message || '');
            if (isTimeout) {
                // Extreme timeout: wait 10s then retry with WASM; console warning only.
                console.warn('[LogicEngine] Extreme timeout on session create; retrying after 10s with WASM only (console warning only).');
                await new Promise((r) => setTimeout(r, RETRY_AFTER_MS));
                this.session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] });
            } else {
                throw e;
            }
        }

        this.inputName = this.session.inputNames[0];
        console.log(`LogicEngine: Ready. Component: ${this.inputName}`);
    }

    /** Build candidate URLs: primary (model_core.bin) then legacy names model_core_v2.bin, model_core_v1.bin (same model). */
    private candidateUrls(primaryUrl: string): string[] {
        const base = primaryUrl.replace(/\/[^/]+$/, '');
        const urls = [primaryUrl];
        for (const name of LOGIC_CORE_ALT_NAMES) {
            urls.push(`${base}/${name}`);
        }
        return urls;
    }

    /** Try each URL; return bytes from first that succeeds. On 404 try next; otherwise throw. */
    private async fetchFirstAvailable(urls: string[]): Promise<Uint8Array> {
        let lastError: Error | null = null;
        for (const url of urls) {
            try {
                const bytes = await this.fetchWithTimeout(url);
                if (url !== urls[0]) {
                    console.log(`LogicEngine: Loaded from alternate filename: ${url}`);
                }
                return bytes;
            } catch (e: any) {
                const is404 = e?.message?.includes('404') || e?.message?.includes('not found');
                if (is404) {
                    lastError = e instanceof Error ? e : new Error(String(e));
                    continue;
                }
                throw e;
            }
        }
        throw lastError ?? new Error('Model not found: no candidate URL succeeded.');
    }

    private async fetchWithTimeout(url: string): Promise<Uint8Array> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`Model fetch failed: ${response.status} ${response.statusText} for ${url}`);
            }
            const buffer = await response.arrayBuffer();
            return new Uint8Array(buffer);
        } catch (e: any) {
            clearTimeout(timeoutId);
            if (e?.name === 'AbortError') {
                throw new Error(`Model fetch timed out after ${TIMEOUT_MS / 1000}s for ${url}`);
            }
            throw e;
        }
    }

    private createSessionWithTimeout(
        bytes: Uint8Array,
        providers: ort.InferenceSession.ExecutionProviderConfig[]
    ): Promise<ort.InferenceSession> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Session create timed out after ${TIMEOUT_MS / 1000}s`));
            }, TIMEOUT_MS);

            ort.InferenceSession.create(bytes, { executionProviders: providers })
                .then((session) => {
                    clearTimeout(timeoutId);
                    resolve(session);
                })
                .catch((e) => {
                    clearTimeout(timeoutId);
                    reject(e);
                });
        });
    }

    async runInference(faceCanvas: HTMLCanvasElement | OffscreenCanvas): Promise<{ output: number, confidence: number }> {
        if (!this.session) return { output: 0, confidence: 0 };

        try {
            // 1. Preprocess: Resize to core requirements (64x64) and NCHW
            const inputTensor = await this.preprocess(faceCanvas);

            // 2. Run Inference
            const feeds: Record<string, ort.Tensor> = {};
            feeds[this.inputName] = inputTensor;

            const results = await this.session.run(feeds);

            // 3. Postprocess: Get Age
            // Model typically outputs: [gender_prob, age_score] or similar
            // Mapping logic for multi-task output vectors

            // Let's assume standard output for now and log it to debug if needed
            // Logic for specific core sequence classification

            const outputNames = this.session.outputNames;
            // Assuming one of them is age. Usually the second one for multi-task models.
            // But let's look for "age" keyword or "dense_2"

            // Diagnostic logic: output 0 is auxiliary, output 1 is primary classification

            let ageVal = 25;
            let confVal = 0.5;

            for (const name of outputNames) {
                const tensor = results[name];
                const data = tensor.data as Float32Array;

                const isLikelyAge = name.toLowerCase().includes('age') || name.includes('dense_2');

                // If single value, likely regression
                if (data.length === 1) {
                    const val = data[0];
                    console.log(`LogicEngine: Internal sequence signal (${name}):`, val);
                    // If it's 0-1, it's likely normalized age / 100
                    // Higher probability of being normalized if < 1.0 but some models use 0.0-1.0 to map to 0-80 or 0-100
                    ageVal = val < 1.0 ? val * 100 : val;
                    confVal = 0.85;
                    if (isLikelyAge) break; // Found it!
                }
                // If vector ~100 length, likely distribution (Softmax expectation)
                else if (data.length >= 80 && data.length <= 110) {
                    console.log(`LogicEngine: Diagnostic vector (${name}), size ${data.length}`);
                    let expectedAge = 0;
                    // ... (rest of logic remains same but we check summing)
                    // Check if it's already softmaxed (sums to ~1)
                    let sum = 0;
                    for (let i = 0; i < data.length; i++) sum += data[i];

                    let probs = data;
                    if (Math.abs(sum - 1.0) > 0.1) {
                        // Needs Softmax
                        const expData = Array.from(data).map(v => Math.exp(v));
                        const expSum = expData.reduce((a, b) => a + b, 0);
                        probs = new Float32Array(expData.map(v => v / expSum));
                    }

                    for (let i = 0; i < probs.length; i++) {
                        expectedAge += i * probs[i];
                    }

                    // Confidence is the max probability (peakiness)
                    confVal = Math.max(...Array.from(probs));
                    ageVal = expectedAge;
                    if (isLikelyAge) break;
                }
            }

            return {
                output: Math.max(1, Math.min(100, ageVal)),
                confidence: confVal
            };

        } catch (e) {
            console.warn('LogicEngine: Sequence failed:', e);
            return { output: 0, confidence: 0 };
        }
    }

    private async preprocess(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<ort.Tensor> {
        // Create a temporary implementation for resizing and normalization
        // This expects 64x64 input usually
        const width = 64;
        const height = 64;

        // Resize logic (using OffscreenCanvas or temp canvas)
        let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

        // Simple resize using a temp canvas
        let tempCanvas;
        if (typeof OffscreenCanvas !== 'undefined') {
            tempCanvas = new OffscreenCanvas(width, height);
            ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
        } else {
            tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
        }

        if (!ctx) throw new Error('No context');

        ctx.drawImage(canvas, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const { data } = imageData; // RGBA

        // Convert to Float32 NCHW [1, 3, 64, 64]
        const float32Data = new Float32Array(1 * 3 * width * height);

        for (let i = 0; i < width * height; i++) {
            // Normalize: (x - mean) / std ? Or just 0-1?
            // Common for these models: 0-1 or -1 to 1
            // logic engine expectation

            const r = data[i * 4] / 255.0;
            const g = data[i * 4 + 1] / 255.0;
            const b = data[i * 4 + 2] / 255.0;

            // NCHW
            // R plane
            float32Data[i] = r;
            // G plane
            float32Data[width * height + i] = g;
            // B plane
            float32Data[2 * width * height + i] = b;
        }

        return new ort.Tensor('float32', float32Data, [1, 3, height, width]);
    }
}

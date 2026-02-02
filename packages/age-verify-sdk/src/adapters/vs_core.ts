import * as faceDetection from '@tensorflow-models/face-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import { SensorInterface, DetectionResult } from "../types";
import { V_128_Gen } from '../embedding/descriptor';
import { S_Op } from '../liveness/surface';
import { LogicCoreL } from './tl_runtime';

/** Required model_x assets (obfuscated names only; IMMUTABLES §5). All must load. */
const REQUIRED_M0X_ASSETS = [
    'model_a_cfg.json', 'model_a.bin',
    'model_b_cfg.json', 'model_b.bin',
    'model_c_cfg.json', 'model_c1.bin', 'model_c2.bin',
    'model_d_cfg.json', 'model_d.bin',
];

// Setup WASM paths for TFJS if not already set (can also be done in worker entry)
// But tfjs-backend-wasm automatically looks in root if not specified.

export class S_D_Engine implements SensorInterface {
    private detector: faceDetection.FaceDetector | null = null;
    private surfaceAnalytic: S_Op;
    private logicCore: LogicCoreL | null = null;
    /** Loaded model_a–model_d asset bytes (IMMUTABLES §5). All must be present. */
    private m0xAssetBytes: Map<string, ArrayBuffer> = new Map();
    private isLoaded = false;
    private lastOutputCheck = 0;
    private cachedOutput: number | null = null;
    private cachedConfidence: number | null = null;

    constructor() {
        this.surfaceAnalytic = new S_Op();
        this.logicCore = new LogicCoreL();
    }

    async load(basePath?: string) {
        if (this.isLoaded) return;

        console.log("S-D: Worker ready. Initializing TFJS...");

        const isWorker = typeof (self as any).importScripts === 'function';
        if (isWorker) {
            console.log("S-D: Worker context detected. Forcing WASM backend for stability...");
            const origin = self.location.origin;
            setWasmPaths(origin + '/assets/');
            await tf.setBackend('wasm');
        }

        // Wait for TFJS to be ready
        await tf.ready();
        console.log("S-D: TFJS Backend Ready. Using:", tf.getBackend());

        // All model_x assets must load (IMMUTABLES §5); obfuscated names only.
        const isWorkerCtx = typeof (self as any).importScripts === 'function';
        const origin = isWorkerCtx ? self.location.origin : (typeof window !== 'undefined' ? window.location.origin : '');
        const base = basePath ? (basePath.startsWith('/') && origin ? origin + basePath : basePath) : (origin + '/models');
        await this.loadRequiredM0xAssets(base);

        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = {
            runtime: 'tfjs', // use tfjs runtime for best worker compatibility
            modelType: 'short'
        };

        console.log("S-D: Creating Face Detector...");
        // @ts-ignore
        this.detector = await faceDetection.createDetector(model, detectorConfig);
        console.log("S-D: Face Detector Loaded.");

        // LogicCore (model_core) is required; no silent skip (IMMUTABLES §5).
        console.log("S-D: Initializing LogicCore...");
        let modelUrl = basePath ? `${basePath}/model_core.bin` : '/models/model_core.bin';

        // Ensure absolute URL if it starts with /
        if (modelUrl.startsWith('/') && origin) {
            modelUrl = origin + modelUrl;
        }

        await this.logicCore!.load(modelUrl);
        console.log("S-D: LogicCore (model_core) Loaded Successfully.");

        const m0xCount = this.m0xAssetBytes.size;
        console.log(`S-D: All 5 models loaded and ready (model_a–model_d: ${m0xCount} assets, model_core: LogicCore).`);
        console.log("S-D: Sync complete.");
        this.isLoaded = true;
    }

    /** Load all required model_x assets into memory (obfuscated names only); throw if any missing (IMMUTABLES §5). */
    private async loadRequiredM0xAssets(base: string): Promise<void> {
        const baseUrl = base.endsWith('/') ? base : base + '/';
        for (const name of REQUIRED_M0X_ASSETS) {
            const url = baseUrl + name;
            console.log(`S-D: Loading ${name}...`);
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Required asset failed to load: ${name} (${res.status})`);
            }
            const bytes = await res.arrayBuffer();
            this.m0xAssetBytes.set(name, bytes);
            console.log(`S-D: ${name} loaded (${bytes.byteLength} bytes).`);
        }
        console.log("S-D: All required model_x assets loaded.");
    }

    // Deterministic Age based on facial geometry
    // This is a heuristic for functional demo purposes to avoid random mocks.
    // It uses ratios between key features which are unique-ish to a face structure.
    private calculateGeometricAge(keypoints: { x: number, y: number }[]): number {
        if (keypoints.length < 6) return 0;

        // 6 points: 0: R-Eye, 1: L-Eye, 2: Nose, 3: Mouth, 4: R-Ear, 5: L-Ear
        const eyeR = keypoints[0];
        const eyeL = keypoints[1];
        const mouth = keypoints[3];
        const earR = keypoints[4];
        const earL = keypoints[5];

        // 1. Face Width (Ear to Ear)
        const faceWidth = Math.sqrt(Math.pow(earL.x - earR.x, 2) + Math.pow(earL.y - earR.y, 2));

        // 2. Eye Distance
        const eyeDistActual = Math.sqrt(Math.pow(eyeL.x - eyeR.x, 2) + Math.pow(eyeL.y - eyeR.y, 2));

        // 3. Central Verticality (Eyes Midpoint to Mouth)
        const eyesMid = { x: (eyeR.x + eyeL.x) / 2, y: (eyeR.y + eyeL.y) / 2 };
        const featureHeight = Math.sqrt(Math.pow(mouth.x - eyesMid.x, 2) + Math.pow(mouth.y - eyesMid.y, 2));

        // Avoid division by zero
        if (faceWidth === 0 || eyeDistActual === 0) return 0;

        // Ratios (Normalized Geometry)
        const ratio1 = (eyeDistActual / faceWidth); // ~0.2 - 0.3
        const ratio2 = (featureHeight / faceWidth); // ~0.15 - 0.25

        // NEW: Much flatter mapping.
        // Perspective distortion (being too close) causes ratios to spike.
        // We use lower coefficients to dampen this effect.
        const ageScore = (ratio1 * 20) + (ratio2 * 40);

        // Map to a realistic adult range starting from a baseline.
        // Neutral adult (score ~14) -> 14 + 10 = 24
        // Older/distorted (score ~25) -> 25 + 10 = 35
        // Very distorted (score ~40) -> 40 + 10 = 50
        let estimatedAge = ageScore + 10;

        if (Math.random() < 0.2) {
            console.log(`Diagnostic Output: r1=${ratio1.toFixed(3)}, r2=${ratio2.toFixed(3)}, score=${ageScore.toFixed(2)}, out=${estimatedAge.toFixed(1)}`);
        }

        // Clamping to a realistic human range, but ALLOWING sub-18.
        if (estimatedAge < 5) estimatedAge = 5;
        if (estimatedAge > 75) estimatedAge = 75;

        return Math.floor(estimatedAge);
    }

    async detect(frame: ImageData | HTMLCanvasElement | OffscreenCanvas): Promise<DetectionResult> {
        if (!this.detector || !this.isLoaded) {
            throw new Error("Sensor-D: Inactive.");
        }

        const faces = await this.detector.estimateFaces(frame as any);

        if (!faces || faces.length === 0) {
            return { faceFound: false };
        }

        const face = faces[0];
        const flatLandmarks: number[] = [];
        const keypoints = face.keypoints || [];

        if (keypoints.length > 0) {
            keypoints.forEach(kp => {
                flatLandmarks.push(kp.x, kp.y, kp.z || 0);
            });
        }

        // Diagnostic Heuristic (Deterministic)
        const geometricAge = this.calculateGeometricAge(keypoints);
        let outputEstimate = geometricAge;
        let enhancedAge: number | undefined = undefined;

        // Extract diagnostic region
        const box = face.box;
        const faceRegion = box ? {
            x: Math.floor(box.xMin),
            y: Math.floor(box.yMin),
            width: Math.floor(box.width),
            height: Math.floor(box.height)
        } : undefined;

        // Primary Dynamic Analysis (Triggered)
        const now = Date.now();
        if (this.logicCore && faceRegion && (now - this.lastOutputCheck > 1000)) {

            // Create a crop for the face to pass to LogicEngine
            try {
                // If frame is canvas, we can crop. If ImageData, harder without canvas.
                // Assuming frame is often Canvas/Video in browser, but TFJS detector allows ImageData.

                // Let's rely on a helper or just do a quick crop here if it's an OffscreenCanvas/Canvas
                if (frame instanceof HTMLCanvasElement || (typeof OffscreenCanvas !== 'undefined' && frame instanceof OffscreenCanvas)) {
                    if (faceRegion) {
                        const cropW = faceRegion.width;
                        const cropH = faceRegion.height;

                        if (cropW > 0 && cropH > 0) {
                            let cropCanvas: OffscreenCanvas | HTMLCanvasElement;
                            if (typeof OffscreenCanvas !== 'undefined') {
                                cropCanvas = new OffscreenCanvas(cropW, cropH);
                            } else {
                                cropCanvas = document.createElement('canvas');
                                cropCanvas.width = cropW;
                                cropCanvas.height = cropH;
                            }
                            const ctx = cropCanvas.getContext('2d', { willReadFrequently: true }) as any;
                            if (ctx) {
                                // Face Alignment (Rotation Correction)
                                const eyeR = keypoints[0];
                                const eyeL = keypoints[1];
                                if (eyeR && eyeL) {
                                    const angle = Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x);

                                    ctx.save();
                                    ctx.translate(cropW / 2, cropH / 2);
                                    ctx.rotate(-angle);
                                    ctx.drawImage(frame as any, faceRegion.x, faceRegion.y, cropW, cropH, -cropW / 2, -cropH / 2, cropW, cropH);
                                    ctx.restore();
                                } else {
                                    ctx.drawImage(frame as any, faceRegion.x, faceRegion.y, cropW, cropH, 0, 0, cropW, cropH);
                                }

                                // Run primary analysis
                                const result = await this.logicCore.runInference(cropCanvas);

                                if (result.output > 0) {
                                    this.cachedOutput = result.output;
                                    this.cachedConfidence = result.confidence;
                                    console.log(`Primary Analysis: Output ${result.output.toFixed(1)}, Confidence ${(result.confidence * 100).toFixed(1)}%`);
                                }
                            }
                        }
                    }
                }
                this.lastOutputCheck = now;
            } catch (e) {
                // Ignore transient errors
                this.lastOutputCheck = now;
            }
        }

        // Resolve output
        if (this.cachedOutput !== null) {
            enhancedAge = this.cachedOutput;
            outputEstimate = this.cachedOutput;
        }


        // Generate deterministic mapping
        const rawEmbedding = V_128_Gen.generate(flatLandmarks);
        const embedding = V_128_Gen.quantize(rawEmbedding);

        // Perform surface integrity diagnostics
        let surfaceScore: number | undefined;
        let surfaceFeatures: any | undefined;

        try {
            const surfaceResult = await this.surfaceAnalytic.analyze(frame, faceRegion);
            surfaceScore = surfaceResult.confidence;
            surfaceFeatures = surfaceResult.features;

            console.log('Surface Analysis:', {
                isValid: surfaceResult.isReal,
                confidence: surfaceResult.confidence,
                features: surfaceResult.features
            });
        } catch (error) {
            console.warn('Surface analysis failed:', error);
        }

        return {
            faceFound: true,
            landmarks: flatLandmarks,
            // @ts-ignore
            confidence: face.score !== undefined ? face.score[0] : 0.9,
            ageEstimate: outputEstimate,
            ageEstimateGeometric: geometricAge,
            ageEstimateEnhanced: enhancedAge,
            ageConfidence: this.cachedConfidence || undefined,
            embedding: embedding,
            surfaceScore,
            surfaceFeatures,
            ageMethod: this.cachedOutput !== null ? 'enhanced' : 'standard'
        };
    }
}

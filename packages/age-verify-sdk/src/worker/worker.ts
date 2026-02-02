console.log("Worker: Initializing...");

// Bridge console logs to main thread for visibility during LOAD_MODELS
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

// Known ONNX Runtime benign warnings in browser/WASM (no CPU vendor); do not surface as ERROR (IMMUTABLES §5).
const ONNX_WARNING_PATTERNS = [
    'Unknown CPU vendor',
    'cpuinfo_vendor',
    'LogEarlyWarning',
];

function isOnnxBenignWarning(text: string): boolean {
    return ONNX_WARNING_PATTERNS.some((p) => text.includes(p));
}

console.log = (...args: any[]) => {
    self.postMessage({ type: 'LOG', payload: args.map(String).join(' ') });
};
console.warn = (...args: any[]) => {
    self.postMessage({ type: 'LOG', payload: '[WARN] ' + args.map(String).join(' ') });
};
console.error = (...args: any[]) => {
    const payload = args.map(String).join(' ');
    if (isOnnxBenignWarning(payload)) {
        self.postMessage({ type: 'LOG', payload: '[WARN] ' + payload });
    } else {
        self.postMessage({ type: 'LOG', payload: '[ERROR] ' + payload });
    }
};

// Core Polyfills
if (typeof ImageData === 'undefined') {
    // @ts-ignore
    self.ImageData = class {
        constructor(public data: Uint8ClampedArray, public width: number, public height: number) { }
    };
}

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    try {
        // Dynamic import to defer initialization
        const { infer, loadModels } = await import('./infer');

        if (type === 'LOAD_MODELS') {
            try {
                await loadModels(payload?.basePath);
                self.postMessage({ type: 'LOADED' });
            } catch (err: any) {
                console.error("Worker: Model Load Failed:", err);
                self.postMessage({ type: 'ERROR', error: err.message });
            }
        } else if (type === 'PROCESS_FRAME') {
            try {
                const result = await infer(payload);
                self.postMessage({ type: 'RESULT', payload: result });
            } catch (err: any) {
                console.error("Worker: Inference Failed:", err);
                self.postMessage({ type: 'ERROR', error: err.message });
            }
        }
    } catch (err: any) {
        console.error("Worker: Logic Import Failed:", err);
        self.postMessage({ type: 'ERROR', error: `Worker init failed: ${err.message}` });
    }
};

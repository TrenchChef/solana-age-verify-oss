import { Frame } from './frame';
import { S_D_Engine } from '../adapters/vs_core';
import { DetectionResult } from '../types';

const adapter = new S_D_Engine();
let isLoaded = false;

export async function loadModels(basePath?: string) {
    if (!isLoaded) {
        await adapter.load(basePath);
        isLoaded = true;
    }
}

export async function infer(frame: Frame): Promise<DetectionResult> {
    if (!isLoaded) {
        await adapter.load();
        isLoaded = true;
    }

    // Use polyfilled ImageData if needed
    const imageData = new (ImageData as any)(frame.data as any, frame.width as any, frame.height as any);

    return await adapter.detect(imageData);
}

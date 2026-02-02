import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { SensorInterface, DetectionResult } from "../types";

export class SensorMAdapter implements SensorInterface {
    private landmarker: FaceLandmarker | null = null;
    private isLoaded = false;

    // Geometric heuristic using a stable subset of MediaPipe landmarks.
    private calculateGeometricAge(landmarks: { x: number; y: number; z?: number }[]): number {
        if (!landmarks || landmarks.length < 264) return 0;

        // MediaPipe Face Mesh landmark indices (stable, widely used)
        const eyeR = landmarks[33];
        const eyeL = landmarks[263];
        const nose = landmarks[1];
        const mouth = landmarks[13];
        const earR = landmarks[454];
        const earL = landmarks[234];

        if (!eyeR || !eyeL || !nose || !mouth || !earR || !earL) return 0;

        // Face width (ear/cheek to ear/cheek)
        const faceWidth = Math.sqrt(Math.pow(earL.x - earR.x, 2) + Math.pow(earL.y - earR.y, 2));
        const eyeDistActual = Math.sqrt(Math.pow(eyeL.x - eyeR.x, 2) + Math.pow(eyeL.y - eyeR.y, 2));
        const eyesMid = { x: (eyeR.x + eyeL.x) / 2, y: (eyeR.y + eyeL.y) / 2 };
        const featureHeight = Math.sqrt(Math.pow(mouth.x - eyesMid.x, 2) + Math.pow(mouth.y - eyesMid.y, 2));

        if (faceWidth === 0 || eyeDistActual === 0) return 0;

        const ratio1 = (eyeDistActual / faceWidth);
        const ratio2 = (featureHeight / faceWidth);
        const ageScore = (ratio1 * 20) + (ratio2 * 40);
        let estimatedAge = ageScore + 10;

        if (estimatedAge < 5) estimatedAge = 5;
        if (estimatedAge > 75) estimatedAge = 75;

        return Math.floor(estimatedAge);
    }

    async load(basePath: string = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm') {
        if (this.isLoaded) return;

        console.log("Sensor-M: Validating baseline...");
        const vision = await FilesetResolver.forVisionTasks(basePath);

        this.landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "CPU"
            },
            runningMode: "IMAGE",
            numFaces: 1
        });

        this.isLoaded = true;
        console.log("Sensor-M: Active.");
    }

    async detect(frame: ImageData | HTMLCanvasElement | OffscreenCanvas): Promise<DetectionResult> {
        if (!this.landmarker || !this.isLoaded) {
            throw new Error("Sensor-M: Inactive.");
        }

        // Analysis engine consumes frame data directly
        const result = this.landmarker.detect(frame as any);

        if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
            return { faceFound: false };
        }

        // Get first face
        const landmarks = result.faceLandmarks[0];
        const flatLandmarks: number[] = [];
        landmarks.forEach(p => {
            flatLandmarks.push(p.x, p.y, p.z);
        });

        const geometricAge = this.calculateGeometricAge(landmarks);

        return {
            faceFound: true,
            landmarks: flatLandmarks,
            confidence: 1.0,
            ageEstimate: geometricAge,
            ageEstimateGeometric: geometricAge,
            ageMethod: 'standard'
        };
    }
}

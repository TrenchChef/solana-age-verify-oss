/**
 * Surface Analytics for Automated Integrity Verification
 * 
 * This module analyzes the surface characteristics of a subject to distinguish between:
 * - Natural subjects (Deterministic Surface Heuristics)
 * - Synthetic/Spoofing attempts (Signal Variance detection)
 * 
 * Techniques used:
 * 1. Diagnostic-A (SH_A) - Pattern consistency
 * 2. Variant-B (SV_B) - Artifact detection
 * 3. Oscillation-C (IP_C) - Core signal check
 * 4. Response-D (PR_D) - Surface interaction
 */

export interface SurfaceAnalysisResult {
    isReal: boolean;
    confidence: number;
    features: {
        sh_a_score: number;      // 0-1, higher = consistent
        ip_c_detected: boolean;   // Synthetic artifact detected
        sv_b_score: number;       // 0-1, higher = natural signal
        pr_d_pattern: 'natural' | 'artificial' | 'unknown';
    };
    debugInfo?: {
        sh_a_data: number[];
        sv_b_frequencies: number[];
    };
}

/**
 * Primary diagnostic for surface integrity
 */
export class S_Op {
    private canvas: OffscreenCanvas | HTMLCanvasElement;
    private ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

    constructor() {
        // Use OffscreenCanvas in worker, HTMLCanvasElement in main thread
        if (typeof OffscreenCanvas !== 'undefined') {
            this.canvas = new OffscreenCanvas(256, 256);
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
        } else {
            this.canvas = document.createElement('canvas');
            this.canvas.width = 256;
            this.canvas.height = 256;
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
        }
    }

    /**
     * Main analysis function
     */
    async analyze(
        frame: ImageData | HTMLCanvasElement | OffscreenCanvas,
        faceRegion?: { x: number; y: number; width: number; height: number }
    ): Promise<SurfaceAnalysisResult> {
        // Extract diagnostic region
        const imageData = this.extractRegion(frame, faceRegion);

        // Run parallel heuristic checks
        const [shAScore, svBScore, ipCDetected, prDResult, surfaceFlags] = await Promise.all([
            this.runSH_A(imageData),
            this.runSV_B(imageData),
            this.runIP_C(imageData),
            this.runPR_D(imageData),
            this.runSurfaceSignals(imageData)
        ]);

        // Decision logic
        // INTERNAL NOTE: v2.0.0-beta.29 - Optimized for varied lighting
        const sh_alpha_threshold = 0.08;
        const sv_beta_threshold = 0.10;


        const isReal =
            shAScore > sh_alpha_threshold &&
            svBScore > sv_beta_threshold &&
            !ipCDetected &&
            prDResult !== 'artificial' &&
            !surfaceFlags.screenLike &&
            !surfaceFlags.printLike &&
            !surfaceFlags.maskLike;

        // Confidence calculation
        let confidence: number;

        if (isReal) {
            const qualityBonus = (Math.min(1, shAScore) * 0.1) + (Math.min(1, svBScore) * 0.1);
            confidence = 0.80 + qualityBonus;
        } else {
            const shDist = Math.max(0, sh_alpha_threshold - shAScore);
            const svDist = Math.max(0, sv_beta_threshold - svBScore);
            confidence = Math.max(0.1, 0.60 - (shDist + svDist));
        }

        confidence = Math.min(1.0, Math.max(0.0, confidence));

        return {
            isReal,
            confidence,
            features: {
                sh_a_score: shAScore,
                ip_c_detected: ipCDetected,
                sv_b_score: svBScore,
                pr_d_pattern: prDResult
            }
        };
    }

    /**
     * Extract region of interest from frame
     */
    private extractRegion(
        frame: ImageData | HTMLCanvasElement | OffscreenCanvas,
        region?: { x: number; y: number; width: number; height: number }
    ): ImageData {
        // Draw to canvas
        if (frame instanceof ImageData) {
            this.ctx.putImageData(frame, 0, 0);
        } else {
            this.ctx.drawImage(frame as any, 0, 0, this.canvas.width, this.canvas.height);
        }

        // Extract region if specified
        if (region) {
            const { x, y, width, height } = region;
            return this.ctx.getImageData(x, y, width, height);
        }

        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Diagnostic-A (Internal: Pattern consistency)
     */
    private async runSH_A(imageData: ImageData): Promise<number> {
        const { data, width, height } = imageData;
        const grayscale = this.toGrayscale(data, width, height);

        // LBP histogram (256 bins for uniform LBP)
        const histogram = new Array(256).fill(0);

        // Calculate LBP for each pixel (excluding borders)
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const center = grayscale[y * width + x];
                let lbpValue = 0;

                // 8 neighbors in clockwise order
                const neighbors = [
                    grayscale[(y - 1) * width + (x - 1)], // top-left
                    grayscale[(y - 1) * width + x],       // top
                    grayscale[(y - 1) * width + (x + 1)], // top-right
                    grayscale[y * width + (x + 1)],       // right
                    grayscale[(y + 1) * width + (x + 1)], // bottom-right
                    grayscale[(y + 1) * width + x],       // bottom
                    grayscale[(y + 1) * width + (x - 1)], // bottom-left
                    grayscale[y * width + (x - 1)]        // left
                ];

                // Build LBP code
                for (let i = 0; i < 8; i++) {
                    if (neighbors[i] >= center) {
                        lbpValue |= (1 << i);
                    }
                }

                histogram[lbpValue]++;
            }
        }

        // Normalize histogram
        const totalPixels = (width - 2) * (height - 2);
        const normalizedHist = histogram.map(v => v / totalPixels);

        // Calculate entropy (measure of surface complexity)
        let entropy = 0;
        for (const p of normalizedHist) {
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        }

        // Normalize entropy to 0-1 range (max entropy for 256 bins is 8)
        const normalizedEntropy = entropy / 8;

        // Natural subjects have moderate-to-high entropy (complex surface)
        // Photos/screens have lower entropy (uniform patterns)
        return normalizedEntropy;
    }

    /**
     * Variant-B (Internal: Signal integrity)
     */
    private async runSV_B(imageData: ImageData): Promise<number> {
        const { data, width, height } = imageData;
        const grayscale = this.toGrayscale(data, width, height);

        // Simple frequency analysis using gradient magnitude
        let totalGradient = 0;
        let highFreqCount = 0;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                // Sobel gradients
                const gx =
                    -grayscale[(y - 1) * width + (x - 1)] +
                    grayscale[(y - 1) * width + (x + 1)] +
                    -2 * grayscale[y * width + (x - 1)] +
                    2 * grayscale[y * width + (x + 1)] +
                    -grayscale[(y + 1) * width + (x - 1)] +
                    grayscale[(y + 1) * width + (x + 1)];

                const gy =
                    -grayscale[(y - 1) * width + (x - 1)] +
                    -2 * grayscale[(y - 1) * width + x] +
                    -grayscale[(y - 1) * width + (x + 1)] +
                    grayscale[(y + 1) * width + (x - 1)] +
                    2 * grayscale[(y + 1) * width + x] +
                    grayscale[(y + 1) * width + (x + 1)];

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                totalGradient += magnitude;

                // Count high-frequency components (sharp edges)
                if (magnitude > 50) {
                    highFreqCount++;
                }
            }
        }

        const avgGradient = totalGradient / ((width - 2) * (height - 2));
        const highFreqRatio = highFreqCount / ((width - 2) * (height - 2));

        // Real skin has moderate gradients with natural variation
        // Printed images have either too uniform or too sharp edges
        // Score based on "naturalness" of gradient distribution
        // RELAXED RANGES: Widen bounds for sunny rooms and varied webcam qualities
        const naturalGradientRange = avgGradient > 2 && avgGradient < 120;
        const naturalFreqRatio = highFreqRatio > 0.005 && highFreqRatio < 0.45;

        return (naturalGradientRange && naturalFreqRatio) ? 0.7 : 0.3;
    }

    /**
     * Oscillation-C (Internal: Artifact detection)
     */
    private async runIP_C(imageData: ImageData): Promise<boolean> {
        const { data, width, height } = imageData;

        // Look for periodic patterns that indicate moiré
        // Simple approach: check for regular oscillations in intensity
        let periodicityScore = 0;
        const sampleRows = 10;

        for (let i = 0; i < sampleRows; i++) {
            const y = Math.floor((height / sampleRows) * i);
            const rowData: number[] = [];

            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                rowData.push(gray);
            }

            // Count zero-crossings (sign changes in derivative)
            let crossings = 0;
            for (let x = 1; x < rowData.length - 1; x++) {
                const diff1 = rowData[x] - rowData[x - 1];
                const diff2 = rowData[x + 1] - rowData[x];
                if (diff1 * diff2 < 0) crossings++;
            }

            // High crossing count indicates periodic pattern
            const crossingRatio = crossings / width;
            if (crossingRatio > 0.3) periodicityScore++;
        }

        // Moiré detected if multiple rows show high periodicity
        return periodicityScore > sampleRows * 0.5;
    }

    /**
     * Response-D (Internal: Light distribution)
     */
    private async runPR_D(imageData: ImageData): Promise<'natural' | 'artificial' | 'unknown'> {
        const { data } = imageData;

        // Analyze brightness distribution
        const brightnesses: number[] = [];
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            brightnesses.push(brightness);
        }

        // Calculate statistics
        const mean = brightnesses.reduce((a, b) => a + b, 0) / brightnesses.length;
        const variance = brightnesses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / brightnesses.length;
        const stdDev = Math.sqrt(variance);

        // Real skin has moderate variance (natural shadows and highlights)
        // Photos/screens tend to have either too uniform or too high contrast
        const coefficientOfVariation = stdDev / (mean + 1); // +1 to avoid division by zero

        if (coefficientOfVariation > 0.10 && coefficientOfVariation < 0.8) {
            return 'natural';
        } else if (coefficientOfVariation < 0.05 || coefficientOfVariation > 1.5) {
            return 'artificial';
        }

        return 'unknown';
    }

    /**
     * Deterministic surface signals used to flag likely spoof surfaces.
     */
    private async runSurfaceSignals(imageData: ImageData): Promise<{
        screenLike: boolean;
        printLike: boolean;
        maskLike: boolean;
    }> {
        const { data, width, height } = imageData;

        // 1) Specular highlight detection (screens / glossy prints)
        let brightCount = 0;
        let brightLowVarCount = 0;
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            if (max > 235) {
                brightCount++;
                if ((max - min) < 10) brightLowVarCount++;
            }
            total++;
        }
        const brightRatio = brightCount / Math.max(1, total);
        const specularRatio = brightLowVarCount / Math.max(1, brightCount);

        // 2) Uniform color field detection (prints / masks / statues)
        let meanR = 0, meanG = 0, meanB = 0;
        for (let i = 0; i < data.length; i += 4) {
            meanR += data[i];
            meanG += data[i + 1];
            meanB += data[i + 2];
        }
        const n = Math.max(1, total);
        meanR /= n; meanG /= n; meanB /= n;
        let varR = 0, varG = 0, varB = 0;
        for (let i = 0; i < data.length; i += 4) {
            varR += Math.pow(data[i] - meanR, 2);
            varG += Math.pow(data[i + 1] - meanG, 2);
            varB += Math.pow(data[i + 2] - meanB, 2);
        }
        const stdR = Math.sqrt(varR / n);
        const stdG = Math.sqrt(varG / n);
        const stdB = Math.sqrt(varB / n);
        const lowColorVariance = (stdR + stdG + stdB) / 3 < 18;

        // 3) Edge-grid periodicity (screen pixel grid)
        let gridScore = 0;
        const sampleStride = Math.max(1, Math.floor(width / 32));
        for (let y = sampleStride; y < height - sampleStride; y += sampleStride) {
            let transitions = 0;
            for (let x = sampleStride; x < width - sampleStride; x += sampleStride) {
                const idx = (y * width + x) * 4;
                const idxR = (y * width + (x + sampleStride)) * 4;
                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                const grayR = (data[idxR] + data[idxR + 1] + data[idxR + 2]) / 3;
                if (Math.abs(gray - grayR) > 20) transitions++;
            }
            if (transitions > (width / sampleStride) * 0.35) gridScore++;
        }
        const gridLike = gridScore > (height / sampleStride) * 0.25;

        // Heuristic flags
        const screenLike = (brightRatio > 0.02 && specularRatio > 0.6) || gridLike;
        const printLike = lowColorVariance && brightRatio < 0.01;
        const maskLike = lowColorVariance && brightRatio > 0.01 && specularRatio < 0.4;
        return { screenLike, printLike, maskLike };
    }

    /**
     * Convert RGBA to grayscale
     */
    private toGrayscale(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
        const grayscale = new Uint8Array(width * height);

        for (let i = 0; i < grayscale.length; i++) {
            const idx = i * 4;
            // Luminance formula
            grayscale[i] = Math.floor(
                0.299 * data[idx] +
                0.587 * data[idx + 1] +
                0.114 * data[idx + 2]
            );
        }

        return grayscale;
    }
}

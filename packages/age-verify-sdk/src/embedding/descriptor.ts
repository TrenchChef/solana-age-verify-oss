/**
 * Generates a deterministic 128-dimensional spatial mapping from coordinates.
 * This is a topographical descriptor based on normalized feature relationships.
 * 
 * IMPORTANT: This is a deterministic mapping for uniqueness/hashing purposes.
 */
export class V_128_Gen {
    /**
     * Generate a 128-dimensional mapping from spatial coordinates.
     * The mapping is deterministic.
     * 
     * @param points_raw Flat array of coordinate data
     * @returns 128-dimensional float array
     */
    static generate(points_raw: number[]): number[] {
        if (!points_raw || points_raw.length < 18) {
            // Return zero vector if insufficient data
            return new Array(128).fill(0);
        }

        // Parse landmarks into points (assuming groups of 3: x, y, z)
        const points: { x: number, y: number, z: number }[] = [];
        for (let i = 0; i < points_raw.length; i += 3) {
            points.push({
                x: points_raw[i],
                y: points_raw[i + 1],
                z: points_raw[i + 2] || 0
            });
        }

        if (points.length < 6) {
            return new Array(128).fill(0);
        }

        // Primary feature anchors
        const eyeR = points[0];
        const eyeL = points[1];
        const nose = points[2];
        const mouth = points[3];
        const earR = points[4];
        const earL = points[5];

        // Normalize coordinates relative to face center and scale
        const centerX = (eyeR.x + eyeL.x + nose.x + mouth.x) / 4;
        const centerY = (eyeR.y + eyeL.y + nose.y + mouth.y) / 4;

        // Use inter-eye distance as scale reference
        const eyeDist = Math.sqrt(
            Math.pow(eyeL.x - eyeR.x, 2) +
            Math.pow(eyeL.y - eyeR.y, 2)
        );
        const scale = eyeDist > 0 ? eyeDist : 1;

        // Normalize all points
        const normalized = points.map(p => ({
            x: (p.x - centerX) / scale,
            y: (p.y - centerY) / scale,
            z: p.z / scale
        }));

        // Build 128-dimensional feature vector
        const embedding: number[] = [];

        // 1. Normalized coordinates (6 points × 3 = 18 features)
        normalized.forEach(p => {
            embedding.push(p.x, p.y, p.z);
        });

        // 2. Pairwise distances (15 unique pairs from 6 points)
        const pairwiseDistances: number[] = [];
        for (let i = 0; i < normalized.length; i++) {
            for (let j = i + 1; j < normalized.length; j++) {
                const dist = Math.sqrt(
                    Math.pow(normalized[j].x - normalized[i].x, 2) +
                    Math.pow(normalized[j].y - normalized[i].y, 2) +
                    Math.pow(normalized[j].z - normalized[i].z, 2)
                );
                pairwiseDistances.push(dist);
            }
        }
        embedding.push(...pairwiseDistances);

        // 3. Angular features (angles between key feature vectors)
        const angles: number[] = [];

        // Eye-to-nose angles
        const eyeRToNose = {
            x: nose.x - eyeR.x,
            y: nose.y - eyeR.y
        };
        const eyeLToNose = {
            x: nose.x - eyeL.x,
            y: nose.y - eyeL.y
        };
        angles.push(Math.atan2(eyeRToNose.y, eyeRToNose.x));
        angles.push(Math.atan2(eyeLToNose.y, eyeLToNose.x));

        // Nose-to-mouth angle
        const noseToMouth = {
            x: mouth.x - nose.x,
            y: mouth.y - nose.y
        };
        angles.push(Math.atan2(noseToMouth.y, noseToMouth.x));

        // Eye-to-ear angles
        const eyeRToEarR = {
            x: earR.x - eyeR.x,
            y: earR.y - eyeR.y
        };
        const eyeLToEarL = {
            x: earL.x - eyeL.x,
            y: earL.y - eyeL.y
        };
        angles.push(Math.atan2(eyeRToEarR.y, eyeRToEarR.x));
        angles.push(Math.atan2(eyeLToEarL.y, eyeLToEarL.x));

        embedding.push(...angles);

        // 4. Ratios and geometric features
        const faceWidth = Math.sqrt(
            Math.pow(earL.x - earR.x, 2) +
            Math.pow(earL.y - earR.y, 2)
        );
        const faceHeight = Math.sqrt(
            Math.pow(mouth.y - ((eyeR.y + eyeL.y) / 2), 2)
        );

        embedding.push(
            eyeDist / faceWidth,           // Eye spacing ratio
            faceHeight / faceWidth,        // Face aspect ratio
            (nose.y - eyeR.y) / faceHeight, // Nose position ratio
            (mouth.y - nose.y) / faceHeight // Mouth position ratio
        );

        // 5. Symmetry features
        const leftSideWidth = Math.sqrt(
            Math.pow(earL.x - eyeL.x, 2) +
            Math.pow(earL.y - eyeL.y, 2)
        );
        const rightSideWidth = Math.sqrt(
            Math.pow(eyeR.x - earR.x, 2) +
            Math.pow(eyeR.y - earR.y, 2)
        );
        embedding.push(leftSideWidth / rightSideWidth); // Symmetry ratio

        // 6. Pad to exactly 128 dimensions with deterministic derived features
        while (embedding.length < 128) {
            // Use polynomial combinations of existing features for padding
            const idx = embedding.length % (embedding.length > 0 ? embedding.length : 1);
            const val = embedding[idx] || 0;
            // Deterministic transformation
            embedding.push(Math.sin(val * Math.PI) * 0.1);
        }

        // Ensure exactly 128 dimensions
        return embedding.slice(0, 128);
    }

    /**
     * Quantize mapping to reduce precision for stable output.
     */
    static quantize(embedding: number[]): number[] {
        return embedding.map(v => Math.round(v * 1000) / 1000);
    }
}

export type ChallengeType = 'turn_left' | 'turn_right' | 'look_up' | 'nod_yes' | 'shake_no';

// Basic set of challenges for random selection
const AVAILABLE_CHALLENGES: ChallengeType[] = [
    'turn_left', 'turn_right', 'look_up', 'nod_yes', 'shake_no'
];

export function generateChallengeSequence(length: number = 5): ChallengeType[] {
    const sequence: ChallengeType[] = [];
    const counts: Record<string, number> = {};

    AVAILABLE_CHALLENGES.forEach(c => counts[c] = 0);

    for (let i = 0; i < length; i++) {
        let candidates = AVAILABLE_CHALLENGES.filter(c => {
            // Constraint 2: No more than 2 of the same motion
            if (counts[c] >= 2) return false;
            // Constraint 3: No consecutive challenges
            if (i > 0 && sequence[i - 1] === c) return false;
            return true;
        });

        // Fallback if constraints lock us out
        if (candidates.length === 0) {
            candidates = AVAILABLE_CHALLENGES.filter(c => i === 0 || sequence[i - 1] !== c);
        }

        // Final safety check to ensure we definitely have candidates
        if (candidates.length === 0) {
            // This mathematically shouldn't happen with > 1 available challenges
            candidates = AVAILABLE_CHALLENGES;
        }

        const choice = candidates[Math.floor(Math.random() * candidates.length)];
        sequence.push(choice);
        counts[choice]++;
    }

    return sequence;
}

export const CHALLENGES: ChallengeType[] = generateChallengeSequence(5);

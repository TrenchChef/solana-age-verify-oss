/**
 * Generates a premium gradient spinner HTML string for use in SDK UI overlays
 * Matches Solana brand colors (purple to cyan gradient)
 */
export function createSpinnerHTML(): string {
    const id = `sav-spin-${Math.random().toString(36).substring(2, 9)}`;
    return `
        <div style="display: flex; align-items: center; justify-content: center; padding: 20px;">
            <svg width="64" height="64" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#A855F7" />
                        <stop offset="100%" stop-color="#06B6D4" />
                    </linearGradient>
                </defs>
                <!-- Background track -->
                <circle cx="24" cy="24" r="20" stroke="rgba(255, 255, 255, 0.1)" stroke-width="5" />
                <!-- Animated partial circle -->
                <g>
                    <animateTransform 
                        attributeName="transform" 
                        type="rotate" 
                        from="-90 24 24" 
                        to="270 24 24" 
                        dur="1s" 
                        repeatCount="indefinite" />
                    <circle 
                        cx="24" 
                        cy="24" 
                        r="20" 
                        stroke="url(#${id})" 
                        stroke-width="5" 
                        stroke-linecap="round" 
                        stroke-dasharray="125.66" 
                        stroke-dashoffset="35" 
                        fill="none" 
                    />
                </g>
            </svg>
        </div>
    `;
}




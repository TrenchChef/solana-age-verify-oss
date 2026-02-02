import React from 'react';

interface SpinnerProps {
    size?: number;
    className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 48, className }) => {
    const spinnerId = "sav-premium-spinner-gradient";
    return (
        <div
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size,
                height: size,
            }}
            role="status"
            aria-label="Loading"
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id={spinnerId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                </defs>
                <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="5"
                />
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
                        stroke={`url(#${spinnerId})`}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray="125.66"
                        strokeDashoffset="35"
                    />
                </g>
            </svg>
        </div>
    );
};


export default Spinner;

import React from "react";

const InfinitySpin: React.FC<{
    size?: number;
    baseColor?: string;
    trailColor?: string;
}> = ({
    size = 100,
    baseColor = "var(--muted-foreground)",
    trailColor = "var(--primary)",
}) => {
        const animationKeyframes = `
        @keyframes infinityTrailDash {
            0% {
                stroke-dashoffset: 0;
            }
            100% {
                stroke-dashoffset: -300;
            }
        }
    `;

        return (
            <div
                style={{
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <style dangerouslySetInnerHTML={{ __html: animationKeyframes }} />
                <svg
                    viewBox="0 0 131 55"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        width: size,
                        height: size,
                        transform: 'scale(1, 1.5)', // Étirer verticalement
                        transformOrigin: 'center',
                    }}
                >
                    {/* Base infinie */}
                    <path
                        d="M5 27.5C5 11 31.5 0 65.5 27.5C99.5 55 126 44 126 27.5C126 11 99.5 0 65.5 27.5C31.5 55 5 44 5 27.5Z"
                        stroke={baseColor}
                        strokeWidth="5"
                        fill="none"
                    />

                    {/* Point animé */}
                    <path
                        d="M5 27.5C5 11 31.5 0 65.5 27.5C99.5 55 126 44 126 27.5C126 11 99.5 0 65.5 27.5C31.5 55 5 44 5 27.5Z"
                        stroke={trailColor}
                        strokeWidth="5"
                        fill="none"
                        style={{
                            strokeDasharray: '40, 259',
                            strokeDashoffset: '0',
                            animation: 'infinityTrailDash 1.5s linear infinite',
                        }}
                    />
                </svg>
            </div>
        );
    };

export default InfinitySpin;

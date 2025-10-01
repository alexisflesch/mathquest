import React from 'react';
import InfinitySpin from '@/components/InfinitySpin';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface LoadingScreenProps {
    message?: string;
    showMathSymbols?: boolean;
}

export default function LoadingScreen({
    message = "Chargement...",
    showMathSymbols = true
}: LoadingScreenProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
            <div className="text-center">
                {/* Custom infinity spinner */}
                <div className="flex justify-center mb-8">
                    <InfinitySpin
                        size={150}
                    />
                </div>

                {/* App logo/title */}
                <h2 className="text-3xl font-bold mb-2 text-[color:var(--foreground)]">
                    🧮 Kutsum
                </h2>

                {/* Loading text */}
                <p className="text-lg text-[color:var(--muted-foreground)]">
                    {message}
                </p>

                {/* Optional: Add some math-themed decorative elements */}
                {showMathSymbols && (
                    <div className="mt-8 flex justify-center space-x-4 text-2xl opacity-50">
                        <span className="text-[color:var(--primary)]">+</span>
                        <span className="text-[color:var(--secondary)]">×</span>
                        <span className="text-[color:var(--accent)]">÷</span>
                        <span className="text-[color:var(--success)]">−</span>
                    </div>
                )}
            </div>
        </div>
    );
}

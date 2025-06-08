"use client";

import React from 'react';
import InfinitySpin from '@/components/InfinitySpin';

// Loading screen component (copied from layout.tsx)
function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
            <div className="text-center">
                {/* Custom infinity spinner */}
                <div className="flex justify-center mb-8">
                    <InfinitySpin
                        // baseColor="#3b82f6"
                        size={150}
                    />
                </div>

                {/* App logo/title */}
                <h2 className="text-3xl font-bold mb-2 text-[color:var(--foreground)]">
                    🧮 MathQuest
                </h2>

                {/* Loading text */}
                <p className="text-lg text-[color:var(--muted-foreground)]">
                    Chargement...
                </p>

                {/* Optional: Add some math-themed decorative elements */}
                <div className="mt-8 flex justify-center space-x-4 text-2xl opacity-50">
                    <span className="text-[color:var(--primary)]">+</span>
                    <span className="text-[color:var(--secondary)]">×</span>
                    <span className="text-[color:var(--accent)]">÷</span>
                    <span className="text-[color:var(--success)]">−</span>
                </div>
            </div>
        </div>
    );
}

export default function LoadingPage() {
    return <LoadingScreen />;
}

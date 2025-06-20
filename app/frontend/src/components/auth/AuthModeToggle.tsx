'use client';

import React from 'react';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export type AuthMode = 'guest' | 'student' | 'teacher';

interface AuthModeToggleProps {
    currentMode: AuthMode;
    onModeChange: (mode: AuthMode) => void;
    className?: string;
}

export default function AuthModeToggle({
    currentMode,
    onModeChange,
    className = ""
}: AuthModeToggleProps) {
    const modes = [
        { key: 'guest' as const, label: 'Jouer en invité', icon: '🎮' },
        { key: 'student' as const, label: 'Compte étudiant', icon: '🎓' },
        { key: 'teacher' as const, label: 'Compte enseignant', icon: '👨‍🏫' }
    ];

    return (
        <div className={`bg-gray-50 p-1 rounded-lg flex space-x-1 ${className}`}>
            {modes.map(({ key, label, icon }) => (
                <button
                    key={key}
                    onClick={() => onModeChange(key)}
                    className={`
            flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${currentMode === key
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                        }
          `}
                >
                    <span className="mr-2">{icon}</span>
                    {label}
                </button>
            ))}
        </div>
    );
}

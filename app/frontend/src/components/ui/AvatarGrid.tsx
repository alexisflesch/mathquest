'use client';

import React from 'react';
import { ALL_ALLOWED_AVATARS } from '@shared/constants/avatars';

interface AvatarGridProps {
    selectedAvatar: string;
    onAvatarSelect: (avatar: string) => void;
    className?: string;
}

export default function AvatarGrid({ selectedAvatar, onAvatarSelect, className = "" }: AvatarGridProps) {
    return (
        <div className={`flex flex-wrap justify-center gap-2 sm:gap-4 max-h-80 overflow-y-auto p-2 sm:p-3 ${className}`}>
            {ALL_ALLOWED_AVATARS.map((avatar) => (
                <button
                    key={avatar}
                    type="button"
                    onClick={() => onAvatarSelect(avatar)}
                    className={`
                        avatar-option w-14 h-14 sm:w-16 sm:h-16 text-4xl sm:text-5xl rounded-lg border-2 transition-all duration-200
                        emoji-avatar flex items-center justify-center flex-shrink-0
                        ${selectedAvatar === avatar
                            ? 'border-blue-500 bg-blue-50 scale-110 shadow-md'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:scale-105'
                        }
                    `}
                >
                    {avatar}
                </button>
            ))}
        </div>
    );
}

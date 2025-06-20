'use client';

import React from 'react';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface AvatarGridProps {
    selectedAvatar: string;
    onAvatarSelect: (avatar: string) => void;
    className?: string;
}

// Comprehensive list of animal emojis - must match backend avatarUtils.ts
const ANIMAL_AVATARS = [
    // Mammals - Land
    '🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🐰', '🐺', '🦝', '🐷', '🐮', '🐹',
    '🐭', '🐗', '🦏', '🦛', '🐘', '🦒', '🦌', '🐄', '🐂', '🐃', '🐎', '🦄', '🦓', '🐑', '🐐', '🦙',
    '🦘', '🐪', '🐫', '🦔', '🦇', '🐿️', '🦫', '🦦', '🦨', '🦡',

    // Birds
    '🐔', '🐓', '🐣', '🐤', '🐥', '🦆', '🦅', '🦉', '🦚', '🦜', '🦢', '🐧', '🕊️', '🦃', '🦩',

    // Marine Animals
    '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🦈', '🐙', '🦑', '🦞', '🦀', '🐚', '🦐',

    // Reptiles & Amphibians
    '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖',

    // Insects & Small Creatures
    '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🦂', '🐝', '🪲', '🪳'
];

export default function AvatarGrid({ selectedAvatar, onAvatarSelect, className = "" }: AvatarGridProps) {
    return (
        <div className={`flex flex-wrap justify-center gap-4 max-h-80 overflow-y-auto p-3 ${className}`}>
            {ANIMAL_AVATARS.map((avatar) => (
                <button
                    key={avatar}
                    type="button"
                    onClick={() => onAvatarSelect(avatar)}
                    className={`
                        avatar-option w-16 h-16 text-5xl rounded-lg border-2 transition-all duration-200
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

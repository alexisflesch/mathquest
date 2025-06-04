/**
 * Avatar Selector Component
 * 
 * This component displays a grid of available avatar options and allows users
 * to select one for their profile. Key features include:
 * 
 * - Grid display of all available emoji avatars (animal emojis only)
 * - Visual highlighting of the currently selected avatar
 * - Responsive layout that adapts to different screen sizes
 * - Scrollable container for many avatar options
 * - Callback support for parent components to handle selection
 * 
 * Used during user registration, profile customization, and anywhere 
 * users need to select an avatar within the MathQuest application.
 */

import React, { useEffect, useState } from 'react';

// Available animal emojis for avatars
function getAvatarList() {
    return [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
        '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐧'
    ];
}

export default function AvatarSelector({ onSelect, selected }: { onSelect?: (avatar: string) => void, selected?: string }) {
    const [avatars, setAvatars] = useState<string[]>([]);

    useEffect(() => {
        setAvatars(getAvatarList());
    }, []);

    return (
        <div className="flex justify-center w-full h-full">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 w-full overflow-y-auto">
                {avatars.map((emoji) => (
                    <button
                        key={emoji}
                        className={`rounded-full border-2 bg-white w-16 h-16 flex items-center justify-center text-2xl ${selected === emoji ? 'border-blue-500' : 'border-gray-300'} hover:border-blue-500 focus:outline-none`}
                        onClick={() => onSelect && onSelect(emoji)}
                        type="button"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}

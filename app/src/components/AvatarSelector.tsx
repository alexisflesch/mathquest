/**
 * Avatar Selector Component
 * 
 * This component displays a grid of available avatar options and allows users
 * to select one for their profile. Key features include:
 * 
 * - Grid display of all available avatars from the public/avatars directory
 * - Visual highlighting of the currently selected avatar
 * - Responsive layout that adapts to different screen sizes
 * - Scrollable container for many avatar options
 * - Callback support for parent components to handle selection
 * 
 * Used during user registration, profile customization, and anywhere 
 * users need to select an avatar within the MathQuest application.
 */

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

// Dynamically load avatar filenames from the avatars folder
function getAvatarList() {
    // Hardcoded list based on your workspace (public/avatars)
    return [
        'angry-face-with-horns.svg', 'automobile.svg', 'bear-face.svg', 'bird.svg', 'blowfish.svg', 'boar.svg', 'bug.svg', 'camel.svg',
        'cat-face-with-wry-smile.svg', 'cat-face.svg', 'cow-face.svg', 'crab.svg', 'dog-face.svg', 'dragon-face.svg', 'ewe.svg',
        'face-with-rolling-eyes.svg', 'face-with-thermometer.svg', 'fish.svg', 'french-fries.svg', 'frog-face.svg', 'front-facing-baby-chick.svg',
        'ghost.svg', 'gorilla.svg', 'hamburger.svg', 'hamster-face.svg', 'hatching-chick.svg', 'honeybee.svg', 'horse-face.svg', 'koala.svg',
        'lady-beetle.svg', 'leopard.svg', 'lion-face.svg', 'lizard.svg', 'monkey.svg', 'mouse.svg', 'mrs-claus-medium-light-skin-tone.svg',
        'octopus.svg', 'owl.svg', 'ox.svg', 'panda-face.svg', 'penguin.svg', 'pig-face.svg', 'rabbit-face.svg', 'ram.svg', 'rat.svg',
        'robot-face.svg', 'rooster.svg', 'scorpion.svg', 'shark.svg', 'shrimp.svg', 'snail.svg', 'spider.svg', 'spouting-whale.svg',
        'tiger-face.svg', 'tropical-fish.svg', 'turkey.svg', 'turtle.svg', 'two-hump-camel.svg', 'unicorn-face.svg', 'whale.svg', 'wolf.svg',
    ];
}

export default function AvatarSelector({ onSelect, selected }: { onSelect?: (avatar: string) => void, selected?: string }) {
    const [avatars, setAvatars] = useState<string[]>([]);

    useEffect(() => {
        setAvatars(getAvatarList());
    }, []);

    return (
        <div className="flex justify-center w-full">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 max-w-xs sm:max-w-xl overflow-y-auto max-h-[220px] sm:max-h-72">
                {avatars.map((file) => (
                    <button
                        key={file}
                        className={`rounded-full border-2 bg-white ${selected === file ? 'border-blue-500' : 'border-gray-300'} hover:border-blue-500 focus:outline-none`}
                        style={{ backgroundColor: 'white' }}
                        onClick={() => onSelect && onSelect(file)}
                        type="button"
                    >
                        <Image
                            src={`/avatars/${file}`}
                            alt={file.replace('.svg', '')}
                            width={48}
                            height={48}
                            className="w-16 h-16 object-cover rounded-full"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

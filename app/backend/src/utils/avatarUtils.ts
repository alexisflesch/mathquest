/**
 * Avatar validation utilities for MathQuest
 * Ensures consistent animal emoji avatars across the platform
 */

import {
    ALLOWED_ANIMAL_AVATARS,
    EXTRA_ALLOWED_AVATARS,
    ALL_ALLOWED_AVATARS,
    type AllowedAvatar
} from '@shared/constants/avatars';

// Re-export for backward compatibility
export { ALLOWED_ANIMAL_AVATARS, EXTRA_ALLOWED_AVATARS, ALL_ALLOWED_AVATARS };
export type { AllowedAvatar };

/**
 * Validates if the provided avatar is one of the allowed animal emojis
 * @param avatar - The avatar string to validate
 * @returns true if valid, false otherwise
 */
export function isValidAvatar(avatar: string): avatar is AllowedAvatar {
    return ALL_ALLOWED_AVATARS.includes(avatar as AllowedAvatar);
}

/**
 * Validates avatar and throws an error if invalid
 * @param avatar - The avatar string to validate
 * @throws Error if avatar is not valid
 */
export function validateAvatar(avatar: string): void {
    if (!avatar) {
        throw new Error('Avatar is required');
    }

    if (!isValidAvatar(avatar)) {
        throw new Error(`Invalid avatar. Must be one of the allowed emojis: ${ALL_ALLOWED_AVATARS.join(', ')}`);
    }
}

/**
 * Gets a random valid animal avatar
 * @returns A random animal emoji from the allowed list
 */
export function getRandomAvatar(): AllowedAvatar {
    const randomIndex = Math.floor(Math.random() * ALLOWED_ANIMAL_AVATARS.length);
    return ALLOWED_ANIMAL_AVATARS[randomIndex];
}

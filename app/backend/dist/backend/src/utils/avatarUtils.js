"use strict";
/**
 * Avatar validation utilities for MathQuest
 * Ensures consistent animal emoji avatars across the platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_ALLOWED_AVATARS = exports.EXTRA_ALLOWED_AVATARS = exports.ALLOWED_ANIMAL_AVATARS = void 0;
exports.isValidAvatar = isValidAvatar;
exports.validateAvatar = validateAvatar;
exports.getRandomAvatar = getRandomAvatar;
const avatars_1 = require("@shared/constants/avatars");
Object.defineProperty(exports, "ALLOWED_ANIMAL_AVATARS", { enumerable: true, get: function () { return avatars_1.ALLOWED_ANIMAL_AVATARS; } });
Object.defineProperty(exports, "EXTRA_ALLOWED_AVATARS", { enumerable: true, get: function () { return avatars_1.EXTRA_ALLOWED_AVATARS; } });
Object.defineProperty(exports, "ALL_ALLOWED_AVATARS", { enumerable: true, get: function () { return avatars_1.ALL_ALLOWED_AVATARS; } });
/**
 * Validates if the provided avatar is one of the allowed animal emojis
 * @param avatar - The avatar string to validate
 * @returns true if valid, false otherwise
 */
function isValidAvatar(avatar) {
    return avatars_1.ALL_ALLOWED_AVATARS.includes(avatar);
}
/**
 * Validates avatar and throws an error if invalid
 * @param avatar - The avatar string to validate
 * @throws Error if avatar is not valid
 */
function validateAvatar(avatar) {
    if (!avatar) {
        throw new Error('Avatar is required');
    }
    if (!isValidAvatar(avatar)) {
        throw new Error(`Invalid avatar. Must be one of the allowed emojis: ${avatars_1.ALL_ALLOWED_AVATARS.join(', ')}`);
    }
}
/**
 * Gets a random valid animal avatar
 * @returns A random animal emoji from the allowed list
 */
function getRandomAvatar() {
    const randomIndex = Math.floor(Math.random() * avatars_1.ALLOWED_ANIMAL_AVATARS.length);
    return avatars_1.ALLOWED_ANIMAL_AVATARS[randomIndex];
}

"use strict";
/**
 * Avatar validation utilities for MathQuest
 * Ensures consistent animal emoji avatars across the platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXTRA_ALLOWED_AVATARS = exports.ALLOWED_ANIMAL_AVATARS = void 0;
exports.isValidAvatar = isValidAvatar;
exports.validateAvatar = validateAvatar;
exports.getRandomAvatar = getRandomAvatar;
// Allowed animal emoji avatars - comprehensive list of animal emojis
exports.ALLOWED_ANIMAL_AVATARS = [
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
exports.EXTRA_ALLOWED_AVATARS = [
    // Personnages / Créatures
    '🤖', // Robot
    '👽', // Extra-terrestre
    '👾', // Monstre pixelisé
    '🧸', // Nounours
    // Symboles liés aux animaux
    '🐾', // Empreintes de pattes
    // Fruits / Objets ludiques
    '🍉', // Pastèque
    '🍎', // Pomme
    '🍇', // Raisin (fun, coloré)
    // Icônes visuelles ludiques
    '⭐', // Étoile
    '🌟', // Étoile brillante
    '⚡', // Éclair
    '🌈', // Arc-en-ciel
    // Animaux manquants ou particuliers
    '🐊', // Crocodile
    '🐇', // Lapin de profil
    '🪼', // Méduse
    // Accessoires-personnages
    '👑', // Couronne
    '🎩', // Chapeau haut-de-forme
    '🕶️', // Lunettes de soleil
];
/**
 * Validates if the provided avatar is one of the allowed animal emojis
 * @param avatar - The avatar string to validate
 * @returns true if valid, false otherwise
 */
function isValidAvatar(avatar) {
    return exports.ALLOWED_ANIMAL_AVATARS.includes(avatar);
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
        throw new Error(`Invalid avatar. Must be one of the allowed animal emojis: ${exports.ALLOWED_ANIMAL_AVATARS.join(', ')}`);
    }
}
/**
 * Gets a random valid animal avatar
 * @returns A random animal emoji from the allowed list
 */
function getRandomAvatar() {
    const randomIndex = Math.floor(Math.random() * exports.ALLOWED_ANIMAL_AVATARS.length);
    return exports.ALLOWED_ANIMAL_AVATARS[randomIndex];
}

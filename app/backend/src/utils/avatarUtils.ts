/**
 * Avatar validation utilities for MathQuest
 * Ensures consistent animal emoji avatars across the platform
 */

// Allowed animal emoji avatars - comprehensive list of animal emojis
export const ALLOWED_ANIMAL_AVATARS = [
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
] as const;

export const EXTRA_ALLOWED_AVATARS = [
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
    '⭐',  // Étoile
    '🌟', // Étoile brillante
    '⚡',  // Éclair
    '🌈', // Arc-en-ciel

    // Animaux manquants ou particuliers
    '🐊', // Crocodile
    '🐇', // Lapin de profil
    '🪼', // Méduse

    // Accessoires-personnages
    '👑', // Couronne
    '🎩', // Chapeau haut-de-forme
    '🕶️', // Lunettes de soleil
] as const;


export type AllowedAvatar = typeof ALLOWED_ANIMAL_AVATARS[number];

/**
 * Validates if the provided avatar is one of the allowed animal emojis
 * @param avatar - The avatar string to validate
 * @returns true if valid, false otherwise
 */
export function isValidAvatar(avatar: string): avatar is AllowedAvatar {
    return ALLOWED_ANIMAL_AVATARS.includes(avatar as AllowedAvatar);
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
        throw new Error(`Invalid avatar. Must be one of the allowed animal emojis: ${ALLOWED_ANIMAL_AVATARS.join(', ')}`);
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

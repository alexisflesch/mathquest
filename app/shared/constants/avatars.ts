/**
 * Shared avatar constants for MathQuest
 * Ensures consistent emoji avatars across frontend and backend
 */

// Allowed animal emoji avatars - exhaustive and safe
export const ALLOWED_ANIMAL_AVATARS = [
    // 🐶 Mammals - Domestics
    '🐶', // Chien
    '🐕', // Chien
    '🦮', // Chien guide
    '🐕‍🦺', // Chien de service
    '🐩', // Caniche
    '🐺', // Loup
    '🦊', // Renard
    '🐱', // Chat
    '🐈', // Chat
    '🐈‍⬛', // Chat noir
    '🐅', // Tigre
    '🐆', // Panthère/guépard
    '🐯', // Tête de tigre
    '🦁', // Lion
    '🐴', // Cheval
    '🐎', // Cheval au galop
    '🦄', // Licorne
    '🦓', // Zèbre

    // 🐮 Mammals - Farm
    '🐮', // Vache
    '🐂', // Taureau
    '🐃', // Buffle
    '🐄', // Vache
    '🐷', // Cochon
    '🐖', // Porc
    '🐗', // Sanglier
    '🐏', // Bélier
    '🐑', // Mouton
    '🐐', // Chèvre
    '🦬', // Bison

    // 🐻 Mammals - Wild
    '🐻', // Ours brun
    '🐻‍❄️', // Ours polaire
    '🐼', // Panda
    '🐨', // Koala
    '🐹', // Hamster
    '🐭', // Souris
    '🐁', // Souris
    '🐀', // Rat
    '🐇', // Lapin
    '🐰', // Tête de lapin
    '🦇', // Chauve-souris
    '🦡', // Blaireau
    '🦨', // Moufette
    '🦦', // Loutre
    '🦥', // Paresseux
    '🦘', // Kangourou
    '🦙', // Lama
    '🦒', // Girafe
    '🦏', // Rhinocéros
    '🦛', // Hippopotame
    '🐘', // Éléphant
    '🦣', // Mammouth
    '🦫', // Castor
    '🦝', // Raton-laveur
    '🦌', // Cerf

    // 🦢 Birds
    '🐔', '🐓', '🐥', '🐤', '🐣',
    '🐦', // Oiseau
    '🐧', // Pingouin
    '🕊️', // Colombe
    '🦅', // Aigle
    '🦆', // Canard
    '🦉', // Hibou
    '🦇', // Chauve-souris déjà listée
    '🦚', // Paon
    '🦜', // Perroquet
    '🦢', // Cygne
    '🦤', // Dodo
    '🦩', // Flamant rose
    '🦃', // Dinde

    // 🐬 Marine animals
    '🐬', '🐋', '🐳',
    '🐟', '🐠', '🐡', '🦈',
    '🦭', // Phoque
    '🐙', // Poulpe
    '🦑', // Calamar
    '🦐', // Crevette
    '🦞', // Homard
    '🦀', // Crabe
    '🦪', // Huître
    '🐚', // Coquillage
    '🪼', // Méduse

    // 🦎 Reptiles & Amphibians
    '🐢', // Tortue
    '🐊', // Crocodile
    '🐍', // Serpent
    '🦎', // Lézard
    '🐉', '🐲', // Dragons stylisés
    '🦕', // Dinosaure herbivore
    '🦖', // Dinosaure carnivore
    '🐸', // Grenouille

    // 🐜 Insects & Small Creatures
    '🐝', '🪲', '🐞', '🐜', '🪳', '🪰', '🦟',
    '🐛', '🦋', '🐌',
    '🦗', // Criquet
    '🕷️', '🕸️', // Araignée et toile
    '🦂', // Scorpion
    '🧑‍🌾', // optionnel mais humain
] as const;

export const EXTRA_ALLOWED_AVATARS = [
    // Fun / symboles
    '🤖', '👽', '👾', '🧸',
    '🐾', // Empreintes de pattes
    '🍉', '🍎', '🍇',
    '⭐', '🌟', '⚡', '🌈',
    '👑', '🎩', '🕶️'
] as const;

// Combined list
export const ALL_ALLOWED_AVATARS = [...ALLOWED_ANIMAL_AVATARS, ...EXTRA_ALLOWED_AVATARS] as const;

// Types
export type AnimalAvatar = typeof ALLOWED_ANIMAL_AVATARS[number];
export type ExtraAvatar = typeof EXTRA_ALLOWED_AVATARS[number];
export type AllowedAvatar = typeof ALL_ALLOWED_AVATARS[number];
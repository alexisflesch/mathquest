import Filter from 'bad-words-next';
import fs from 'fs';
import path from 'path';
// Import CommonJS pour french-badwords-list
const frenchBadwordsList = require('french-badwords-list');

// Charger zacangerWords
const zacangerWords = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'dictionaries', 'words.json'), 'utf-8'));
// Charger le dictionnaire fr.txt personnalisé
const frTxtWords = fs.readFileSync(path.join(process.cwd(), 'dictionaries', 'fr.txt'), 'utf-8')
    .split('\n')
    .map(w => w.trim())
    .filter(Boolean);

// Fusionne toutes les listes (fr.txt + french-badwords-list + zacanger)
const allBadWords = [
    ...frTxtWords,
    ...frenchBadwordsList.array,
    ...zacangerWords
];
const data = { id: 'custom', words: allBadWords };
const filter = new Filter({ data });

// Fonction utilitaire pour vérifier un pseudo
export function checkPseudoWithSubstrings(pseudo: string, useSubstrings = false): boolean {
    if (!useSubstrings) {
        return filter.check(pseudo);
    }
    // Vérifie toutes les sous-chaînes de longueur >= 3
    const minLen = 3;
    const maxLen = pseudo.length;
    for (let i = 0; i < maxLen; i++) {
        for (let j = i + minLen; j <= maxLen; j++) {
            const sub = pseudo.slice(i, j);
            if (filter.check(sub)) {
                return true;
            }
        }
    }
    return false;
}

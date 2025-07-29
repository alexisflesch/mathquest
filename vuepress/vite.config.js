import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        // Servir le favicon à la racine en plus du base path
        middlewareMode: false,
    },
    publicDir: false, // Désactiver le publicDir par défaut de Vite
})

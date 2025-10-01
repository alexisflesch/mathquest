# Prévisualiser la landing page Kutsum

Pour lancer un petit serveur web local (statique) dans le dossier landing-page/ :

## Avec Python 3 (recommandé, déjà installé sur la plupart des systèmes)

```bash
cd landing-page
python3 -m http.server 8080
```

Puis ouvrez http://localhost:8080 dans votre navigateur.

## Avec Node.js (si vous préférez)

```bash
npm install -g serve
cd landing-page
serve -l 8080
```

## Screenshots

Placez les images de screenshots dans `landing-page/assets/` (ex: `login-page.png`, `tournament-join-form.png`).

---

**Déploiement** :
Copiez simplement le contenu du dossier `landing-page/` sur n'importe quel hébergement statique (Netlify, Vercel, nginx, etc.).

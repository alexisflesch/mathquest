# Landing Page Kutsum

Landing page professionnelle pour Kutsum, l'alternative libre à Kahoot.

## Prévisualiser localement

### Avec Python 3 (recommandé)

```bash
cd landing-page
python3 -m http.server 8080
```

Puis ouvrez http://localhost:8080 dans votre navigateur.

### Avec Node.js

```bash
npm install -g serve
cd landing-page
serve -l 8080
```

## Structure

- `index.html` - Page principale avec contenu SEO-optimisé
- `styles/main.css` - Design moderne, responsive, dark/light mode
- `assets/favicon.svg` - Favicon vectoriel
- `assets/screenshots/` - Captures d'écran de l'application

## Fonctionnalités

✅ Design professionnel et épuré orienté éducation  
✅ SEO optimisé (meta tags, schema.org, Open Graph)  
✅ Dark/light mode automatique + toggle manuel  
✅ Responsive (mobile, tablette, desktop)  
✅ Performance (lazy loading images)  
✅ Accessibilité (ARIA labels, structure sémantique)  

## Sections

1. **Hero** - Proposition de valeur claire ("Alternative libre à Kahoot")
2. **Pourquoi Kutsum** - 4 valeurs clés (gratuit, privé, open source, collaboratif)
3. **Trois modes** - Quiz, Tournoi, Entraînement avec détails
4. **Screenshots** - Galerie responsive
5. **CTA** - Appel à l'action final
6. **Footer** - Liens organisés par catégorie

## Déploiement

Copiez simplement le contenu du dossier `landing-page/` sur :
- Netlify
- Vercel
- GitHub Pages
- Votre serveur nginx/Apache

Aucune dépendance ni build nécessaire - 100% statique.

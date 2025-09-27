# Utilisation des scripts

Ce répertoire contient des scripts utiles pour l'écriture des questions, la mise à jour de la base de données et de la documentation vuepress.

## Scripts disponibles

- `import_questions.py` : Script pour importer des questions dans la base de données : pensez à renommer et mettre à jour le fichier `example.env` avec vos informations de connexion.
- `yaml2latex.py` : Convertit des fichiers YAML en fichiers LaTeX et pdf (utile pour les profs de maths, nécessite d'avoir LaTeX installé). Le code est maintenant organisé en modules dans le dossier `yaml2latex/` pour une meilleure maintenabilité.
- `deploy-doc.sh` : Déploie la documentation vuepress sur github pages (et récupère la nomenclature des questions).
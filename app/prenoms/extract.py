import pandas as pd
import json

# Remplace par le chemin vers le CSV téléchargé
fichier = "liste-complete.csv"

# Charger le CSV
prenoms = pd.read_csv(fichier, sep=";")

# Garder seulement prénom et nombre d'occurrences
prenoms = prenoms[["prenom", "valeur"]]

# Agréger par prénom
prenoms = prenoms.groupby("prenom", as_index=False).sum()

# Filtrer pour enlever les prénoms ultra-rares (ici >= 10 naissances cumulées)
prenoms_filtre = prenoms[prenoms["valeur"] >= 10]

# Extraire la liste triée
prenoms_list = sorted(prenoms_filtre["prenom"].unique().tolist())

# Sauvegarde en JSON
with open("prenoms.json", "w", encoding="utf-8") as f:
    json.dump(prenoms_list, f, ensure_ascii=False, indent=2)

print(f"Fichier généré avec {len(prenoms_list)} prénoms.")

Nom du style : mathquest-pro
🔷 Palette Tailwind cohérente (professionnelle, sérieuse, moderne)

Usage	Couleur HEX	Classe Tailwind
Primary	#2563EB	bg-blue-600
Primary hover	#1D4ED8	hover:bg-blue-700
Accent	#10B981	text-emerald-500
Background	#F9FAFB	bg-gray-50
Surface (cards)	#FFFFFF	bg-white
Text primary	#111827	text-gray-900
Text secondary	#6B7280	text-gray-500
Border	#E5E7EB	border-gray-200
Error	#DC2626	text-red-600
Tu peux intégrer ça dans ton tailwind.config.js via des couleurs customisées (facultatif), ou juste utiliser les classes telles quelles.

💡 Typo recommandée
Police principale : Inter ou Manrope — moderne, sérieuse, très lisible.

Intégration rapide via Google Fonts :

html
Copy
Edit
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
Et dans Tailwind :

js
Copy
Edit
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    }
  }
}
🧩 Composants à styliser pour donner le ton pro
Boutons

html
Copy
Edit
<button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow">
  Valider
</button>
Cards

html
Copy
Edit
<div class="bg-white p-6 rounded-lg shadow border border-gray-200">
  <h2 class="text-lg font-semibold text-gray-900">Titre</h2>
  <p class="text-gray-500">Contenu de la carte.</p>
</div>
Inputs

html
Copy
Edit
<input class="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
🧰 Bonus : DaisyUI pour rapidité
Si tu veux tester plusieurs looks rapidement, installe DaisyUI et teste avec le thème business ou corporate :

bash
Copy
Edit
npm install daisyui
js
Copy
Edit
// tailwind.config.js
plugins: [require("daisyui")],
daisyui: {
  themes: ["business", "corporate"]
}

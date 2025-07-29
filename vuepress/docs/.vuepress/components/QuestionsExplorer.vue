<template>
  <div>
    <label>Niveau :
      <select v-model="selectedNiveau" @change="onNiveauChange">
        <option value="">-- Choisir un niveau --</option>
        <option v-for="niveau in niveaux" :key="niveau" :value="niveau">{{ niveau }}</option>
      </select>
    </label>
    
    <label v-if="disciplines.length">Discipline :
      <select v-model="selectedDiscipline" @change="onDisciplineChange">
        <option value="">-- Choisir une discipline --</option>
        <option v-for="d in disciplines" :key="d" :value="d">{{ d }}</option>
      </select>
    </label>
    
    <label v-if="themes.length">Thème :
      <select v-model="selectedTheme" @change="onThemeChange">
        <option value="">-- Choisir un thème --</option>
        <option v-for="t in themes" :key="t" :value="t">{{ t }}</option>
      </select>
    </label>
    
    <!-- Liste simple des tags -->
    <div v-if="tags.length" class="tags-container">
      <h3>Tags disponibles :</h3>
      <ul class="tags-list">
        <li v-for="tag in tags" :key="tag">
          {{ tag }}
        </li>
      </ul>
    </div>
    
    <div v-if="niveaux.length === 0">
      <p>Chargement des données...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Import dynamique de tous les fichiers JSON dans le dossier data/
const jsonModules = import.meta.glob('../data/*.json', { eager: true })

// Ordre des niveaux dans le système français
const ORDRE_NIVEAUX = [
  'cp', 'ce1', 'ce2', 'cm1', 'cm2',
  'sixieme', '6eme', '6e',
  'cinquieme', '5eme', '5e',
  'quatrieme', '4eme', '4e',
  'troisieme', '3eme', '3e',
  'seconde', '2nde', '2de',
  'premiere', '1ere', '1re',
  'terminale', 'term', 'tle',
  'l1', 'l2', 'l3', 'm1', 'm2'
]

const niveaux = ref([])
const niveauxData = ref({})
const selectedNiveau = ref('')
const selectedDiscipline = ref('')
const selectedTheme = ref('')

// Load data from imported JSON files
async function fetchNiveaux() {
  try {
    // Convertir les modules importés en objet avec le nom du fichier comme clé
    const dataMap = {}
    const niveauxTrouves = []
    
    for (const path in jsonModules) {
      // Extraire le nom du fichier sans extension
      const fileName = path.split('/').pop().replace('.json', '')
      dataMap[fileName] = jsonModules[path].default || jsonModules[path]
      niveauxTrouves.push(fileName) // Garder la casse originale !
    }
    
    // Trier les niveaux selon l'ordre défini
    niveaux.value = niveauxTrouves.sort((a, b) => {
      const indexA = ORDRE_NIVEAUX.indexOf(a.toLowerCase()) // Comparer en lowercase
      const indexB = ORDRE_NIVEAUX.indexOf(b.toLowerCase()) // mais garder l'original
      
      // Si les deux sont dans l'ordre défini
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      // Si seulement A est dans l'ordre défini, il vient en premier
      if (indexA !== -1) return -1
      // Si seulement B est dans l'ordre défini, il vient en premier
      if (indexB !== -1) return 1
      // Sinon, ordre alphabétique
      return a.localeCompare(b)
    })
    
    niveauxData.value = dataMap
    
    console.log('Loaded data:', niveauxData.value)
    console.log('Niveaux triés:', niveaux.value)
    
    if (niveaux.value.length > 0) {
      selectedNiveau.value = niveaux.value[0]
    }
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

onMounted(fetchNiveaux)

const disciplines = computed(() => {
  try {
    if (!selectedNiveau.value) return []
    const data = niveauxData.value[selectedNiveau.value]
    console.log('Computing disciplines for:', selectedNiveau.value, data)
    if (!data || !data.disciplines) return []
    return data.disciplines.map(d => d.nom)
  } catch (error) {
    console.error('Error computing disciplines:', error)
    return []
  }
})

const themes = computed(() => {
  try {
    if (!selectedNiveau.value || !selectedDiscipline.value) return []
    const data = niveauxData.value[selectedNiveau.value]
    if (!data || !data.disciplines) return []
    const discipline = data.disciplines.find(d => d.nom === selectedDiscipline.value)
    console.log('Computing themes for:', selectedDiscipline.value, discipline)
    if (!discipline || !discipline.themes) return []
    return discipline.themes.map(t => t.nom)
  } catch (error) {
    console.error('Error computing themes:', error)
    return []
  }
})

const tags = computed(() => {
  try {
    if (!selectedNiveau.value || !selectedDiscipline.value || !selectedTheme.value) return []
    const data = niveauxData.value[selectedNiveau.value]
    if (!data || !data.disciplines) return []
    const discipline = data.disciplines.find(d => d.nom === selectedDiscipline.value)
    if (!discipline || !discipline.themes) return []
    const theme = discipline.themes.find(t => t.nom === selectedTheme.value)
    console.log('Computing tags for:', selectedTheme.value, theme)
    if (!theme || !theme.tags) return []
    return theme.tags
  } catch (error) {
    console.error('Error computing tags:', error)
    return []
  }
})

function onNiveauChange() {
  selectedDiscipline.value = ''
  selectedTheme.value = ''
}
function onDisciplineChange() {
  selectedTheme.value = ''
}
function onThemeChange() {
  // Plus besoin de réinitialiser selectedTag
}
</script>

<style scoped>
label {
  display: block;
  margin: 1em 0 0.5em;
}
select {
  margin-left: 0.5em;
}

.tags-container {
  margin-top: 1em;
}

.tags-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
}

.tags-list li {
  padding: 0.5em 1em;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
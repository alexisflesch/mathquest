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
    
    <label v-if="tags.length">Tag :
      <select v-model="selectedTag">
        <option value="">-- Choisir un tag --</option>
        <option v-for="tag in tags" :key="tag" :value="tag">{{ tag }}</option>
      </select>
    </label>
    
    <div v-if="selectedTag">
      <h3>Tag sélectionné :</h3>
      <p><strong>{{ selectedTag }}</strong></p>
      <p><em>Niveau: {{ selectedNiveau }}, Discipline: {{ selectedDiscipline }}, Thème: {{ selectedTheme }}</em></p>
    </div>
    
    <div v-if="niveaux.length === 0">
      <p>Chargement des données...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Import JSON files directly (this is more reliable in VuePress)
import cpData from '../data/cp.json'
import ce1Data from '../data/ce1.json'

const niveaux = ref([])
const niveauxData = ref({})
const selectedNiveau = ref('')
const selectedDiscipline = ref('')
const selectedTheme = ref('')
const selectedTag = ref('')

// Load data from imported JSON files
async function fetchNiveaux() {
  try {
    // Use imported data directly instead of fetching
    const dataMap = {
      'cp': cpData,
      'ce1': ce1Data
    }
    
    niveaux.value = Object.keys(dataMap)
    niveauxData.value = dataMap
    
    console.log('Loaded data:', niveauxData.value)
    
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
  selectedTag.value = ''
}
function onDisciplineChange() {
  selectedTheme.value = ''
  selectedTag.value = ''
}
function onThemeChange() {
  selectedTag.value = ''
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
</style>

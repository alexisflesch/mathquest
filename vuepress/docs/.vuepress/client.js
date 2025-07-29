import { defineClientConfig } from 'vuepress/client'
import QuestionsExplorer from './components/QuestionsExplorer.vue'

export default defineClientConfig({
    enhance({ app }) {
        app.component('QuestionsExplorer', QuestionsExplorer)
    },
})

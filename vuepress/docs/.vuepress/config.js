import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress/cli'
import { viteBundler } from '@vuepress/bundler-vite'


export default defineUserConfig({

  lang: 'fr-FR',
  title: 'MathQuest',
  description: 'Alternative libre et open source à Kahoot, pour les enseignants et leurs élèves.',
  base: '/mathquest/',

  theme: defaultTheme({
    logo: '/assets/logo.svg',

    navbar: [
      { text: "Accueil", link: "/" },
      { text: "Utilisation de l'appli", link: "/utilisation/" },
      { text: "Écriture de questions", link: "/questions-yaml/" },
      { text: "Installation", link: "/installation/" },
    ],

    sidebar: {
      '/questions-yaml/': [
        {
          text: 'Questions (YAML)',
          children: [
            '/questions-yaml/README.md',
            '/questions-yaml/contribuer.md',
          ],
        },
      ],
    },
  }),

  bundler: viteBundler(),
})

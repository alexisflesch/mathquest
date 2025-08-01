import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress/cli'
import { viteBundler } from '@vuepress/bundler-vite'


export default defineUserConfig({

  lang: 'fr-FR',
  title: 'MathQuest',
  description: 'Alternative libre et open source à Kahoot, pour les enseignants et leurs élèves.',
  base: '/mathquest/',

  head: [
    ['link', { rel: 'icon', href: '/mathquest/favicon.ico' }],
    ['link', { rel: 'stylesheet', href: '/mathquest/styles/screenshots.css' }]
  ],

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
      '/installation/': [
        {
          text: 'Installation',
          children: [
            '/installation/README.md',
          ],
        },
      ],
      '/utilisation/': [
        {
          text: 'Utilisation',
          children: [
            '/utilisation/README.md',
            '/utilisation/quiz.md',
            '/utilisation/tournoi.md',
            '/utilisation/entrainement.md',
          ],
        },
      ],
    },
  }),

  bundler: viteBundler({
    viteOptions: {
      server: {
        // Middleware pour servir le favicon à la racine
        middlewareMode: false,
      }
    }
  }),
})

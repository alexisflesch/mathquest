import comp from "/home/aflesch/mathquest/vuepress/docs/.vuepress/.temp/pages/utilisation/index.html.vue"
const data = JSON.parse("{\"path\":\"/utilisation/\",\"title\":\"Utilisation de l'application\",\"lang\":\"fr-FR\",\"frontmatter\":{\"title\":\"Utilisation de l'application\"},\"git\":{\"updatedTime\":1751575389000,\"contributors\":[{\"name\":\"alexisflesch\",\"username\":\"alexisflesch\",\"email\":\"alexis.flesch@gmail.com\",\"commits\":1,\"url\":\"https://github.com/alexisflesch\"}],\"changelog\":[{\"hash\":\"ff0e59106460a31d3b84585d7643b474d7e21cda\",\"time\":1751575389000,\"email\":\"alexis.flesch@gmail.com\",\"author\":\"alexisflesch\",\"message\":\"creating doc\"}]},\"filePathRelative\":\"utilisation/README.md\"}")
export { comp, data }

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}

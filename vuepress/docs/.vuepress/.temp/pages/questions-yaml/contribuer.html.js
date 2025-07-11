import comp from "/home/aflesch/mathquest/vuepress/docs/.vuepress/.temp/pages/questions-yaml/contribuer.html.vue"
const data = JSON.parse("{\"path\":\"/questions-yaml/contribuer.html\",\"title\":\"Contribuer à la base commune de questions\",\"lang\":\"fr-FR\",\"frontmatter\":{\"title\":\"Contribuer à la base commune de questions\"},\"git\":{\"updatedTime\":1752067597000,\"contributors\":[{\"name\":\"alexisflesch\",\"username\":\"alexisflesch\",\"email\":\"alexis.flesch@gmail.com\",\"commits\":2,\"url\":\"https://github.com/alexisflesch\"}],\"changelog\":[{\"hash\":\"a3e2c89143849c6ec7ac3f0f60d46d4e016d92f7\",\"time\":1752067597000,\"email\":\"alexis.flesch@gmail.com\",\"author\":\"alexisflesch\",\"message\":\"doc update and bdd update (fresh start with \\\"good\\\" questions)\"},{\"hash\":\"ff0e59106460a31d3b84585d7643b474d7e21cda\",\"time\":1751575389000,\"email\":\"alexis.flesch@gmail.com\",\"author\":\"alexisflesch\",\"message\":\"creating doc\"}]},\"filePathRelative\":\"questions-yaml/contribuer.md\"}")
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

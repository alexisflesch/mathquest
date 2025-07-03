export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"/home/aflesch/mathquest/vuepress/docs/.vuepress/.temp/pages/index.html.js"), meta: {"title":""} }],
  ["/get-started.html", { loader: () => import(/* webpackChunkName: "get-started.html" */"/home/aflesch/mathquest/vuepress/docs/.vuepress/.temp/pages/get-started.html.js"), meta: {"title":"Get Started"} }],
  ["/installation/", { loader: () => import(/* webpackChunkName: "installation_index.html" */"/home/aflesch/mathquest/vuepress/docs/.vuepress/.temp/pages/installation/index.html.js"), meta: {"title":"Installation"} }],
  ["/questions-yaml/", { loader: () => import(/* webpackChunkName: "questions-yaml_index.html" */"/home/aflesch/mathquest/vuepress/docs/.vuepress/.temp/pages/questions-yaml/index.html.js"), meta: {"title":"Écriture de questions (YAML)"} }],
  ["/questions-yaml/contribuer.html", { loader: () => import(/* webpackChunkName: "questions-yaml_contribuer.html" */"/home/aflesch/mathquest/vuepress/docs/.vuepress/.temp/pages/questions-yaml/contribuer.html.js"), meta: {"title":"Contribuer à la base commune de questions"} }],
  ["/utilisation/", { loader: () => import(/* webpackChunkName: "utilisation_index.html" */"/home/aflesch/mathquest/vuepress/docs/.vuepress/.temp/pages/utilisation/index.html.js"), meta: {"title":"Utilisation de l'application"} }],
  ["/404.html", { loader: () => import(/* webpackChunkName: "404.html" */"/home/aflesch/mathquest/vuepress/docs/.vuepress/.temp/pages/404.html.js"), meta: {"title":""} }],
]);

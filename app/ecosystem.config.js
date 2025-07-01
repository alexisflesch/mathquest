module.exports = {
  apps: [
    {
      name: "mathquest-backend",
      script: "./backend/dist/backend/src/server.js",
      cwd: "./backend/dist/backend/src",
      env: {
        NODE_ENV: "production",
        REDIS_URL: "redis://localhost:6379"
        // Ajoutez ici d'autres variables d'environnement nécessaires (DB, JWT, etc)
      }
    },
    {
      name: "mathquest-frontend",
      script: "node",
      cwd: "./frontend",
      args: "./node_modules/next/dist/bin/next start -p 3008"
    }
  ]
}

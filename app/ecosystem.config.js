module.exports = {
    apps: [
        {
            name: "mathquest-backend",
            script: "npm",
            cwd: "./backend",
            args: "run start",
            env: {
                NODE_ENV: "production",
                REDIS_URL: "redis://localhost:6379"
                // Ajoutez ici d'autres variables d'environnement nécessaires (DB, JWT, etc)
            },
            log_file: "./logs/pm2-backend.log",
            out_file: "./logs/pm2-backend-out.log",
            error_file: "./logs/pm2-backend-error.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            merge_logs: true,
            max_memory_restart: "400M"
        },
        {
            name: "mathquest-frontend",
            script: "npm",
            cwd: "./frontend",
            args: "run start:minimal",
            env: {
                NODE_ENV: "production",
                NEXT_TELEMETRY_DISABLED: "1"
            },
            log_file: "./logs/pm2-frontend.log",
            out_file: "./logs/pm2-frontend-out.log",
            error_file: "./logs/pm2-frontend-error.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            merge_logs: true,
            max_memory_restart: "300M"
        }
    ]
}

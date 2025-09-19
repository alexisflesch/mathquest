# Déploiement et DevOps

## Vue d'ensemble

MathQuest peut être déployé sur différents environnements : développement local, serveur VPS, ou infrastructure cloud. Le déploiement utilise PM2 pour la gestion des processus et inclut des optimisations pour les environnements à mémoire limitée.

## Prérequis système

### Configuration minimale

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm postgresql redis-server nginx

# Node.js version 18+
node --version  # Doit afficher v18.x.x ou supérieur

# PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Configuration recommandée

```bash
# Serveur VPS (2GB RAM minimum)
- Ubuntu 22.04 LTS
- Node.js 18.x
- PostgreSQL 15+
- Redis 7+
- Nginx (reverse proxy)
- PM2 (gestionnaire de processus)
- 2GB RAM
- 20GB stockage
```

## Scripts de déploiement

### Construction complète

Le script `build-all.sh` gère la construction atomique :

```bash
#!/bin/bash
# Construction complète avec options mémoire

# Mode standard (développement)
./build-all.sh

# Mode optimisé mémoire (VPS)
./build-all.sh --low-memory

# Aide
./build-all.sh --help
```

**Optimisations mémoire :**
- `--max-old-space-size=1024` : Limite heap Node.js à 1GB
- `--max-semi-space-size=64` : Optimise le garbage collector
- `LIGHT_BUILD=1` : Désactive les optimisations lourdes
- `NEXT_TELEMETRY_DISABLED=1` : Désactive télémétrie Next.js

### Construction VPS

Le script `build-vps.sh` est un wrapper optimisé :

```bash
#!/bin/bash
# Construction optimisée pour VPS

echo "🚀 Starting VPS-optimized build..."

# Vérification mémoire système
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.1fGB", $2/1024}')
AVAIL_MEM=$(free -m | awk 'NR==2{printf "%.1fGB", $7/1024}')

echo "📊 System Memory: $TOTAL_MEM total, $AVAIL_MEM available"

# Construction avec optimisations
exec "$(dirname "$0")/build-all.sh" --low-memory
```

## Configuration PM2

### Fichier ecosystem.config.js

```javascript
module.exports = {
    apps: [
        {
            name: "mathquest-backend",
            script: "npm",
            cwd: "./backend",
            args: "run start",
            env: {
                NODE_ENV: "production",
                REDIS_URL: "redis://localhost:6379",
                DATABASE_URL: "postgresql://user:pass@localhost:5432/mathquest",
                JWT_SECRET: "your_secure_jwt_secret",
                FRONTEND_URL: "https://yourdomain.com"
            },
            log_file: "./logs/pm2-backend.log",
            out_file: "./logs/pm2-backend-out.log",
            error_file: "./logs/pm2-backend-error.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            merge_logs: true,
            max_memory_restart: "400M",
            instances: 1,
            exec_mode: "fork"
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
            max_memory_restart: "300M",
            instances: 1,
            exec_mode: "fork"
        }
    ]
}
```

### Commandes PM2

```bash
# Démarrage des services
pm2 start ecosystem.config.js

# Vérification du statut
pm2 status

# Redémarrage d'un service
pm2 restart mathquest-backend

# Arrêt des services
pm2 stop ecosystem.config.js

# Suppression des services
pm2 delete ecosystem.config.js

# Sauvegarde de la configuration
pm2 save

# Monitoring en temps réel
pm2 monit

# Logs en temps réel
pm2 logs

# Logs d'un service spécifique
pm2 logs mathquest-backend
```

## Configuration Nginx

### Reverse proxy

```nginx
# /etc/nginx/sites-available/mathquest
server {
    listen 80;
    server_name yourdomain.com;

    # Logs
    access_log /var/log/nginx/mathquest_access.log;
    error_log /var/log/nginx/mathquest_error.log;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # API-specific timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Socket.IO (WebSocket)
    location /socket.io/ {
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Sécurité
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=()" always;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}

# Redirection HTTP vers HTTPS (si SSL configuré)
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Activation du site

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/mathquest /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

## Configuration SSL (Let's Encrypt)

### Installation Certbot

```bash
# Installation
sudo apt install certbot python3-certbot-nginx

# Génération du certificat
sudo certbot --nginx -d yourdomain.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

### Configuration HTTPS

Certbot modifie automatiquement la configuration Nginx pour ajouter SSL.

## Base de données

### Configuration PostgreSQL

```bash
# Connexion en tant que superutilisateur
sudo -u postgres psql

# Création de la base de données
CREATE DATABASE mathquest;

# Création de l'utilisateur
CREATE USER mathquest_user WITH ENCRYPTED PASSWORD 'secure_password';

# Attribution des droits
GRANT ALL PRIVILEGES ON DATABASE mathquest TO mathquest_user;

# Quitter
\q
```

### Migration Prisma

```bash
# Génération du client Prisma
cd backend
npx prisma generate

# Application des migrations
npx prisma migrate deploy

# Vérification de l'état
npx prisma migrate status
```

### Sauvegarde automatique

```bash
# Script de sauvegarde (/usr/local/bin/backup-mathquest.sh)
#!/bin/bash

BACKUP_DIR="/var/backups/mathquest"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mathquest_$DATE.sql"

# Création du répertoire si nécessaire
mkdir -p $BACKUP_DIR

# Sauvegarde
pg_dump -U mathquest_user -h localhost mathquest > $BACKUP_FILE

# Compression
gzip $BACKUP_FILE

# Nettoyage des sauvegardes anciennes (garder 7 jours)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Programmation des sauvegardes

```bash
# Édition de la crontab
sudo crontab -e

# Ajout de la ligne pour sauvegarde quotidienne à 2h du matin
0 2 * * * /usr/local/bin/backup-mathquest.sh
```

## Monitoring et métriques

### Endpoints de santé

```bash
# Santé générale
curl http://localhost:3007/health

# Métriques mémoire
curl http://localhost:3007/health/memory

# Métriques détaillées (avec authentification)
curl -H "Authorization: Bearer <token>" http://localhost:3007/api/v1/health/metrics
```

### Monitoring PM2

```bash
# Statut des processus
pm2 jlist

# Métriques JSON
pm2 jlist | jq '.[] | {name: .name, pid: .pid, memory: .monit.memory, cpu: .monit.cpu}'

# Logs avec suivi
pm2 logs --lines 100 --nostream
```

### Monitoring système

```bash
# Utilisation mémoire
free -h

# Utilisation disque
df -h

# Processus Node.js
ps aux | grep node

# Connexions réseau
netstat -tlnp | grep :3007
netstat -tlnp | grep :3008
```

## Scaling et optimisation

### Configuration multi-instance

```javascript
// ecosystem.config.js pour scaling
module.exports = {
    apps: [
        {
            name: "mathquest-backend",
            script: "dist/server.js",
            instances: "max", // Utilise tous les CPU disponibles
            exec_mode: "cluster",
            env: {
                NODE_ENV: "production",
                // Variables d'environnement...
            },
            max_memory_restart: "400M"
        }
    ]
}
```

### Load balancing avec Nginx

```nginx
upstream mathquest_backend {
    ip_hash;  # Session stickiness pour WebSocket
    server localhost:3007;
    server localhost:3009;  # Instance secondaire
    server localhost:3010;  # Instance tertiaire
}

server {
    location /api/ {
        proxy_pass http://mathquest_backend;
        # Configuration proxy...
    }

    location /socket.io/ {
        proxy_pass http://mathquest_backend;
        # Configuration WebSocket...
    }
}
```

### Cache Redis avancé

```javascript
// Configuration Redis avec cluster
const redisClient = new Redis.Cluster([
    { host: 'redis-1', port: 6379 },
    { host: 'redis-2', port: 6379 },
    { host: 'redis-3', port: 6379 }
], {
    redisOptions: {
        password: 'secure_password'
    }
});
```

## Déploiement automatisé

### Script de déploiement complet

```bash
#!/bin/bash
# deploy.sh - Déploiement automatisé

set -e

echo "🚀 Starting MathQuest deployment..."

# Mise à jour du code
git pull origin main

# Installation des dépendances
npm install

# Construction optimisée
./build-all.sh --low-memory

# Migration base de données
cd backend
npx prisma migrate deploy
cd ..

# Redémarrage des services
pm2 restart ecosystem.config.js

# Vérification de santé
sleep 10
curl -f http://localhost:3007/health || exit 1
curl -f http://localhost:3008/ || exit 1

echo "✅ Deployment completed successfully!"
```

### Rollback

```bash
#!/bin/bash
# rollback.sh - Retour arrière

echo "🔄 Rolling back to previous version..."

# Arrêt des services
pm2 stop ecosystem.config.js

# Restauration du code
git checkout HEAD~1

# Reconstruction
./build-all.sh --low-memory

# Redémarrage
pm2 start ecosystem.config.js

echo "✅ Rollback completed!"
```

## Sécurité

### Configuration firewall

```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443

# Vérification
sudo ufw status
```

### Mises à jour de sécurité

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Redémarrage si nécessaire
sudo reboot
```

### Monitoring de sécurité

```bash
# Logs d'accès suspects
sudo tail -f /var/log/nginx/access.log | grep -E "(POST|PUT|DELETE).*(admin|login|auth)"

# Tentatives de connexion SSH
sudo journalctl -u ssh -f
```

## Troubleshooting

### Problèmes courants

**Service qui ne démarre pas :**
```bash
# Vérification des logs
pm2 logs mathquest-backend --lines 50

# Vérification des variables d'environnement
pm2 show mathquest-backend
```

**Mémoire pleine :**
```bash
# Vérification de l'utilisation
pm2 monit

# Redémarrage avec limite mémoire réduite
pm2 restart mathquest-backend --max-memory-restart 256M
```

**Connexions WebSocket qui échouent :**
```bash
# Vérification Nginx
sudo nginx -t

# Logs Nginx
sudo tail -f /var/log/nginx/error.log
```

**Base de données inaccessible :**
```bash
# Test de connexion
psql -U mathquest_user -d mathquest -h localhost

# Vérification du service
sudo systemctl status postgresql
```

Cette configuration permet un déploiement robuste et scalable de MathQuest adapté aux environnements de production.
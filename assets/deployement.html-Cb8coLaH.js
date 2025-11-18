import{_ as n,c as a,a as e,o as l}from"./app-Blvv7Pu1.js";const p={};function i(t,s){return l(),a("div",null,s[0]||(s[0]=[e(`<h1 id="deploiement-et-devops" tabindex="-1"><a class="header-anchor" href="#deploiement-et-devops"><span>Déploiement et DevOps</span></a></h1><h2 id="vue-d-ensemble" tabindex="-1"><a class="header-anchor" href="#vue-d-ensemble"><span>Vue d&#39;ensemble</span></a></h2><p>MathQuest peut être déployé sur différents environnements : développement local, serveur VPS, ou infrastructure cloud. Le déploiement utilise PM2 pour la gestion des processus et inclut des optimisations pour les environnements à mémoire limitée.</p><h2 id="prerequis-systeme" tabindex="-1"><a class="header-anchor" href="#prerequis-systeme"><span>Prérequis système</span></a></h2><h3 id="configuration-minimale" tabindex="-1"><a class="header-anchor" href="#configuration-minimale"><span>Configuration minimale</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Ubuntu/Debian</span></span>
<span class="line"><span class="token function">sudo</span> <span class="token function">apt</span> update</span>
<span class="line"><span class="token function">sudo</span> <span class="token function">apt</span> <span class="token function">install</span> <span class="token parameter variable">-y</span> nodejs <span class="token function">npm</span> postgresql redis-server nginx</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Node.js version 18+</span></span>
<span class="line"><span class="token function">node</span> <span class="token parameter variable">--version</span>  <span class="token comment"># Doit afficher v18.x.x ou supérieur</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># PostgreSQL</span></span>
<span class="line"><span class="token function">sudo</span> systemctl <span class="token builtin class-name">enable</span> postgresql</span>
<span class="line"><span class="token function">sudo</span> systemctl start postgresql</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Redis</span></span>
<span class="line"><span class="token function">sudo</span> systemctl <span class="token builtin class-name">enable</span> redis-server</span>
<span class="line"><span class="token function">sudo</span> systemctl start redis-server</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="configuration-recommandee" tabindex="-1"><a class="header-anchor" href="#configuration-recommandee"><span>Configuration recommandée</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Serveur VPS (2GB RAM minimum)</span></span>
<span class="line">- Ubuntu <span class="token number">22.04</span> LTS</span>
<span class="line">- Node.js <span class="token number">18</span>.x</span>
<span class="line">- PostgreSQL <span class="token number">15</span>+</span>
<span class="line">- Redis <span class="token number">7</span>+</span>
<span class="line">- Nginx <span class="token punctuation">(</span>reverse proxy<span class="token punctuation">)</span></span>
<span class="line">- PM2 <span class="token punctuation">(</span>gestionnaire de processus<span class="token punctuation">)</span></span>
<span class="line">- 2GB RAM</span>
<span class="line">- 20GB stockage</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="scripts-de-deploiement" tabindex="-1"><a class="header-anchor" href="#scripts-de-deploiement"><span>Scripts de déploiement</span></a></h2><h3 id="construction-complete" tabindex="-1"><a class="header-anchor" href="#construction-complete"><span>Construction complète</span></a></h3><p>Le script <code>build-all.sh</code> gère la construction atomique :</p><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token shebang important">#!/bin/bash</span></span>
<span class="line"><span class="token comment"># Construction complète avec options mémoire</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Mode standard (développement)</span></span>
<span class="line">./build-all.sh</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Mode optimisé mémoire (VPS)</span></span>
<span class="line">./build-all.sh --low-memory</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Aide</span></span>
<span class="line">./build-all.sh <span class="token parameter variable">--help</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>Optimisations mémoire :</strong></p><ul><li><code>--max-old-space-size=1024</code> : Limite heap Node.js à 1GB</li><li><code>--max-semi-space-size=64</code> : Optimise le garbage collector</li><li><code>LIGHT_BUILD=1</code> : Désactive les optimisations lourdes</li><li><code>NEXT_TELEMETRY_DISABLED=1</code> : Désactive télémétrie Next.js</li></ul><h3 id="construction-vps" tabindex="-1"><a class="header-anchor" href="#construction-vps"><span>Construction VPS</span></a></h3><p>Le script <code>build-vps.sh</code> est un wrapper optimisé :</p><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token shebang important">#!/bin/bash</span></span>
<span class="line"><span class="token comment"># Construction optimisée pour VPS</span></span>
<span class="line"></span>
<span class="line"><span class="token builtin class-name">echo</span> <span class="token string">&quot;🚀 Starting VPS-optimized build...&quot;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Vérification mémoire système</span></span>
<span class="line"><span class="token assign-left variable">TOTAL_MEM</span><span class="token operator">=</span><span class="token variable"><span class="token variable">$(</span><span class="token function">free</span> <span class="token parameter variable">-m</span> <span class="token operator">|</span> <span class="token function">awk</span> <span class="token string">&#39;NR==2{printf &quot;%.1fGB&quot;, $2/1024}&#39;</span><span class="token variable">)</span></span></span>
<span class="line"><span class="token assign-left variable">AVAIL_MEM</span><span class="token operator">=</span><span class="token variable"><span class="token variable">$(</span><span class="token function">free</span> <span class="token parameter variable">-m</span> <span class="token operator">|</span> <span class="token function">awk</span> <span class="token string">&#39;NR==2{printf &quot;%.1fGB&quot;, $7/1024}&#39;</span><span class="token variable">)</span></span></span>
<span class="line"></span>
<span class="line"><span class="token builtin class-name">echo</span> <span class="token string">&quot;📊 System Memory: <span class="token variable">$TOTAL_MEM</span> total, <span class="token variable">$AVAIL_MEM</span> available&quot;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Construction avec optimisations</span></span>
<span class="line"><span class="token builtin class-name">exec</span> <span class="token string">&quot;<span class="token variable"><span class="token variable">$(</span><span class="token function">dirname</span> <span class="token string">&quot;<span class="token variable">$0</span>&quot;</span><span class="token variable">)</span></span>/build-all.sh&quot;</span> --low-memory</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="configuration-pm2" tabindex="-1"><a class="header-anchor" href="#configuration-pm2"><span>Configuration PM2</span></a></h2><h3 id="fichier-ecosystem-config-js" tabindex="-1"><a class="header-anchor" href="#fichier-ecosystem-config-js"><span>Fichier ecosystem.config.js</span></a></h3><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre><code class="language-javascript"><span class="line">module<span class="token punctuation">.</span>exports <span class="token operator">=</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token literal-property property">apps</span><span class="token operator">:</span> <span class="token punctuation">[</span></span>
<span class="line">        <span class="token punctuation">{</span></span>
<span class="line">            <span class="token literal-property property">name</span><span class="token operator">:</span> <span class="token string">&quot;mathquest-backend&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">script</span><span class="token operator">:</span> <span class="token string">&quot;npm&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">cwd</span><span class="token operator">:</span> <span class="token string">&quot;./backend&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">args</span><span class="token operator">:</span> <span class="token string">&quot;run start&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">env</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">                <span class="token constant">NODE_ENV</span><span class="token operator">:</span> <span class="token string">&quot;production&quot;</span><span class="token punctuation">,</span></span>
<span class="line">                <span class="token constant">REDIS_URL</span><span class="token operator">:</span> <span class="token string">&quot;redis://localhost:6379&quot;</span><span class="token punctuation">,</span></span>
<span class="line">                <span class="token constant">DATABASE_URL</span><span class="token operator">:</span> <span class="token string">&quot;postgresql://user:pass@localhost:5432/mathquest&quot;</span><span class="token punctuation">,</span></span>
<span class="line">                <span class="token constant">JWT_SECRET</span><span class="token operator">:</span> <span class="token string">&quot;your_secure_jwt_secret&quot;</span><span class="token punctuation">,</span></span>
<span class="line">                <span class="token constant">FRONTEND_URL</span><span class="token operator">:</span> <span class="token string">&quot;https://yourdomain.com&quot;</span></span>
<span class="line">            <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">log_file</span><span class="token operator">:</span> <span class="token string">&quot;./logs/pm2-backend.log&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">out_file</span><span class="token operator">:</span> <span class="token string">&quot;./logs/pm2-backend-out.log&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">error_file</span><span class="token operator">:</span> <span class="token string">&quot;./logs/pm2-backend-error.log&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">log_date_format</span><span class="token operator">:</span> <span class="token string">&quot;YYYY-MM-DD HH:mm:ss Z&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">merge_logs</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">max_memory_restart</span><span class="token operator">:</span> <span class="token string">&quot;400M&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">instances</span><span class="token operator">:</span> <span class="token number">1</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">exec_mode</span><span class="token operator">:</span> <span class="token string">&quot;fork&quot;</span></span>
<span class="line">        <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token punctuation">{</span></span>
<span class="line">            <span class="token literal-property property">name</span><span class="token operator">:</span> <span class="token string">&quot;mathquest-frontend&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">script</span><span class="token operator">:</span> <span class="token string">&quot;npm&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">cwd</span><span class="token operator">:</span> <span class="token string">&quot;./frontend&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">args</span><span class="token operator">:</span> <span class="token string">&quot;run start:minimal&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">env</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">                <span class="token constant">NODE_ENV</span><span class="token operator">:</span> <span class="token string">&quot;production&quot;</span><span class="token punctuation">,</span></span>
<span class="line">                <span class="token constant">NEXT_TELEMETRY_DISABLED</span><span class="token operator">:</span> <span class="token string">&quot;1&quot;</span></span>
<span class="line">            <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">log_file</span><span class="token operator">:</span> <span class="token string">&quot;./logs/pm2-frontend.log&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">out_file</span><span class="token operator">:</span> <span class="token string">&quot;./logs/pm2-frontend-out.log&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">error_file</span><span class="token operator">:</span> <span class="token string">&quot;./logs/pm2-frontend-error.log&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">log_date_format</span><span class="token operator">:</span> <span class="token string">&quot;YYYY-MM-DD HH:mm:ss Z&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">merge_logs</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">max_memory_restart</span><span class="token operator">:</span> <span class="token string">&quot;300M&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">instances</span><span class="token operator">:</span> <span class="token number">1</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">exec_mode</span><span class="token operator">:</span> <span class="token string">&quot;fork&quot;</span></span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line">    <span class="token punctuation">]</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="commandes-pm2" tabindex="-1"><a class="header-anchor" href="#commandes-pm2"><span>Commandes PM2</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Démarrage des services</span></span>
<span class="line">pm2 start ecosystem.config.js</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Vérification du statut</span></span>
<span class="line">pm2 status</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Redémarrage d&#39;un service</span></span>
<span class="line">pm2 restart mathquest-backend</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Arrêt des services</span></span>
<span class="line">pm2 stop ecosystem.config.js</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Suppression des services</span></span>
<span class="line">pm2 delete ecosystem.config.js</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Sauvegarde de la configuration</span></span>
<span class="line">pm2 save</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Monitoring en temps réel</span></span>
<span class="line">pm2 monit</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Logs en temps réel</span></span>
<span class="line">pm2 logs</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Logs d&#39;un service spécifique</span></span>
<span class="line">pm2 logs mathquest-backend</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="configuration-nginx" tabindex="-1"><a class="header-anchor" href="#configuration-nginx"><span>Configuration Nginx</span></a></h2><h3 id="reverse-proxy" tabindex="-1"><a class="header-anchor" href="#reverse-proxy"><span>Reverse proxy</span></a></h3><div class="language-nginx line-numbers-mode" data-highlighter="prismjs" data-ext="nginx"><pre><code class="language-nginx"><span class="line"><span class="token comment"># /etc/nginx/sites-available/mathquest</span></span>
<span class="line"><span class="token directive"><span class="token keyword">server</span></span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">listen</span> <span class="token number">80</span></span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">server_name</span> yourdomain.com</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token comment"># Logs</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">access_log</span> /var/log/nginx/mathquest_access.log</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">error_log</span> /var/log/nginx/mathquest_error.log</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token comment"># Frontend (Next.js)</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">location</span> /</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_pass</span> http://localhost:3008</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_http_version</span> 1.1</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> Upgrade <span class="token variable">$http_upgrade</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> Connection <span class="token string">&#39;upgrade&#39;</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> Host <span class="token variable">$host</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> X-Real-IP <span class="token variable">$remote_addr</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> X-Forwarded-For <span class="token variable">$proxy_add_x_forwarded_for</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> X-Forwarded-Proto <span class="token variable">$scheme</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_cache_bypass</span> <span class="token variable">$http_upgrade</span></span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token comment"># Timeouts</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_connect_timeout</span> <span class="token number">60s</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_send_timeout</span> <span class="token number">60s</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_read_timeout</span> <span class="token number">60s</span></span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">    <span class="token comment"># Backend API</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">location</span> /api/</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_pass</span> http://localhost:3007</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_http_version</span> 1.1</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> Upgrade <span class="token variable">$http_upgrade</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> Connection <span class="token string">&#39;upgrade&#39;</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> Host <span class="token variable">$host</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> X-Real-IP <span class="token variable">$remote_addr</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> X-Forwarded-For <span class="token variable">$proxy_add_x_forwarded_for</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> X-Forwarded-Proto <span class="token variable">$scheme</span></span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token comment"># API-specific timeouts</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_connect_timeout</span> <span class="token number">30s</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_send_timeout</span> <span class="token number">30s</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_read_timeout</span> <span class="token number">30s</span></span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">    <span class="token comment"># Socket.IO (WebSocket)</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">location</span> /socket.io/</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_pass</span> http://localhost:3007</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_http_version</span> 1.1</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> Upgrade <span class="token variable">$http_upgrade</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> Connection <span class="token string">&quot;upgrade&quot;</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> Host <span class="token variable">$host</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> X-Real-IP <span class="token variable">$remote_addr</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> X-Forwarded-For <span class="token variable">$proxy_add_x_forwarded_for</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_set_header</span> X-Forwarded-Proto <span class="token variable">$scheme</span></span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token comment"># WebSocket timeouts</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_connect_timeout</span> <span class="token number">7d</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_send_timeout</span> <span class="token number">7d</span></span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_read_timeout</span> <span class="token number">7d</span></span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">    <span class="token comment"># Sécurité</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">add_header</span> X-Frame-Options <span class="token string">&quot;DENY&quot;</span> always</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">add_header</span> X-Content-Type-Options <span class="token string">&quot;nosniff&quot;</span> always</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">add_header</span> Referrer-Policy <span class="token string">&quot;strict-origin-when-cross-origin&quot;</span> always</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">add_header</span> Permissions-Policy <span class="token string">&quot;camera=(), microphone=()&quot;</span> always</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token comment"># Compression</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">gzip</span> <span class="token boolean">on</span></span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">gzip_vary</span> <span class="token boolean">on</span></span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">gzip_min_length</span> <span class="token number">1024</span></span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">gzip_types</span></span>
<span class="line">        text/plain</span>
<span class="line">        text/css</span>
<span class="line">        text/xml</span>
<span class="line">        text/javascript</span>
<span class="line">        application/javascript</span>
<span class="line">        application/xml+rss</span>
<span class="line">        application/json</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Redirection HTTP vers HTTPS (si SSL configuré)</span></span>
<span class="line"><span class="token directive"><span class="token keyword">server</span></span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">listen</span> <span class="token number">80</span></span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">server_name</span> yourdomain.com</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">return</span> <span class="token number">301</span> https://<span class="token variable">$server_name</span><span class="token variable">$request_uri</span></span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="activation-du-site" tabindex="-1"><a class="header-anchor" href="#activation-du-site"><span>Activation du site</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Créer le lien symbolique</span></span>
<span class="line"><span class="token function">sudo</span> <span class="token function">ln</span> <span class="token parameter variable">-s</span> /etc/nginx/sites-available/mathquest /etc/nginx/sites-enabled/</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Tester la configuration</span></span>
<span class="line"><span class="token function">sudo</span> nginx <span class="token parameter variable">-t</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Recharger Nginx</span></span>
<span class="line"><span class="token function">sudo</span> systemctl reload nginx</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="configuration-ssl-let-s-encrypt" tabindex="-1"><a class="header-anchor" href="#configuration-ssl-let-s-encrypt"><span>Configuration SSL (Let&#39;s Encrypt)</span></a></h2><h3 id="installation-certbot" tabindex="-1"><a class="header-anchor" href="#installation-certbot"><span>Installation Certbot</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Installation</span></span>
<span class="line"><span class="token function">sudo</span> <span class="token function">apt</span> <span class="token function">install</span> certbot python3-certbot-nginx</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Génération du certificat</span></span>
<span class="line"><span class="token function">sudo</span> certbot <span class="token parameter variable">--nginx</span> <span class="token parameter variable">-d</span> yourdomain.com</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Renouvellement automatique</span></span>
<span class="line"><span class="token function">sudo</span> certbot renew --dry-run</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="configuration-https" tabindex="-1"><a class="header-anchor" href="#configuration-https"><span>Configuration HTTPS</span></a></h3><p>Certbot modifie automatiquement la configuration Nginx pour ajouter SSL.</p><h2 id="base-de-donnees" tabindex="-1"><a class="header-anchor" href="#base-de-donnees"><span>Base de données</span></a></h2><h3 id="configuration-postgresql" tabindex="-1"><a class="header-anchor" href="#configuration-postgresql"><span>Configuration PostgreSQL</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Connexion en tant que superutilisateur</span></span>
<span class="line"><span class="token function">sudo</span> <span class="token parameter variable">-u</span> postgres psql</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Création de la base de données</span></span>
<span class="line">CREATE DATABASE mathquest<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Création de l&#39;utilisateur</span></span>
<span class="line">CREATE <span class="token environment constant">USER</span> mathquest_user WITH ENCRYPTED PASSWORD <span class="token string">&#39;secure_password&#39;</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Attribution des droits</span></span>
<span class="line">GRANT ALL PRIVILEGES ON DATABASE mathquest TO mathquest_user<span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Quitter</span></span>
<span class="line"><span class="token punctuation">\\</span>q</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="migration-prisma" tabindex="-1"><a class="header-anchor" href="#migration-prisma"><span>Migration Prisma</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Génération du client Prisma</span></span>
<span class="line"><span class="token builtin class-name">cd</span> backend</span>
<span class="line">npx prisma generate</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Application des migrations</span></span>
<span class="line">npx prisma migrate deploy</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Vérification de l&#39;état</span></span>
<span class="line">npx prisma migrate status</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="sauvegarde-automatique" tabindex="-1"><a class="header-anchor" href="#sauvegarde-automatique"><span>Sauvegarde automatique</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Script de sauvegarde (/usr/local/bin/backup-mathquest.sh)</span></span>
<span class="line"><span class="token comment">#!/bin/bash</span></span>
<span class="line"></span>
<span class="line"><span class="token assign-left variable">BACKUP_DIR</span><span class="token operator">=</span><span class="token string">&quot;/var/backups/mathquest&quot;</span></span>
<span class="line"><span class="token assign-left variable">DATE</span><span class="token operator">=</span><span class="token variable"><span class="token variable">$(</span><span class="token function">date</span> +%Y%m%d_%H%M%S<span class="token variable">)</span></span></span>
<span class="line"><span class="token assign-left variable">BACKUP_FILE</span><span class="token operator">=</span><span class="token string">&quot;<span class="token variable">$BACKUP_DIR</span>/mathquest_<span class="token variable">$DATE</span>.sql&quot;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Création du répertoire si nécessaire</span></span>
<span class="line"><span class="token function">mkdir</span> <span class="token parameter variable">-p</span> <span class="token variable">$BACKUP_DIR</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Sauvegarde</span></span>
<span class="line">pg_dump <span class="token parameter variable">-U</span> mathquest_user <span class="token parameter variable">-h</span> localhost mathquest <span class="token operator">&gt;</span> <span class="token variable">$BACKUP_FILE</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Compression</span></span>
<span class="line"><span class="token function">gzip</span> <span class="token variable">$BACKUP_FILE</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Nettoyage des sauvegardes anciennes (garder 7 jours)</span></span>
<span class="line"><span class="token function">find</span> <span class="token variable">$BACKUP_DIR</span> <span class="token parameter variable">-name</span> <span class="token string">&quot;*.sql.gz&quot;</span> <span class="token parameter variable">-mtime</span> +7 <span class="token parameter variable">-delete</span></span>
<span class="line"></span>
<span class="line"><span class="token builtin class-name">echo</span> <span class="token string">&quot;Backup completed: <span class="token variable">$BACKUP_FILE</span>.gz&quot;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="programmation-des-sauvegardes" tabindex="-1"><a class="header-anchor" href="#programmation-des-sauvegardes"><span>Programmation des sauvegardes</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Édition de la crontab</span></span>
<span class="line"><span class="token function">sudo</span> <span class="token function">crontab</span> <span class="token parameter variable">-e</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Ajout de la ligne pour sauvegarde quotidienne à 2h du matin</span></span>
<span class="line"><span class="token number">0</span> <span class="token number">2</span> * * * /usr/local/bin/backup-mathquest.sh</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="monitoring-et-metriques" tabindex="-1"><a class="header-anchor" href="#monitoring-et-metriques"><span>Monitoring et métriques</span></a></h2><h3 id="endpoints-de-sante" tabindex="-1"><a class="header-anchor" href="#endpoints-de-sante"><span>Endpoints de santé</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Santé générale</span></span>
<span class="line"><span class="token function">curl</span> http://localhost:3007/health</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Métriques mémoire</span></span>
<span class="line"><span class="token function">curl</span> http://localhost:3007/health/memory</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Métriques détaillées (avec authentification)</span></span>
<span class="line"><span class="token function">curl</span> <span class="token parameter variable">-H</span> <span class="token string">&quot;Authorization: Bearer &lt;token&gt;&quot;</span> http://localhost:3007/api/v1/health/metrics</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="monitoring-pm2" tabindex="-1"><a class="header-anchor" href="#monitoring-pm2"><span>Monitoring PM2</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Statut des processus</span></span>
<span class="line">pm2 jlist</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Métriques JSON</span></span>
<span class="line">pm2 jlist <span class="token operator">|</span> jq <span class="token string">&#39;.[] | {name: .name, pid: .pid, memory: .monit.memory, cpu: .monit.cpu}&#39;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Logs avec suivi</span></span>
<span class="line">pm2 logs <span class="token parameter variable">--lines</span> <span class="token number">100</span> <span class="token parameter variable">--nostream</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="monitoring-systeme" tabindex="-1"><a class="header-anchor" href="#monitoring-systeme"><span>Monitoring système</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Utilisation mémoire</span></span>
<span class="line"><span class="token function">free</span> <span class="token parameter variable">-h</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Utilisation disque</span></span>
<span class="line"><span class="token function">df</span> <span class="token parameter variable">-h</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Processus Node.js</span></span>
<span class="line"><span class="token function">ps</span> aux <span class="token operator">|</span> <span class="token function">grep</span> <span class="token function">node</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Connexions réseau</span></span>
<span class="line"><span class="token function">netstat</span> <span class="token parameter variable">-tlnp</span> <span class="token operator">|</span> <span class="token function">grep</span> :3007</span>
<span class="line"><span class="token function">netstat</span> <span class="token parameter variable">-tlnp</span> <span class="token operator">|</span> <span class="token function">grep</span> :3008</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="scaling-et-optimisation" tabindex="-1"><a class="header-anchor" href="#scaling-et-optimisation"><span>Scaling et optimisation</span></a></h2><h3 id="configuration-multi-instance" tabindex="-1"><a class="header-anchor" href="#configuration-multi-instance"><span>Configuration multi-instance</span></a></h3><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre><code class="language-javascript"><span class="line"><span class="token comment">// ecosystem.config.js pour scaling</span></span>
<span class="line">module<span class="token punctuation">.</span>exports <span class="token operator">=</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token literal-property property">apps</span><span class="token operator">:</span> <span class="token punctuation">[</span></span>
<span class="line">        <span class="token punctuation">{</span></span>
<span class="line">            <span class="token literal-property property">name</span><span class="token operator">:</span> <span class="token string">&quot;mathquest-backend&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">script</span><span class="token operator">:</span> <span class="token string">&quot;dist/server.js&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">instances</span><span class="token operator">:</span> <span class="token string">&quot;max&quot;</span><span class="token punctuation">,</span> <span class="token comment">// Utilise tous les CPU disponibles</span></span>
<span class="line">            <span class="token literal-property property">exec_mode</span><span class="token operator">:</span> <span class="token string">&quot;cluster&quot;</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">env</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">                <span class="token constant">NODE_ENV</span><span class="token operator">:</span> <span class="token string">&quot;production&quot;</span><span class="token punctuation">,</span></span>
<span class="line">                <span class="token comment">// Variables d&#39;environnement...</span></span>
<span class="line">            <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token literal-property property">max_memory_restart</span><span class="token operator">:</span> <span class="token string">&quot;400M&quot;</span></span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line">    <span class="token punctuation">]</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="load-balancing-avec-nginx" tabindex="-1"><a class="header-anchor" href="#load-balancing-avec-nginx"><span>Load balancing avec Nginx</span></a></h3><div class="language-nginx line-numbers-mode" data-highlighter="prismjs" data-ext="nginx"><pre><code class="language-nginx"><span class="line"><span class="token directive"><span class="token keyword">upstream</span> mathquest_backend</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">ip_hash</span></span><span class="token punctuation">;</span>  <span class="token comment"># Session stickiness pour WebSocket</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">server</span> localhost:3007</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">server</span> localhost:3009</span><span class="token punctuation">;</span>  <span class="token comment"># Instance secondaire</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">server</span> localhost:3010</span><span class="token punctuation">;</span>  <span class="token comment"># Instance tertiaire</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token directive"><span class="token keyword">server</span></span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token directive"><span class="token keyword">location</span> /api/</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_pass</span> http://mathquest_backend</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token comment"># Configuration proxy...</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">    <span class="token directive"><span class="token keyword">location</span> /socket.io/</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token directive"><span class="token keyword">proxy_pass</span> http://mathquest_backend</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token comment"># Configuration WebSocket...</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="cache-redis-avance" tabindex="-1"><a class="header-anchor" href="#cache-redis-avance"><span>Cache Redis avancé</span></a></h3><div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre><code class="language-javascript"><span class="line"><span class="token comment">// Configuration Redis avec cluster</span></span>
<span class="line"><span class="token keyword">const</span> redisClient <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Redis<span class="token punctuation">.</span>Cluster</span><span class="token punctuation">(</span><span class="token punctuation">[</span></span>
<span class="line">    <span class="token punctuation">{</span> <span class="token literal-property property">host</span><span class="token operator">:</span> <span class="token string">&#39;redis-1&#39;</span><span class="token punctuation">,</span> <span class="token literal-property property">port</span><span class="token operator">:</span> <span class="token number">6379</span> <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token punctuation">{</span> <span class="token literal-property property">host</span><span class="token operator">:</span> <span class="token string">&#39;redis-2&#39;</span><span class="token punctuation">,</span> <span class="token literal-property property">port</span><span class="token operator">:</span> <span class="token number">6379</span> <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token punctuation">{</span> <span class="token literal-property property">host</span><span class="token operator">:</span> <span class="token string">&#39;redis-3&#39;</span><span class="token punctuation">,</span> <span class="token literal-property property">port</span><span class="token operator">:</span> <span class="token number">6379</span> <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">]</span><span class="token punctuation">,</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token literal-property property">redisOptions</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token literal-property property">password</span><span class="token operator">:</span> <span class="token string">&#39;secure_password&#39;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="deploiement-automatise" tabindex="-1"><a class="header-anchor" href="#deploiement-automatise"><span>Déploiement automatisé</span></a></h2><h3 id="script-de-deploiement-complet" tabindex="-1"><a class="header-anchor" href="#script-de-deploiement-complet"><span>Script de déploiement complet</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token shebang important">#!/bin/bash</span></span>
<span class="line"><span class="token comment"># deploy.sh - Déploiement automatisé</span></span>
<span class="line"></span>
<span class="line"><span class="token builtin class-name">set</span> <span class="token parameter variable">-e</span></span>
<span class="line"></span>
<span class="line"><span class="token builtin class-name">echo</span> <span class="token string">&quot;🚀 Starting MathQuest deployment...&quot;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Mise à jour du code</span></span>
<span class="line"><span class="token function">git</span> pull origin main</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Installation des dépendances</span></span>
<span class="line"><span class="token function">npm</span> <span class="token function">install</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Construction optimisée</span></span>
<span class="line">./build-all.sh --low-memory</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Migration base de données</span></span>
<span class="line"><span class="token builtin class-name">cd</span> backend</span>
<span class="line">npx prisma migrate deploy</span>
<span class="line"><span class="token builtin class-name">cd</span> <span class="token punctuation">..</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Redémarrage des services</span></span>
<span class="line">pm2 restart ecosystem.config.js</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Vérification de santé</span></span>
<span class="line"><span class="token function">sleep</span> <span class="token number">10</span></span>
<span class="line"><span class="token function">curl</span> <span class="token parameter variable">-f</span> http://localhost:3007/health <span class="token operator">||</span> <span class="token builtin class-name">exit</span> <span class="token number">1</span></span>
<span class="line"><span class="token function">curl</span> <span class="token parameter variable">-f</span> http://localhost:3008/ <span class="token operator">||</span> <span class="token builtin class-name">exit</span> <span class="token number">1</span></span>
<span class="line"></span>
<span class="line"><span class="token builtin class-name">echo</span> <span class="token string">&quot;✅ Deployment completed successfully!&quot;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="rollback" tabindex="-1"><a class="header-anchor" href="#rollback"><span>Rollback</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token shebang important">#!/bin/bash</span></span>
<span class="line"><span class="token comment"># rollback.sh - Retour arrière</span></span>
<span class="line"></span>
<span class="line"><span class="token builtin class-name">echo</span> <span class="token string">&quot;🔄 Rolling back to previous version...&quot;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Arrêt des services</span></span>
<span class="line">pm2 stop ecosystem.config.js</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Restauration du code</span></span>
<span class="line"><span class="token function">git</span> checkout HEAD~1</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Reconstruction</span></span>
<span class="line">./build-all.sh --low-memory</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Redémarrage</span></span>
<span class="line">pm2 start ecosystem.config.js</span>
<span class="line"></span>
<span class="line"><span class="token builtin class-name">echo</span> <span class="token string">&quot;✅ Rollback completed!&quot;</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="securite" tabindex="-1"><a class="header-anchor" href="#securite"><span>Sécurité</span></a></h2><h3 id="configuration-firewall" tabindex="-1"><a class="header-anchor" href="#configuration-firewall"><span>Configuration firewall</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># UFW (Ubuntu)</span></span>
<span class="line"><span class="token function">sudo</span> ufw <span class="token builtin class-name">enable</span></span>
<span class="line"><span class="token function">sudo</span> ufw allow <span class="token function">ssh</span></span>
<span class="line"><span class="token function">sudo</span> ufw allow <span class="token string">&#39;Nginx Full&#39;</span></span>
<span class="line"><span class="token function">sudo</span> ufw allow <span class="token number">80</span></span>
<span class="line"><span class="token function">sudo</span> ufw allow <span class="token number">443</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Vérification</span></span>
<span class="line"><span class="token function">sudo</span> ufw status</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="mises-a-jour-de-securite" tabindex="-1"><a class="header-anchor" href="#mises-a-jour-de-securite"><span>Mises à jour de sécurité</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Mise à jour système</span></span>
<span class="line"><span class="token function">sudo</span> <span class="token function">apt</span> update <span class="token operator">&amp;&amp;</span> <span class="token function">sudo</span> <span class="token function">apt</span> upgrade <span class="token parameter variable">-y</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Redémarrage si nécessaire</span></span>
<span class="line"><span class="token function">sudo</span> <span class="token function">reboot</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="monitoring-de-securite" tabindex="-1"><a class="header-anchor" href="#monitoring-de-securite"><span>Monitoring de sécurité</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Logs d&#39;accès suspects</span></span>
<span class="line"><span class="token function">sudo</span> <span class="token function">tail</span> <span class="token parameter variable">-f</span> /var/log/nginx/access.log <span class="token operator">|</span> <span class="token function">grep</span> <span class="token parameter variable">-E</span> <span class="token string">&quot;(POST|PUT|DELETE).*(admin|login|auth)&quot;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Tentatives de connexion SSH</span></span>
<span class="line"><span class="token function">sudo</span> journalctl <span class="token parameter variable">-u</span> <span class="token function">ssh</span> <span class="token parameter variable">-f</span></span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="troubleshooting" tabindex="-1"><a class="header-anchor" href="#troubleshooting"><span>Troubleshooting</span></a></h2><h3 id="problemes-courants" tabindex="-1"><a class="header-anchor" href="#problemes-courants"><span>Problèmes courants</span></a></h3><p><strong>Service qui ne démarre pas :</strong></p><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Vérification des logs</span></span>
<span class="line">pm2 logs mathquest-backend <span class="token parameter variable">--lines</span> <span class="token number">50</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Vérification des variables d&#39;environnement</span></span>
<span class="line">pm2 show mathquest-backend</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>Mémoire pleine :</strong></p><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Vérification de l&#39;utilisation</span></span>
<span class="line">pm2 monit</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Redémarrage avec limite mémoire réduite</span></span>
<span class="line">pm2 restart mathquest-backend --max-memory-restart 256M</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>Connexions WebSocket qui échouent :</strong></p><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Vérification Nginx</span></span>
<span class="line"><span class="token function">sudo</span> nginx <span class="token parameter variable">-t</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Logs Nginx</span></span>
<span class="line"><span class="token function">sudo</span> <span class="token function">tail</span> <span class="token parameter variable">-f</span> /var/log/nginx/error.log</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>Base de données inaccessible :</strong></p><div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre><code class="language-bash"><span class="line"><span class="token comment"># Test de connexion</span></span>
<span class="line">psql <span class="token parameter variable">-U</span> mathquest_user <span class="token parameter variable">-d</span> mathquest <span class="token parameter variable">-h</span> localhost</span>
<span class="line"></span>
<span class="line"><span class="token comment"># Vérification du service</span></span>
<span class="line"><span class="token function">sudo</span> systemctl status postgresql</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Cette configuration permet un déploiement robuste et scalable de MathQuest adapté aux environnements de production.</p>`,78)]))}const o=n(p,[["render",i]]),r=JSON.parse('{"path":"/details-techniques/deployement.html","title":"Déploiement et DevOps","lang":"fr-FR","frontmatter":{},"git":{"updatedTime":1758286875000,"contributors":[{"name":"alexisflesch","username":"alexisflesch","email":"alexis.flesch@gmail.com","commits":1,"url":"https://github.com/alexisflesch"}],"changelog":[{"hash":"8fbb71211cc25ed6748dfb46362eb2796047c9da","time":1758286875000,"email":"alexis.flesch@gmail.com","author":"alexisflesch","message":"updating doc"}]},"filePathRelative":"details-techniques/deployement.md"}');export{o as comp,r as data};

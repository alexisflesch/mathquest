<template><div><h1 id="utilisation-de-l-application" tabindex="-1"><a class="header-anchor" href="#utilisation-de-l-application"><span>Utilisation de l'application</span></a></h1>
<blockquote>
<p>Cette page présente les principales fonctionnalités de MathQuest.</p>
</blockquote>
<h2 id="fonctionnalites-principales" tabindex="-1"><a class="header-anchor" href="#fonctionnalites-principales"><span>Fonctionnalités principales</span></a></h2>
<p>MathQuest propose trois modes de jeu principaux :</p>
<ul>
<li><strong>Quiz (mode enseignant)</strong> : Quiz en temps réel piloté par l'enseignant. L'enseignant contrôle l'enchaînement des questions, le timer, et la diffusion des réponses/corrections. Les élèves répondent en direct, sans feedback automatique (feedback oral ou à la fin).</li>
<li><strong>Tournoi (mode compétition)</strong> : Tournoi synchrone ou différé. Tous les participants reçoivent les questions en même temps (synchrone) ou peuvent rejouer la partie en différé (asynchrone). Le backend gère le timer, la progression, le classement et la diffusion des bonnes réponses et des feedbacks (si présents) à la fin de chaque question.</li>
<li><strong>Entraînement (mode libre)</strong> : Mode individuel, sans timer. L'utilisateur choisit d'enchaîner les questions à son rythme, reçoit un feedback immédiat après chaque réponse, et peut recommencer autant de fois qu'il le souhaite. Aucun score n'est enregistré.</li>
</ul>
<h2 id="prise-en-main-rapide" tabindex="-1"><a class="header-anchor" href="#prise-en-main-rapide"><span>Prise en main rapide</span></a></h2>
<ol>
<li>
<p><strong>Connexion à l'application</strong></p>
<ul>
<li>Choisissez votre profil (élève, enseignant, invité) à la connexion. En mode invité, pas besoin de créer un compte: choisissez simplement un pseudo et un avatar et vous êtes prêt à jouer. Vos résultats ne seront pas sauvegardés mais vous pourrez mettre à jour votre profil plus tard si vous le souhaitez.</li>
<li>Si vous êtes enseignant, vous pouvez créer un compte vous permettant de gérer vos activités: regroupez des questions et créez des quiz pour une utilisation en classe, ou des tournois voire des sessions d'entraînement pour vos élèves.</li>
</ul>
</li>
<li>
<p><strong>Déroulement selon le mode</strong></p>
<ul>
<li><strong>Quiz</strong> : L'enseignant crée ou sélectionne un quiz, invite les élèves à rejoindre, puis contrôle le déroulement.</li>
<li><strong>Tournoi</strong> : Un utilisateur (élève ou enseignant) lance un tournoi (synchrone ou différé), les participants rejoignent via un code, le backend gère la progression.</li>
<li><strong>Entraînement</strong> : L'utilisateur démarre une session d'entraînement libre, répond à des questions à son rythme, et obtient un feedback immédiat.</li>
</ul>
</li>
</ol>
<h2 id="guides-detailles" tabindex="-1"><a class="header-anchor" href="#guides-detailles"><span>Guides détaillés</span></a></h2>
<ul>
<li>
<RouterLink to="/utilisation/quiz/">📊 Mode Quiz (enseignant)</RouterLink></li>
<li>
<RouterLink to="/utilisation/tournoi/">🏆 Mode Tournoi</RouterLink></li>
<li>
<RouterLink to="/utilisation/entrainement/">🎯 Mode Entraînement</RouterLink></li>
</ul>
<h2 id="architecture-de-l-application-apercu" tabindex="-1"><a class="header-anchor" href="#architecture-de-l-application-apercu"><span>Architecture de l'application (aperçu)</span></a></h2>
<ul>
<li><strong>Frontend</strong> : Application React/Next.js (interface utilisateur, navigation, gestion d'état, communication temps réel via Socket.IO).</li>
<li><strong>Backend</strong> : API Node.js/Express (gestion des utilisateurs, parties, questions, statistiques, WebSocket).</li>
<li><strong>Base de données</strong> : PostgreSQL, schéma géré par Prisma.</li>
</ul>
</div></template>



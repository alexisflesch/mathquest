<template><div><h1 id="contribuer-a-la-base-commune-de-questions" tabindex="-1"><a class="header-anchor" href="#contribuer-a-la-base-commune-de-questions"><span>Contribuer à la base commune de questions</span></a></h1>
<p>Vous souhaitez enrichir la base de questions partagée de MathQuest (hébergée sur GitHub) ? Voici comment proposer vos propres questions et les rendre accessibles à tous.</p>
<p>👉 <strong>Voir la base de questions sur GitHub :</strong>
<a href="https://github.com/alexisflesch/mathquest/tree/main/questions" target="_blank" rel="noopener noreferrer">https://github.com/alexisflesch/mathquest/tree/main/questions</a></p>
<p>La structure des dossiers est organisée par <strong>Niveau</strong> (<code v-pre>6e</code>, <code v-pre>5e</code>, ...), puis <strong>Discipline</strong>, puis éventuellement <strong>thème</strong> ou <strong>auteur</strong>.</p>
<h2 id="_1-preparer-vos-fichiers-yaml" tabindex="-1"><a class="header-anchor" href="#_1-preparer-vos-fichiers-yaml"><span>1. Préparer vos fichiers YAML</span></a></h2>
<ul>
<li>Utilisez un éditeur de texte pour créer vos fichiers YAML. Préférez un éditeur qui supporte la coloration syntaxique YAML (comme VSCode, Sublime Text, etc.).</li>
<li>Rédigez vos questions au format YAML en respectant la <a href="/questions-yaml/" target="_blank" rel="noopener noreferrer">structure officielle</a>.</li>
<li>Utilisez les clés en anglais (<code v-pre>uid</code>, <code v-pre>text</code>, <code v-pre>answerOptions</code>, etc.), mais les valeurs (énoncés, thèmes, etc.) peuvent être en français.</li>
<li><strong>L'<code v-pre>uid</code> doit être unique</strong> : il doit commencer par le nom de l'auteur (ex : <code v-pre>dupont-6e-maths-fractions-001</code>). Ajoutez niveau, discipline, thème si besoin pour éviter toute collision.</li>
<li>Vous pouvez mettre autant de questions que vous voulez dans un même fichier YAML.</li>
</ul>
<h2 id="_2-proposer-une-contribution" tabindex="-1"><a class="header-anchor" href="#_2-proposer-une-contribution"><span>2. Proposer une contribution</span></a></h2>
<ul>
<li>Deux possibilités :
<ul>
<li><strong>Contact direct (recommandé pour débuter)</strong> : envoyez vos fichiers ou questions à alexis.flesch@gmail.com (idéal si vous n'êtes pas à l'aise avec GitHub).</li>
<li><strong>Pull Request sur GitHub</strong> :
<ul>
<li>Rendez-vous sur <a href="https://github.com/aflesch/mathquest" target="_blank" rel="noopener noreferrer">le dépôt GitHub de MathQuest</a> et cliquez sur &quot;Fork&quot; pour créer votre copie personnelle.</li>
<li>Ajoutez vos fichiers YAML dans le bon dossier (<code v-pre>questions/6e/</code>, etc.), puis ouvrez une Pull Request vers la branche principale du dépôt d'origine. Décrivez brièvement votre contribution (niveau, thèmes, nombre de questions, etc.).</li>
</ul>
</li>
</ul>
</li>
</ul>
<h2 id="_3-ajouter-vos-fichiers-questions" tabindex="-1"><a class="header-anchor" href="#_3-ajouter-vos-fichiers-questions"><span>3. Ajouter vos fichiers/questions</span></a></h2>
<ul>
<li>Placez vos fichiers YAML dans le dossier approprié (ex : <code v-pre>questions/6e/</code>, <code v-pre>questions/test/</code>, etc.).</li>
<li>Respectez l'organisation existante (un fichier par question ou un fichier pour un lot, selon le dossier).</li>
</ul>
<h2 id="_4-verifier-la-validite" tabindex="-1"><a class="header-anchor" href="#_4-verifier-la-validite"><span>4. Vérifier la validité</span></a></h2>
<ul>
<li>Relisez soigneusement chaque question avant de proposer une contribution.</li>
<li>Utilisez le script d'import local pour vérifier que vos fichiers sont valides et importables (voir la doc principale).</li>
<li>Corrigez toute erreur de format ou de validation.</li>
</ul>
<h2 id="_5-proposer-une-contribution" tabindex="-1"><a class="header-anchor" href="#_5-proposer-une-contribution"><span>5. Proposer une contribution</span></a></h2>
<ul>
<li>Deux possibilités :
<ul>
<li><strong>Pull Request sur GitHub</strong> : depuis votre fork, ouvrez une Pull Request vers la branche principale du dépôt d'origine. Décrivez brièvement votre contribution (niveau, thèmes, nombre de questions, etc.).</li>
<li><strong>Contact direct</strong> : envoyez vos fichiers ou questions à alexis.flesch@gmail.com (idéal pour les débutants ou si vous n'êtes pas à l'aise avec GitHub).</li>
</ul>
</li>
</ul>
<h2 id="_6-revue-et-integration" tabindex="-1"><a class="header-anchor" href="#_6-revue-et-integration"><span>6. Revue et intégration</span></a></h2>
<ul>
<li>Les mainteneurs vérifieront la qualité, la cohérence et l'absence de doublons.</li>
<li>Après validation, vos questions seront intégrées à la base commune et disponibles pour tous !</li>
</ul>
<h2 id="_7-bonnes-pratiques-et-conventions" tabindex="-1"><a class="header-anchor" href="#_7-bonnes-pratiques-et-conventions"><span>7. Bonnes pratiques et conventions</span></a></h2>
<ul>
<li>Il n'existe pas encore de liste officielle de niveaux/disciplines/thèmes/tags, mais vous pouvez consulter la partie &quot;Créer une activité&quot; de l'application pour voir les valeurs existantes (menus déroulants).</li>
<li>Pour les niveaux, utilisez les noms standards : <code v-pre>6e</code>, <code v-pre>5e</code>, ..., <code v-pre>L1</code>, <code v-pre>L2</code>, <code v-pre>L3</code>, <code v-pre>M1</code>, <code v-pre>M2</code>.</li>
</ul>
<p><strong>Merci pour votre contribution !</strong></p>
</div></template>



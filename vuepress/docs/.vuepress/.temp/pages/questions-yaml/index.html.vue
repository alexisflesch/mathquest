<template><div><h1 id="rediger-des-questions-au-format-yaml" tabindex="-1"><a class="header-anchor" href="#rediger-des-questions-au-format-yaml"><span>Rédiger des questions au format YAML</span></a></h1>
<blockquote>
<p>Cette page explique comment rédiger des questions pour MathQuest au format YAML, en utilisant les noms de champs <strong>anglais</strong> (cohérence avec le code). Les valeurs et la documentation sont en français.</p>
</blockquote>
<h2 id="exemple-minimal-champs-obligatoires" tabindex="-1"><a class="header-anchor" href="#exemple-minimal-champs-obligatoires"><span>Exemple minimal (champs obligatoires)</span></a></h2>
<div class="language-yaml line-numbers-mode" data-highlighter="prismjs" data-ext="yml"><pre v-pre><code class="language-yaml"><span class="line"><span class="token key atrule">uid</span><span class="token punctuation">:</span> <span class="token string">"Q-0001"</span></span>
<span class="line"><span class="token key atrule">text</span><span class="token punctuation">:</span> <span class="token string">"Quelle est la capitale de la France ?"</span></span>
<span class="line"><span class="token key atrule">questionType</span><span class="token punctuation">:</span> <span class="token string">"single_choice"</span></span>
<span class="line"><span class="token key atrule">discipline</span><span class="token punctuation">:</span> <span class="token string">"géographie"</span></span>
<span class="line"><span class="token key atrule">themes</span><span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token string">"Europe"</span><span class="token punctuation">,</span> <span class="token string">"France"</span><span class="token punctuation">]</span></span>
<span class="line"><span class="token key atrule">answerOptions</span><span class="token punctuation">:</span></span>
<span class="line">  <span class="token punctuation">-</span> <span class="token string">"Paris"</span></span>
<span class="line">  <span class="token punctuation">-</span> <span class="token string">"Londres"</span></span>
<span class="line">  <span class="token punctuation">-</span> <span class="token string">"Berlin"</span></span>
<span class="line">  <span class="token punctuation">-</span> <span class="token string">"Madrid"</span></span>
<span class="line"><span class="token key atrule">correctAnswers</span><span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token boolean important">true</span><span class="token punctuation">,</span> <span class="token boolean important">false</span><span class="token punctuation">,</span> <span class="token boolean important">false</span><span class="token punctuation">,</span> <span class="token boolean important">false</span><span class="token punctuation">]</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="exemple-complet-toutes-options" tabindex="-1"><a class="header-anchor" href="#exemple-complet-toutes-options"><span>Exemple complet (toutes options)</span></a></h2>
<p>Ci-dessous un exemple complet avec toutes les clefs possibles ainsi que la syntaxe à utiliser pour écrire un champ sur plusieurs lignes.</p>
<div class="language-yaml line-numbers-mode" data-highlighter="prismjs" data-ext="yml"><pre v-pre><code class="language-yaml"><span class="line"><span class="token key atrule">uid</span><span class="token punctuation">:</span> <span class="token string">"Q-0002"</span></span>
<span class="line"><span class="token key atrule">title</span><span class="token punctuation">:</span> <span class="token string">"Capitale européenne"</span></span>
<span class="line"><span class="token key atrule">text</span><span class="token punctuation">:</span> <span class="token punctuation">|</span><span class="token scalar string"></span>
<span class="line">  Dans quelle ville se trouve le siège du gouvernement allemand ?</span></span>
<span class="line"></span>
<span class="line">  Un indice <span class="token punctuation">?</span> Cette ville est aussi la capitale du pays<span class="token punctuation">,</span> et elle a été </span>
<span class="line">  divisée pendant la guerre froide.</span>
<span class="line"><span class="token key atrule">questionType</span><span class="token punctuation">:</span> <span class="token string">"multiple_choice"</span></span>
<span class="line"><span class="token key atrule">discipline</span><span class="token punctuation">:</span> <span class="token string">"géographie"</span></span>
<span class="line"><span class="token key atrule">themes</span><span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token string">"Europe"</span><span class="token punctuation">,</span> <span class="token string">"Allemagne"</span><span class="token punctuation">]</span></span>
<span class="line"><span class="token key atrule">difficulty</span><span class="token punctuation">:</span> <span class="token number">2</span></span>
<span class="line"><span class="token key atrule">gradeLevel</span><span class="token punctuation">:</span> <span class="token string">"5e"</span></span>
<span class="line"><span class="token key atrule">author</span><span class="token punctuation">:</span> <span class="token string">"Mme Dupont"</span></span>
<span class="line"><span class="token key atrule">explanation</span><span class="token punctuation">:</span> <span class="token string">"Berlin est la capitale depuis 1990."</span></span>
<span class="line"><span class="token key atrule">tags</span><span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token string">"capitale"</span><span class="token punctuation">,</span> <span class="token string">"Europe"</span><span class="token punctuation">,</span> <span class="token string">"histoire"</span><span class="token punctuation">]</span></span>
<span class="line"><span class="token key atrule">timeLimit</span><span class="token punctuation">:</span> <span class="token number">30</span></span>
<span class="line"><span class="token key atrule">isHidden</span><span class="token punctuation">:</span> <span class="token boolean important">false</span></span>
<span class="line"><span class="token key atrule">answerOptions</span><span class="token punctuation">:</span></span>
<span class="line">  <span class="token punctuation">-</span> <span class="token string">"Munich"</span></span>
<span class="line">  <span class="token punctuation">-</span> <span class="token string">"Berlin"</span></span>
<span class="line">  <span class="token punctuation">-</span> <span class="token string">"Francfort"</span></span>
<span class="line">  <span class="token punctuation">-</span> <span class="token string">"Hambourg"</span></span>
<span class="line"><span class="token key atrule">correctAnswers</span><span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token boolean important">false</span><span class="token punctuation">,</span> <span class="token boolean important">true</span><span class="token punctuation">,</span> <span class="token boolean important">false</span><span class="token punctuation">,</span> <span class="token boolean important">false</span><span class="token punctuation">]</span></span>
<span class="line"><span class="token key atrule">feedbackWaitTime</span><span class="token punctuation">:</span> <span class="token number">5</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="reference-des-champs-yaml" tabindex="-1"><a class="header-anchor" href="#reference-des-champs-yaml"><span>Référence des champs YAML</span></a></h2>
<table>
<thead>
<tr>
<th>Champ</th>
<th>Type</th>
<th>Obligatoire</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code v-pre>uid</code></td>
<td>string</td>
<td>oui</td>
<td>Identifiant unique de la question (fourni par l'utilisateur)</td>
</tr>
<tr>
<td><code v-pre>title</code></td>
<td>string</td>
<td>non</td>
<td>Titre court (optionnel mais recommandé)</td>
</tr>
<tr>
<td><code v-pre>text</code></td>
<td>string</td>
<td>oui</td>
<td>Énoncé de la question (en français ou autre)</td>
</tr>
<tr>
<td><code v-pre>questionType</code></td>
<td>string</td>
<td>oui</td>
<td><code v-pre>multiple_choice</code> ou <code v-pre>single_choice</code></td>
</tr>
<tr>
<td><code v-pre>discipline</code></td>
<td>string</td>
<td>oui</td>
<td>Discipline (ex : <code v-pre>mathématiques</code>, <code v-pre>géographie</code>)</td>
</tr>
<tr>
<td><code v-pre>themes</code></td>
<td>string[]</td>
<td>oui</td>
<td>Liste de thèmes (en français ou anglais)</td>
</tr>
<tr>
<td><code v-pre>difficulty</code></td>
<td>int</td>
<td>non</td>
<td>Niveau de difficulté (entier)</td>
</tr>
<tr>
<td><code v-pre>gradeLevel</code></td>
<td>string</td>
<td>non</td>
<td>Niveau scolaire (ex : <code v-pre>5e</code>, <code v-pre>Terminale</code>)</td>
</tr>
<tr>
<td><code v-pre>author</code></td>
<td>string</td>
<td>non</td>
<td>Auteur de la question</td>
</tr>
<tr>
<td><code v-pre>explanation</code></td>
<td>string</td>
<td>non</td>
<td>Explication affichée après la réponse</td>
</tr>
<tr>
<td><code v-pre>tags</code></td>
<td>string[]</td>
<td>non</td>
<td>Liste de tags</td>
</tr>
<tr>
<td><code v-pre>timeLimit</code></td>
<td>int</td>
<td>non</td>
<td>Limite de temps en secondes</td>
</tr>
<tr>
<td><code v-pre>isHidden</code></td>
<td>boolean</td>
<td>non</td>
<td>Si vrai, la question est cachée aux élèves</td>
</tr>
<tr>
<td><code v-pre>answerOptions</code></td>
<td>string[]</td>
<td>oui*</td>
<td>Liste des propositions (obligatoire pour multiple_choice)</td>
</tr>
<tr>
<td><code v-pre>correctAnswers</code></td>
<td>bool[]</td>
<td>oui*</td>
<td>Tableau de booléens, un par proposition</td>
</tr>
<tr>
<td><code v-pre>feedbackWaitTime</code></td>
<td>int</td>
<td>non</td>
<td>Temps (secondes) d'affichage de l'explication</td>
</tr>
</tbody>
</table>
<ul>
<li>
<p>Le champ <code v-pre>timeLimit</code> correspond à la durée du chrono (en secondes) pour la question. Evitez les durées trop longues (plus de 30 secondes) car les élèves doivent attendre la fin du chrono pour passer à la question suivante ! Ou alors, ajoutez le paramètre <code v-pre>isHidden</code> pour que la question ne soit pas affichée aux élèves en mode &quot;tournoi&quot; ou &quot;entraînement&quot; (cf ci-dessous).</p>
</li>
<li>
<p>Le champ <code v-pre>isHidden</code> permet de &quot;cacher&quot; une question aux élèves. Autrement dit, lorsqu'ils travailleront en mode &quot;tournoi&quot; ou &quot;entraînement&quot;, cette question ne sera jamais affichée. Cela peut être utile pour des questions trop difficiles, hors programme, ou qui nécessitent un grand temps de réflexion (donc bien pour un quiz en classe, mais pas pour un entraînement autonome).</p>
</li>
<li>
<p>le champ <code v-pre>feedbackWaitTime</code> a une valeur par défaut de 5 secondes. C'est le temps pendant lequel l'explication restera affichée après la fin du chrono.</p>
</li>
</ul>
<hr>
<h2 id="ecrire-des-formules-mathematiques-avec-latex" tabindex="-1"><a class="header-anchor" href="#ecrire-des-formules-mathematiques-avec-latex"><span>Écrire des formules mathématiques avec LaTeX</span></a></h2>
<p>Vous pouvez insérer des formules mathématiques dans vos questions, réponses ou explications en utilisant la syntaxe LaTeX (compatible MathJax).</p>
<ul>
<li>Pour une formule en ligne :<div class="language-markdown line-numbers-mode" data-highlighter="prismjs" data-ext="md"><pre v-pre><code class="language-markdown"><span class="line">\(E = mc^2\)</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div></li>
<li>Pour une formule centrée (affichage bloc) :<div class="language-markdown line-numbers-mode" data-highlighter="prismjs" data-ext="md"><pre v-pre><code class="language-markdown"><span class="line">\[</span>
<span class="line">\int_0^1 x^2 dx = \frac{1}{3}</span>
<span class="line">\]</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></li>
</ul>
<p>Les &quot;anciens&quot; délimiteurs de LaTeX (<code v-pre>$$</code> et <code v-pre>$</code>) <strong>ne sont pas supportés</strong> pour éviter les conflits avec le symbole dollar qui pourrait être utilisé dans les réponses (en particulier dans les matières non scientifiques où les enseignants ignorent l'existence de LaTeX). N'importe quel chatbot est capable de convertir ces délimiteurs en <code v-pre>\(...\)</code> ou <code v-pre>\[...\]</code> si nécessaire, ou de vous aider à le faire avec des expressions régulières.</p>
<p>Toutes les zones de texte (<code v-pre>text</code>, <code v-pre>answerOptions</code>, <code v-pre>explanation</code>, etc.) acceptent le LaTeX.</p>
<hr>
<p><strong>Importer des questions :</strong></p>
<ul>
<li>Placez vos fichiers YAML dans le dossier prévu à cet effet.</li>
<li>Utilisez le script d'import fourni pour les charger en base.</li>
</ul>
</div></template>



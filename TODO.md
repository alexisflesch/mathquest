# Favicon
Test it

# PWA
Do it

# Composant de feedback du score
Créer un composant de feedback du score qui s'anime après chaque calcul du score (où ?) et qui montre le classement actuel.

# Composant de feedback de la question
En mode tournoi, mettre en pause à la fin de chaque question et afficher le feedback de la question (s'il est défini dans la base) avec un dialog qui s'ouvre par-dessus:
- remettre en compte à rebours de qqs secondes
- afficher l'animation de score
- afficher le feedback de la question avec éventuellement un "bravo" ou un "dommage" en fonction de la réponse

# Videoproj
- Tant que le quiz n'a pas commencé, afficher un QR-Code à la place de la question
- Tant que le quiz n'a pas commencé, afficher un QR-Code à la place du chrono
- Tant que personne n'est connecté, afficher un QR-Code à la place du podium
- Toutes les divs avec un QR-code temporaire doivent avoir un titre
- La div QR-code doit avoir le code du tournoi aussi large que possible
- Modifier le design du composant de zoom
- Changer taille et disposition par défaut
- Sauvegarder mise en page dans localStorage
- Au fur et à mesure que les étudiants rejoignent, les placer sur le podium :
    - Affecter un score de 0.1 au premier arrivé, puis décrémenter de 0.001 à chaque fois qu'un étudiant arrive

# Late join
Vérifier que le backend fait son boulot puis tester le front
- videoproj : le timer fait n'imp quand il devrait être stoppé
- live : vérifier que le timer marche quand stoppé/en pause
- dashboard : pareil

# Teacher dashboard
- Commencer par uploader des "vraies" questions pour bien tester l'ui
- Faire des tests d'édition sur le timer (pause, édition, reprise, stpo, étidtion, reprise, etc.)
- UI : édition du timer
- UI : mettre le trophée en dernier ?
- Afficher les stats sur le dashboard automatiquement !





# Mode entraînement
Remettre les filtres dans le bon ordre (niveau en premier) et filtrer les dropdowns correctement. Est-ce qu'on ne devrait pas garder la même interface que pour le mode tournoi ? Peut-être même ne garder qu'une page et laisser choisir le mode à la fin (entraînement ou tournoi) ?

# Score
Faire en sorte que le score max soit 1000 points :
- soit n le nombre de questions
- chaque question rapport jusqu'à 1000/n points
- chaque seconde passée à réfléchir enlève 0.5 point
- en mode quiz, quand le prof termine le quiz, on met à l'échelle si toutes les questions n'ont pas été traitées
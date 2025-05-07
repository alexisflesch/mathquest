# Favicon
Test it

# PWA
Do it


# Feedback :
- mettre en option dans un fichier bien visible :
    - le temps d'affichage des croix/checks
    - le temps d'affichage du feedback par défaut
- ajouter une option "temps feedback" dans les questions et demander au serveur de le regarder
- c'est au serveur de décider du temps du feedback, pas à l'ui, l'ui doit l'écouter via socket en même temps qu'elle reçoit le feedback. Ce n'est pas non plus l'ui qui décide de fermer la fenêtre de feedback, c'est quand le serveur envoie la question d'après ou ferme le tournoi.
- quand le tournoi envoie le signal que le tournoi est terminé (normalement il a eu le temps de calculer le leaderboard), on redirige vers leaderboard direct.


# Composant de feedback du score
Créer un composant de feedback du score qui s'anime après chaque calcul du score (où ?) et qui montre le classement actuel. Placement :
- sur téléphone : dans le bandeau du haut
- sur desktop : lui réserver une place en haut de la page, peut-être à côté du chrono


### Troisième truc (marchera peut-être sans modif)
Si le feedback n'est pas défini, afficher juste les croix/checks et attendre 1-2s avant de passer à la question suivante.

# Videoproj
- Tant que le quiz n'a pas commencé, afficher un QR-Code à la place de la question
- Tant que le quiz n'a pas commencé, afficher un QR-Code à la place du chrono
- Tant que personne n'est connecté, afficher un QR-Code à la place du podium
- Toutes les divs avec un QR-code temporaire doivent avoir un titre pour qu'on puisse les repositionner
- La div QR-code doit avoir le code du tournoi aussi large que possible
- Modifier le design du composant de zoom
- Changer taille et disposition par défaut
- Sauvegarder mise en page dans localStorage
- Au fur et à mesure que les étudiants rejoignent, les placer sur le podium :
    - Vérifier qu'ils sont loggés et
    - Affecter un score de 0.1 au premier arrivé, puis décrémenter de 0.001 à chaque fois qu'un étudiant arrive

# Late join
Vérifier que le backend fait son boulot puis tester le front
- live : vérifier que le timer marche quand stoppé/en pause
- dashboard : demander au backend d'envoyer les stats (si refresh on perd tout)

# Teacher dashboard
- Commencer par uploader des "vraies" questions pour bien tester l'ui
- Faire des tests d'édition sur le timer (pause, édition, reprise, stpo, étidtion, reprise, etc.)
- UI : édition du timer
- UI : mettre le trophée en dernier ?


# Score
En mode quiz, quand le prof termine le quiz, on met à l'échelle si toutes les questions n'ont pas été traitées.
Attention, pour l'instant le scaling est fait sur le nombre de réponses de l'étudiant, ça n'est pas ce qu'on veut !!



# Redirect
Sur toutes les pages student/*, faire un redirect vers l'authentification si l'utilisateur n'est pas connecté puis renvoyer sur la page d'origine.
## 🔹 Exercice 1 – QCM (choix simple)

On considère deux vecteurs $ u $ et $ v $ non colinéaires de $ \mathbb{R}^2 $. Laquelle des affirmations suivantes est **correctement formulée** ?

A) $ \text{Vect}(u,v) $ est une base de $ \mathbb{R}^2 $.  
B) $ (u,v) $ est une base de $ \text{Vect}(u,v) $.  
C) $ \{u,v\} $ est une base de $ \mathbb{R}^2 $.  
D) $ \text{Vect}(u,v) $ est une famille libre.

> **Réponse : B**  
> → Une **famille** (comme $ (u,v) $) peut être une **base**. $ \text{Vect}(u,v) $ est un **espace**, pas une base.  
> → $ \{u,v\} $ est un ensemble non ordonné, pas adapté pour une base.  
> → D confond espace et famille.

---

## 🔹 Exercice 2 – QCU (choix unique)

Laquelle des expressions suivantes désigne un **sous-espace vectoriel** de $ \mathbb{R}^n $ ?

A) $ (e_1, e_2) $  
B) $ \{e_1, e_2\} $  
C) $ \text{Vect}(e_1, e_2) $  
D) $ \text{rg}(e_1, e_2) $

> **Réponse : C**  
> → $ (e_1,e_2) $ : famille ordonnée  
> → $ \{e_1,e_2\} $ : ensemble de vecteurs  
> → $ \text{rg} $ : un nombre (le rang)  
> → $ \text{Vect}(e_1,e_2) $ : sous-espace vectoriel

---

## 🔹 Exercice 3 – Vrai ou Faux (justifier)

Dire si l’affirmation est **vraie** ou **fausse**, et justifier.

> « Si $ u $ et $ v $ sont deux vecteurs non colinéaires de $ \mathbb{R}^2 $, alors $ \text{Vect}(u,v) $ est une base de $ \mathbb{R}^2 $. »

> **Réponse : Faux**  
> → $ \text{Vect}(u,v) $ est un **espace vectoriel**, pas une **base**.  
> → Ce qu’on veut dire : *la famille $ (u,v) $ est une base de $ \mathbb{R}^2 $, car elle est libre et $ \dim \mathbb{R}^2 = 2 $.*

---

## 🔹 Exercice 4 – QCM

Soit $ u = (1,0) $, $ v = (0,1) $, $ w = (1,1) $ dans $ \mathbb{R}^2 $.  
Parmi les affirmations suivantes, laquelle est correcte ?

A) $ (u,v,w) $ est une base de $ \mathbb{R}^2 $.  
B) $ \text{Vect}(u,v,w) $ est une famille libre.  
C) $ \dim(\text{Vect}(u,v,w)) = 3 $.  
D) $ (u,v) $ est une base de $ \text{Vect}(u,v,w) $.

> **Réponse : D**  
> → A : une base doit avoir exactement $ \dim E $ vecteurs **libres** → ici 3 vecteurs dans $ \mathbb{R}^2 $ : impossible  
> → B : un espace n’est pas une famille  
> → C : impossible → max dim = 2  
> → D : correct, car $ (u,v) $ libre et $ \text{Vect}(u,v) = \mathbb{R}^2 = \text{Vect}(u,v,w) $

---

## 🔹 Exercice 5 – Question numérique

Soient $ u, v, w \in \mathbb{R}^5 $ trois vecteurs **linéairement indépendants**.  
Quelle est la dimension de $ \text{Vect}(u,v,w) $ ?

> **Réponse : 3**  
> → Par définition : si une famille de $ k $ vecteurs est libre, alors $ \dim(\text{Vect}(u_1,\dots,u_k)) = k $.

---

## 🔹 Exercice 6 – QCM (piège de vocabulaire)

Laquelle de ces affirmations est **nécessairement fausse** ?

A) Une famille de 4 vecteurs dans $ \mathbb{R}^3 $ peut être libre.  
B) Une famille contenant le vecteur nul est libre.  
C) Une famille de 2 vecteurs non colinéaires dans $ \mathbb{R}^2 $ est une base.  
D) $ \text{Vect}(u) $ est une droite vectorielle.

> **Réponse : B**  
> → Une famille contenant le vecteur nul est **toujours liée**.  
> → A : faux aussi (trop de vecteurs), mais B est **toujours** faux, sans condition.  
> → C : vrai si les deux sont non nuls et non colinéaires  
> → D : vrai (si $ u \ne 0 $)

---

## 🔹 Exercice 7 – Vrai/Faux

Vrai ou faux ? Justifier.

> « Si $ (u,v) $ est une famille génératrice de $ E $ et que $ u $ et $ v $ ne sont pas colinéaires, alors $ (u,v) $ est une base de $ E $. »

> **Réponse : Vrai (si $ \dim E = 2 $)** – mais ambigu  
> → En toute rigueur : faux **si on ne connaît pas la dimension de $ E $**.  
> → Contre-exemple : $ E = \mathbb{R}^3 $, $ u = (1,0,0) $, $ v = (0,1,0) $ : famille non colinéaire, génératrice d’un plan, mais **pas** de $ \mathbb{R}^3 $.  
> → Donc : **Faux** en général.  
> → Pour que ce soit une base, il faut : libre + génératrice **de $ E $**.

> ✅ Correction : l’affirmation suppose-t-elle que $ (u,v) $ engendre $ E $ tout entier ? Oui → donc si $ E = \text{Vect}(u,v) $, alors oui, c’est une base (car libre + génératrice).  
> → **Donc : Vrai**, sous cette interprétation.

→ *Bon point de discussion en classe !*

---

## 🔹 Exercice 8 – Écriture correcte

Corrigez la phrase suivante (très fréquente, mais incorrecte) :

> « Puisque $ u $ et $ v $ ne sont pas colinéaires, $ \text{Vect}(u,v) $ est une base de $ \mathbb{R}^2 $. »

> **Correction attendue :**  
> « Puisque $ u $ et $ v $ ne sont pas colinéaires, la famille $ (u,v) $ est libre. Comme elle contient 2 vecteurs et que $ \dim(\mathbb{R}^2) = 2 $, c’est une base de $ \mathbb{R}^2 $. »

---

## 🔹 Exercice 9 – Famille vs ensemble

Laquelle de ces notations désigne une **famille ordonnée de vecteurs** ?

A) $ \{u,v\} $  
B) $ \text{Vect}(u,v) $  
C) $ (u,v) $  
D) $ u + v $

> **Réponse : C**  
> → En algèbre linéaire, les **parenthèses** $ (u,v) $ désignent une **famille ordonnée**, essentielle pour parler de base, de coordonnées, de matrice.  
> → $ \{u,v\} $ est un ensemble non ordonné.  
> → Les autres : expression ou espace.

---

## 🔹 Exercice 10 – Synthèse

Soit $ E = \text{Vect}(u,v,w) \subset \mathbb{R}^4 $, avec $ u, v, w $ linéairement indépendants.

Répondre par **vrai ou faux** à chaque affirmation :

1. $ \dim E = 3 $  
2. $ (u,v,w) $ est une base de $ E $  
3. $ \text{Vect}(u,v,w) $ est une base de $ E $  
4. $ (u,v) $ est une famille libre  
5. $ (u,v,w) $ est une base de $ \mathbb{R}^4 $

> **Réponses :**  
> 1. **Vrai** → 3 vecteurs libres ⇒ dim = 3  
> 2. **Vrai** → famille libre et génératrice de $ E $  
> 3. **Faux** → $ \text{Vect} $ est un espace, pas une base  
> 4. **Vrai** → sous-famille d’une famille libre  
> 5. **Faux** → besoin de 4 vecteurs pour une base de $ \mathbb{R}^4 $

---

## ✅ Conseils pour éviter les erreurs

| Objet | Notation | Remarque |
|------|----------|---------|
| Vecteur | $ u $ | Ex: $ (1,2) \in \mathbb{R}^2 $ |
| Famille ordonnée | $ (u,v) $ | On peut parler de **base**, de **liberté**, de **coordonnées** |
| Ensemble de vecteurs | $ \{u,v\} $ | Non ordonné, pas adapté en algèbre linéaire standard |
| Espace engendré | $ \text{Vect}(u,v) $ | C’est un **sous-espace vectoriel** |
| Dimension | $ \dim(E) $ | C’est un **nombre entier** |
| Rang | $ \text{rg}(u,v,w) $ | C’est la dimension de l’espace engendré |

→ **Règle d’or :**  
> On ne dit **jamais** qu’un **espace** est une **base**.  
> On dit : **"la famille $ (u,v) $ est une base de $ \text{Vect}(u,v) $"**.


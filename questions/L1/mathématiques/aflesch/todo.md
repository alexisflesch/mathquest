### Question 2 : Le piège de la dimension

Soit une application linéaire $ f: E \to F $ avec $\dim(E) = 3$ et $\dim(F) = 4$.
Laquelle de ces affirmations est **nécessairement vraie** ?

- [ ] Si $f$ est injective, alors elle est aussi surjective.
- [x] $f$ ne peut pas être surjective.
- [ ] $f$ est nécessairement injective.
- [ ] Le rang de $f$ est forcément 4.

*(Piège : Le fameux "injective <=> surjective <=> bijective" n'est vrai que pour les endomorphismes en dimension finie.)*

---

### Question 3 : L'inversibilité en pratique

Soit $f$ l'endomorphisme de $\mathbb{R}^2$ dont la matrice dans la base canonique est $ A = \begin{pmatrix} 1 & 3 \\ k & 2 \end{pmatrix} $, où $k$ est un réel.

Pour quelle valeur de $k$ l'endomorphisme $f$ n'est-il **PAS** bijectif ?
*(Réponse numérique attendue, peut être une fraction a/b)*

- Réponse : **2/3**

*(Piège : Au lieu de cocher une propriété, il faut la traduire en un calcul. `det(A) = 2 - 3k = 0`)*

---

### Question 4 : Sous-espaces supplémentaires, un cas concret

Dans $E = \mathbb{R}^2$, lesquels de ces couples de sous-espaces sont supplémentaires ?

- [ ] $F = \text{Vect}((1,0))$ et $G = \text{Vect}((2,0))$.
- [ ] $F = \text{Vect}((1,0))$ et $G = E$.
- [x] $F = \text{Vect}((1,0))$ (l'axe des abscisses) et $G = \text{Vect}((1,1))$ (la première bissectrice).
- [ ] $F=\{(0,0)\}$ et $G = \text{Vect}((1,2))$.

*(Pièges : F et G colinéaires (intersection non nulle), F inclus dans G, somme non égale à E).*

---

### Question 5 : Trouver un noyau, c'est résoudre un système

Soit $f$ l'endomorphisme de $\mathbb{R}^3$ dont la matrice dans la base canonique est :

$$
 A = \begin{pmatrix} 1 & 1 & 2 \\ 1 & 0 & 1 \\ 0 & 1 & 1 \end{pmatrix} 
$$
Un vecteur **non nul** appartenant à $\ker(f)$ est :

- [ ] $(1, 1, -1)$
- [ ] $(2, 1, 1)$
- [x] $(-1, -1, 1)$
- [ ] $(1, 1, 1)$

*(Demande une petite résolution de système, plus active qu'une simple lecture.)*

---

### Question 6 : La stabilité, un concept moins trivial

Soit $f$ l'endomorphisme de $\mathbb{R}^3$ dont la matrice dans la base canonique $(e_1, e_2, e_3)$ est :

$$
 A = \begin{pmatrix} 1 & 2 & 0 \\ 3 & 4 & 0 \\ 0 & 0 & 5 \end{pmatrix} 
$$
Lequel de ces sous-espaces est **stable** par $f$ ?

- [ ] La droite $\text{Vect}(e_1)$.
- [x] La droite $\text{Vect}(e_3)$.
- [ ] Le plan $\text{Vect}(e_1, e_3)$.
- [ ] La droite $\text{Vect}(e_1+e_2)$.
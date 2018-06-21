# SearchEngine

## Requis

* npm
* nodeJS

## Pour tester

* Charger les modules : `npm install`
* Lancer le serveur : `node index.js`
* Ouvrir la page web dans un navigateur : par défaut double clic sur le fichier `.html`

## Comment ça marche ?

Le but de ce moteur de recherche est d'obtenir une liste de produits qui figurent dans une base de données à partir d'une requête émise par un client.

La réponse à cette requête doit être le plus pertinente possible, c'est pourquoi ce moteur de recherche repose sur les différents éléments présentés ci-après.

### 1) Indexation des données.

L'index est la base du moteur de recherche. Il y figure l'ensemble des mots clés qui décrivent les produits présent dans la base de données. Par exemple une *assiette bleue en carton d'une marque X* est représentée de la façon suivante :

    {
        "Object"    : "assiette",
        "Color"     : "bleu",
        "Material"  : "carton",
        "Brand"     : "X"
    }

Ainsi, après indexation l'ensemble des mots "assiette", "bleu", "carton", "X" se trouveront dans l'index.

Le code permettant d'initialiser la base de données et l'indexation se trouve dans `database/db.js`.

<br>

___
**21/06 :**

L'indexation s'effectue lors du démarrage du serveur. Chaque produit est extrait de la base de données (depuis la table `Product`) et ses attributs sont analysés :
* Si son attribut figure dans l'index (table `IndexTable`), alors on assigne l'identifiant `id` du mot dans l'index à l'identifiant `id_prod` du produit (via la table `Is_in`).
* Sinon, on ajoute le mot dans l'index (table `IndexTable`), puis on associe les identifiants comme précédemment (via la table `Is_in`).

**LIMITE :** On doit recréer toute la base de données pour ajouter/modifier un élément et donc refaire entièrement l'indexation.

<br>

___

### 2) Traitement de la requête.

Un des enjeux majeur du moteur de recherche est de permettre à l'utilisateur de ne pas écrire rigoureusement les mots clé indexés dans sa requête. Par exemple une faute d'orthographe ne doit pas être gênant. De même écrire *métallique* doit bien retourner les objets en "métal". Enfin, les mots vides ("un", "une", "dans", ...) ne doivent pas interférer.

Il faut donc traiter la requête de l'utilisateur pour extraire les mots clé utiles à la recherche.

Le code permettant d'extraire les mots clé se trouve dans `front/index.js`.

<br>

___
**21/06 :**

Pour chaque mot de la *requête utilisateur*, la première étape consiste en la suppression des accents et des majuscules. Un premier test permet de savoir si le mot considéré fait parti de la liste des mots vide.

En suite, on calcule la [distance de Levenshtein](https://fr.wikipedia.org/wiki/Distance_de_Levenshtein) entre le mot considéré et l'ensemble des mots de l'index. On garde enfin les mots dont la distance de Levenshtein n'est pas trop importante compte tenu de la taille du mot d'origine. Ainsi, les fautes d'orthographe sont corrigées, les accords (féminin, pluriel) disparaissent et on ne garde que les radicaux.

A l'issue de cette étape on a donc un dictionnaire portant associant à une valeur de distance de Levenshtein un tableau de mots clé probable avec leur position dans la *requête d'origine* et leur *type* (i.e. l'attribut correspondant au mot. Exemple `{1 => [[0, 'assiette', 'Object'], [1, 'jaune', 'Color']], 3 => [[3, 'porcelaine', 'Material']]}`).

Si ce dictionnaire est vide, on invite l'utilisateur à reformuler sa requête.

**LIMITES :**
* Des méthodes d'optimisation peuvent encore être mis en place.
* L'algorithme n'a pas montré de faille lors des tests, mais il n'est pas prouvé qu'il fonctionne pour toutes les requêtes.
* Comme on compare avec le contenu de l'index, l'utilisateur peut demander un objet qui pourrait exister mais qui ne figure simplement pas dans la base de données. Si c'est le cas, il devrait être prévenu.
* Ajout des opérateurs booléens (OU, ET, ...)

<br>

___

### 3) Confection de la requête plus probable.

Il faut donc maintenant réécrire la *requête initiale* avec les mots clé extraits. Cette nouvelle requête doit être la plus proche possible de celle de l'utilisateur. On va donc observer chaque mot clé et ne sélectionner que ceux qui reconstituent de façon le plus probable la *requête de l'utilisateur*.

Le code permettant de confectionner la requête plus probable se trouve dans `front/index.js`.

<br>

___
**21/06 :**

L'idée est de sélectionner les mots clés dont la distance de Levenshtein est la plus basse avec deux conditions :
* Une requête ne peut pas utiliser le même mot d'origine deux fois. Ainsi une *requête initiale* composée de 2 mots, ne pourra pas avoir plus de 2 mots dans la nouvelle requête et le premier mot ne sera sélectionné qu'une fois, même si le traitement de la *requête* aboutit à plus d'un mot clé associé à celui-ci.
* Une requête ne peut pas être composée de deux mots clé renvoyant vers le même attribut. Ainsi si deux mots différents dans la *requête initiale* sont traduits par un mot clé associé au même attribut, alors seul l'un d'entre eux sera sélectionné.

On affiche les mots clés dans le navigateur pour que l'utilisateur puisse les voir. Les mots clé secondaires qui n'ont pas été retenus pour composer la requête finale sont également affichés, pour que l'utilisateur puisse les sélectionner afin de compléter sa recherche. Il peut également ôter des mots clé primaires afin de rafiner la requête finale.

**LIMITE :** On pourrait également envisager que certains type de mots comptent plus (par exemple le type d'objet).

<br>

___

### 4) Recherche en base de données.

Une fois la requête plus probable extraite, il faut trouver les produits qui correspondent dans la base de données.

Le code permettant de faire cette recherche se trouve dans `front/index.js` et dans `routes/produits.js`.

<br>

___
**21/06 :**

L'idée est d'extraire de la base de données, pour chaque mot clé, tous les produits qui ont en attribut ce mot clé. On utilise bien sûr l'index
pour se faire.

On stocke l'ensemble des identifiants de produit dans une liste, même s'ils apparaissent plusieurs fois.

**LIMITE :** ...

<br>

___

### 5) Choix des résultats.

A partir de la liste précédemment obtenue, il faut déterminer les produits qui vont être affichés pour l'utilisateur
et l'ordre dans lequel ils vont apparaîtrent.

Le code permettant de faire ce choix se trouve dans `front/index.js`.

___
**21/06 :**

La première étape consiste à calculer un score pour chaque produit distinct. Ce score correspond simplement au nombre d'apparissions dans la liste optenue.

On affiche enfin les produits dans l'ordre des scores décroissants. Le produit le plus pertinent par rapport à la
requête se trouve donc en premier.

**LIMITE :** ...

<br>

___

L'ensemble du code est commenté en français.

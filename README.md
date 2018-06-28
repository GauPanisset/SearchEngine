# SearchEngine

## Requis

* npm
* nodeJS
* elasticsearch

## Pour tester

A taper dans la console pour :
* Charger les modules : `npm install`
* Lancer le serveur : `node init.js`
* Lancer le serveur Elasticsearch : `elasticsearch`

A faire :
* Lancer le serveur de base de données mysql.
* Ouvrir la page web dans un navigateur : par défaut double clic sur le fichier `.html`

## Comment ça marche ?

Le but de ce moteur de recherche est d'obtenir une liste de produits qui figurent dans une base de données à partir d'une requête émise par un client.

La réponse à cette requête doit être le plus pertinente possible, c'est pourquoi ce moteur de recherche repose sur les différents éléments présentés ci-après.

### 1) Structure des données.

Le moteur va chercher les objets présents dans une base de données. La structure de celles-ci doivent permettre
des requêtes efficaces.

<br>

___
**21/06 :** Le code permettant d'initialiser la base de données dans `database/db.js` sur la branche `master`.

Par exemple une *assiette bleue en carton d'une marque X* est représentée de la façon suivante :

    {
        "Object"    : "assiette",
        "Color"     : "bleu",
        "Material"  : "carton",
        "Brand"     : "X"
    }

On peut éventuellement penser à d'autres attributs tels que des *catégories*, *forme*, *prix*, *type de couleur*
, ...

**LIMITE :** Les bases de données sont rarement (voir jamais) déjà sous cette forme.

<br>

___
**28/06 :** Le code permettant d'initialiser la base de données dans `database/init.js` sur la branche `Elastic`.

Le problème du modèle précédent était que les marques souhaitant déposer leurs produits sur le site doivent pouvoir
le faire de façon simple. Or, les marques ont des bases de données prévues pour la vente en ligne, c'est-à-dire
dont la structure ne se rapproche pas du tout de celle proposée précédemment. En effet, les produits ne sont pas
décrits par des attributs, mais par un ensemble de textes (typiqement un titre, une description et éventuellement des
catégories).

Ainsi pour l'*assiette bleue en carton d'une marque X* est représentée par exemple de la façon suivante :

    {
        "Text1"     : "Petits extras",
        "Text2"     : "Assiettes",
        "Text3"     : "Lot de 8 assiettes en carton - X - bleues"
        "Text4"     : "Acheter un lot d'asisttes en carton X aux couleurs pastelles"
    }

**LIMITE :** On ne sait pas extraire les mots clés principaux (en s'affranchissant des accords féminin/pluriel).
Tous les mots figurant dans les descriptions se retrouveront dans l'index.

### 2) Indexation des données.

L'index est la base du moteur de recherche. Il y figure l'ensemble des mots clés qui décrivent les produits
présent dans la base de données.

Avec l'exemple de l'*assiette bleue en carton d'une marque X*, après indexation l'ensemble des mots "assiette", "bleu", "carton" et "X" se trouveront dans l'index.

<br>

___
**21/06 :** Le code permettant d'initialiser l'indexation se trouve dans `database/db.js` sur la branche `master`.

L'indexation s'effectue lors du démarrage du serveur. Chaque produit est extrait de la base de données (depuis la table `Product`) et ses attributs sont analysés :
* Si son attribut figure dans l'index (table `IndexTable`), alors on assigne l'identifiant `id` du mot dans l'index à l'identifiant `id_prod` du produit (via la table `Is_in`).
* Sinon, on ajoute le mot dans l'index (table `IndexTable`), puis on associe les identifiants comme précédemment (via la table `Is_in`).

**LIMITE :** On doit recréer toute la base de données pour ajouter/modifier un élément et donc refaire entièrement l'indexation.

<br>

___
**28/06 :** Le code permettant d'initialiser l'indexation se trouve dans `elasticsearch/init.js` sur la branche `Elastic`.

Le module **Elasticsearch** est spécialement conçu pour créer un moteur de recherche. Il propose une API permettant
d'indexer des documents, de faire des recherches, de faire des suggestions, ...

Après avoir initialisé le client, nous utilisons la méthode `.bulk` avec des données en *JSON* extraites de
la base de données.

**LIMITE :** Pour le moment, il n'y a pas de méthodes permettant d'indexer n'importe quelle base de données, ni
de méthodes permettant de modifier l'index déjà existant.

### 3) Traitement de la requête.

Un des enjeux majeur du moteur de recherche est de permettre à l'utilisateur de ne pas avoir à écrire dans sa requête rigoureusement les mots clé indexés. Par exemple une faute d'orthographe ne doit pas être gênant. De même écrire *métallique* doit bien retourner les objets en "métal". Enfin, les mots vides ("un", "une", "dans", ...) ne doivent pas interférer.

Il faut donc traiter la requête de l'utilisateur pour extraire les mots clé utiles à la recherche.

<br>

___
**21/06 :** Le code permettant d'extraire les mots clé se trouve dans `front/init.js` sur la branche `master`.

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
**28/06 :** Le code permettant d'extraire les mots clé se trouve dans `route/product.js` sur la branche `Elastic`.

Il n'y a pas vraiement de traitement de la requête, on cherche à la lettre près le mot entré par l'utilisateur.
On ôte tout de même les mots-vides (qui sont listés dans un tableau) et les majuscules.

Lors de la recherche, on a tout de même un argument condition sur la distance de Levenshtein (*fuzziness*). On peut donc éventuellement
jouer dessus pour modifier le résultat de la requête.

**LIMITES :** Une faute de frappe ou de grammaire pourrait rendre la recherche moins pertinente. Proposer dynamiquement
une distance de Levenshtein pertinente en fonction de la requête.

### 4) Confection de la requête plus probable.

Il faut donc maintenant réécrire la *requête initiale* avec les mots clé extraits. Cette nouvelle requête doit être la plus proche possible de celle de l'utilisateur. On va donc observer chaque mot clé et ne sélectionner que ceux qui reconstituent de façon le plus probable la *requête de l'utilisateur*.

<br>

___
**21/06 :** Le code permettant de confectionner la requête plus probable se trouve dans `front/init.js` sur la `branche`..

L'idée est de sélectionner les mots clés dont la distance de Levenshtein est la plus basse avec deux conditions :
* Une requête ne peut pas utiliser le même mot d'origine deux fois. Ainsi une *requête initiale* composée de 2 mots, ne pourra pas avoir plus de 2 mots dans la nouvelle requête et le premier mot ne sera sélectionné qu'une fois, même si le traitement de la *requête* aboutit à plus d'un mot clé associé à celui-ci.
* Une requête ne peut pas être composée de deux mots clé renvoyant vers le même attribut. Ainsi si deux mots différents dans la *requête initiale* sont traduits par un mot clé associé au même attribut, alors seul l'un d'entre eux sera sélectionné.

On affiche les mots clés dans le navigateur pour que l'utilisateur puisse les voir. Les mots clé secondaires qui n'ont pas été retenus pour composer la requête finale sont également affichés, pour que l'utilisateur puisse les sélectionner afin de compléter sa recherche. Il peut également ôter des mots clé primaires afin de rafiner la requête finale.

**LIMITE :** On pourrait également envisager que certains type de mots comptent plus (par exemple le type d'objet).

<br>

___
**28/06 :** Le code permettant de confectionner la requête plus probable se trouve dans `route/product.js` sur la branche `Elastic`.

Un seul paramètre nous permet de raffiner la requête : le nombre de mots de la requête qui doivent apparaitre.
Un nombre trop élevé n'est pas bon car il se peut que la requête de l'utilisateur soit trop précise sans que
celui-ci le veuille (par exemple, il peut faire des concessions sur la couleur). En revanche un nombre trop faible
ne devrait pas avoir d'influence sur la réponse car le score calculé met quand même en avant les produits avec
le plus de mots issus de la requête.

**LIMITES :** Le calcul du score reste un peu flou. Pas d'analyse des mots clé plus pertinents.

### 5) Recherche en base de données.

Une fois la requête plus probable extraite, il faut trouver les produits qui correspondent dans la base de données.

<br>

___
**21/06 :** Le code permettant de faire cette recherche se trouve dans `front/init.js` et dans `routes/produits.js`  sur la `branche`..

L'idée est d'extraire de la base de données, pour chaque mot clé, tous les produits qui ont en attribut ce mot clé. On utilise bien sûr l'index
pour se faire.

On stocke l'ensemble des identifiants de produit dans une liste, même s'ils apparaissent plusieurs fois.

**LIMITE :** ...

<br>

___
**28/06 :** Le code permettant de faire cette recherche se trouve dans `route/product.js` sur la branche `Elastic`.

La recherche en base de données se fait automatiquement par *Elasticsearch*. En réalité, la recherche est faite dans l'index,
sans connecter mysql.

**LIMITES :** ...

### 6) Choix des résultats.

A partir de la liste précédemment obtenue, il faut déterminer les produits qui vont être affichés pour l'utilisateur
et l'ordre dans lequel ils vont apparaîtrent.

___
**21/06 :** Le code permettant de faire ce choix se trouve dans `front/init.js` sur la `branche`.

La première étape consiste à calculer un score pour chaque produit distinct. Ce score correspond simplement au nombre d'apparissions dans la liste optenue.

On affiche enfin les produits dans l'ordre des scores décroissants. Le produit le plus pertinent par rapport à la
requête se trouve donc en premier.

**LIMITE :** ...

<br>

___
**28/06 :** Le code permettant de faire ce choix se trouve dans `route/product.js` sur la branche `Elastic`.

Les résultats sortent triés par ordre de score décroissant.

**LIMITES :** ...

L'ensemble du code est commenté en français.

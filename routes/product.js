const Express = require('express');
const router = Express.Router();

const Elastic = require('../elasticsearch/init.js');

const stopWords = ['alors', 'au', 'aucuns', 'aussi', 'autre', 'avant', 'avec', 'avoir', 'bon', 'car', 'ce', 'cela', 'ces', 'ceux', 'chaque', 'ci', 'comme', 'comment', 'dans', 'des', 'du', 'dedans', 'dehors', 'depuis', 'devrait', 'doit', 'donc', 'dos', 'debut', 'elle', 'elles', 'en', 'encore', 'essai', 'est', 'et', 'eu', 'fait', 'faites', 'fois', 'font', 'hors', 'ici', 'il', 'ils', 'je', 'juste', 'la', 'le', 'les', 'leur', 'la', 'ma', 'maintenant', 'mais', 'mes', 'mine', 'moins', 'mon', 'mot', 'meme', 'ni', 'nommes', 'notre', 'nous', 'ou', 'ou', 'par', 'parce', 'pas', 'peut', 'peu', 'plupart', 'pour', 'pourquoi', 'quand', 'que', 'quel', 'quelle', 'quelles', 'quels', 'qui', 'sa', 'sans', 'ses', 'seulement', 'si', 'sien', 'son', 'sont', 'sous', 'soyez', 'sujet', 'sur', 'ta', 'tandis', 'tellement', 'tels', 'tes', 'ton', 'tous', 'tout', 'trop', 'tres', 'tu', 'voient', 'vont', 'votre', 'vous', 'vu', 'ca', 'etaient', 'etat', 'etions', 'ete', 'etre'];

function removeAccents(string){
    //Fonction permettant d'enlever les accents.
    let res = string.split('');
    const accents    = "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž";
    const accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";
    for (let i = 0; i < res.length; i++) {
        let pos = accents.indexOf(res[i]);
        if (pos !== -1) {
            res[i] = accentsOut[pos];
        }
    }
    return res.join('');
}

function suggestCompare(word, origin) {
    //Retourne true si word a un genre/nombre différent de origin mais a le même radical. suggestCompare(vert, vertes) = True / suggestCompare(vert, verre) = false
    origin = removeAccents(origin);

    if (word === origin) {
        return true
    }
    const except = ["yeux", "aïeux", "cieux"];          //Exception au pluriel
    const exceptSing = ["œil", "aieul", "ciel"];        //Singulier des exceptions
    let i = except.indexOf(word);
    if (i > 0) {                                        //On vérifie qu'il ne s'agit pas d'une exception.
        return origin === exceptSing[i];
    }
    if (word[word.length - 1] === 's' || word[word.length - 1] === 'x') {               //On vérifie si il s'agit d'un pluriel en -s ou -x.
        word = word.substr(0, word.length - 1);
        if (word === origin) {
            return true;
        } else if (word[word.length - 1] === 'e') {                                     //On vérifie si il s'agit d'un adjectif au féminin.
            word = word.substr(0, word.length - 1);
            return word === origin || (word + 's') === origin;
        } else {
            return (word + 'e') === origin || (word + "es") === origin;
        }
    } else if (word.substr(word.length - 3, 3) === "aux") {                             //On vérifie si il s'agit d'un pluriel en -aux.
        word = word.replace(0, word.length - 3) + "al";
        return word === origin || (word + 'e' === origin);
    } else if (word[word.length - 1] === 'e') {
        word = word.substr(0, word.length - 1);
        return word === origin || (word + 's') === origin || (word + 'es') === origin;
    } else {
        return (word + 'e') === origin || (word + 's') === origin || (word + 'es') === origin;
    }
}

function suggestCompareSet(word, set) {
    //Retourne true si word a un genre/nombre différent d'un des mot de set mais a le même radical.
    for (let i = 0; i < set.length; i++) {
        if(suggestCompare(word, set[i])) {
            return true;
        }
    }
    return false;
}


router.get('/:keywords/:nbProducts', (req, res) => {
   //Traitement de la requête
    console.log(req.params.nbProducts);
    let data = req.params.keywords.split('&');          //La requête transite sous forme : product/mot1&mot2&mot3 si l'utilisateur a frappé "mot1 mot2 mot3"
    let request = [];
    data.forEach((word) => {
        if(!stopWords.includes(word)) {                 //On enlève les mots vides.
            request.push(word);
        }
    });
    request = request.join(' ');
    console.log(request);
    let body = {                                        //On crée le body de la requête Elasticsearch.
        size: req.params.nbProducts,                    //Nombre de produits retourné par la requête.
        from: 0,
        query: {
            multi_match: {
                query: request,
                fields: ['Arg1', 'Arg2', 'Arg3', 'Arg4'],
                minimum_should_match: request.split(" ").length,            //Nombre de mots de la requête qui doivent être retrouvé dans les documents sélectionnés.
                fuzziness: 1,                                               //Nombre max de modifications acceptées dans un mot.
            }
        },
        suggest: {                                                          //Suggestions.
            text : request,
            suggestion1 : {
                term : {
                    field : "Arg1"
                },
            },
            suggestion2 : {
                term : {
                    field : "Arg2"
                },
            },
            suggestion3 : {
                term : {
                    field : "Arg3"
                },
            },
            suggestion4 : {
                term : {
                    field : "Arg4"
                },

            },
        },
        explain: 'true'
    };



    Elastic.search('index', body)                                           //Promesse de recherche et de suggestion.
        .then(results => {
            let products = [];
            let suggestion = [];
            results.suggest.suggestion1.forEach((keyword) => {
                keyword.options.forEach((word) => {
                    word.text = removeAccents(word.text);
                    if (! suggestCompare(word.text, keyword.text) && ! suggestCompareSet(word.text, suggestion) && ! stopWords.includes(word.text)) {
                        suggestion.push(word.text);
                    }
               });
            });
            results.suggest.suggestion2.forEach((keyword) => {
                keyword.options.forEach((word) => {
                    word.text = removeAccents(word.text);
                    if (! suggestCompare(word.text, keyword.text) && ! suggestCompareSet(word.text, suggestion) && ! stopWords.includes(word.text)) {
                        suggestion.push(word.text);
                    }
                });
            });
            results.suggest.suggestion3.forEach((keyword) => {
                keyword.options.forEach((word) => {
                    word.text = removeAccents(word.text);
                    if (! suggestCompare(word.text, keyword.text) && ! suggestCompareSet(word.text, suggestion) && ! stopWords.includes(word.text)) {
                        suggestion.push(word.text);
                    }
                });
            });
            results.suggest.suggestion4.forEach((keyword) => {
                keyword.options.forEach((word) => {
                    word.text = removeAccents(word.text);
                    if (! suggestCompare(word.text, keyword.text) && ! suggestCompareSet(word.text, suggestion) && ! stopWords.includes(word.text)) {
                        suggestion.push(word.text);
                    }
                });
            });
            console.log(`found ${results.hits.total} items in ${results.took}ms`);
            console.log(`returned:`);
            results.hits.hits.forEach(
                (hit, index) => {
                    products[++index] = {
                        id: hit._source.Id,
                        arg1: hit._source.Arg1,
                        arg2: hit._source.Arg2,
                        arg3: hit._source.Arg3,
                        arg4: hit._source.Arg4
                    };
                    console.log(
                    `\t${body.from + index} | ${hit._source.Id} | ${hit._source.Arg1} | ${hit._source.Arg2} | ${hit._source.Arg3} | ${hit._source.Arg4}`
                )}
            );
            const json = {
                prod: products,
                sug: suggestion,
                req: request.split(' ')
            };
            console.log(suggestion);
            return res.json(json);                  //On retourne au client un JSON contenant les produits séledtionnés, les suggestions et les mots utilisés dans la requête.
        })
        .catch(console.error);
});

router.get('/index/indices', (req, res) => {
    //Permet d'affichager le debug d'Elasticsearch.
    Elastic.indices();
    res.end();
});

module.exports.router = router;

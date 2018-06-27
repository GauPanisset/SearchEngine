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
    const except = ["yeux", "aïeux", "cieux"];
    const exceptSing = ["œil", "aieul", "ciel"];
    let i = except.indexOf(word);
    if (i > 0) {
        return origin === exceptSing[i];
    }
    if (word[word.length - 1] === 's' || word[word.length - 1] === 'x') {
        word = word.substr(0, word.length - 1);
        if (word === origin) {
            return true;
        } else if (word[word.length - 1] === 'e') {
            word = word.substr(0, word.length - 1);
            return word === origin || (word + 's') === origin;
        } else {
            return (word + 'e') === origin || (word + "es") === origin;
        }
    } else if (word.substr(word.length - 3, 3) === "aux") {
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


router.get('/:keywords', (req, res) => {
   //Traitement de la requête
    let data = req.params.keywords.split('&');
    let request = [];
    data.forEach((word) => {
        if(!stopWords.includes(word)) {
            request.push(word);
        }
    });
    request = request.join(' ');
    console.log(request);
    let body = {
        size: 30,
        from: 0,
        query: {
            multi_match: {
                query: request,
                fields: ['Arg1', 'Arg2', 'Arg3', 'Arg4'],
                minimum_should_match: request.split(" ").length - 1,
                fuzziness: 1,
            }
        },
        suggest: {
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



    Elastic.search('index', body)
        .then(results => {
            let suggestion = [];
            results.suggest.suggestion1.forEach((keyword) => {
                keyword.options.forEach((word) => {
                    word.text = removeAccents(word.text);
                    if (! suggestCompare(word.text, keyword.text) && ! suggestCompareSet(word.text, suggestion)) {
                        suggestion.push(word.text);
                    }
               });
            });
            results.suggest.suggestion2.forEach((keyword) => {
                keyword.options.forEach((word) => {
                    word.text = removeAccents(word.text);
                    if (! suggestCompare(word.text, keyword.text) && ! suggestCompareSet(word.text, suggestion)) {
                        suggestion.push(word.text);
                    }
                });
            });
            results.suggest.suggestion3.forEach((keyword) => {
                keyword.options.forEach((word) => {
                    word.text = removeAccents(word.text);
                    if (! suggestCompare(word.text, keyword.text) && ! suggestCompareSet(word.text, suggestion)) {
                        suggestion.push(word.text);
                    }
                });
            });
            results.suggest.suggestion4.forEach((keyword) => {
                keyword.options.forEach((word) => {
                    word.text = removeAccents(word.text);
                    if (! suggestCompare(word.text, keyword.text) && ! suggestCompareSet(word.text, suggestion)) {
                        suggestion.push(word.text);
                    }
                });
            });
            console.log(`found ${results.hits.total} items in ${results.took}ms`);
            console.log(`returned:`);
            results.hits.hits.forEach(
                (hit, index) => console.log(
                    `\t${body.from + ++index} | ${hit._source.Id} | ${hit._source.Arg1} | ${hit._source.Arg2} | ${hit._source.Arg3} | ${hit._source.Arg4}`
                )
            );
            console.log(suggestion);
            return res.json(results.suggest);
        })
        .catch(console.error);
});

router.get('/index/indices', (req, res) => {
    Elastic.indices();
    res.end();
});

/*router.get('/test/mysql', (req, res, next) => {
    DB.query("SELECT cat_article.art_idtart AS Id, cat_souscategorie.sct_lib AS Cate, cat_souscategorie2.sc2_lib AS Cate2, cat_article.art_lib AS Text1, cat_article.art_tit AS Text2 FROM cat_article INNER JOIN cat_souscategorie ON cat_souscategorie.sct_idtsct = cat_article.art_idtsct INNER JOIN cat_souscategorie2 ON cat_souscategorie2.sc2_idtsc2 = cat_article.art_idtsc2", (err, data) => {
        if(err) {
            return next(err);
        }
        return res.json(data);
    });
});*/

module.exports.router = router;

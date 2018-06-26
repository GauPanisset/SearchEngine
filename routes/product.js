const Express = require('express');
const router = Express.Router();

const Elastic = require('../elasticsearch/init.js');

const stopWords = ['alors', 'au', 'aucuns', 'aussi', 'autre', 'avant', 'avec', 'avoir', 'bon', 'car', 'ce', 'cela', 'ces', 'ceux', 'chaque', 'ci', 'comme', 'comment', 'dans', 'des', 'du', 'dedans', 'dehors', 'depuis', 'devrait', 'doit', 'donc', 'dos', 'debut', 'elle', 'elles', 'en', 'encore', 'essai', 'est', 'et', 'eu', 'fait', 'faites', 'fois', 'font', 'hors', 'ici', 'il', 'ils', 'je', 'juste', 'la', 'le', 'les', 'leur', 'la', 'ma', 'maintenant', 'mais', 'mes', 'mine', 'moins', 'mon', 'mot', 'meme', 'ni', 'nommes', 'notre', 'nous', 'ou', 'ou', 'par', 'parce', 'pas', 'peut', 'peu', 'plupart', 'pour', 'pourquoi', 'quand', 'que', 'quel', 'quelle', 'quelles', 'quels', 'qui', 'sa', 'sans', 'ses', 'seulement', 'si', 'sien', 'son', 'sont', 'sous', 'soyez', 'sujet', 'sur', 'ta', 'tandis', 'tellement', 'tels', 'tes', 'ton', 'tous', 'tout', 'trop', 'tres', 'tu', 'voient', 'vont', 'votre', 'vous', 'vu', 'ca', 'etaient', 'etat', 'etions', 'ete', 'etre'];

router.get('/:keywords', (req, res) => {
   //Traitement de la requête
    let data = req.params.keywords.split('&');
    let request = [];
    data.forEach((word) => {
        console.log(word);
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
                minimum_should_match: request.split(" ").length,
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
            console.log(`found ${results.hits.total} items in ${results.took}ms`);
            console.log(`returned:`);
            results.hits.hits.forEach(
                (hit, index) => console.log(
                    `\t${body.from + ++index} | ${hit._source.Id} | ${hit._source.Arg1} | ${hit._source.Arg2} | ${hit._source.Arg3} | ${hit._source.Arg4}`
                )
            );
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

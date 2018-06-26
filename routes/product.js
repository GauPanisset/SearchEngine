const Express = require('express');
const router = Express.Router();

const Elastic = require('../elasticsearch/init.js');


router.get('/:keywords', (req, res) => {
   //Traitement de la requête
    let request = req.params.keywords.replace('&', ' ');
    console.log(request);
    let body = {
        size: 30,
        from: 0,
        query: {
            multi_match: {
                query: request,
                fields: ['Cate', 'Cate2', 'Text1', 'Text2']
            }
        },
        explain: 'true'
    };

    Elastic.search('index', body)
        .then(results => {
            console.log(`found ${results.hits.total} items in ${results.took}ms`);
            console.log(`returned:`);
            results.hits.hits.forEach(
                (hit, index) => console.log(
                    `\t${body.from + ++index} | ${hit._source.Id} | ${hit._source.Cate} | ${hit._source.Cate2} | ${hit._source.Text1} | ${hit._source.Text2}`
                )
            );
            return res.json(results.hits.hits);
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

const elasticsearch = require('elasticsearch');
const DB = require('../database/init.js');

const esClient = new elasticsearch.Client({
    //Initialise le client Elasticsearch.
    host: '127.0.0.1:9200',
    log: 'error'
});

function bulkIndex(index, type, data) {
    //Fonction d'indexation.
    let bulkBody = [];

    data.forEach(item => {
        bulkBody.push({
            index: {
                _index: index,
                _type: type,
                _id: item.id
            }
        });

        bulkBody.push(item);
    });

    esClient.bulk({body: bulkBody})
        .then(response => {
            let errorCount = 0;
            response.items.forEach(item => {
                if (item.index && item.index.error) {
                    console.log(++errorCount, item.index.error);
                }
            });
            console.log(
                `Successfully indexed ${data.length - errorCount}
       out of ${data.length} items.`
            );
        })
        .catch(console.err);
}

function search(index, body) {
    //Fonction de recherche. Voir ../routes/product.js
    return esClient.search({index: index, body: body});
}

function indices(){
    //Fonction de debug. Voir ../routes/product.js
    esClient.cat.indices({v: true}).then(console.log).catch(console.err);
}

let dataPromise = new Promise((resolve, reject) => {
    //Promesse permettant de récupérer tous les produits de la base de données.
    DB.query("SELECT cat_article.art_idtart AS Id, cat_souscategorie.sct_lib AS Arg1, cat_souscategorie2.sc2_lib AS Arg2, cat_article.art_lib AS Arg3, cat_article.art_tit AS Arg4 FROM cat_article INNER JOIN cat_souscategorie ON cat_souscategorie.sct_idtsct = cat_article.art_idtsct INNER JOIN cat_souscategorie2 ON cat_souscategorie2.sc2_idtsc2 = cat_article.art_idtsc2", (err, data) => {
        if (err) {
            reject(err);
        }
        resolve(data)
    });
});

dataPromise.then((data) => {
    esClient.cat.indices().then((val) => {
        if(val === undefined){
            bulkIndex('index', 'article', data);
        }
    }).catch(console.err);
}).catch(console.err);


module.exports.search = search;
module.exports.indices = indices;


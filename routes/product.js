const Express = require('express');
const router = Express.Router();

const DB = require('../database/db.js');

const con = require('../database/mysql');

router.get('/', (req, res, next) => {
    DB.all('SELECT * FROM Product', (err, data) => {
       if(err) {
           return next(err);
       }
       return res.json(data);
    });
});

router.get('/:id', (req, res, next) => {
    DB.all('SELECT * FROM Product WHERE Id = ?', [req.params.id], (err, data) => {
        if(err) {
            return next(err);
        }
        return res.json(data);
    });
});

router.get('/test/mysql', (req, res, next) => {
    con.query("SELECT cat_article.art_idtart AS Id, cat_souscategorie.sct_lib AS Cate, cat_souscategorie2.sc2_lib AS Cate2, cat_article.art_lib AS Text1, cat_article.art_tit AS Text2 FROM cat_article INNER JOIN cat_souscategorie ON cat_souscategorie.sct_idtsct = cat_article.art_idtsct INNER JOIN cat_souscategorie2 ON cat_souscategorie2.sc2_idtsc2 = cat_article.art_idtsc2", (err, data) => {
        if(err) {
            return next(err);
        }
        return res.json(data);
    });
});

module.exports.router = router;

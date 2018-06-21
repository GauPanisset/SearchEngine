const Express = require('express');
const router = Express.Router();

const DB = require('../database/db.js');

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

module.exports.router = router;

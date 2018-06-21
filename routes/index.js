const Express = require('express');
const router = Express.Router();

const DB = require('../db.js');

router.get('/', (req, res, next) => {
    DB.all('SELECT * FROM IndexTable', (err, data) => {
        if(err) {
            return next(err);
        }
        return res.json(data);
    });
});

router.get('/in', (req, res, next) => {
   DB.all('SELECT * FROM Is_in', (err, data) => {
       if(err) {
           return next(err);
       }
       return res.json(data);
   });
});

router.get('/selection/:word/:attribute', (req, res, next) => {
    DB.all('SELECT Is_in.Id_prod AS Id FROM Is_in INNER JOIN IndexTable ON IndexTable.Id = Is_in.Id WHERE IndexTable.Word = ? AND IndexTable.Attribute = ?', [req.params.word, req.params.attribute], (err, data) => {
        if (err) {
            return next(err);
        }
        return res.json(data);
    });
});

module.exports.router = router;

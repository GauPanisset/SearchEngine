const Express = require('express');
const BP = require('body-parser');


const app = Express();

app.use(BP.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/product', require('./routes/product.js').router);

app.listen(3030, (err) => {

    if (err) {
        console.log(err);
    }
    else {
        console.log('app listening on port 3030');
    }
});

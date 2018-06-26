const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "panier",
    socketPath: "/Applications/MAMP/tmp/mysql/mysql.sock"
});

con.connect((err) => {
    if (err) {
        throw err;
    }
});

module.exports = con;

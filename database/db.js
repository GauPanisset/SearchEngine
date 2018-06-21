const DB_NAME = 'data';
const Fs = require('fs');
const Path = require('path');
const Sqlite = require('sqlite3');

const DB = new Sqlite.Database(`./database/${DB_NAME}`);

let words_index = [];

function removeAccents(string){
    //Fonction permettant d'enlever les accents.
    const accents    = "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž";
    const accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";
    for (let i = 0; i < string.length; i++) {
        let pos = accents.indexOf(string[i]);
        if (pos !== -1) {
            string[i] = accentsOut[pos];
        }
    }
    return string;
}

function findIndex(tuple, set) {
    //Fonction permettant de trouver l'indice auquel se trouve un tuple dans un tableau.
    for (let i = 0; i < set.length; i++) {
        if (tuple[0] === set[i][0] && tuple[1] === set[i][1]) {
            return i;
        }
    }
    return -1;
}

function index(data){
    //Fonction d'indexation.
    for(let i = 0; i < data.length; i ++){          //Pour tout produits...
        const keys = Object.keys(data[i]);
        for(let j = 1; j < keys.length; j ++){      //Pour tout attributs d'un produit...
            if(findIndex([data[i][keys[j]], keys[j]], words_index) < 0) {
                words_index.push([data[i][keys[j]], keys[j]]);      //On retient que le mot est déjà indexé. On stocke dans une variable pour ne pas avoir à refaire une requête SQL.
                DB.run("INSERT INTO IndexTable (Word, Attribute) VALUES (?, ?)", [removeAccents(data[i][keys[j]]).toLowerCase(), keys[j]], (err) => {       //On ajoute dans l'index.
                    if (err){
                        console.log(err);
                    }
                });
            }
            DB.run("INSERT INTO Is_in (Id, Id_prod) VALUES (?, ?)", [findIndex([data[i][keys[j]], keys[j]], words_index) + 1, data[i]["Id"]], (err) => {    //On ajoute la correspondance mot - produit.
                if (err){
                    console.log(err);
                }
            });
        }
    }
}

//Initialisation de la base de données.
if(!Fs.existsSync(`./database/${DB_NAME}`)){
    const init = Fs.readFileSync(Path.join(process.cwd(), './database/data.sql'), 'utf-8');
    DB.exec(init);
} else {
    try {
        Fs.unlinkSync(`./database/${DB_NAME}`);
    }
    catch (_ign) {}
    const init = Fs.readFileSync(Path.join(process.cwd(), './database/data.sql'), 'utf-8');
    DB.exec(init);
}


let productsPromise = new Promise((resolve, reject) => {
    DB.all("SELECT * FROM Product", (err, data) => {
        if (err) {
            reject(err);
        }
        resolve(data)
    });
});

productsPromise.then((val) => {
    index(val);
}).catch((val) => {
    console.log(val);
});

module.exports = DB;

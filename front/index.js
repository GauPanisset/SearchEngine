//stop list contenant quelques des mots vides.
const stopList = ["un", "une", "le", "la", "avec", "sans", "qui", "que"];

let cleanRequest = [];                      //cleanRequest[i][0] : Label du i-ième mot clé.
                                            //cleanRequest[i][1] : Type du i-ième mot clé.
let secondaryRequest = [];

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

function levenshtein(string1, string2){
    //Fonction permettant d'évaluer la distance de Levenshtein.
    const len1 = string1.length;
    const len2 = string2.length;

    let res = new Array();

    for (let i = 0; i < len1 + 1; i++){
        res[i] = new Array();
        res[i][0] = i;
    }
    for (let j = 0; j < len2 + 1; j++){
        res[0][j] = j;
    }

    for (let i = 1; i < len1 + 1; i ++){
        for (let j = 1; j < len2 + 1; j++) {
            let cost = 0;
            if (string1.charAt(i - 1) !== string2.charAt(j - 1)) {
                cost = 1;
            }
            res[i][j] = Math.min(res[i - 1][j] + 1, res[i][j - 1] + 1, res[i - 1][j - 1] + cost);
            if (string1[i-1] === string2[j - 2] && string1[i - 2] === string2[j - 1]) {
                res[i][j] = Math.min(res[i][j], res[i - 2][j - 2] + cost)
            }
        }
    }
    return res[len1][len2];
}

function up(index) {
    $(`#${secondaryRequest[index][0]}`).remove();
    const removed = secondaryRequest.splice(index, 1)[0];
    cleanRequest.push(removed);
    displayKeywords()

}

function down(index) {
    $(`#${cleanRequest[index][0]}`).remove();
    const removed = cleanRequest.splice(index, 1)[0];
    secondaryRequest.push(removed);
    displayKeywords()

}

function displayKeywords() {
    const bgColor = ["red", "green", "blue", "yellow", "purple", "orange"];
    const color = ["white", "white", "white", "black", "white", "black"]
    $("#keyword-container").empty();
    $("#secondary-container").empty();
    for (let i = 0; i < cleanRequest.length; i++) {
        $("#keyword-container").append(`
                <button type="button" class="btn" id="${cleanRequest[i][0]}" style="background-color:${bgColor[i%color.length]}; color:${color[i%color.length]}" onclick="down('${i}')">${cleanRequest[i][0]}</button>
                `);
    }
    if (secondaryRequest.length > 0) {
        $("#secondary-container").append(`
                <p>Vous cherchiez peut-être plutôt :</p>
                `);
        for (let i = 0; i < secondaryRequest.length; i++) {
            $("#secondary-container").append(`
                    <button type="button" class="btn" id="${secondaryRequest[i][0]}" style="background-color:grey; color:white" onclick="up('${i}')">${secondaryRequest[i][0]}</button>
                    `);
        }
    }
    if (cleanRequest.length === 0) {
        $("#keyword-container").append(`
            <span class="badge badge-warning">Nous n'avons pas ce type de produit. Veuillez modifier votre requête.</span>
            `);
    }
    getProduct();
}

function getKeywords(){
    //Fonction qui extrait les mots clé de la requête
    cleanRequest = [];
    secondaryRequest = [];
    const request = $("#request").val();
    const words = request.split(" ");
    let keywords = new Map();                   //Contient les distance de levenshtein associées à de potentiels mots clé.
    for (let i = 0; i < words.length; i++){
        words[i] = removeAccents(words[i]).toLowerCase();
    }
    console.log(words);
    $.ajax({
        url: "http://localhost:3030/index/",        //On récupère l'ensemble des mots de l'index pour les comparer à ceux de la requête utilisateur.
        method: "GET",
        dataType: "json",
        error: (error) => {
            console.log(error);
        },
        success: (data) => {
            let used_type = new Map();          //Variables nécessaires dans la constitution d'une requête "propre" probable à partir de celle de l'utilisateur.
            let used_word = [];                 //Ces variables permettent de retenir si un attribut ou un mot a déjà utilisé. En effet, pour une requête propre on ne peut pas utiliser deux fois le même mot d'origine et on ne peut pas avoir deux fois un attribut du même type.
            for(let i = 0; i < words.length; i++) {
                if (!stopList.includes(words[i])) {
                    for (let j = 0; j < data.length; j++) {
                        const leven = levenshtein(words[i], data[j]["Word"]);       //On calcule la distance de Levenshtein entre chaque mot de la requête qui n'est pas un mot vide (stopList) et chaque mot de l'index.
                        if (Math.trunc(words[i].length / 2) >= leven) {             //Condition sur l'acceptation d'une distance.
                            used_type.set(data[j]["Attribute"], 0);
                            if (keywords.get(leven) === undefined) {
                                keywords.set(leven, [[i, data[j]["Word"], data[j]["Attribute"]]]);
                            } else {
                                keywords.get(leven).push([i, data[j]["Word"], data[j]["Attribute"]]);
                            }
                        }
                    }
                }
            }
            console.log(keywords);          //keywords.get(i)[j][0] = Position dans la requête initiale du j-ième mot clé dont l'indice de levenshtein est i.
                                            //keywords.get(i)[j][1] = Etiquette du j-ième mot clé dont l'indice de levenshtein est i.
                                            //keywords.get(i)[j][2] = Type du j-ième mot clé dont l'indice de levenshtein est i.
            const leven_max = Math.max(...keywords.keys());
            for (let i = 0; i <= leven_max; i ++) {             //Constitution de la requête propre. On sélectionne les mots avec la distance de levenshtein la plus basse, puis on complète.
                if (keywords.get(i) !== undefined) {
                    for (let j = 0; j < keywords.get(i).length; j++) {
                        if (used_word[keywords.get(i)[j][0]] === undefined && used_type.get(keywords.get(i)[j][2]) === 0) {
                            used_word[keywords.get(i)[j][0]] = 1;
                            used_type.set(keywords.get(i)[j][2], 1);
                            cleanRequest.push([keywords.get(i)[j][1], keywords.get(i)[j][2]]);
                        } else {
                            secondaryRequest.push([keywords.get(i)[j][1], keywords.get(i)[j][2]]);
                        }
                    }
                }
            }
            console.log(cleanRequest);
            console.log(secondaryRequest);
            displayKeywords();
        }
    });
}

window.getKeywords = getKeywords;

function displayProducts(products){
    //Fonction permettant d'afficher les produits.
    $(".card-columns").empty();
    let score = new Map();                          //On calcule les scores de chaque produit sélectionné. Plus ils ont d'attributs dans les mots clé, plus leur score est élevé.
    for (let i = 0; i < products.length; i++) {
        if (score.get(products[i]) === undefined) {
            score.set(products[i], 1);
        } else {
            score.set(products[i], score.get(products[i]) + 1);
        }
    }
    console.log(score);
    const bgColor = ["#87CEFA", "#00BFFF", "#1E90FF", "#2C75FF", "#0000FF", "#00008B"];
    const color = ["black", "black", "black", "black", "black", "white"];
    for (let k = cleanRequest.length; k > 0; k--) {                         //On affiche en premier les produits au meilleur score.
        for (let [product, value] of score) {
            if(value === k){
                $.ajax({
                    url: "http://localhost:3030/product/"+product.toString(),
                    method: "GET",
                    dataType: "json",
                    error: (error) => {
                        console.log(error);
                    },
                    success: (data) => {
                        $(".card-columns").append(`
                        <div class="card" style="background-color: ${bgColor[k%bgColor.length]}; color: ${color[k%color.length]}">
                            <div class="card-body">
                                <h1>${data[0]["Id"]} : ${data[0]["Brand"]}</h1>
                                <p>${data[0]["Object"]}</p>
                                <p>${data[0]["Color"]} – ${data[0]["Color_type"]}</p>
                                <p>${data[0]["Material"]}</p>
                            </div>
                        </div>
                `)
                    }
                });
            }
        }
    }

}

function getProduct(){
    //Fonction permettant de sélectionner les produits correspondants aux mots clé.
    let products = []; //Liste des identifiants produit qui possède au moins un attribut dans les mots clé.
    for (let i = 0; i < cleanRequest.length; i ++) {
        $.ajax({
            url: "http://localhost:3030/index/selection/" + cleanRequest[i][0].toString() + "/" + cleanRequest[i][1].toString(),
            method: "GET",
            dataType: "json",
            error: (error) => {
                console.log(error);
            },
            success: (data) => {
                for (let j = 0; j < data.length; j++) {
                    products.push(data[j]["Id"]);
                }
                if(i === cleanRequest.length - 1) {
                    console.log(products);
                    displayProducts(products)
                }
            }
        });
    }
}

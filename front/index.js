const stopList = ["un", "une", "le", "la", "avec", "sans", "qui", "que"];

function removeAccents(string){
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

function getKeywords(){
    $(".card-columns").empty();
    const request = $("#request").val();
    const words = request.split(" ");
    let keywords = new Map();
    let cleanRequest = [];                      //cleanRequest[i][0] : Label du i-ième mot clé.
                                                //cleanRequest[i][1] : Type du i-ième mot clé.
    for (let i = 0; i < words.length; i++){
        words[i] = removeAccents(words[i]).toLowerCase();
    }
    console.log(words);
    $.ajax({
        url: "http://localhost:3030/index/",
        method: "GET",
        dataType: "json",
        error: (error) => {
            console.log(error);
        },
        success: (data) => {
            let used_type = new Map();
            let used_word = [];
            for(let i = 0; i < words.length; i++) {
                if (!stopList.includes(words[i])) {
                    for (let j = 0; j < data.length; j++) {
                        const leven = levenshtein(words[i], data[j]["Word"]);
                        if (Math.trunc(words[i].length / 2) >= leven) {
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
            for (let i = 0; i <= leven_max; i ++) {
                if (keywords.get(i) !== undefined) {
                    for (let j = 0; j < keywords.get(i).length; j++) {
                        if (used_word[keywords.get(i)[j][0]] === undefined && used_type.get(keywords.get(i)[j][2]) === 0) {
                            used_word[keywords.get(i)[j][0]] = 1;
                            used_type.set(keywords.get(i)[j][2], 1);
                            cleanRequest.push([keywords.get(i)[j][1], keywords.get(i)[j][2]]);
                        }
                    }
                }
            }
                                    //============= AFFICHAGE ALPHA =============

            console.log(cleanRequest);
            const bgColor = ["red", "green", "blue", "yellow", "purple", "orange"];
            const color = ["white", "white", "white", "black", "white", "black"]
            $("#badge-container").empty();
            for (let i = 0; i < cleanRequest.length; i++) {
                if (cleanRequest[i] !== undefined)
                $("#badge-container").append(`
            <span class="badge" style="background-color:${bgColor[i%color.length]}; color:${color[i%color.length]}">${cleanRequest[i][0]}</span>
            `)
            }
                                    //============= AFFICHAGE ALPHA =============
            getProduct(cleanRequest);
        }
    });
}

window.getKeywords = getKeywords;

function displayProducts(products, max){
    let score = new Map();
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
    for (let k = max; k > 0; k--) {
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

function getProduct(keywords){
    let products = [];
    for (let i = 0; i < keywords.length; i ++) {
        $.ajax({
            url: "http://localhost:3030/index/selection/" + keywords[i][0].toString() + "/" + keywords[i][1].toString(),
            method: "GET",
            dataType: "json",
            error: (error) => {
                console.log(error);
            },
            success: (data) => {
                for (let j = 0; j < data.length; j++) {
                    products.push(data[j]["Id"]);
                }
                if(i === keywords.length - 1) {
                    console.log(products);
                    displayProducts(products, keywords.length)
                }
            }
        });
    }
}

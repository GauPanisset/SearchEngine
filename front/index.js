let answer;

function colorHexa(index) {
    //Fonction qui donne une couleur unique à un produit en fonction de son id.
    index = "000000" + index;
    let res = [5, 5, 5, 5, 5, 5];
    for (let i = 0; i < 6; i++) {
        res[i] += parseInt(index.substr(index.length - (6 - i), 1));
        res[i] = res[i].toString(16);
    }
    return res.join('');
}

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

function up(index) {
    //Fonction permettant de prendre en compte une suggestion.
    $(`#${answer.sug[index]}`).remove();
    answer.req.push(answer.sug[index]);
    getProducts();
}

function down(index) {
    //Fonction permettant d'enlever un mot clé.
    $(`#${answer.req[index]}`).remove();
    answer.req.splice(index, 1);
    getProducts();
}

function display() {
    //Fonction permettant l'affichage des produits et mots clé.
    const bgColor = ["red", "green", "blue", "yellow", "purple", "orange"];
    const color = ["white", "white", "white", "black", "white", "black"];
    $("#keyword-container").empty();
    $("#secondary-container").empty();
    $(".card-columns").empty();
    if (answer.prod.length === 0) {
        $("#keyword-container").append(`
            <span class="badge badge-warning">Nous n'avons pas ce type de produit. Veuillez modifier votre requête.</span><br>
            `);
    }
    for (let i = 0; i < answer.req.length; i++) {
        $("#keyword-container").append(`
            <button type="button" class="btn" id="${answer.req[i]}" style="background-color:${bgColor[i % color.length]}; color:${color[i % color.length]}" onclick="down('${i}')">${answer.req[i]}</button>
            `);
    }
    if (answer.sug.length > 0) {
        $("#secondary-container").append(`
                <p>Vous cherchiez peut-être plutôt :</p>
                `);
        for (let i = 0; i < answer.sug.length; i++) {
            $("#secondary-container").append(`
                    <button type="button" class="btn" id="${answer.sug[i]}" style="background-color:grey; color:white" onclick="up('${i}')">${answer.sug[i]}</button>
                    `);
        }
    }
    for (let i = 1; i < answer.nbProducts + 1; i++) {
        $(".card-columns").append(`
                        <div class="card" style="background-color: #${colorHexa(answer.prod[i].id)}; color: white">
                            <div class="card-body">
                                <h1>${answer.prod[i].id}</h1>
                                <p>${answer.prod[i].arg1}</p>
                                <p>${answer.prod[i].arg2}</p>
                                <p>${answer.prod[i].arg3}</p>
                                <p>${answer.prod[i].arg4}</p>
                            </div>
                        </div>
                `)
    }
}

function getProducts(button) {
    //Requête demandant les produits.
    let request;
    if (button) {
        request = $("#request").val();
    } else {
        request = answer.req.join(' ');
    }
    let nbProducts = $("#formControlRange").val();
    request = removeAccents(request.toLowerCase()).replace(" ","&");
    $.ajax({
        url: "http://localhost:3030/product/" + request + "/" + nbProducts,
        method: "GET",
        dataType: "json",
        error: (error) => {
            console.log(error);
        },
        success: (data) => {
            answer = data;
            answer.nbProducts = parseInt(Object.keys(answer.prod)[Object.keys(answer.prod).length - 1]);
            display();
        }
    });
}

window.getProducts = getProducts;

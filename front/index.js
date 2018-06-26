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

function getProducts() {
    let request = $("#request").val();
    request = removeAccents(request.toLowerCase()).replace(" ","&");
    $.ajax({
        url: "http://localhost:3030/product/" + request,
        method: "GET",
        dataType: "json",
        error: (error) => {
            console.log(error);
        },
        success: (data) => {
            console.log(data);
        }
    })
}

window.getProducts = getProducts;

function addAcc(e) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === 201) {
            let parser = new DOMParser();
            xml = parser.parseFromString(decodeURIComponent(this.responseText), "text/xml");
            document.getElementById("accounts").innerHTML += "<tr><td>" + xml.getElementsByTagName('id')[0].childNodes[0].nodeValue;
                + "</td><td>" + xml.getElementsByTagName('balance')[0].childNodes[0].nodeValue;
                + "</td></td>";
        }
    };
    xhr.open("GET", "create");
    xhr.setRequestHeader("Content-Type", "text/plain");
    xhr.send();
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("add_acc").addEventListener('click', addAcc);
    document.getElementById("send_dosh").addEventListener('click', function(e) {
        window.location.href='/send.html';
    });
    document.getElementById("logout").addEventListener('click', function(e) {
        window.location.href='/logout';
    });
});

//Send an XMLHttpRequest of type "method" to location "action" and execute callback() upon success
//If specified, expected_status is the expected successful response code from the request
//If specified, error_callback() is called instead if an error occurs
function SendRequest(method, action, callback, expected_status=200, error_callback=null) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === expected_status) {
            callback(this);
        }
        else if(error_callback) { error_callback(this); }
    };
    xhr.open(method, action);
    xhr.setRequestHeader("Content-Type", "text/plain");
    xhr.send();
}

function addAcc(xhr) {
    let parser = new DOMParser();
    let xml = parser.parseFromString(decodeURIComponent(xhr.responseText), "text/xml");
    //Put this user's first and last name in "name" classed locations
    let name = xml.getElementsByTagName('name')[0].childNodes[0].nodeValue;
    let name_fields = document.getElementsByClassName('name');
    for(let name_field of name_fields) {
        if(name_field.innerHTML != name) {
            name_field.innerHTML = name;
        }
    }
    //Enumerate this user's accounts in the "accounts" block if they have any
    let accounts = xml.getElementsByTagName('account');
    if(accounts) {
        document.getElementById("accounts").innerHTML = "<tr><th>Account ID</th><th>Balance</th></tr>";
        for(let account of xml.getElementsByTagName('account')) {
            console.log(account);
            document.getElementById("accounts").innerHTML += "<tr><td>" + account.getElementsByTagName("id")[0].childNodes[0].nodeValue
                + "</td><td>" + account.getElementsByTagName('balance')[0].childNodes[0].nodeValue;
                + "</td></tr>";
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    SendRequest("GET", "status", addAcc);
    /*document.getElementById("add_acc").addEventListener('click', addAcc);
    document.getElementById("send_dosh").addEventListener('click', function(e) {
        window.location.href='/send.html';
    });
    document.getElementById("logout").addEventListener('click', function(e) {
        window.location.href='/logout';
    });*/
});

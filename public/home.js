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

function update(xhr) {
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
        let first = true;
        for(let account of xml.getElementsByTagName('account')) {
            let id = account.getElementsByTagName("id")[0].childNodes[0].nodeValue;
            let balance = account.getElementsByTagName('balance')[0].childNodes[0].nodeValue;
            //Insert this account as an option in all selection forms
            let options = '<option value="'+id+'">'+id+'</option>';
            for(let selector of document.getElementsByTagName('select')) {
                selector.innerHTML = first ? options : selector.innerHTML + options;
            }
            first = false;
            //Display this account in the table
            document.getElementById("accounts").innerHTML += "<tr><td>" + id
                + "</td><td>" + balance;
                + "</td></tr>";
        }
    }
}

function createAcc() {
    SendRequest("GET", "create", function() { SendRequest("GET", "status", update); }, 201);
    //We could parse the new account directly here but sending another update request is easier
}

//For a user transferring money between their accounts
function transfer() {
}
//For a user depositing into their account - allows for withdraws with negative numbers
//If is_deposit is false we know the withdraw button was clicked and not deposit.
function deposit(is_deposit) {
}

function unhide(elem) {
    if(elem && elem.nextElementSibling) {
        elem.nextElementSibling.hidden = !elem.nextElementSibling.hidden;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    SendRequest("GET", "status", update);
    for(let expando of document.getElementsByClassName("expando")) {
        expando.addEventListener('click', function() { unhide(expando); });
    }
    document.getElementById("create").addEventListener('click', createAcc);
    document.getElementById("t_btn").addEventListener('click', transfer);
    document.getElementById("d_btn").addEventListener('click', function() { deposit(true); });
    document.getElementById("w_btn").addEventListener('click', function() { deposit(false); });
});

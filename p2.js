'use strict'

var express = require("express");
var app = express();
app.set("view_engine", "ejs");
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
var fs = require("fs");
var sqlite3 = require('sqlite3');
var db = null;

//Check if db exists
if(!fs.existsSync('./bank.db')) {
    //If not, create it by executing the init_db file
    if(!fs.existsSync('./init_db')) {
        console.log("You need to create an init_db file!");
        return;
    }
    let data = fs.readFileSync('./init_db');
    if(data === null) {
        console.log("Failed to read ./init_db");
        console.log("Skipping creation of database...");
        return;
    }
    db = new sqlite3.Database('./bank.db', sqlite3.OPEN_CREATE, (err) => {
        if(err === null) {
            console.log(err);
        }
        else {
            db.serialize(function() {
                let q = db.prepare(data);
                q.finalize();
            });
        }
    });

    fs.close('./init_db', (err) => {});
}

app.get('/', function(req, resp) {
});

app.listen(3000);

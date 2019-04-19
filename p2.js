'use strict'

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
const fs = require("fs");
const sqlite3 = require('sqlite3');
var db = null;
const bankDbFile = __dirname + '/bank.db';
const initDbFile = __dirname + '/init_db.sql';

//Check if db exists and if not create it
if(!fs.existsSync(bankDbFile)) {
    if(!fs.existsSync(initDbFile)) {
        console.log("You need to create " + initDbFile + "!");
        return;
    }
    //Read the schema SQL from init_db.sql
    let data = fs.readFileSync(initDbFile, 'utf8');
    if(!data) {
        console.log("Failed to read " + initDbFile);
        console.log("Skipping creation of database...");
        return;
    }
    db = new sqlite3.Database(bankDbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if(err) {
            console.log(err);
        }
        else {
            db.exec(data, (err) => {
                if(err) { console.log(err) };
                console.log("Initialized the database schema");
            });
        }
    });
}
else {
    db = new sqlite3.Database(bankDbFile);
}

app.get('/', function(req, resp) {
    resp.sendFile(__dirname + "/index.html");
});
app.get('/login.html', function(req, resp) {
    resp.sendFile(__dirname + "/login.html");
});

app.listen(3000);

process.on('SIGTERM', () => {
    if(db) {
        db.close();
    }
    server.close();
});

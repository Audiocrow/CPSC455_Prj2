'use strict'

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("body-parser-xml")(bodyParser);
app.use(bodyParser.xml());
const parseString = require("xml2js").parseString;
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

//res.set('Content-Security-Policy', 'default-src "self"');
app.get('/', function(req, res) {
    res.sendFile(__dirname + "/index.html");
});
app.get('/create.html', function(req, res) {
    res.sendFile(__dirname + "/create.html");
});
app.post('/create.html', function(req, res) {
    res.sendFile(__dirname + "/create.html");
});
app.get('/register.html', function(req, res) {
    res.sendFile(__dirname + "/register.html");
});
app.post('/register.html', function(req, res) {
    let form_data = JSON.stringify(req.body);
    let pwd = form_data["password"];
    //Check if the password meets OWASP's requirements from https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Authentication_Cheat_Sheet.md#password-complexity
    //Note: these are the same requirements the front-end attempts to enforce
    let valid = true;
	if(/(.)\1\1/.test(form_data)) {
		valid = false;
	}
	let criteria = 0;
	if(/[a-z]/.test(pwd.value)) { criteria++; }
	if(/[A-Z]/.test(pwd.value)) { criteria++; }
	if(/[0-9]/.test(pwd.value)) { criteria++; }
	if(/[ !@#$%^&*)(_\-+=}\]{\["':;?/>.<,]/.test(pwd.value)) { criteria++; }
	let pwd_requirements = document.getElementById("pwd_requirements");
	if(criteria < 3) {
		valid = false;
    }
	if(!valid) {
        res.status(400).end();
    }
    res.setHeader("Content-Type", "application/xml");
    res.send("Heres some stuff LOLbutts");
});

app.listen(3000);

process.on('SIGTERM', () => {
    if(db) {
        db.close();
    }
    server.close();
});

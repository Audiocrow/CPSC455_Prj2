'use strict'

const express = require("express");
const app = express();
app.use(express.static('public'));
const bodyParser = require("body-parser");
require("body-parser-xml")(bodyParser);
app.use(bodyParser.xml({
    xmlParseOptions: {
        explicitArray: false //Only use array if >1
    }
}));
const parseString = require("xml2js").parseString;
const xssFilters = require("xss-filters");
const fs = require("fs");
const sqlite3 = require('sqlite3');
const argon2 = require("argon2");
const csp = require("helmet-csp");
app.use(csp({
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'","'unsafe-inline'"]
    },
loose:false}));
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
//Validate the data a user tries to register with
//On invalid, return BAD REQUEST.
//The front-end is also performing validation, so invalid requests should only happen if they bypass it somehow.
app.post('/register.html', async function(req, res) {
    let form_data = req.body["user"];
    //First decode the XML-escapes, but then escape for HTML use with xssFilters
    let first_name = xssFilters.inHTMLData(decodeURIComponent(form_data.first_name));
    let last_name = xssFilters.inHTMLData(decodeURIComponent(form_data.last_name));
    let address = xssFilters.inHTMLData(decodeURIComponent(form_data.address));
    let pwd = decodeURIComponent(form_data.password);
    console.log(pwd);
    //Check if the password meets OWASP's requirements from https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Authentication_Cheat_Sheet.md#password-complexity
    //Note: these are the same requirements the front-end attempts to enforce
	if(/(.)\1\1/.test(pwd)) {
		res.status(400).send("Password does not meet requirements"); //Password has 3 or more of the same character in a row
        return;
	}
	let criteria = 0;
	if(/[a-z]/.test(pwd)) { criteria++; }
	if(/[A-Z]/.test(pwd)) { criteria++; }
	if(/[0-9]/.test(pwd)) { criteria++; }
	if(/[ !@#$%^&*)(_\-+=}\]{\["':;?/>.<,]/.test(pwd)) { criteria++; }
	if(criteria < 3) {
        res.status(400).send("Password does not meet requirements"); //Password does not meet complexity requirements
        return;
    }
    //Check to see if the supplied name and address are reasonable
    let name_reg = /[a-zA-Z]{2,32}/;
    let address_reg = /[a-zA-Z0-9&,.# -]{4,128}/;
    console.log(first_name + " " + last_name + " at " + address);
    if(!name_reg.test(first_name) || !name_reg.test(last_name) || !address_reg.test(address)) {
        res.status(400).send("Name or address is invalid");
        return;
    }
    //Everything is fine, add this person to the database
    //Using prepared statements to prevent injection
    if(!db) { res.status(503).end(); } //Can't create users if the db is down
    let query = db.prepare("INSERT INTO users(first_name,last_name,address,pwd_hash) VALUES(?,?,?,?)");
    try {
        const pwd_hash = await argon2.hash(pwd);
        query.run([first_name,last_name,address,pwd_hash], function(err) {
            if(err) {
                console.log(err);
                res.status(409).send("User already exists");
                return;
            }
            console.log("Created new user " + first_name + " " + last_name + " at " + address);
            res.location("/");
            res.redirect(201, "/");
        });
    } catch(err) {
        console.log(err);
        res.status(500).send("Please try again later."); //Argon failed?
    }
});

app.listen(3000);

process.on('SIGTERM', () => {
    if(db) {
        db.close();
    }
    server.close();
});

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
const session = require("client-sessions");
app.use(session({
    cookieName: "session",
    secret: "gd89s7fd89sgSADIFJ(#$RL@#SAGd897gfidgd",
    duration: 180000, //3 Minutes
    activeDuration: 180000,
    httpOnly: true,
    secure: true,
    ephemeral: true
}));

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
    if(!req.session || !req.session.user) {
        res.redirect("/login");
    }
    else {
        res.sendFile(__dirname + "/index.html");
    }
});

//@status - sends the user's name and accounts as XML
app.get('/status', function(req, res) {
    if(!req.session || !req.session.user) {
        res.redirect("/login");
    }
    else {
        res.set("Content-Type", "application/xml");
        let account_query = db.prepare("SELECT acc_id,balance FROM accounts WHERE user_id=?");
        let xml = "<user><name>" + req.session.name + "</name>";
        //And display their accounts and balances
        account_query.all(req.session.user, function(err,accounts) {
            if(!err && accounts && accounts.length > 0) {
                for(let account of accounts) {
                    xml += "<account><id>" + account.acc_id + "</id>"
                        + "<balance>" + account.balance + "</balance></account>";
                }
            }
            xml += "</user>";
            res.send(xml);
        });
    }
});

app.get('/create', function(req, res) {
    if(req.session && req.session.user) {
        let query = db.prepare("INSERT INTO accounts(balance,user_id) VALUES (?, ?)");
        query.run([0, req.session.user], function(err) {
            if(err) {
                res.status(503).send("Failed to create a new account - please try again later");
                return;
            }
            res.setHeader("Content-Type", "application/xml");
            res.status(201).send("<account><id>" + this.lastID + "</id><balance>0</balance></account>");
        });
    }
    else {
        req.session.reset();
        res.redirect("/");
    }
});

app.get('/login', function(req, res) {
    res.sendFile(__dirname + "/login.html");
});

app.post('/login', function(req, res) {
    if(!db) { res.status(503).end(); } //Can't login if the db is down
    if(req.session.attempts && req.session.attempts > 5) {
        res.status(403).send("You have failed to login too many times, please try again later.");
    }
    let form_data = req.body["user"];
    //Decode the XML-escapes
    let first_name = decodeURIComponent(form_data.first_name);
    let last_name = decodeURIComponent(form_data.last_name);
    let pwd = decodeURIComponent(form_data.password);
    //Find this user in the database
    let query = db.prepare("SELECT * FROM users WHERE first_name=? AND last_name=?");
    query.get([first_name, last_name], async function(err, row) {
        if(err || !row) {
            if(err) { console.log(err); }
            res.status(404).send("No such user");
            return;
        }
        else {
            try {
                //Use argon2 to verify the password matches the hash
                if(await argon2.verify(row.pwd_hash, pwd)) {
                    //Save the user's info from the database for quick future lookups and to serve as their session
                    req.session.user = row.user_id;
                    //Encoding special characters because the name will be used in html and/or javascript contexts
                    //This should have happened already when the account was created so this may be redundant
                    req.session.name = xssFilters.inHTMLData(row.first_name) + " " + xssFilters.inHTMLData(row.last_name);
                    res.redirect("/");
                }
                else {
                    res.status(401).send("Incorrect password.");
                    if(req.session.attempts) {
                        req.session.attempts++;
                        console.log(req.session.attempts + " failed attempts to login as " + first_name + " " + last_name);
                    } else { req.session.attempts = 1; }
                    return;
                }
            } catch(err) { console.log(err); }
        }
    });
});
app.get('/logout', function(req, res) {
    req.session.reset();
    res.redirect("/");
});
app.get('/register.html', function(req, res) {
    res.sendFile(__dirname + "/register.html");
});
//Validate the data a user tries to register with
//On invalid, return BAD REQUEST.
//The front-end is also performing validation, so invalid requests should only happen if they bypass it somehow.
app.post('/register.html', async function(req, res) {
    if(!db) { res.status(503).end(); } //Can't create users if the db is down
    let form_data = req.body["user"];
    //First decode the XML-escapes, but then escape for HTML use with xssFilters
    let first_name = xssFilters.inHTMLData(decodeURIComponent(form_data.first_name));
    let last_name = xssFilters.inHTMLData(decodeURIComponent(form_data.last_name));
    let address = xssFilters.inHTMLData(decodeURIComponent(form_data.address));
    let pwd = decodeURIComponent(form_data.password);
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
    if(!name_reg.test(first_name) || !name_reg.test(last_name) || !address_reg.test(address)) {
        res.status(400).send("Name or address is invalid");
        return;
    }
    //Everything is fine, add this person to the database
    //Using prepared statements to prevent injection
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
            //Setting up the session using their newly assigned primary key
            req.session.user = this.lastID;
            req.session.name = first_name + " " + last_name; //These are filtered above to be ok in HTML context
            let query2 = db.prepare("INSERT INTO accounts(balance,user_id) VALUES(?, ?)");
            query2.run([40, this.lastID]); //Give the new user an account with $40 for testing purposes
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

Alexander Edgar Shadowcrow00@csu.fullerton.edu

Dependencies:
	express, body-parser, body-parser-xml, xml2js, xss-filters,
	mysql, bcrypt, helmet-csp, client-sessions
	
	These can all be installed through npm

Instructions:
Please first have your mysql server running
As a mysql root user, please have mysql execute init_db.sql
The command for this is usually "mysql -u root -p < init_db.sql"
run "node p3.js"
direct your browser to localhost:3000

Overview:
This application will create a bank.db sqlite3 file if it does not exist.
The user can get/post to "login", get/post to "register", get "/" or "index",
	and post to "withdraw", "deposit", "transfer", and "logout".
The application runs on port 3000.

1. Password requirements follow OWASP standards and are validated both client-side and server-side.
2. E-Mails are cursorily examined by regex to meet OWASP standards.
3. The index page is the only members-only page that requires a valid session, although posts to "withdraw", "deposit", "transfer", and "logout" technically also have this stipulation.
4. Sessions are managed using client-sessions with an httpOnly, secure, 3-minute cookie
5. Passwords are stored hashed+salted by argon2.
6. All non-file data used in XMLHttpRequests are sent in application/xml format.
7. Prior to such sends, all fields are encoded with encodeURIComponent to prevent XML chicanery.
8. The first and last name are also filtered by xss-filters.inHTMLData since they are displayed in an HTML context.
9. All SQL statements are prepared.
10. HTTPS is used with a self-signed certificate.

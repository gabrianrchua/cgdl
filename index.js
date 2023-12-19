const sqlite3 = require('sqlite3').verbose();
//const prompt = require('prompt-sync')({sigint: true});
const express = require('express');
const { stdin, stdout } = require('process');
const readline = require('readline');

const app = express();
const api = express();
const rl = readline.createInterface(stdin, stdout);
const PORT = 8080;
const GOOD_REQ_RE = /^[a-z0-9]+$/gi;

app.use(express.json());
app.use("/api", api);

let db = new sqlite3.Database('./test.db', sqlite3.OPEN_READWRITE, (err) => {
	if (err) {
		if (err.errno == 14) {
			db = new sqlite3.Database('./test.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
				if (err) {
					console.error("Fatal: Error creating database at ./test.db");
					console.error(err);
					process.exit(1);
				} else {
					initDb(db);
				}
			});
		} else {
			console.error("Fatal: Error loading database at ./test.db");
			console.error(err);
			process.exit(1);
		}
	} else {
		initApp();
	}
});

function initApp() {
	app.listen(PORT, () => {
		console.log("Listening on port " + PORT);
		userInput();
	});
}

// create db structure and empty fields
function initDb(database) {
	database.exec(`
	CREATE TABLE Categories
	(
	Name varchar(32),
	Description varchar(255)
	);
	INSERT INTO Categories (Name, Description)
	VALUES ('PC', 'Programs and games for Windows, Mac, or Linux'),
		('Android', 'APKs and AABs for sideloading on Android'),
		('Switch', 'Games and DLC for Yuzu and other Switch emulators'),
		('Wii', 'Games for Wii and GameCube for Dolphin emulator'),
		('Files', 'Misc. files and other sharables');
	CREATE TABLE PC
	(
	Name varchar(32),
	Description varchar(255),
	Link varchar(64)
	);
	CREATE TABLE Android AS SELECT * FROM PC WHERE 0;
	CREATE TABLE Switch AS SELECT * FROM PC WHERE 0;
	CREATE TABLE Wii AS SELECT * FROM PC WHERE 0;
	CREATE TABLE Files AS SELECT * FROM PC WHERE 0;`, (err) => {
		if (err) {
			console.error(err);
		} else {
			console.log("First time database created and initialized successfully");
		}
		initApp();
	});
}

// runs test query on database and then terminates server
function testQuery(database) {
	database.each("SELECT rowid AS id, * FROM Categories", (err, row) => {
		console.log(row.id + " | " + row.Name + " | " + row.Description);
	}, (err) => {
		console.log("done");
		terminate();
	});
}

rl.on("SIGINT", () => {
	terminate();
});

function userInput() {
	rl.question("admin> ", resp => {
		resp = resp.toLowerCase().split(" ");
		if (resp.length == 0) {
			userInput();
			return;
		}
		if (resp[0] == "exit") {
			terminate();
			return;
		} else if (resp[0] == "help") {
			console.log(`List of commands:
create <name> <description> - create a new category
add <name> <description> <category> <link> - add item to a category listing
exit - stop server and exit`);
		}
		userInput();
	});
}

function terminate(exitcode = 0) {
	db.close(err => {
		if (err != null) {
			console.error("Error while closing db:");
			console.error(err);
			process.exit(1);
		} else {
			process.exit(exitcode);
		}
	});
}

app.get("/", (req, res) => {
	res.send("APP home");
});

api.get("/", (req, res) => {
	res.send({
		"status": "healthy"
	});
});
api.get("/categories", (req, res) => {
	db.all("SELECT rowid AS id, * FROM Categories", (err, rows) => {
		if (err != null) {
			res.send({
				"status": "error",
				"err": err
			});
		} else {
			res.send({
				"status": "success",
				"result": rows
			});
		}
	});
});
api.get("/categories/:name", (req, res) => {
	let name = req.params["name"];
	let match = name.match(GOOD_REQ_RE);
	if (match && match.length == 1) {
		db.all("SELECT rowid AS id, * FROM " + name, (err, rows) => {
			if (err != null) {
				res.send({
					"status": "error",
					"err": err
				});
			} else {
				res.send({
					"status": "success",
					"result": rows
				});
			}
		});
	} else {
		res.send({
			"status": "error",
			"err": "Invalid or malformed request"
		});
	}
});
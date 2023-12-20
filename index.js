const sqlite3 = require('sqlite3')
const express = require('express');
const { stdin, stdout } = require('process');
const readline = require('readline');

const app = express(); // at '/' - base level, also serves angular package
const api = express(); // at '/api' - serves API requests
const dl = express(); // at '/dl' - exclusively serves files from directory specified at FILE_DIR
const rl = readline.createInterface(stdin, stdout);
const PORT = 80;
const GOOD_REQ_RE = /^[a-z0-9]+$/gi;
const FILE_DIR = "./files/";

app.use(express.json());
app.use("/api", api);
app.use("/dl", dl);
app.use(express.static("srv")); // everything from angular package

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
	Name varchar(32) UNIQUE,
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
		resp = resp.split(" ");
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
    new name must be alphanumeric only
  add <name> <category> <link> <description> - add item to a category listing
    name must be alphanumeric only
    category must match already existing category
    link must be relative to /dl directory without preceding slash, e.g. subdir/file.zip
  exit - stop server and exit`);
  			userInput();
		} else if (resp[0] == "create") {
			if (resp.length < 3) {
				console.log("Invalid input, expected 'create <name> <description>'");
				userInput();
			} else {
				db.exec("INSERT INTO Categories (Name, Description)\nVALUES(\"" + resp[1] + "\", \"" + resp.slice(2).join(" ") + "\");\nCREATE TABLE " + resp[1] + "\n(\nName varchar(32),\nDescription varchar(255),\nLink varchar(64)\n);", (err) => {
					if (err) {
						console.log("Error occurred while creating category:");
						console.log(err);
					} else {
						console.log("Operation was successful");
					}
					userInput();
				});
			}
		} else if (resp[0] == "add") {
			if (resp.length < 5) {
				console.log("Invalid input, expected 'add <name> <category> <link> <description>'");
				userInput();
			} else {
				db.run("INSERT INTO " + resp[2] + " (Name, Description, Link)\nVALUES(\"" + resp[1] + "\", \"" + resp.slice(4).join(" ") + "\", \"" + resp[3] + "\");", (err) => {
					if (err) {
						console.log("Error occurred while adding item to category:");
						console.log(err);
					} else {
						console.log("Operation was successful");
					}
					userInput();
				});
			}
		} else {
			console.log("Invalid command, type 'help' for a list of commands");
			userInput();
		}
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

/*app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "/srv/index.html"));
});*/

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

dl.get("/", (req, res) => {
	const path = req.query.path;
	const options = {
		dotfiles: 'deny',
	}
	if (path) {
		res.download(FILE_DIR + path, path.slice(path.lastIndexOf("/")+1), options, err => {
			if (err) {
				res.send({
					"status": "error",
					"err": err.errno + ": " + err.code
				});
			}
		});
	} else {
		res.send({
			"status": "error",
			"err": "Please provide a path to the file (?path=...)"
		});
	}
});

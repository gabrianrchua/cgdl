const sqlite3 = require('sqlite3');
const prompt = require('prompt-sync')({sigint: true});

let db = new sqlite3.Database('./test.db', sqlite3.OPEN_READWRITE, (err) => {
	if (err && err.errno == 14) {
		db = new sqlite3.Database('./test.db', sqlite3.CREATE, (err) => {
			console.error("Fatal: Error creating database at ./test.db");
			console.error(err);
			process.exit(1);
		});
		createDb(db);
	} else if (err) {
		console.error("Fatal: Error loading database at ./test.db");
		console.error(err);
		process.exit(1);
	} else {
		testQuery(db);
	}
});

// create db structure and empty fields
function createDb(database) {
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
	CREATE TABLE Android LIKE PC;
	CREATE TABLE Switch LIKE PC;
	CREATE TABLE Wii LIKE PC;
	CREATE TABLE Files LIKE PC;`, (err) => {
		if (err != null) {
			console.log("First time database created and initialized successfully");
		} else {
			console.error(err);
		}
		testQuery(database);
	});
}

function testQuery(database) {
	database.each("SELECT rowid AS id, * FROM Categories", (err, row) => {
		console.log(row.id + " | " + row.Name + " | " + row.Description);
	}, (err) => {
		console.log("done");
		terminate();
	});
}

/*let userin = ""
while (userin != "exit") {
	userin = prompt("db> ").toLowerCase();
	if (userin == "exit") {
		terminate();
	}
}*/

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

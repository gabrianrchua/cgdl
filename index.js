const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./test.db', sqlite3.OPEN_READWRITE, (err) => {
	console.error("Error loading database at ./test.db");
	console.error(err);
	if (err.errno == 14) {
		
	}
	process.exit(1);
});

db.serialize(() => {
    db.run("CREATE TABLE lorem (info TEXT)");

    const stmt = db.prepare("INSERT INTO lorem VALUES (?)");
    for (let i = 0; i < 10; i++) {
        stmt.run("Ipsum " + i);
    }
    stmt.finalize();

    db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
        console.log(row.id + ": " + row.info);
    });
});

db.close();

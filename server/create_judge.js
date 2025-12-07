const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const username = 'judge';
const password = 'judge123';
const fullName = 'Honorable AI';

db.serialize(() => {
    db.get("SELECT * FROM judges WHERE username = ?", [username], (err, row) => {
        if (err) {
            console.error("DB Error:", err);
            return;
        }
        if (row) {
            console.log(`Judge already exists: ${username} / ${password}`);
        } else {
            const stmt = db.prepare("INSERT INTO judges (username, password, fullName) VALUES (?, ?, ?)");
            stmt.run(username, password, fullName, function (err) {
                if (err) console.error("Insert Error:", err);
                else console.log(`Created Default Judge: ${username} / ${password}`);
            });
            stmt.finalize();
        }
    });

    // List all judges just in case
    db.all("SELECT * FROM judges", (err, rows) => {
        console.log("--- All Judges ---");
        console.table(rows);
    });
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    db.all("SELECT * FROM admins", (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Admins:", rows);
        }
    });
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const fs = require('fs');
db.get("SELECT resetToken FROM members WHERE email='ankitraj2163@gmail.com'", (err, row) => {
    if (err) {
        console.error(err);
    } else {
        const token = row ? row.resetToken : "User not found";
        console.log("TOKEN:", token);
        fs.writeFileSync(path.join(__dirname, 'token.txt'), token);
    }
});

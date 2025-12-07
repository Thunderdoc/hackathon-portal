const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const email = 'ankitraj2163@gmail.com';
const newToken = 'force-reset-123';
const newExpiry = Date.now() + 86400000; // 24 hours

db.run("UPDATE members SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?", [newToken, newExpiry, email], function (err) {
    if (err) {
        console.error("DB Error:", err);
    } else {
        if (this.changes > 0) {
            console.log("Token Updated Successfully!");
            console.log(`Link: http://localhost:5173/set-password?token=${newToken}`);
        } else {
            console.log("User not found or no changes made.");
        }
    }
});

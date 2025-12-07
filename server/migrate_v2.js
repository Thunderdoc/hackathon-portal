const db = require('./db');

console.log("Starting migration v2...");

db.serialize(() => {
    // Add password column
    db.run("ALTER TABLE members ADD COLUMN password TEXT", (err) => {
        if (err && err.message.includes('duplicate column')) {
            console.log("Column 'password' already exists.");
        } else if (err) {
            console.error("Error adding 'password' column:", err.message);
        } else {
            console.log("Added 'password' column.");
        }
    });

    // Add role column
    db.run("ALTER TABLE members ADD COLUMN role TEXT DEFAULT 'MEMBER'", (err) => {
        if (err && err.message.includes('duplicate column')) {
            console.log("Column 'role' already exists.");
        } else if (err) {
            console.error("Error adding 'role' column:", err.message);
        } else {
            console.log("Added 'role' column.");
        }
    });

    // Add resetToken column
    db.run("ALTER TABLE members ADD COLUMN resetToken TEXT", (err) => {
        if (err && err.message.includes('duplicate column')) {
            console.log("Column 'resetToken' already exists.");
        } else if (err) {
            console.error("Error adding 'resetToken' column:", err.message);
        } else {
            console.log("Added 'resetToken' column.");
        }
    });

    // Add resetTokenExpiry column
    db.run("ALTER TABLE members ADD COLUMN resetTokenExpiry DATETIME", (err) => {
        if (err && err.message.includes('duplicate column')) {
            console.log("Column 'resetTokenExpiry' already exists.");
        } else if (err) {
            console.error("Error adding 'resetTokenExpiry' column:", err.message);
        } else {
            console.log("Added 'resetTokenExpiry' column.");
        }
    });
});

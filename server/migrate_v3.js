const db = require('./db');

console.log("Starting migration v3...");

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teamId INTEGER NOT NULL,
      message TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(teamId) REFERENCES teams(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error("Error creating messages table:", err.message);
        } else {
            console.log("Messages table created (or already exists).");
        }
    });
});

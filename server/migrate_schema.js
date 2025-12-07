const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Starting Migration...");

    const columnsToAdd = [
        "ALTER TABLE teams ADD COLUMN repoUrl TEXT",
        "ALTER TABLE teams ADD COLUMN demoUrl TEXT",
        "ALTER TABLE teams ADD COLUMN projectDescription TEXT"
    ];

    columnsToAdd.forEach(sql => {
        db.run(sql, (err) => {
            if (err) {
                if (err.message.includes("duplicate column name")) {
                    console.log(`Column already exists: ${sql}`);
                } else {
                    console.error("Migration Error:", err.message);
                }
            } else {
                console.log(`Success: ${sql}`);
            }
        });
    });
});

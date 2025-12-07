const db = require('./db');

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS teams");
    db.run("DROP TABLE IF EXISTS members");
    db.run("DROP TABLE IF EXISTS admins");
    db.run("DROP TABLE IF EXISTS config");
    console.log("Tables dropped. Restart the server to recreate them.");
});

const db = require('./db');

db.all("SELECT * FROM members WHERE email LIKE 'ankitraj2163%'", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
});

const db = require('./db');

db.run("UPDATE members SET password = '12345', role = 'LEAD' WHERE email LIKE 'ankitraj2163%'", function (err) {
    if (err) console.error(err);
    else console.log("Password updated to 12345 and Role set to LEAD");
});

const db = require('./db');

const email = 'pm@pmo.ac.in';
const password = '123456';

db.serialize(() => {
    db.run("UPDATE members SET password = ?, role = 'LEAD' WHERE email = ?", [password, email], function (err) {
        if (err) {
            console.error(err.message);
        } else {
            console.log(`Updated user ${email}: Password set to '${password}', Role set to 'LEAD'`);
        }
    });
});

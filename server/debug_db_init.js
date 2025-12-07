
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
console.log("Debug: Opening database at", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        try {
            initDb();
        } catch (e) {
            console.error("Error in initDb execution:", e);
        }
    }
});

function initDb() {
    console.log("Debug: Starting initDb serialization...");
    db.serialize(() => {
        const run = (sql, params = []) => {
            db.run(sql, params, function (err) {
                if (err) {
                    console.error("SQL ERROR:", err.message);
                    console.error("Failed SQL:", sql);
                } else {
                    // console.log("Success:", sql.substring(0, 50) + "...");
                }
            });
        };

        // Replicating db.js structure but with explicit error logging wrapper

        run(`CREATE TABLE IF NOT EXISTS teams(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teamName TEXT UNIQUE NOT NULL,
            members TEXT, -- JSON string of member objects
            code TEXT UNIQUE,
            transactionId TEXT,
            status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Active', 'Disqualified')),
            score INTEGER DEFAULT 0,
            problemStatement TEXT,
            projectUrl TEXT,
            projectDescription TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            flags TEXT, -- JSON string of flag objects {judgeId, reason, at}
            nominated BOOLEAN DEFAULT 0 -- Golden Buzzer status
        )`);

        run(`CREATE TABLE IF NOT EXISTS members(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teamId INTEGER,
            fullName TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            photoUrl TEXT,
            resumeUrl TEXT,
            password TEXT,
            role TEXT DEFAULT 'MEMBER',
            resetToken TEXT,
            resetTokenExpiry DATETIME,
            FOREIGN KEY(teamId) REFERENCES teams(id) ON DELETE CASCADE
        )`);

        run(`CREATE TABLE IF NOT EXISTS admins(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`);

        run(`CREATE TABLE IF NOT EXISTS config(
            key TEXT PRIMARY KEY,
            value TEXT
        )`);

        run("DROP TABLE IF EXISTS messages");
        run(`CREATE TABLE IF NOT EXISTS messages(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teamId INTEGER NOT NULL,
            message TEXT NOT NULL,
            sender TEXT DEFAULT 'TEAM', -- 'TEAM', 'ADMIN', 'JUDGE'
            judgeId INTEGER,
            judgeName TEXT,
            teamName TEXT,
            isRead BOOLEAN DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        run(`CREATE TABLE IF NOT EXISTS submissions(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teamId INTEGER,
            projectUrl TEXT,
            repoUrl TEXT,
            description TEXT,
            pptUrl TEXT,
            videoUrl TEXT,
            reportUrl TEXT,
            submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(teamId) REFERENCES teams(id)
        )`);

        run(`CREATE TABLE IF NOT EXISTS mentorship_requests(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teamId INTEGER NOT NULL,
            teamName TEXT,
            query TEXT,
            status TEXT DEFAULT 'Open',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(teamId) REFERENCES teams(id) ON DELETE CASCADE
        )`);

        run(`CREATE TABLE IF NOT EXISTS judges(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            fullName TEXT NOT NULL,
            assignedRooms TEXT
        )`);

        // THE FIX PART
        run("DROP TABLE IF EXISTS criteria");
        run(`CREATE TABLE IF NOT EXISTS criteria(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            maxScore INTEGER DEFAULT 10
        )`);

        run(`CREATE TABLE IF NOT EXISTS scores(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teamId INTEGER,
            judgeId INTEGER,
            criteriaId INTEGER,
            score INTEGER,
            feedback TEXT,
            FOREIGN KEY(teamId) REFERENCES teams(id),
            FOREIGN KEY(judgeId) REFERENCES judges(id),
            FOREIGN KEY(criteriaId) REFERENCES criteria(id),
            UNIQUE(teamId, judgeId, criteriaId)
        )`);

        run(`CREATE TABLE IF NOT EXISTS judge_feedback(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teamId INTEGER,
            judgeId INTEGER,
            feedback TEXT,
            FOREIGN KEY(teamId) REFERENCES teams(id),
            FOREIGN KEY(judgeId) REFERENCES judges(id)
        )`);

        run(`CREATE TABLE IF NOT EXISTS resources(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT,
            url TEXT NOT NULL,
            uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Seed Admin using run()
        db.get("SELECT count(*) as count FROM admins", (err, row) => {
            if (err) console.error(err.message);
            else if (row.count === 0) {
                run(`INSERT INTO admins(username, password) VALUES('admin', 'admin123')`);
                console.log("Default admin created.");
            }
        });

        // Seed Criteria
        const defaultCriteria = [
            { name: 'Innovation', desc: 'How innovative is the idea?', max: 10 },
            { name: 'Feasibility', desc: 'Is the solution practical?', max: 10 },
            { name: 'Presentation', desc: 'Quality of pitch/demo', max: 10 },
            { name: 'Technical Complexity', desc: 'Code quality and difficulty', max: 10 }
        ];

        defaultCriteria.forEach(c => {
            run(`INSERT OR IGNORE INTO criteria(name, description, maxScore) VALUES(?, ?, ?)`, [c.name, c.desc, c.max]);
        });

        console.log("Debug info: Init script submitted all queries.");
    });
}

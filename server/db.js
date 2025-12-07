const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        try {
            initDb();
            // Seed a log entry so it's not blank
            setTimeout(() => {
                db.run("INSERT INTO logs (action) VALUES ('System Initialized. Connection Secure.')");
            }, 1000);
        } catch (e) {
            console.error("Error in initDb:", e);
        }
    }
});

function initDb() {
    db.serialize(() => {
        // Create Teams Table
        db.run(`CREATE TABLE IF NOT EXISTS teams(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teamName TEXT UNIQUE NOT NULL,
            members TEXT, -- JSON string of member objects
            teamCode TEXT UNIQUE,
            transactionId TEXT,
            totalAmount INTEGER,
            paymentStatus TEXT DEFAULT 'Paid',
            status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Active', 'Disqualified')),
            score INTEGER DEFAULT 0,
            problemStatement TEXT,
            repoUrl TEXT,
            demoUrl TEXT,
            projectDescription TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            flags TEXT, -- JSON string of flag objects {judgeId, reason, at}
            nominated BOOLEAN DEFAULT 0, -- Golden Buzzer status
            isPanic BOOLEAN DEFAULT 0
        )`);

        // Migration for existing tables (safe to run)
        db.run("ALTER TABLE teams ADD COLUMN isPanic BOOLEAN DEFAULT 0", (err) => { /* Ignore error if exists */ });

        // Create Members Table
        db.run(`CREATE TABLE IF NOT EXISTS members(
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

        // Create Admins Table
        db.run(`CREATE TABLE IF NOT EXISTS admins(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`);

        // Create Config Table
        db.run(`CREATE TABLE IF NOT EXISTS config(
            key TEXT PRIMARY KEY,
            value TEXT
        )`);

        // Create Messages Table
        db.run("DROP TABLE IF EXISTS messages", () => {
            db.run(`CREATE TABLE IF NOT EXISTS messages(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                teamId INTEGER, -- Made Nullable for Judge messages
                message TEXT NOT NULL,
                sender TEXT DEFAULT 'TEAM', -- 'TEAM', 'ADMIN', 'JUDGE'
                judgeId INTEGER,
                judgeName TEXT,
                teamName TEXT,
                isRead BOOLEAN DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
        });

        // Create Submissions Table
        db.run(`CREATE TABLE IF NOT EXISTS submissions(
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

        // Create Mentorship Requests Table
        db.run("DROP TABLE IF EXISTS mentorship_requests");
        db.run(`CREATE TABLE IF NOT EXISTS mentorship_requests(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teamId INTEGER NOT NULL,
            teamName TEXT,
            category TEXT,
            description TEXT,
            status TEXT DEFAULT 'Open',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(teamId) REFERENCES teams(id) ON DELETE CASCADE
        )`);

        // Create Judges Table
        db.run(`CREATE TABLE IF NOT EXISTS judges(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            fullName TEXT NOT NULL,
            assignedRooms TEXT
        )`);

        // Create Criteria Table
        db.run("DROP TABLE IF EXISTS criteria");
        db.run(`CREATE TABLE IF NOT EXISTS criteria(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            maxScore INTEGER DEFAULT 10
        )`);

        // Create Scores Table
        db.run(`CREATE TABLE IF NOT EXISTS scores(
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

        // Create Judge Feedback Table
        db.run(`CREATE TABLE IF NOT EXISTS judge_feedback(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teamId INTEGER,
            judgeId INTEGER,
            feedback TEXT,
            FOREIGN KEY(teamId) REFERENCES teams(id),
            FOREIGN KEY(judgeId) REFERENCES judges(id)
        )`);

        // Create Resources Table
        db.run(`CREATE TABLE IF NOT EXISTS resources(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT,
            url TEXT NOT NULL,
            uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create Logs Table
        db.run(`CREATE TABLE IF NOT EXISTS logs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Seed Admin
        db.get("SELECT count(*) as count FROM admins", (err, row) => {
            if (err) console.error(err.message);
            else if (row.count === 0) {
                db.run(`INSERT INTO admins(username, password) VALUES('admin', 'admin123')`);
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
            db.run(`INSERT OR IGNORE INTO criteria(name, description, maxScore) VALUES(?, ?, ?)`, [c.name, c.desc, c.max]);
        });
    });
}

module.exports = db;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const { createObjectCsvStringifier } = require('csv-writer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// --- DATA SAFETY: AUTOMATED BACKUPS ---
const BACKUP_DIR = path.join(__dirname, 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

const dbSource = path.resolve(__dirname, 'database.sqlite');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDest = path.join(BACKUP_DIR, `backup-${timestamp}.sqlite`);

try {
    if (fs.existsSync(dbSource)) {
        fs.copyFileSync(dbSource, backupDest);
        console.log(`[DATA SAFETY] Database backed up to: ${backupDest}`);
    }
} catch (err) {
    console.error('[DATA SAFETY] Backup Failed:', err);
}

// --- EMAIL CONFIGURATION ---
// REPLACE WITH YOUR ACTUAL CREDENTIALS
// --- EMAIL CONFIGURATION (BREVO SMTP) ---
// --- EMAIL CONFIGURATION (BREVO SMTP) ---
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    // console.log("==================================================");
    // console.log("           SIMULATION EMAIL SENT                  ");
    // console.log("==================================================");
    console.log(`Sending Email To: ${to}`);
    // console.log(`Subject: ${subject}`);
    // console.log("Body (HTML Snippet):");
    // console.log(html);
    // console.log("==================================================");
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
    });
};

const app = express();
const PORT = 5001;

console.log("Attempting to start server on port " + PORT);

app.use(cors());
app.use(bodyParser.json());
// 1. Static Files with Explicit CORS for HTML2Canvas
app.use('/uploads', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
}, express.static(path.join(__dirname, 'uploads')));

// --- SERVE FRONTEND (PRODUCTION) ---
app.use(express.static(path.join(__dirname, '../client/dist')));

// --- MULTER SETUP ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage }); // Initialize Multer


// --- UTILS ---
const runTransaction = (callback) => {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        callback();
    });
};

// --- ROUTES ---

// 1. Register Team (Transaction)
app.post('/api/register', upload.any(), (req, res) => {
    // Check Lockdown
    db.get("SELECT value FROM config WHERE key = 'lockdown'", (err, row) => {
        if (row && row.value === 'true') {
            return res.status(403).json({ error: 'Registration is currently PAUSED by the administrators.' });
        }

        try {
            const { teamName } = req.body;
            let members = [];

            // Parse members from FormData (it might come as stringified JSON or individual fields)
            if (req.body.members) {
                members = JSON.parse(req.body.members);
            }

            // Basic Validation
            if (!teamName || !members || members.length < 2 || members.length > 5) {
                return res.status(400).json({ error: 'Invalid team data. Must have 2-5 members.' });
            }

            // Map files to members
            // Assuming frontend sends files with field names like "member-0-photo", "member-0-resume"
            if (req.files) {
                req.files.forEach(file => {
                    const match = file.fieldname.match(/member-(\d+)-(photo|resume)/);
                    if (match) {
                        const index = parseInt(match[1]);
                        const type = match[2]; // 'photo' or 'resume'
                        if (members[index]) {
                            const url = `http://localhost:${PORT}/uploads/${file.filename}`;
                            if (type === 'photo') members[index].photoUrl = url;
                            if (type === 'resume') members[index].resumeUrl = url;
                        }
                    }
                });
            }

            // Check for duplicate emails within the request
            const emailSet = new Set();
            for (const m of members) {
                if (emailSet.has(m.email)) {
                    return res.status(400).json({ error: `Duplicate email in request: ${m.email}` });
                }
                emailSet.add(m.email);
            }

            // 1. Check if Team Name exists
            db.get("SELECT id FROM teams WHERE teamName = ?", [teamName], (err, row) => {
                if (err) return res.status(500).json({ error: 'DB Error' });
                if (row) return res.status(400).json({ error: 'Team Name already taken.' });

                // 2. Check if any Email exists
                const emails = members.map(m => m.email);
                const placeholders = emails.map(() => '?').join(',');
                db.all(`SELECT email FROM members WHERE email IN (${placeholders})`, emails, (err, rows) => {
                    if (err) return res.status(500).json({ error: 'DB Error' });
                    if (rows.length > 0) {
                        return res.status(400).json({ error: `Emails already registered: ${rows.map(r => r.email).join(', ')}` });
                    }

                    // 3. Proceed to Insert
                    const totalAmount = members.length * 500;
                    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                    const teamCode = `HT25-TM-${Math.floor(1000 + Math.random() * 9000)}`; // HT25-TM-1234

                    db.serialize(() => {
                        db.run("BEGIN TRANSACTION");

                        db.run("INSERT INTO teams (teamName, teamCode, totalAmount, transactionId) VALUES (?, ?, ?, ?)", [teamName, teamCode, totalAmount, transactionId], function (err) {
                            if (err) {
                                console.error("REGISTRATION SQL ERROR:", err); // Added Log
                                db.run("ROLLBACK");
                                return res.status(500).json({ error: 'Failed to create team: ' + err.message });
                            }
                            const teamId = this.lastID;

                            const stmt = db.prepare("INSERT INTO members (teamId, fullName, email, phone, photoUrl, resumeUrl) VALUES (?, ?, ?, ?, ?, ?)");
                            let errorOccurred = false;

                            members.forEach(member => {
                                stmt.run([teamId, member.fullName, member.email, member.phone, member.photoUrl, member.resumeUrl], (err) => {
                                    if (err) errorOccurred = true;
                                });
                            });

                            stmt.finalize();

                            if (errorOccurred) {
                                db.run("ROLLBACK");
                                res.status(500).json({ error: 'Failed to add members' });
                            } else {
                                db.run("COMMIT");

                                // Send Set Password Email to Team Lead (First Member)
                                const teamLead = members[0];
                                const token = crypto.randomBytes(32).toString('hex');
                                const tokenExpiry = Date.now() + 3600000; // 1 hour

                                db.run("UPDATE members SET resetToken = ?, resetTokenExpiry = ?, role = 'LEAD' WHERE email = ?", [token, tokenExpiry, teamLead.email], (err) => {
                                    if (!err) {
                                        const resetLink = `http://localhost:5173/set-password?token=${token}`;
                                        const mailOptions = {
                                            from: process.env.EMAIL_USER,
                                            to: teamLead.email,
                                            subject: `Welcome to Hackathon 2025! Set Your Password`,
                                            html: `
                                                <h1>Welcome to the Hackathon!</h1>
                                                <p>You have been registered as the Team Lead for <b>${teamName}</b>.</p>
                                                <p><b>Team Code:</b> ${teamCode}</p>
                                                <p>Please click the link below to set your password and access the Team Dashboard:</p>
                                                <a href="${resetLink}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Set Password</a>
                                                <p><small>Link expires in 1 hour.</small></p>
                                            `
                                        };
                                        transporter.sendMail(mailOptions, (err, info) => {
                                            if (err) console.log('Email error:', err);
                                            else console.log('Email sent:', info.response);
                                        });
                                    }
                                });

                                // Log Registration
                                db.run("INSERT INTO logs (action) VALUES (?)", [`Team registered: ${teamName}`]);

                                res.json({ message: 'Registration Successful! Check your email to set password.', teamCode, transactionId });
                            }
                        });
                    });
                });
            });

        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Server Error processing request' });
        }
    });
});

// 1.5 Impersonate Team (God Mode)
app.post('/api/admin/impersonate', (req, res) => {
    const { teamId } = req.body;
    db.get("SELECT * FROM members WHERE teamId = ? AND role = 'LEAD'", [teamId], (err, member) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        if (!member) {
            // Fallback to any member if no lead
            db.get("SELECT * FROM members WHERE teamId = ? LIMIT 1", [teamId], (err, anyMember) => {
                if (!anyMember) return res.status(404).json({ error: 'No members found' });
                res.json({ message: 'Impersonation active', user: { id: anyMember.id, email: anyMember.email, role: 'LEAD', teamId: anyMember.teamId, fullName: anyMember.fullName } });
            });
        } else {
            res.json({ message: 'Impersonation active', user: { id: member.id, email: member.email, role: member.role, teamId: member.teamId, fullName: member.fullName } });
        }
    });
});


// 2. Admin Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        if (row) {
            res.json({ message: 'Login successful', user: { username: row.username } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// 3. Get All Teams
app.get('/api/teams', (req, res) => {
    const query = `
    SELECT t.id as teamId, t.teamName, t.totalAmount, t.paymentStatus, t.transactionId, t.problemStatement, t.status, t.createdAt,
           m.id as memberId, m.fullName, m.email, m.phone, m.photoUrl, m.role
    FROM teams t
    LEFT JOIN members m ON t.id = m.teamId
    ORDER BY t.createdAt DESC
  `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB Error' });

        // Group by Team
        const teams = {};
        rows.forEach(row => {
            if (!teams[row.teamId]) {
                teams[row.teamId] = {
                    id: row.teamId,
                    teamName: row.teamName,
                    totalAmount: row.totalAmount,
                    paymentStatus: row.paymentStatus,
                    transactionId: row.transactionId,
                    problemStatement: row.problemStatement,
                    status: row.status,
                    createdAt: row.createdAt,
                    members: []
                };
            }
            if (row.memberId) {
                teams[row.teamId].members.push({
                    id: row.memberId,
                    fullName: row.fullName,
                    email: row.email,
                    phone: row.phone,
                    photoUrl: row.photoUrl
                });
            }
        });

        res.json(Object.values(teams));
    });
});

// 3.5 Get Single Team
app.get('/api/team/:id', (req, res) => {
    const { id } = req.params;
    const query = `
    SELECT t.id as teamId, t.teamName, t.totalAmount, t.paymentStatus, t.transactionId, t.problemStatement, t.status, t.createdAt,
        m.id as memberId, m.fullName, m.email, m.phone, m.photoUrl, m.role
    FROM teams t
    LEFT JOIN members m ON t.id = m.teamId
    WHERE t.id = ?
        `;

    db.all(query, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        if (rows.length === 0) return res.status(404).json({ error: 'Team not found' });

        const team = {
            id: rows[0].teamId,
            teamName: rows[0].teamName,
            totalAmount: rows[0].totalAmount,
            paymentStatus: rows[0].paymentStatus,
            transactionId: rows[0].transactionId,
            problemStatement: rows[0].problemStatement,
            status: rows[0].status,
            createdAt: rows[0].createdAt,
            members: rows.map(r => ({
                id: r.memberId,
                fullName: r.fullName,
                email: r.email,
                phone: r.phone,
                photoUrl: r.photoUrl,
                role: r.role
            }))
        };
        res.json(team);
    });
});

// 4. Delete Team
app.delete('/api/admin/team/:id', (req, res) => {
    const { id } = req.params;
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run("DELETE FROM members WHERE teamId = ?", [id]);
        db.run("DELETE FROM teams WHERE id = ?", [id], function (err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: 'Failed to delete' });
            }
            db.run("COMMIT");
            res.json({ message: 'Team deleted' });
        });
    });
});



// 7. Assign Problem Statement
app.put('/api/admin/assign-problem/:teamId', (req, res) => {
    const { teamId } = req.params;
    const { problemStatement } = req.body;
    db.run("UPDATE teams SET problemStatement = ? WHERE id = ?", [problemStatement, teamId], function (err) {
        if (err) return res.status(500).json({ error: 'Update failed' });
        // Log Assignment
        db.run("INSERT INTO logs (action) VALUES (?)", [`Problem statement assigned to Team ID ${teamId}`]);
        res.json({ message: 'Problem assigned' });
    });
});


// 8. Update Team Status
app.put('/api/admin/update-status/:teamId', (req, res) => {
    const { teamId } = req.params;
    const { status } = req.body;
    db.run("UPDATE teams SET status = ? WHERE id = ?", [status, teamId], function (err) {
        if (err) return res.status(500).json({ error: 'Update failed' });
        db.run("INSERT INTO logs (action) VALUES (?)", [`Team ID ${teamId} status changed to ${status}`]);
        res.json({ message: 'Status updated' });
    });
});

// 8.5 Update Member Details
app.put('/api/admin/member/:id', upload.single('photo'), (req, res) => {
    const { id } = req.params;
    const { fullName, email, phone } = req.body;
    let sql = "UPDATE members SET fullName = ?, email = ?, phone = ? WHERE id = ?";
    let params = [fullName, email, phone, id];

    if (req.file) {
        const photoUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
        sql = "UPDATE members SET fullName = ?, email = ?, phone = ?, photoUrl = ? WHERE id = ?";
        params = [fullName, email, phone, photoUrl, id];
    }

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: 'Update failed' });
        res.json({ message: 'Member updated' });
    });
});


// 9. SSE Broadcast Endpoint
let clients = [];
app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    clients.push(newClient);

    // Keep alive
    const interval = setInterval(() => {
        res.write(':\n\n');
    }, 15000);

    req.on('close', () => {
        clearInterval(interval);
        clients = clients.filter(c => c.id !== clientId);
    });
});

app.post('/api/admin/broadcast', (req, res) => {
    const { message } = req.body;
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({ message })} \n\n`);
    });
    res.json({ message: 'Broadcast sent' });
});

// 10. Email Dispatch (Real)
app.post('/api/admin/email', async (req, res) => {
    const { subject, body } = req.body;

    // Get all member emails
    db.all("SELECT email FROM members", [], async (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB Error' });

        const emails = rows.map(r => r.email);
        // Send in batches or loop (simple loop for now)
        for (const email of emails) {
            await sendEmail(email, subject, body);
        }

        res.json({ message: `Emails dispatched to ${emails.length} users.` });
    });
});

// --- AUTH ROUTES ---

// Set Password (First Time or Reset)
app.post('/api/auth/set-password', (req, res) => {
    const { token, password } = req.body;
    db.get("SELECT * FROM members WHERE resetToken = ? AND resetTokenExpiry > ?", [token, Date.now()], (err, member) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        if (!member) return res.status(400).json({ error: 'Invalid or expired token' });

        db.run("UPDATE members SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?", [password, member.id], (err) => {
            if (err) return res.status(500).json({ error: 'Update failed' });
            res.json({ message: 'Password set successfully' });
        });
    });
});

// Team Lead Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM members WHERE email = ? AND password = ?", [email, password], (err, member) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        if (member) {
            res.json({ message: 'Login successful', user: { id: member.id, email: member.email, role: member.role, teamId: member.teamId, fullName: member.fullName } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Forgot Password
app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    db.get("SELECT * FROM members WHERE email = ?", [email], (err, member) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        if (!member) return res.status(404).json({ error: 'User not found' });

        const token = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + 3600000; // 1 hour

        db.run("UPDATE members SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?", [token, tokenExpiry, member.id], (err) => {
            if (err) return res.status(500).json({ error: 'Update failed' });

            const resetLink = `http://localhost:5173/set-password?token=${token}`;
            sendEmail(email, "Password Reset Request", `
                <p>You requested a password reset.</p>
                <p>Click here to reset: <a href="${resetLink}">Reset Password</a></p>
            `);

            res.json({ message: 'Password reset email sent' });
        });
    });
});

// 11. Lockdown Config
app.get('/api/config/lockdown', (req, res) => {
    db.get("SELECT value FROM config WHERE key = 'lockdown'", (err, row) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json({ lockdown: row ? row.value === 'true' : false });
    });
});

app.post('/api/config/lockdown', (req, res) => {
    const { lockdown } = req.body; // boolean
    db.run("UPDATE config SET value = ? WHERE key = 'lockdown'", [String(lockdown)], function (err) {
        if (err) return res.status(500).json({ error: 'Update failed' });
        res.json({ message: `Lockdown ${lockdown ? 'enabled' : 'disabled'}` });
    });
});

// 11.5 Results Config
app.get('/api/config/results', (req, res) => {
    db.get("SELECT value FROM config WHERE key = 'results_released'", (err, row) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json({ released: row ? row.value === 'true' : false });
    });
});

app.post('/api/config/results', (req, res) => {
    const { released } = req.body; // boolean
    db.run("INSERT OR REPLACE INTO config (key, value) VALUES ('results_released', ?)", [String(released)], function (err) {
        if (err) return res.status(500).json({ error: 'Update failed' });
        res.json({ message: `Results ${released ? 'released' : 'hidden'}` });
    });
});

// 6. Export CSV
app.get('/api/export', (req, res) => {
    const query = `
        SELECT t.id as TeamID, t.teamName as TeamName, t.totalAmount, t.paymentStatus, t.transactionId,
        m.fullName as MemberName, m.email as MemberEmail, m.phone as MemberPhone
        FROM teams t
        JOIN members m ON t.id = m.teamId
        ORDER BY t.createdAt DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB Error' });

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'TeamID', title: 'Team ID' },
                { id: 'TeamName', title: 'Team Name' },
                { id: 'MemberName', title: 'Member Name' },
                { id: 'MemberEmail', title: 'Member Email' },
                { id: 'MemberPhone', title: 'Member Phone' },
                { id: 'totalAmount', title: 'Amount' },
                { id: 'paymentStatus', title: 'Status' },
                { id: 'transactionId', title: 'Transaction ID' }
            ]
        });

        const header = csvStringifier.getHeaderString();
        const records = csvStringifier.stringifyRecords(rows);

        res.setHeader('Content-Type', 'text/csv');
    });
});

app.post('/api/admin/reply', (req, res) => {
    const { teamId, message } = req.body;
    // Admin replies are automatically read by admin, but unread for team (if we tracked team read status, but for now just store it)
    db.run("INSERT INTO messages (teamId, message, sender, isRead) VALUES (?, ?, 'ADMIN', 1)", [teamId, message], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to send reply' });
        db.run("INSERT INTO logs (action) VALUES (?)", [`Admin replied to Team ${teamId}: "${message}"`]);
        res.json({ message: 'Reply sent' });
    });
});

// 9. Admin Logs
app.get('/api/admin/logs', (req, res) => {
    db.all("SELECT * FROM logs ORDER BY createdAt DESC LIMIT 50", (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        const logs = rows.map(r => `[${new Date(r.createdAt).toLocaleTimeString()}] ${r.action}`);
        res.json(logs);
    });
});

app.post('/api/admin/log', (req, res) => {
    const { action } = req.body;
    db.run("INSERT INTO logs (action) VALUES (?)", [action], function (err) {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json({ status: 'logged' });
    });
});

app.get('/api/admin/logs/download', (req, res) => {
    db.all("SELECT * FROM logs ORDER BY createdAt DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB Error' });

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'id', title: 'ID' },
                { id: 'createdAt', title: 'Timestamp' },
                { id: 'action', title: 'Action' }
            ]
        });

        const header = csvStringifier.getHeaderString();
        const records = csvStringifier.stringifyRecords(rows);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="system_logs.csv"');
        res.send(header + records);
    });
});

app.get('/api/admin/messages', (req, res) => {
    const query = `
        SELECT m.id, m.message, m.sender, m.isRead, m.createdAt, m.teamId, m.judgeId,
               t.teamName, j.username as judgeName, j.fullName as judgeFullName
        FROM messages m
        LEFT JOIN teams t ON m.teamId = t.id
        LEFT JOIN judges j ON m.judgeId = j.id
        ORDER BY m.createdAt DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json(rows);
    });
});



app.get('/api/messages/:teamId', (req, res) => {
    const { teamId } = req.params;
    const query = `
        SELECT * FROM messages WHERE teamId = ? ORDER BY createdAt ASC
    `;
    db.all(query, [teamId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json(rows);
    });
});

app.get('/api/judge/messages/:judgeId', (req, res) => {
    const { judgeId } = req.params;
    db.all("SELECT * FROM messages WHERE judgeId = ? ORDER BY createdAt ASC", [judgeId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json(rows);
    });
});

app.post('/api/judge/message', (req, res) => {
    const { judgeId, message } = req.body;
    db.run("INSERT INTO messages (judgeId, message, sender) VALUES (?, ?, 'JUDGE')", [judgeId, message], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to send' });
        res.json({ message: 'Sent to Admin' });
    });
});

app.post('/api/team/message', (req, res) => {
    const { teamId, message } = req.body;
    db.run("INSERT INTO messages (teamId, message, sender) VALUES (?, ?, 'TEAM')", [teamId, message], function (err) {
        if (err) return res.status(500).json({ error: 'DB Error' });
        // Log it so Admin sees it in System Logs immediately
        db.run("INSERT INTO logs (action) VALUES (?)", [`INCOMING MSG from Team ${teamId}: "${message}"`]);
        res.json({ message: 'Message sent' });
    });
});

app.post('/api/admin/reply-judge', (req, res) => {
    const { judgeId, message } = req.body;
    db.run("INSERT INTO messages (judgeId, message, sender, isRead) VALUES (?, ?, 'ADMIN', 1)", [judgeId, message], function (err) {
        if (err) return res.status(500).json({ error: 'Failed' });
        db.run("INSERT INTO logs (action) VALUES (?)", [`Admin replied to Judge ${judgeId}: "${message}"`]);
        res.json({ message: 'Reply Sent' });
    });
});

app.put('/api/admin/message/:id/read', (req, res) => {
    const { id } = req.params;
    db.run("UPDATE messages SET isRead = 1 WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: 'Update failed' });
        res.json({ message: 'Marked as read' });
    });
});

// 12.5 Project Submission
app.post('/api/team/submit', (req, res) => {
    const { teamId, repoLink, demoLink, description } = req.body;

    // 1. Check Timer
    db.get("SELECT value FROM config WHERE key = 'hackathon_end_time'", (err, row) => {
        if (err) return res.status(500).json({ error: 'DB Error' });

        const endTime = row ? new Date(row.value) : null;
        if (endTime && new Date() > endTime) {
            return res.status(403).json({ error: "TIME'S UP! Submissions are closed." });
        }

        // 2. Proceed with Update
        db.run("UPDATE teams SET repoUrl = ?, demoUrl = ?, projectDescription = ? WHERE id = ?",
            [repoLink, demoLink, description, teamId],
            function (err) {
                if (err) return res.status(500).json({ error: 'DB Error' });
                res.json({ message: 'Project Submitted Successfully' });
            }
        );
    });
});

// 12.6 Team Results view
app.get('/api/team/results/:teamId', (req, res) => {
    const { teamId } = req.params;

    // 1. Check if results are released
    db.get("SELECT value FROM config WHERE key = 'results_released'", (err, row) => {
        if (err) return res.status(500).json({ error: 'DB Error' });

        const released = row ? row.value === 'true' : false;
        if (!released) {
            return res.json({ released: false });
        }

        // 2. Fetch Score and Feedback
        const sql = `
            SELECT t.score as manualScore,
            (SELECT feedback FROM judge_feedback WHERE teamId = t.id LIMIT 1) as feedback,
            (SELECT AVG(score) FROM scores WHERE teamId = t.id) as judgeAvg
            FROM teams t
            WHERE t.id = ?
        `;

        db.get(sql, [teamId], (err, result) => {
            if (err) return res.status(500).json({ error: 'DB Error' });

            // Calculate total or use logic (Here we can just show what we found)
            res.json({
                released: true,
                score: (result.manualScore || 0) + (result.judgeAvg || 0),
                feedback: result.feedback || "No feedback provided."
            });
        });
    });
});

// 13. Verify Member Endpoint
app.get('/api/verify/member/:id', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT m.id, m.fullName, m.photoUrl, m.role, t.teamName, t.status
        FROM members m
        JOIN teams t ON m.teamId = t.id
        WHERE m.id = ?
    `;
    db.get(query, [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        if (!row) return res.status(404).json({ error: 'Member not found' });
        res.json(row);
    });
});

// 15. Mentorship System
app.post('/api/mentorship/request', (req, res) => {
    const { teamId, category, description } = req.body;
    db.run("INSERT INTO mentorship_requests (teamId, category, description) VALUES (?, ?, ?)", [teamId, category, description], function (err) {
        if (err) return res.status(500).json({ error: 'DB Error' });
        // Log Distress Signal
        db.run("INSERT INTO logs (action) VALUES (?)", [`DISTRESS SIGNAL from Team ${teamId} (${category}): ${description}`]);
        res.json({ message: 'Help requested' });
    });
});

app.get('/api/mentorship/queue', (req, res) => {
    const query = `
        SELECT m.*, t.teamName 
        FROM mentorship_requests m
        JOIN teams t ON m.teamId = t.id
        WHERE m.status IN ('Open', 'OPEN')
        ORDER BY m.createdAt ASC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json(rows);
    });
});

app.post('/api/mentorship/resolve/:id', (req, res) => {
    db.run("UPDATE mentorship_requests SET status = 'RESOLVED' WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json({ message: 'Request resolved' });
    });
});

// 16. Ticker System
app.post('/api/config/ticker', (req, res) => {
    const { message } = req.body;
    db.run("INSERT OR REPLACE INTO config (key, value) VALUES ('ticker_message', ?)", [message], (err) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json({ message: 'Ticker updated' });
    });
});

app.get('/api/config/ticker', (req, res) => {
    db.get("SELECT value FROM config WHERE key = 'ticker_message'", (err, row) => {
        res.json({ message: row ? row.value : 'Welcome to the Hackathon! 🚀' });
    });
});



// --- TURBO MDE: JUDGING & RESOURCES ---

// 17. Timer System
app.post('/api/config/timer', (req, res) => {
    const { endTime } = req.body; // Expecting ISO string or timestamp
    db.run("INSERT OR REPLACE INTO config (key, value) VALUES ('hackathon_end_time', ?)", [endTime], (err) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json({ message: 'Timer updated' });
    });
});

app.get('/api/config/timer', (req, res) => {
    db.get("SELECT value FROM config WHERE key = 'hackathon_end_time'", (err, row) => {
        res.json({ endTime: row ? row.value : null });
    });
});

// 18. Judge Stats
app.get('/api/admin/judge-stats', (req, res) => {
    const sql = `
        SELECT j.id, j.fullName, j.username, 
        COUNT(DISTINCT s.teamId) as gradedTeams
        FROM judges j
        LEFT JOIN scores s ON j.id = s.judgeId
        GROUP BY j.id
    `;
    db.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        res.json(rows);
    });
});

// 1. Add Judge
app.post('/api/admin/judge', (req, res) => {
    const { username, password, fullName } = req.body;
    console.log("[ADD JUDGE]", { username, fullName }); // DEBUG LOG
    db.run('INSERT INTO judges (username, password, fullName) VALUES (?, ?, ?)', [username, password, fullName], function (err) {
        if (err) {
            console.error("[ADD JUDGE ERROR]", err.message); // DEBUG LOG
            return res.status(500).json({ error: err.message });
        }
        db.run("INSERT INTO logs (action) VALUES (?)", [`New Judge added: ${fullName}`]);
        res.json({ id: this.lastID, message: 'Judge added' });
    });
});

app.get('/api/admin/judges', (req, res) => {
    db.all('SELECT id, username, fullName FROM judges', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 20. Broadcast System (Maps to Ticker + Logs)
app.post('/api/admin/broadcast', (req, res) => {
    const { message } = req.body;
    db.serialize(() => {
        db.run("INSERT INTO logs (action) VALUES (?)", [`COMMAND: Broadcast initiated - "${message}"`]);
        db.run("INSERT OR REPLACE INTO config (key, value) VALUES ('ticker_message', ?)", [message]);
    });
    res.json({ success: true });
});

app.delete('/api/admin/judge/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM judges WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Judge removed' });
    });
});

// 2. Upload Resource
app.post('/api/admin/resource', upload.single('file'), (req, res) => {
    const { title, category } = req.body;
    const filename = req.file ? req.file.filename : '';
    db.run('INSERT INTO resources (title, category, filename) VALUES (?, ?, ?)', [title, category, filename], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run("INSERT INTO logs (action) VALUES (?)", [`Resource uploaded: ${title}`]);
        res.json({ id: this.lastID, message: 'Resource uploaded' });
    });
});

// 3. Get Resources (Public/Team)
app.get('/api/resources', (req, res) => {
    db.all('SELECT * FROM resources ORDER BY uploadedAt DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// (Duplicate routes removed)

// 2.5 Manual Database Backup (Data Safety)
app.get('/api/admin/backup', (req, res) => {
    const file = path.resolve(__dirname, 'database.sqlite');
    res.download(file, `hackathon_backup_${Date.now()}.sqlite`, (err) => {
        if (err) res.status(500).json({ error: 'Backup download failed' });
    });
});

// 4. Judge Login
app.post('/api/judge/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM judges WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });
        res.json({ message: 'Login success', judge: row });
    });
});

// 5. Get Teams for Judging
app.get('/api/judge/teams', (req, res) => {
    db.all('SELECT * FROM teams WHERE status = "Active"', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 5.1 Flag Team (Red Flag)
app.post('/api/judge/flag', (req, res) => {
    const { teamId, reason, judgeId } = req.body;
    db.get('SELECT flags FROM teams WHERE id = ?', [teamId], (err, row) => {
        let currentFlags = [];
        if (row && row.flags) currentFlags = JSON.parse(row.flags);
        currentFlags.push({ judgeId, reason, at: new Date() });
        db.run('UPDATE teams SET flags = ? WHERE id = ?', [JSON.stringify(currentFlags), teamId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            db.run("INSERT INTO logs (action) VALUES (?)", [`Team ID ${teamId} FLAGGED by Judge ${judgeId}: ${reason}`]);
            res.json({ message: 'Flagged' });
        });
    });
});

// 5.2 Nominate Team (Golden Buzzer) - Consolidated
app.post('/api/judge/nominate', (req, res) => {
    const { teamId, judgeId } = req.body;
    db.run('UPDATE teams SET nominated = 1 WHERE id = ?', [teamId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run("INSERT INTO logs (action) VALUES (?)", [`Team ID ${teamId} NOMINATED (Golden Buzzer) by Judge ${judgeId}`]);
        res.json({ message: 'Nominated!' });
    });
});

// 6. Admin Leaderboard
app.get('/api/admin/leaderboard', (req, res) => {
    const sql = `
        SELECT t.id, t.teamName, t.nominated, t.flags, COALESCE(SUM(s.score), 0) as totalScore
        FROM teams t
        LEFT JOIN scores s ON t.id = s.teamId
        GROUP BY t.id
        ORDER BY totalScore DESC
    `;
    db.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});




// 6. Get Criteria
app.get('/api/criteria', (req, res) => {
    db.all('SELECT * FROM criteria', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 7. Submit Score (Bulk + Feedback)
app.post('/api/judge/score', (req, res) => {
    const { judgeId, teamId, criteriaScores, feedback } = req.body; // criteriaScores is [{id, score}, ...]

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        let errorOccurred = false;

        // 1. Delete old scores for this judge/team to prevent duplicates
        db.run("DELETE FROM scores WHERE judgeId = ? AND teamId = ?", [judgeId, teamId], (err) => {
            if (err) errorOccurred = true;

            // 2. Insert new scores
            const insertStmt = db.prepare("INSERT INTO scores (judgeId, teamId, criteriaId, score) VALUES (?, ?, ?, ?)");
            criteriaScores.forEach(c => {
                insertStmt.run(judgeId, teamId, c.id, c.score);
            });
            insertStmt.finalize();

            // 3. Save Feedback
            if (feedback) {
                db.run("DELETE FROM judge_feedback WHERE judgeId = ? AND teamId = ?", [judgeId, teamId]);
                db.run("INSERT INTO judge_feedback (judgeId, teamId, feedback) VALUES (?, ?, ?)", [judgeId, teamId, feedback]);
            }

            if (errorOccurred) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: 'Database Error' });
            }

            db.run("COMMIT", () => {
                db.run("INSERT INTO logs (action) VALUES (?)", [`Judge ${judgeId} submitted scores for Team ${teamId}`]);
                res.json({ message: 'Evaluation Submitted Successfully' });
            });
        });
    });
});

// 8. Wipe Judges (God Mode)
app.delete('/api/admin/score/:teamId', (req, res) => {
    const { teamId } = req.params;
    db.run('DELETE FROM scores WHERE teamId = ?', [teamId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run("INSERT INTO logs (action) VALUES (?)", [`Scores WIPED for Team ID ${teamId}`]);
        res.json({ message: 'Scores wiped', changes: this.changes });
    });
});

app.put('/api/admin/score/:teamId', (req, res) => {
    const { teamId } = req.params;
    const { score } = req.body;
    db.run('UPDATE teams SET score = ? WHERE id = ?', [score, teamId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Score updated manually' });
    });
});

// 8.1 Update Team (Admin Edit)
// 8.1 Update Team (Admin Edit)
app.put('/api/admin/team/:id', (req, res) => {
    const { id } = req.params;
    console.log(`[UPDATE TEAM] ID: ${id}, Body:`, req.body);
    const { members, status, problemStatement, score } = req.body;

    // Transaction to update both Tables
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 1. Update Teams Table (Status, Problem, Score) - Ignoring members JSON since we use relational table now
        const sqlTeam = `UPDATE teams SET status = ?, problemStatement = ?, score = ? WHERE id = ?`;
        db.run(sqlTeam, [status, problemStatement, score, id], function (err) {
            if (err) {
                console.error("[UPDATE TEAM ERROR]", err.message);
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
            }

            // 2. Update Members Table
            if (members && Array.isArray(members)) {
                let memberErrors = false;
                const stmt = db.prepare("UPDATE members SET fullName = ?, email = ?, phone = ?, photoUrl = ? WHERE id = ?");

                members.forEach(m => {
                    stmt.run(m.fullName, m.email, m.phone, m.photoUrl, m.id, (err) => {
                        if (err) {
                            console.error("[UPDATE MEMBER ERROR]", err.message);
                            memberErrors = true;
                        }
                    });
                });
                stmt.finalize();

                if (memberErrors) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: "Failed to update some members" });
                }
            }

            db.run("COMMIT", () => {
                db.run("INSERT INTO logs (action) VALUES (?)", [`Team ID ${id} details updated by Admin`]);
                res.json({ message: 'Team and Members updated successfully' });
            });
        });
    });
});

// 8.2 Impersonate Team (Ghost Mode)
app.post('/api/admin/impersonate', (req, res) => {
    const { teamId } = req.body;
    db.get('SELECT id, teamName FROM teams WHERE id = ?', [teamId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Team not found' });

        // Return a mock user object compatible with TeamDashboard
        res.json({
            user: {
                teamId: row.id,
                teamName: row.teamName,
                role: 'LEADER' // Mock role
            }
        });
    });
});

// 8.3 Panic Mode Sync
app.post('/api/team/panic', (req, res) => {
    const { teamId, isPanic } = req.body;
    db.run("UPDATE teams SET isPanic = ? WHERE id = ?", [isPanic ? 1 : 0, teamId], (err) => {
        if (err) return res.status(500).json({ error: 'DB Error' });
        if (isPanic) {
            db.run("INSERT INTO logs (action) VALUES (?)", [`ALERT: Team ${teamId} entered PANIC MODE`]);
        }
        res.json({ message: 'Panic state updated' });
    });
});

// 9. Leaderboard (Advanced)
app.get('/api/leaderboard', (req, res) => {
    const sql = `
        SELECT t.id, t.teamName, t.score as manualScore,
        COALESCE(SUM(s.score * c.weight * 1.0) / NULLIF(COUNT(DISTINCT s.judgeId), 0), 0) as judgeScore
        FROM teams t
        LEFT JOIN scores s ON t.id = s.teamId
        LEFT JOIN criteria c ON s.criteriaId = c.id
        WHERE t.status = 'Active'
        GROUP BY t.id
    `;
    db.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const leaderboard = rows.map(r => ({
            ...r,
            totalScore: (r.manualScore || 0) + (r.judgeScore || 0)
        })).sort((a, b) => b.totalScore - a.totalScore);
        res.json(leaderboard);
    });
});

// --- CATCH-ALL FOR FRONTEND ROUTING ---
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

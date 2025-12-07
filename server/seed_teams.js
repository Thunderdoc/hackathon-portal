
const path = require('path');
const db = require('./db');

const teams = [
    { name: 'Quantum Leap', problem: 'AI Healthcare' },
    { name: 'Nebula Nexus', problem: 'Blockchain Voting' },
    { name: 'Cyber Pioneers', problem: 'Smart Cities' },
    { name: 'Glitch Hunters', problem: 'Cybersecurity' },
    { name: 'Code Wizards', problem: 'EdTech Platform' },
    { name: 'Data Dynamos', problem: 'FinTech App' },
    { name: 'Pixel Perfect', problem: 'AR/VR Game' },
    { name: 'Neural Netters', problem: 'Climate Change AI' },
    { name: 'Silicon Squad', problem: 'IoT Agriculture' },
    { name: 'Binary Bandits', problem: 'Supply Chain Algo' }
];

const mockDesc = "This project aims to revolutionize the industry using cutting-edge tech. We implemented a microservices architecture with a React frontend and Node.js backend. The solution addresses key pain points in efficiency and scalability.";

db.serialize(() => {
    console.log("Seeding 10 Teams...");

    teams.forEach((t, i) => {
        const teamCode = `TM-${1000 + i}`;
        const txnId = `TXN-${Date.now()}-${i}`;

        db.run(`INSERT INTO teams (teamName, teamCode, transactionId, status, problemStatement, repoUrl, projectDescription, totalAmount, paymentStatus) 
                VALUES (?, ?, ?, 'Active', ?, 'https://github.com/mock/repo', ?, 1500, 'Paid')`,
            [t.name, teamCode, txnId, t.problem, mockDesc],
            function (err) {
                if (err) return console.error("Team Insert Error:", err.message);

                const teamId = this.lastID;
                console.log(`Added Scheme: ${t.name} (ID: ${teamId})`);

                // Add 3 members per team
                for (let j = 1; j <= 3; j++) {
                    const isLead = j === 1;
                    const role = isLead ? 'LEAD' : 'MEMBER';
                    const name = `Member ${j} of ${t.name}`;
                    const email = `user${teamId}_${j}@example.com`;
                    const pass = '123456'; // Simple pass for testing

                    db.run(`INSERT INTO members (teamId, fullName, email, phone, password, role) 
                        VALUES (?, ?, ?, '9999999999', ?, ?)`,
                        [teamId, name, email, pass, role],
                        (err) => {
                            if (err) console.error("Member Insert Error:", err.message);
                        });
                }
            });
    });
});

// Close after a brief timeout to allow operations to finish
setTimeout(() => {
    db.close(() => {
        console.log("Seeding Complete. DB Closed.");
    });
}, 2000);

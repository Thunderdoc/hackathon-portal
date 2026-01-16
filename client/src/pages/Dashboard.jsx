import API_URL from '../config';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Clock, Shield, Award, LogOut, Search, Printer, Trash2, Terminal, Radio, Mail, User, Ghost, Flag, Download, LifeBuoy, Megaphone, Code, Eye } from 'lucide-react';
import HolographicCard from '../components/HolographicCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Dashboard = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [stats, setStats] = useState({ total_teams: 0, total_members: 0, verified: 0, pending: 0 });
    const [resultsReleased, setResultsReleased] = useState(false);
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [lockdown, setLockdown] = useState(false);
    const [timerEnd, setTimerEnd] = useState(null);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [judges, setJudges] = useState([]);
    const [editingTeam, setEditingTeam] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [replyModal, setReplyModal] = useState(null);
    const [replyMsg, setReplyMsg] = useState('');
    const [judgeStats, setJudgeStats] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [mentorshipTickets, setMentorshipTickets] = useState([]);
    const [newJudge, setNewJudge] = useState({ username: '', password: '', fullName: '' });

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) navigate('/admin');

        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 5000);
        return () => clearInterval(interval);
    }, [navigate]);

    const fetchDashboardData = async () => {
        const fetchData = async (url, setter) => {
            try {
                const res = await axios.get(url);
                setter(res.data);
            } catch (e) { console.error(`Failed to fetch ${url}`, e); }
        };

        try {
            const res = await axios.get(`${API_URL}/api/teams`);
            setTeams(res.data);
            calculateStats(res.data);
        } catch (e) { console.error("Teams Init Failed", e); }

        fetchData(`${API_URL}/api/admin/messages`, setMessages);
        fetchData(`${API_URL}/api/mentorship/queue`, (data) => setMentorshipTickets(data || []));
        fetchData(`${API_URL}/api/admin/logs`, setLogs);

        try {
            const res = await axios.get(`${API_URL}/api/config`);
            const timer = res.data.find(c => c.key === 'hackathon_end_time');
            if (timer) setTimerEnd(timer.value);
            const lock = res.data.find(c => c.key === 'lockdown');
            setLockdown(lock && lock.value === 'true');
        } catch (e) { }

        try {
            const rRes = await axios.get(`${API_URL}/api/config/results`);
            setResultsReleased(rRes.data.released);
        } catch (e) { }

        fetchData(`${API_URL}/api/admin/judges`, setJudges);
        fetchData(`${API_URL}/api/admin/judge-stats`, setJudgeStats);
        fetchData(`${API_URL}/api/admin/leaderboard`, setLeaderboard);
    };

    const calculateStats = (data) => {
        const total_teams = data.length;
        const total_members = data.reduce((acc, team) => acc + team.members.length, 0);
        const verified = data.filter(t => t.status === 'Active').length;
        const pending = data.filter(t => t.status === 'Pending').length;
        setStats({ total_teams, total_members, verified, pending });
    };

    const addLog = async (action) => {
        try { await axios.post(`${API_URL}/api/admin/log`, { action }); } catch (e) { }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin');
    };

    const generatePass = (member, teamName) => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return alert('Popup blocked! Please allow popups.');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print ID Card</title>
                    <style>
                        body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #eee; }
                        @media print {
                            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            body { background: white; }
                        }
                    </style>
                </head>
                <body>
                    <div id="card-mount"></div>
                    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js"></script>
                    <script>
                        const card = document.createElement('div');
                        card.style.cssText = "width:350px;height:550px;background:white;border-radius:20px;border:1px solid #ccc;overflow:hidden;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;position:relative;";
                        card.innerHTML = \`
                            <div style="width:100%;height:140px;background:linear-gradient(135deg,#1a2a6c,#b21f1f,#fdbb2d);text-align:center;color:white;display:flex;flex-direction:column;justify-content:center;">
                                <h2 style="margin:0;">HACKATHON</h2><p style="margin:0;letter-spacing:4px;font-size:14px;">2025 ACCESS PASS</p>
                            </div>
                            <div style="margin-top:-60px;width:150px;height:150px;background:white;border-radius:25px;padding:5px;display:flex;justify-content:center;align-items:center;">
                                <img src="\${'${member.photoUrl || ''}' || 'https://via.placeholder.com/150'}" style="width:140px;height:140px;border-radius:20px;object-fit:cover;background:#eee;" crossorigin="anonymous">
                            </div>
                            <h1 style="margin:10px 0 5px;">${member.fullName}</h1>
                            <div style="background:red;color:white;padding:5px 20px;border-radius:20px;font-size:12px;font-weight:bold;">${member.role}</div>
                            <h3 style="margin-top:20px;color:#1d3557;border-bottom:2px solid #eee;padding-bottom:5px;">${teamName}</h3>
                            <div style="margin-top:auto;margin-bottom:20px;text-align:center;"><canvas id="qr"></canvas><div style="font-family:monospace;color:#ccc;">ID-${member.id}</div></div>
                        \`;
                        document.body.appendChild(card);
                        QRCode.toCanvas(document.getElementById('qr'), '${window.location.origin}/verify/${member.id}', function(e){
                            if(!e) setTimeout(()=>{window.print();window.close();},500);
                        });
                    </script>
                </body>
            </html>
        `);
    };

    const handleDeleteTeam = async (id) => {
        if (confirm('CRITICAL: Delete this team PERMANENTLY?')) {
            await axios.delete(`${API_URL}/api/admin/team/${id}`);
            addLog(`CRITICAL: Deleted team ${id}`);
            fetchDashboardData();
        }
    };

    const toggleLockdown = async () => {
        const newState = !lockdown;
        await axios.post(`${API_URL}/api/config/lockdown`, { value: newState.toString() });
        setLockdown(newState);
        addLog(`COMMAND: Lockdown ${newState ? 'INITIATED' : 'LIFTED'}`);
    };

    const handleBroadcast = async () => {
        if (!broadcastMsg) return;
        try {
            await axios.post(`${API_URL}/api/admin/broadcast`, { message: broadcastMsg });
            setBroadcastMsg('');
            addLog(`COMMAND: Broadcast initiated - "${broadcastMsg}"`);
        } catch (err) { addLog('ERROR: Broadcast failed.'); }
    };

    const handleEmailDispatch = async () => {
        if (!broadcastMsg) return alert("Please enter a message body.");
        try {
            await axios.post(`${API_URL}/api/admin/email`, { subject: 'Hackathon Update', body: broadcastMsg });
            addLog('COMMAND: Email Dispatch Initiated to ALL users.');
            setBroadcastMsg('');
        } catch (err) { addLog('ERROR: Email Dispatch failed.'); }
    };

    const fetchJudges = async () => {
        const res = await axios.get(`${API_URL}/api/admin/judges`);
        setJudges(res.data);
    };

    const markAsRead = async (id) => {
        await axios.put(`${API_URL}/api/admin/message/${id}/read`);
        fetchDashboardData();
    };

    const handleReplySend = async () => {
        if (!replyMsg.trim()) return;
        try {
            if (replyModal.type === 'JUDGE') {
                await axios.post(`${API_URL}/api/admin/reply-judge`, { judgeId: replyModal.id, message: replyMsg });
            } else {
                await axios.post(`${API_URL}/api/admin/reply`, { teamId: replyModal.id, message: replyMsg });
            }
            setReplyModal(null);
            setReplyMsg('');
            alert('Reply Sent');
        } catch (err) { alert('Failed to send reply'); }
    };

    const handleEditClick = (team) => {
        setEditingTeam(team);
        setEditFormData(JSON.parse(JSON.stringify(team)));
    };

    const handleEditChange = (e, field, memberId) => {
        const val = e.target.value;
        if (memberId) {
            const updatedMembers = editFormData.members.map(m => m.id === memberId ? { ...m, [field]: val } : m);
            setEditFormData({ ...editFormData, members: updatedMembers });
        } else {
            setEditFormData({ ...editFormData, [field]: val });
        }
    };

    const handlePhotoChange = (e, memberId) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const updatedMembers = editFormData.members.map(m => m.id === memberId ? { ...m, photoPreview: reader.result, photoFile: file } : m);
                setEditFormData({ ...editFormData, members: updatedMembers });
            };
            reader.readAsDataURL(file);
        }
    };

    const saveChanges = async () => {
        setLoading(true);
        try {
            const updatedMembers = await Promise.all(editFormData.members.map(async (m) => {
                if (m.photoFile) {
                    const fd = new FormData();
                    fd.append('photo', m.photoFile);
                    const res = await axios.post(`${API_URL}/api/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    return { ...m, photoUrl: res.data.url, photoPreview: undefined, photoFile: undefined };
                }
                return m;
            }));
            const finalData = { ...editFormData, members: updatedMembers };
            await axios.put(`${API_URL}/api/admin/team/${editingTeam.id}`, finalData);
            alert('Changes Saved!');
            setEditingTeam(null);
            fetchDashboardData();
        } catch (err) { alert('Save Failed'); }
        finally { setLoading(false); }
    };

    const handleImpersonate = async (teamId) => {
        try {
            const res = await axios.post(`${API_URL}/api/admin/impersonate`, { teamId });
            localStorage.setItem('teamUser', JSON.stringify(res.data.user));
            window.open('/team/dashboard', '_blank');
        } catch (err) { alert('Impersonation Failed'); }
    };

    // Sound Effect for Distress Signals (Live Help)
    useEffect(() => {
        const hasDistress = mentorshipTickets.some(t => t.status === 'Open');
        if (hasDistress) {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            // Gentle "Ping" Notification
            const playPing = () => {
                if (ctx.state === 'closed') return;
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g);
                g.connect(ctx.destination);
                o.type = 'sine';
                o.frequency.setValueAtTime(600, ctx.currentTime);
                g.gain.setValueAtTime(0.05, ctx.currentTime); // Lower volume
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                o.start();
                o.stop(ctx.currentTime + 0.5);
            };

            playPing();
            const interval = setInterval(playPing, 5000); // Gentle reminder every 5 seconds
            return () => { clearInterval(interval); ctx.close(); };
        }
    }, [mentorshipTickets]);

    const showProjectLinks = (team) => {
        const repo = team.repoUrl || 'Not submitted';
        const demo = team.demoUrl || 'Not submitted';
        const desc = team.projectDescription || 'No description';
        alert(`PROJECT DETAILS:\n\nRepo: ${repo}\nDemo: ${demo}\n\nDescription: ${desc}`);
    };

    const filteredTeams = teams.filter(t => t.teamName.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            {/* Top Navigation */}
            <div style={{ background: '#1d3557', padding: '1rem 2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Shield size={24} color="#00ff9d" />
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '1px' }}>ADMIN CONSOLE <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>v2.0</span></h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#333', padding: '0.5rem', borderRadius: '5px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#fca311', fontSize: '0.9rem' }}>
                            {timerEnd ? new Date(timerEnd).toLocaleTimeString() : 'OFF'}
                        </span>
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                            <button onClick={async () => { const date = prompt("Enter Deadline", new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' ')); if (date) { const newTime = new Date(date).toISOString(); await axios.post(`${API_URL}/api/config/timer`, { endTime: newTime }); setTimerEnd(newTime); } }} title="Set Custom Time" style={{ background: '#fca311', border: 'none', borderRadius: '3px', cursor: 'pointer', padding: '0.2rem' }}><Clock size={14} color="black" /></button>
                            <button onClick={async () => { const newTime = timerEnd ? new Date(new Date(timerEnd).getTime() + 3600000).toISOString() : new Date(Date.now() + 3600000).toISOString(); await axios.post(`${API_URL}/api/config/timer`, { endTime: newTime }); setTimerEnd(newTime); }} title="+1h" style={{ background: '#4caf50', border: 'none', padding: '0.2rem 0.4rem', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', borderRadius: '3px', cursor: 'pointer' }}>+1h</button>
                            <button onClick={async () => { if (!timerEnd) return; const newTime = new Date(new Date(timerEnd).getTime() - 3600000).toISOString(); await axios.post(`${API_URL}/api/config/timer`, { endTime: newTime }); setTimerEnd(newTime); }} title="-1h" style={{ background: '#e63946', border: 'none', padding: '0.2rem 0.4rem', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', borderRadius: '3px', cursor: 'pointer' }}>-1h</button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={toggleLockdown} style={{ background: lockdown ? '#dc3545' : '#198754', color: 'white', border: 'none', borderRadius: '5px', padding: '0.4rem 0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', animation: lockdown ? 'pulse 1s infinite' : 'none' }}>
                            {lockdown ? <Shield size={16} /> : <Shield size={16} />} {lockdown ? 'LOCKDOWN ACTIVE' : 'ACTIVATE LOCKDOWN'}
                        </button>
                        <button onClick={() => window.open(`${API_URL}/api/export`, '_blank')} style={{ background: '#212529', border: 'none', borderRadius: '5px', padding: '0.4rem 0.8rem', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                            <Download size={16} /> EXPORT DATA
                        </button>
                        <button onClick={() => window.open(`${API_URL}/api/admin/backup`, '_blank')} title="Download Backup" style={{ background: '#4cc9f0', border: 'none', borderRadius: '5px', padding: '0.4rem 0.8rem', color: '#1d3557', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}><Download size={16} /> BACKUP</button>
                        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>LOGOUT <LogOut size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Global Controls Panel */}
            < div style={{ background: 'white', padding: '1rem 2rem', borderBottom: '1px solid #eee', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                <button onClick={async () => {
                    const msg = prompt("Enter Ticker Message:");
                    if (msg) await axios.post(`${API_URL}/api/config/ticker`, { message: msg });
                }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#333', color: '#00ff9d', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer' }}>
                    <Terminal size={16} /> SET TICKER
                </button>

                <button onClick={async () => {
                    if (confirm(resultsReleased ? "HIDE RESULTS?" : "PUBLISH RESULTS? This will be visible to all teams.")) {
                        await axios.post(`${API_URL}/api/config/results`, { released: !resultsReleased });
                        setResultsReleased(!resultsReleased);
                    }
                }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: resultsReleased ? '#d63384' : '#6f42c1', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {resultsReleased ? <Radio size={16} /> : <Award size={16} />} {resultsReleased ? 'RESULTS: LIVE' : 'RESULTS: HIDDEN'}
                </button>
            </div >

            {/* Notification Toast */}
            {
                mentorshipTickets.some(t => t.status === 'Open') && (
                    <div style={{
                        position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
                        background: '#e63946', color: 'white', padding: '1rem 2rem', borderRadius: '10px',
                        boxShadow: '0 10px 30px rgba(230, 57, 70, 0.5)',
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        animation: 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <div style={{ background: 'white', padding: '0.5rem', borderRadius: '50%' }}>
                            <LifeBuoy color="#e63946" size={24} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>DISTRESS SIGNAL ACTIVE</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{mentorshipTickets.filter(t => t.status === 'Open').length} Teams need help!</div>
                        </div>
                        <a href="#live-help" style={{ color: 'white', textDecoration: 'underline', fontWeight: 'bold', marginLeft: '1rem' }}>VIEW</a>
                    </div>
                )
            }
            <style>{`@keyframes bounceIn { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

            {/* Main Content */}
            <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>

                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {[
                            { label: 'TOTAL TEAMS', val: stats.total_teams, icon: Users, color: '#457b9d' },
                            { label: 'PARTICIPANTS', val: stats.total_members, icon: User, color: '#1d3557' },
                            { label: 'VERIFIED', val: stats.verified, icon: Award, color: '#2a9d8f' },
                            { label: 'PENDING', val: stats.pending, icon: Clock, color: '#e63946' }
                        ].map((s, i) => (
                            <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                <div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: s.color, margin: 0 }}>{s.val}</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '600' }}>{s.label}</span>
                                </div>
                                <s.icon size={32} color={s.color} opacity={0.2} />
                            </div>
                        ))}
                    </div>

                    {/* Team Management */}
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'white', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', color: '#1d3557', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={20} /> ACTIVE TEAMS
                            </h2>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                                    <input type="text" placeholder="SEARCH TEAMS..." className="input-field" style={{ paddingLeft: '2.5rem', padding: '0.5rem 0.5rem 0.5rem 2.5rem', borderRadius: '5px', border: '1px solid #ddd' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <div style={{ color: '#6c757d' }}>{filteredTeams.length} RECORDS FOUND</div>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #dee2e6', color: '#1d3557', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>TEAM</th>
                                        <th style={{ padding: '1rem' }}>MEMBERS</th>
                                        <th style={{ padding: '1rem' }}>TX ID</th>
                                        <th style={{ padding: '1rem' }}>STATUS</th>
                                        <th style={{ padding: '1rem' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTeams.map(team => (
                                        <tr key={team.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{team.teamName}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {team.members.map(m => (
                                                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                                            <span>{m.fullName}</span>
                                                            <button onClick={() => generatePass(m, team.teamName)} title="Print ID Card" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d3557' }}><Printer size={14} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#6c757d' }}>{team.transactionId || 'PENDING'}</td>
                                            <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: team.status === 'Active' ? '#d1e7dd' : '#f8d7da', color: team.status === 'Active' ? '#0f5132' : '#842029', fontWeight: '600', fontSize: '0.8rem' }}>{team.status || 'Active'}</span>
                                                {team.nominated === 1 && <span title="Golden Buzzer Nominee" style={{ color: '#fca311' }}><Award size={16} /></span>}
                                                {team.flags && JSON.parse(team.flags || '[]').length > 0 && <span title="Flagged by Judge" style={{ color: '#e63946' }}><Flag size={16} /></span>}
                                                {team.isPanic === 1 && <span title="PANIC MODE ACTIVE" style={{ color: '#e63946', animation: 'pulse 1s infinite' }}><LifeBuoy size={16} /></span>}
                                            </td>
                                            <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => showProjectLinks(team)} title="View Project" style={{ background: 'none', border: 'none', color: '#4cc9f0', cursor: 'pointer' }}><Code size={18} /></button>
                                                <button onClick={() => setReplyModal({ id: team.id, name: team.teamName, type: 'TEAM' })} title="Message Team" style={{ background: 'none', border: 'none', color: '#2a9d8f', cursor: 'pointer' }}><Megaphone size={18} /></button>
                                                <button onClick={() => handleEditClick(team)} title="Edit Team" style={{ background: 'none', border: 'none', color: '#ffc107', cursor: 'pointer' }}><User size={18} /></button>
                                                <button onClick={() => handleImpersonate(team.id)} title="Ghost Entry (Impersonate)" style={{ background: 'none', border: 'none', color: '#6f42c1', cursor: 'pointer' }}><Ghost size={18} /></button>
                                                <button onClick={() => handleDeleteTeam(team.id)} title="Delete Team" style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Operations Command */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Judge Management */}
                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'white', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '1rem', color: '#1d3557' }}>JUDGE RECRUITMENT</h3>
                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    className="input-field"
                                    style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }}
                                    value={newJudge.username}
                                    onChange={(e) => setNewJudge({ ...newJudge, username: e.target.value })}
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="input-field"
                                    style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }}
                                    value={newJudge.password}
                                    onChange={(e) => setNewJudge({ ...newJudge, password: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="input-field"
                                    style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }}
                                    value={newJudge.fullName}
                                    onChange={(e) => setNewJudge({ ...newJudge, fullName: e.target.value })}
                                />
                                <button onClick={async () => {
                                    if (!newJudge.username || !newJudge.password || !newJudge.fullName) return alert("Fill all fields");
                                    try {
                                        await axios.post(`${API_URL}/api/admin/judge`, newJudge);
                                        alert('Judge Access Granted');
                                        setNewJudge({ username: '', password: '', fullName: '' });
                                        fetchDashboardData();
                                    } catch (e) { alert(e.response?.data?.error || 'Failed to add judge'); }
                                }} className="primary-btn" style={{ background: '#fca311', color: 'black', fontWeight: 'bold', padding: '0.5rem', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>AUTHORIZE JUDGE</button>
                            </div>
                            <div style={{ maxHeight: '150px', overflowY: 'auto', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                                <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>ACTIVE JUDGES</h4>
                                {judges.map(j => (
                                    <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.3rem', background: '#f8f9fa', marginBottom: '0.3rem', borderRadius: '4px' }}>
                                        <span><b>{j.fullName}</b> ({j.username})</span>
                                        <button onClick={async () => { if (confirm('Revoke?')) { await axios.delete(`${API_URL}/api/admin/judge/${j.id}`); fetchDashboardData(); } }} style={{ border: 'none', background: 'none', color: '#e63946', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resource Upload */}
                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'white', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '1rem', color: '#1d3557' }}>RESOURCE DEPLOYMENT</h3>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <input type="text" id="resTitle" placeholder="Resource Title" className="input-field" style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                                <input type="text" id="resCat" placeholder="Category" className="input-field" style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                                <input type="file" id="resFile" />
                                <button onClick={async () => {
                                    const t = document.getElementById('resTitle').value;
                                    const c = document.getElementById('resCat').value;
                                    const f = document.getElementById('resFile').files[0];
                                    if (!f) return alert("File missing");
                                    const fd = new FormData();
                                    fd.append('title', t);
                                    fd.append('category', c);
                                    fd.append('file', f);
                                    try {
                                        await axios.post(`${API_URL}/api/admin/resource`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                        alert('Resource Deployed');
                                    } catch (e) { alert('Deployment Failed'); }
                                }} className="primary-btn" style={{ background: '#2a9d8f', padding: '0.5rem', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>UPLOAD ASSET</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Live Terminal */}
                    <div className="glass-panel" style={{ padding: '1rem', height: '300px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.9rem', background: '#212529', color: '#00ff9d', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#fff', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Terminal size={16} /> SYSTEM LOGS</div>
                            <button onClick={() => window.open(`${API_URL}/api/admin/logs/download`, '_blank')} style={{ background: 'none', border: '1px solid #00ff9d', color: '#00ff9d', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '3px', cursor: 'pointer' }}>DOWNLOAD CSV</button>
                        </div>
                        {logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: '0.2rem', opacity: 0.8 }}>{log}</div>
                        ))}
                    </div>

                    {/* Broadcast */}
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'white', borderRadius: '10px' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1d3557' }}><Radio size={20} /> BROADCAST SYSTEM</h3>
                        <textarea rows="3" placeholder="ENTER MESSAGE..." value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} style={{ width: '100%', marginBottom: '1rem', resize: 'none', background: '#f8f9fa', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={handleBroadcast} className="primary-btn" style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>SEND ALERT</button>
                            <button onClick={handleEmailDispatch} className="primary-btn" style={{ flex: 1, background: '#6c757d', fontSize: '0.9rem', padding: '0.5rem', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><Mail size={16} /> EMAIL</button>
                        </div>
                    </div>

                    {/* Inbox */}
                    <div className="glass-panel" style={{ padding: '1rem', height: '300px', overflowY: 'auto', background: 'white', borderRadius: '10px' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#1d3557', fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>INBOX (SUPPORT)</h3>
                        {messages.length === 0 ? <p style={{ color: '#aaa', textAlign: 'center' }}>No messages.</p> : (
                            messages.map(msg => (
                                <div key={msg.id} style={{ marginBottom: '1rem', padding: '0.5rem', background: msg.isRead ? '#f8f9fa' : '#e3f2fd', borderRadius: '5px', borderLeft: msg.isRead ? '3px solid #ccc' : '3px solid #2196f3' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6c757d', marginBottom: '0.2rem' }}>
                                        <strong>{msg.sender === 'JUDGE' ? `JUDGE: ${msg.judgeName || 'Unknown'}` : `TEAM: ${msg.teamName}`}</strong>
                                        <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#333' }}>{msg.message}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {!msg.isRead && <button onClick={() => markAsRead(msg.id)} style={{ fontSize: '0.7rem', color: '#2196f3', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Mark Read</button>}
                                        <button onClick={() => setReplyModal({ id: msg.sender === 'JUDGE' ? msg.judgeId : msg.teamId, name: msg.sender === 'JUDGE' ? msg.judgeName : msg.teamName, type: msg.sender === 'JUDGE' ? 'JUDGE' : 'TEAM' })} style={{ fontSize: '0.7rem', color: '#2a9d8f', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Reply</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Judge Progress */}
                    <div className="glass-panel" style={{ padding: '1rem', height: '250px', background: 'white', borderRadius: '10px' }}>
                        <h3 style={{ color: '#1d3557', fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>JUDGE EVALUATION STATUS</h3>
                        {judgeStats.length === 0 ? <p style={{ color: '#999' }}>No data yet.</p> : (
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={judgeStats} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="username" width={80} style={{ fontSize: '0.8rem' }} />
                                    <Tooltip />
                                    <Bar dataKey="gradedTeams" fill="#fca311" name="Teams Graded" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Live Leaderboard */}
                    <div className="glass-panel" style={{ padding: '1rem', background: 'white', borderRadius: '10px' }}>
                        <h3 style={{ color: '#1d3557', fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>LIVE LEADERBOARD 🏆</h3>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {leaderboard.map((t, i) => (
                                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee', background: i < 3 ? 'linear-gradient(90deg, #fff3cd 0%, transparent 100%)' : 'transparent', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>{t.teamName}</span>
                                        {t.nominated === 1 && <Award size={14} color="#fca311" />}
                                        {t.flags && JSON.parse(t.flags || '[]').length > 0 && <Flag size={14} color="#e63946" />}
                                    </div>
                                    <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: i === 0 ? '#d4af37' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#666' }}>{t.totalScore}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mentorship / Help Tickets Panel */}
                    <div id="live-help" className="glass-panel" style={{ padding: '1rem', background: 'white', borderRadius: '10px' }}>
                        <h3 style={{ color: '#e63946', fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <LifeBuoy size={16} /> LIVE HELP REQUESTS
                        </h3>
                        {mentorshipTickets.length === 0 ? <p style={{ color: '#aaa' }}>No active distress signals.</p> : (
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {mentorshipTickets.map(t => (
                                    <div key={t.id} style={{ padding: '0.5rem', background: '#fff0f3', border: '1px solid #ffccd5', borderRadius: '5px', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                                            <strong style={{ color: '#a4133c' }}>{t.teamName}</strong>
                                            <span style={{ fontSize: '0.7rem', color: '#666' }}>{new Date(t.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 'bold', color: '#black' }}>[{t.category || 'HELP'}]</span> {t.description}
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (!confirm("Mark as Resolved?")) return;
                                                try {
                                                    await axios.post(`${API_URL}/api/mentorship/resolve/${t.id}`);
                                                    fetchDashboardData(); // Refresh all
                                                } catch (e) { alert("Failed to resolve"); }
                                            }}
                                            style={{ width: '100%', padding: '0.3rem', background: '#2a9d8f', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            MARK RESOLVED
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals & Popups */}
            {
                selectedMember && (
                    <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
                        <HolographicCard teamName={selectedMember.teamName} memberName={selectedMember.fullName} role={selectedMember.role} photoUrl={selectedMember.photoUrl} idNumber={`ID-${selectedMember.id}`} />
                    </div>
                )
            }

            {
                replyModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '10px', width: '400px' }}>
                            <h3>Reply to {replyModal.name}</h3>
                            <textarea className="input-field" rows="4" style={{ width: '100%', marginTop: '1rem', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }} value={replyMsg} onChange={e => setReplyMsg(e.target.value)} placeholder="Type your reply..."></textarea>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button onClick={handleReplySend} className="primary-btn" style={{ padding: '0.5rem 1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>SEND</button>
                                <button onClick={() => setReplyModal(null)} className="primary-btn" style={{ padding: '0.5rem 1rem', background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>CANCEL</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                editingTeam && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#fff', padding: '2rem', borderRadius: '10px', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ marginBottom: '1rem', color: '#1d3557' }}>EDIT TEAM: {editingTeam.teamName}</h2>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Status</label>
                                <select value={editFormData.status || 'Active'} onChange={(e) => handleEditChange(e, 'status')} className="input-field" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }}>
                                    <option value="Active">Active</option>
                                    <option value="Disqualified">Disqualified</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Problem Statement</label>
                                <input type="text" value={editFormData.problemStatement || ''} onChange={(e) => handleEditChange(e, 'problemStatement')} placeholder="Assign Problem Statement" className="input-field" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Team Score (Manual Override)</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <input type="number" value={editFormData.score || 0} onChange={(e) => handleEditChange(e, 'score')} className="input-field" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                                    <button onClick={async () => { if (!confirm("Wipe all judge scores?")) return; try { await axios.delete(`${API_URL}/api/admin/score/${editingTeam.id}`); alert("Scores wiped."); } catch (e) { alert("Failed"); } }} style={{ background: '#e63946', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', padding: '0 1rem', whiteSpace: 'nowrap' }}>WIPE JUDGES</button>
                                </div>
                            </div>
                            <h3 style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Members</h3>
                            {editFormData.members.map((m) => (
                                <div key={m.id} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ddd' }}>
                                            <img src={m.photoPreview || m.photoUrl || 'https://via.placeholder.com/60'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#6c757d', marginBottom: '0.2rem' }}>Change Photo</label>
                                            <input type="file" accept="image/*" onChange={(e) => handlePhotoChange(e, m.id)} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input type="text" value={m.fullName} onChange={(e) => handleEditChange(e, 'fullName', m.id)} placeholder="Full Name" className="input-field" style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                                        <input type="email" value={m.email} onChange={(e) => handleEditChange(e, 'email', m.id)} placeholder="Email" className="input-field" style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                                    </div>
                                    <input type="text" value={m.phone} onChange={(e) => handleEditChange(e, 'phone', m.id)} placeholder="Phone" className="input-field" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }} />
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button onClick={saveChanges} className="primary-btn" style={{ flex: 1, padding: '0.5rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }} disabled={loading}>{loading ? 'SAVING...' : 'SAVE CHANGES'}</button>
                                <button onClick={() => setEditingTeam(null)} className="primary-btn" style={{ flex: 1, background: '#6c757d', padding: '0.5rem', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>CANCEL</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;

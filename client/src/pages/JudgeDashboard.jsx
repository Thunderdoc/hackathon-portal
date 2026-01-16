import API_URL from '../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Gavel, LogOut, CheckCircle, FileText, Download, History, Zap, Clock, MessageCircle, Flag, Award } from 'lucide-react';

const Countdown = () => {
    const [timeLeft, setTimeLeft] = useState('');
    const [targetTime, setTargetTime] = useState(null);

    useEffect(() => {
        axios.get(`${API_URL}/api/config/timer`).then(res => {
            if (res.data.endTime) setTargetTime(new Date(res.data.endTime));
        }).catch(e => { });
    }, []);

    useEffect(() => {
        if (!targetTime) return;
        const interval = setInterval(() => {
            const now = new Date();
            const diff = targetTime - now;
            if (diff <= 0) {
                setTimeLeft('TIME UP');
                return;
            }
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        }, 1000);
        return () => clearInterval(interval);
    }, [targetTime]);

    if (!targetTime) return null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'monospace', fontWeight: 'bold', background: 'rgba(230, 57, 70, 0.2)', padding: '0.5rem 1rem', borderRadius: '5px', fontSize: '1.2rem', color: '#e63946', border: '1px solid #e63946' }}>
            <Clock size={20} /> {timeLeft || 'Loading...'}
        </div>
    );
};

const JudgeDashboard = () => {
    const navigate = useNavigate();
    const [judge, setJudge] = useState(null);
    const [teams, setTeams] = useState([]);
    const [criteria, setCriteria] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [scores, setScores] = useState({}); // { criteriaId: score }
    const [resources, setResources] = useState([]);
    const [activeTab, setActiveTab] = useState('grading'); // 'grading' | 'resources' | 'history' | 'chat'
    const [gradedTeams, setGradedTeams] = useState(new Set());
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');

    useEffect(() => {
        const userStr = localStorage.getItem('judgeUser');
        if (!userStr) {
            navigate('/judge/login');
            return;
        }
        setJudge(JSON.parse(userStr));
        fetchTeams();
        fetchCriteria();
        fetchResources();

        const chatInterval = setInterval(() => {
            fetchChat(JSON.parse(userStr).id);
        }, 5000);
        fetchChat(JSON.parse(userStr).id);

        return () => clearInterval(chatInterval);
    }, [navigate]);

    const fetchChat = async (judgeId) => {
        try {
            const res = await axios.get(`${API_URL}/api/judge/messages/${judgeId}`);
            setChatMessages(res.data);
        } catch (e) { }
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim()) return;
        try {
            await axios.post(`${API_URL}/api/judge/message`, { judgeId: judge.id, message: chatInput });
            setChatInput('');
            fetchChat(judge.id);
        } catch (e) {
            alert('Failed to send message');
        }
    };

    const fetchTeams = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/teams`);
            setTeams(res.data);
        } catch (e) { }
    };

    const fetchCriteria = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/criteria`);
            setCriteria(res.data);
        } catch (e) { }
    };

    const fetchResources = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/resources`);
            setResources(res.data);
        } catch (e) { }
    };

    const handleScoreChange = (cId, val) => {
        setScores(prev => ({ ...prev, [cId]: parseInt(val) }));
    };

    const submitScore = async () => {
        try {
            const criteriaScores = Object.entries(scores).map(([cId, score]) => ({ id: parseInt(cId), score }));
            const feedback = document.getElementById('judgeFeedback')?.value || '';

            await axios.post(`${API_URL}/api/judge/score`, {
                judgeId: judge.id,
                teamId: selectedTeam.id,
                criteriaScores,
                feedback
            });
            alert('Score Submitted!');
            setGradedTeams(prev => new Set([...prev, selectedTeam.id]));
            setSelectedTeam(null);
            setScores({});
        } catch (e) {
            alert('Failed to submit score');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('judgeUser');
        navigate('/judge/login');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#121212', color: '#e0e0e0', fontFamily: "'Open Sans', sans-serif" }}>
            {/* Header */}
            <header style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                padding: '1rem 2rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#fca311', padding: '0.5rem', borderRadius: '5px', color: 'black' }}>
                        <Gavel size={24} />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontFamily: "'Montserrat', sans-serif", letterSpacing: '1px', color: '#fff' }}>JUDGE PORTAL</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Countdown />
                    <nav style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => setActiveTab('grading')} style={{ background: 'none', border: 'none', color: activeTab === 'grading' ? '#fca311' : '#888', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Zap size={16} /> Grading
                        </button>
                        <button onClick={() => setActiveTab('resources')} style={{ background: 'none', border: 'none', color: activeTab === 'resources' ? '#fca311' : '#888', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={16} /> Resources
                        </button>
                        <button onClick={() => setActiveTab('chat')} style={{ background: 'none', border: 'none', color: activeTab === 'chat' ? '#fca311' : '#888', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageCircle size={16} /> Support
                        </button>
                    </nav>
                    <div style={{ width: '1px', height: '20px', background: '#444' }}></div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: '#fca311' }}>HONORABLE JUDGE {judge?.username?.toUpperCase()}</div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>ID: {judge?.id}</div>
                    </div>
                    <button onClick={handleLogout} style={{ background: '#333', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '5px', cursor: 'pointer' }}>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>

                {activeTab === 'grading' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem', }}>
                        {/* Team Sidebar */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '15px',
                            padding: '1rem',
                            height: 'calc(100vh - 150px)',
                            overflowY: 'auto',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#888', fontSize: '0.9rem', letterSpacing: '1px' }}>PENDING EVALUATION</h3>
                            {teams.map(team => (
                                <div
                                    key={team.id}
                                    onClick={() => setSelectedTeam(team)}
                                    style={{
                                        padding: '1rem',
                                        marginBottom: '0.5rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: selectedTeam?.id === team.id ? 'rgba(252, 163, 17, 0.2)' : 'rgba(255,255,255,0.03)',
                                        border: selectedTeam?.id === team.id ? '1px solid #fca311' : '1px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 'bold', color: selectedTeam?.id === team.id ? '#fca311' : '#eee' }}>{team.teamName}</div>
                                        {gradedTeams.has(team.id) && <CheckCircle size={14} color="#4caf50" />}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>{team.problemStatement ? 'Assigned' : 'Pending Topic'}</div>
                                </div>
                            ))}
                        </div>

                        {/* Grading Area */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '15px',
                            padding: '2rem',
                            minHeight: '600px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            position: 'relative'
                        }}>
                            {!selectedTeam ? (
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#666', gap: '1rem' }}>
                                    <Gavel size={64} style={{ opacity: 0.2 }} />
                                    <div>SELECT A TEAM TO BEGIN EVALUATION</div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                                        <h2 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '2rem' }}>{selectedTeam.teamName}</h2>

                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                            {selectedTeam.repoUrl && (
                                                <a href={selectedTeam.repoUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4cc9f0', textDecoration: 'none', background: 'rgba(76, 201, 240, 0.1)', padding: '0.5rem 1rem', borderRadius: '5px' }}>
                                                    <FileText size={16} /> Repository
                                                </a>
                                            )}
                                            {selectedTeam.demoUrl && (
                                                <a href={selectedTeam.demoUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca311', textDecoration: 'none', background: 'rgba(252, 163, 17, 0.1)', padding: '0.5rem 1rem', borderRadius: '5px' }}>
                                                    <Zap size={16} /> Live Demo
                                                </a>
                                            )}
                                        </div>

                                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
                                            <strong style={{ color: '#888', display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>PROBLEM STATEMENT</strong>
                                            <div style={{ fontFamily: 'monospace', color: '#fca311', marginBottom: '1rem' }}>
                                                {selectedTeam.problemStatement || "No problem statement assigned yet."}
                                            </div>
                                            <strong style={{ color: '#888', display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>PROJECT DESCRIPTION</strong>
                                            <div style={{ color: '#eee', lineHeight: '1.5' }}>
                                                {selectedTeam.projectDescription || "No description provided."}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                                        {criteria.map(c => (
                                            <div key={c.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '10px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{c.name}</span>
                                                    <span style={{ fontSize: '0.8rem', color: '#888', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Weight: {c.weight}x</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="10"
                                                        value={scores[c.id] || 0}
                                                        onChange={e => handleScoreChange(c.id, e.target.value)}
                                                        style={{ width: '100%', accentColor: '#fca311', height: '5px' }}
                                                    />
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: (scores[c.id] || 0) > 8 ? '#4caf50' : (scores[c.id] || 0) > 4 ? '#fca311' : '#e63946', width: '40px', textAlign: 'right' }}>
                                                        {scores[c.id] || 0}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: '2rem' }}>
                                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold', color: '#888' }}>JUDGE'S QUALITATIVE FEEDBACK</label>
                                        <textarea
                                            className="input-field"
                                            rows="4"
                                            placeholder="Provide detailed feedback for the team..."
                                            id="judgeFeedback"
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '5px',
                                                color: 'white',
                                                resize: 'none'
                                            }}
                                        ></textarea>
                                    </div>

                                    {/* Judge Power Actions */}
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <button
                                            onClick={async () => {
                                                const reason = prompt("Enter reason for FLAGGING this team (e.g. Plagiarism):");
                                                if (reason) {
                                                    try {
                                                        await axios.post(`${API_URL}/api/judge/flag`, { teamId: selectedTeam.id, reason, judgeId: judge.id });
                                                        alert("Team Flagged. Admin notified.");
                                                    } catch (e) { alert("Failed to flag team."); }
                                                }
                                            }}
                                            style={{ flex: 1, background: 'rgba(230, 57, 70, 0.2)', color: '#e63946', border: '1px solid #e63946', padding: '0.8rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(230, 57, 70, 0.4)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(230, 57, 70, 0.2)'}
                                        >
                                            <Flag size={18} /> REPORT VIOLATION
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm("NOMINATE this team for the Golden Buzzer? (Exceptional Performance)")) {
                                                    try {
                                                        await axios.post(`${API_URL}/api/judge/nominate`, { teamId: selectedTeam.id, judgeId: judge.id });
                                                        alert("Golden Buzzer Pressed! 🏆");
                                                    } catch (e) { alert("Failed to nominate."); }
                                                }
                                            }}
                                            style={{ flex: 1, background: 'rgba(252, 163, 17, 0.2)', color: '#fca311', border: '1px solid #fca311', padding: '0.8rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(252, 163, 17, 0.4)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(252, 163, 17, 0.2)'}
                                        >
                                            <Award size={18} /> GOLDEN BUZZER
                                        </button>
                                    </div>

                                    <button
                                        onClick={submitScore}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            background: 'linear-gradient(45deg, #fca311, #ff6b6b)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            marginTop: '1rem',
                                            fontWeight: 'bold',
                                            fontSize: '1.2rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            boxShadow: '0 4px 15px rgba(252, 163, 17, 0.3)'
                                        }}
                                    >
                                        <CheckCircle /> SUBMIT FINAL EVALUATION
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '15px',
                        padding: '2rem'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}> <FileText /> JUDGE RESOURCES</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {resources.map(r => (
                                <div key={r.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h3 style={{ marginTop: 0 }}>{r.title}</h3>
                                    <div style={{ color: '#888', marginBottom: '1rem', fontSize: '0.9rem' }}>{r.category}</div>
                                    <a href={`${API_URL}/uploads/${r.filename}`} target="_blank" rel="noreferrer" style={{
                                        display: 'block', textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '0.5rem', color: '#fca311', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold'
                                    }}>
                                        <Download size={14} style={{ marginRight: '5px' }} /> DOWNLOAD
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '15px',
                        padding: '2rem',
                        height: 'calc(100vh - 150px)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}> <MessageCircle /> ADMIN SUPPORT UPLINK</h2>

                        <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {chatMessages.length === 0 && <p style={{ textAlign: 'center', color: '#666' }}>No messages exchanged.</p>}
                            {chatMessages.map(msg => (
                                <div key={msg.id} style={{
                                    marginBottom: '0.8rem',
                                    textAlign: msg.sender === 'JUDGE' ? 'right' : 'left'
                                }}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '0.8rem 1.2rem',
                                        borderRadius: '15px',
                                        background: msg.sender === 'JUDGE' ? '#fca311' : '#333',
                                        color: msg.sender === 'JUDGE' ? '#000' : '#fff',
                                        maxWidth: '70%',
                                        textAlign: 'left'
                                    }}>
                                        {msg.message}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.3rem' }}>
                                        {msg.sender === 'ADMIN' ? 'HQ' : 'YOU'} • {new Date(msg.createdAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Type a message to the organizers..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={sendChatMessage}
                                style={{
                                    background: '#fca311',
                                    color: 'black',
                                    border: 'none',
                                    padding: '0 2rem',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                SEND
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JudgeDashboard;

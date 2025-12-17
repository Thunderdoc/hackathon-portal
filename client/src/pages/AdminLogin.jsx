import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Cpu } from 'lucide-react';
import API_URL from '../config';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/login`, { username, password });
            if (res.data.message === 'Login successful') {
                localStorage.setItem('adminToken', 'true');
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError('ACCESS DENIED: Invalid Credentials');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: `url('/iron_man_bg.png') no-repeat center center/cover`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0, 0, 0, 0.6)', // Dark overlay
                zIndex: 1
            }}></div>

            <div className="glass-panel" style={{
                width: '420px',
                padding: '3rem',
                background: 'rgba(20, 30, 48, 0.7)', // Darker glass
                backdropFilter: 'blur(10px)',
                borderRadius: '15px',
                border: '1px solid rgba(0, 255, 255, 0.3)', // Cyan border
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.2), inset 0 0 20px rgba(0, 255, 255, 0.1)',
                zIndex: 10,
                color: '#fff',
                position: 'relative'
            }}>
                {/* HUD Corners */}
                <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '2px solid #00ffff', borderLeft: '2px solid #00ffff' }}></div>
                <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '2px solid #00ffff', borderRight: '2px solid #00ffff' }}></div>
                <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '2px solid #00ffff', borderLeft: '2px solid #00ffff' }}></div>
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '2px solid #00ffff', borderRight: '2px solid #00ffff' }}></div>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        margin: '0 auto 1rem',
                        borderRadius: '50%',
                        border: '2px solid #00ffff',
                        boxShadow: '0 0 15px #00ffff',
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                    }}>
                        <img src="/jarvis_logo.png" alt="Jarvis" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ color: '#00ffff', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '2px', fontFamily: 'monospace', textShadow: '0 0 10px #00ffff' }}>STARK ADMIN</h2>
                    <p style={{ color: '#a8dadc', fontSize: '0.8rem', letterSpacing: '1px' }}>BIOMETRIC AUTHENTICATION REQUIRED</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(230, 57, 70, 0.2)',
                        color: '#ff6b6b',
                        padding: '1rem',
                        borderRadius: '4px',
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        border: '1px solid #e63946',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        textShadow: '0 0 5px #e63946'
                    }}>
                        <Lock size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <User size={20} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#00ffff' }} />
                        <input
                            type="text"
                            placeholder="AGENT ID"
                            className="input-field"
                            style={{
                                paddingLeft: '3rem',
                                background: 'rgba(0, 0, 0, 0.5)',
                                border: '1px solid #00ffff',
                                color: '#fff',
                                fontFamily: 'monospace'
                            }}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div style={{ marginBottom: '2rem', position: 'relative' }}>
                        <Cpu size={20} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#00ffff' }} />
                        <input
                            type="password"
                            placeholder="ACCESS CODE"
                            className="input-field"
                            style={{
                                paddingLeft: '3rem',
                                background: 'rgba(0, 0, 0, 0.5)',
                                border: '1px solid #00ffff',
                                color: '#fff',
                                fontFamily: 'monospace'
                            }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="primary-btn" style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1rem',
                        background: 'linear-gradient(45deg, #e63946, #d62828)',
                        border: 'none',
                        boxShadow: '0 0 15px rgba(230, 57, 70, 0.5)',
                        color: '#fff',
                        letterSpacing: '2px'
                    }}>
                        INITIATE LOGIN
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;

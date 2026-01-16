import API_URL from '../config';
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, Lock, Mail, ArrowRight, Activity } from 'lucide-react';

const TeamLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
            localStorage.setItem('teamUser', JSON.stringify(res.data.user));
            navigate('/team/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email first to reset password.');
            return;
        }
        try {
            await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
            setError('Password reset link sent to your email.');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send reset link');
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
                background: 'rgba(10, 25, 47, 0.85)', // Deep blue overlay
                zIndex: 1
            }}></div>

            <div className="glass-panel" style={{
                width: '450px',
                padding: '3rem',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(15px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 215, 0, 0.3)', // Gold border
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                zIndex: 10,
                color: '#fff',
                position: 'relative'
            }}>
                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                    <Activity color="#ffd700" size={24} />
                </div>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)', // Gold gradient
                        borderRadius: '15px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 auto 1rem',
                        transform: 'rotate(45deg)',
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)'
                    }}>
                        <Users size={36} color="#000" style={{ transform: 'rotate(-45deg)' }} />
                    </div>
                    <h2 style={{ color: '#ffd700', fontSize: '2rem', fontWeight: '800', marginTop: '1.5rem', letterSpacing: '1px', textShadow: '0 0 10px rgba(255, 215, 0, 0.3)' }}>SQUAD ACCESS</h2>
                    <p style={{ color: '#a8dadc' }}>Enter credentials to access mission data</p>
                </div>

                {error && (
                    <div style={{
                        background: error.includes('sent') ? 'rgba(42, 157, 143, 0.2)' : 'rgba(230, 57, 70, 0.2)',
                        color: error.includes('sent') ? '#2a9d8f' : '#e63946',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        border: error.includes('sent') ? '1px solid #2a9d8f' : '1px solid #e63946'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#ffd700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Identity</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#ffd700' }} />
                            <input
                                type="email"
                                className="input-field"
                                style={{
                                    paddingLeft: '3rem',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid #ffd700',
                                    color: '#fff'
                                }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="team.lead@example.com"
                                required
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#ffd700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Security Code</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#ffd700' }} />
                            <input
                                type="password"
                                className="input-field"
                                style={{
                                    paddingLeft: '3rem',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid #ffd700',
                                    color: '#fff'
                                }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="primary-btn" style={{
                        width: '100%',
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#ffd700',
                        color: '#000',
                        fontWeight: 'bold'
                    }} disabled={isLoading}>
                        {isLoading ? 'AUTHENTICATING...' : <>ACCESS DASHBOARD <ArrowRight size={18} /></>}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                    <button
                        onClick={handleForgotPassword}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#a8dadc',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            textDecoration: 'underline'
                        }}>
                        Reset Security Code
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeamLogin;

import React, { useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';

const SetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        try {
            await axios.post('http://localhost:5001/api/auth/set-password', { token, password });
            setMessage('Password set successfully! Redirecting to login...');
            setTimeout(() => navigate('/team/login'), 2000);
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to set password');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8f9fa' }}>
            <div className="glass-panel" style={{ padding: '2rem', width: '400px', background: 'white', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#1d3557' }}>Set Password</h2>
                {message && <div style={{ marginBottom: '1rem', color: message.includes('success') ? 'green' : 'red', textAlign: 'center' }}>{message}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                        <input
                            type="password"
                            className="input-field"
                            style={{ width: '100%', padding: '0.5rem' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
                        <input
                            type="password"
                            className="input-field"
                            style={{ width: '100%', padding: '0.5rem' }}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="primary-btn" style={{ width: '100%', padding: '0.75rem', background: '#1d3557', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Set Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetPassword;

import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { CheckCircle, Plus, Trash2, Users, Crown, Upload, Camera } from 'lucide-react';
import HolographicCard from '../components/HolographicCard';

const Registration = () => {
    const [teamName, setTeamName] = useState('');
    const [members, setMembers] = useState([
        { fullName: '', email: '', phone: '', photo: null, photoPreview: null, resume: null },
        { fullName: '', email: '', phone: '', photo: null, photoPreview: null, resume: null }
    ]);
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [txId, setTxId] = useState(null);
    const [teamCode, setTeamCode] = useState(null);

    const handleMemberChange = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        setMembers(newMembers);
    };

    const handlePhotoUpload = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const newMembers = [...members];
            newMembers[index].photo = file;
            newMembers[index].photoPreview = URL.createObjectURL(file);
            setMembers(newMembers);
        }
    };

    const handleResumeUpload = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const newMembers = [...members];
            newMembers[index].resume = file;
            setMembers(newMembers);
        }
    };

    const addMember = () => {
        if (members.length < 5) {
            setMembers([...members, { fullName: '', email: '', phone: '', photo: null, photoPreview: null, resume: null }]);
        }
    };

    const removeMember = (index) => {
        if (members.length > 2) {
            const newMembers = members.filter((_, i) => i !== index);
            setMembers(newMembers);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setStatus('loading');

        const formData = new FormData();
        formData.append('teamName', teamName);

        // Strip files before JSON
        const membersData = members.map(m => ({
            fullName: m.fullName,
            email: m.email,
            phone: m.phone
        }));
        formData.append('members', JSON.stringify(membersData));

        members.forEach((member, index) => {
            if (member.photo) formData.append(`member-${index}-photo`, member.photo);
            if (member.resume) formData.append(`member-${index}-resume`, member.resume);
        });

        try {
            const res = await axios.post('http://localhost:5001/api/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setTxId(res.data.transactionId);
            setTeamCode(res.data.teamCode);
            setStatus('success');
        } catch (error) {
            console.error(error);
            if (error.code === 'ERR_NETWORK' || !error.response) {
                setErrorMsg('Unable to connect to the server. Is the backend running?');
            } else {
                setErrorMsg(error.response?.data?.error || 'Registration failed. Please try again.');
            }
            setStatus('error');
        }
    };

    const [isMuted, setIsMuted] = useState(true);

    if (status === 'success') {
        return (
            <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-panel"
                    style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', borderTop: '5px solid var(--success)', background: 'rgba(255,255,255,0.9)' }}
                >
                    <CheckCircle size={80} color="var(--success)" style={{ marginBottom: '1.5rem', margin: '0 auto' }} />
                    <h1 style={{ marginBottom: '1rem', color: 'var(--success)' }}>REGISTRATION COMPLETE</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Team <b>{teamName}</b> has been registered successfully.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ flex: 1, background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TEAM CODE</p>
                            <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#e63946', fontFamily: 'monospace' }}>{teamCode}</p>
                        </div>
                        <div style={{ flex: 1, background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TXN ID</p>
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--secondary-color)', fontFamily: 'monospace' }}>{txId && txId.split('-')[1]}</p>
                        </div>
                    </div>

                    <button className="primary-btn" onClick={() => window.location.reload()}>Register Another Team</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', fontFamily: "'Open Sans', sans-serif", color: 'white' }}>
            {/* Video Background */}
            <div style={{
                position: 'fixed',
                top: 0, left: 0, width: '100%', height: '100%',
                zIndex: -1,
                background: '#000'
            }}>
                <video
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    poster="/iron_man_bg.png"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'translate(-50%, -50%)',
                        opacity: 0.6
                    }}
                >
                    <source src="/assets/video/videoplayback.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* Sound Toggle */}
            <button
                onClick={() => setIsMuted(!isMuted)}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    zIndex: 100
                }}
            >
                {/* Icons will be imported */}
                {isMuted ? "🔇" : "🔊"}
            </button>

            <div className="container" style={{ padding: '2rem 1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{ textAlign: 'center', marginBottom: '3rem' }}
                >
                    {/* Login Links Overlay */}
                    <div style={{ position: 'absolute', top: '1rem', right: '2rem', display: 'flex', gap: '1rem', zIndex: 100 }}>
                        <a href="/team/login" style={{ background: 'rgba(0,0,0,0.5)', color: '#4cc9f0', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #4cc9f0', padding: '0.5rem 1rem', borderRadius: '5px', backdropFilter: 'blur(5px)' }}>TEAM LOGIN</a>
                        <a href="/judge/login" style={{ background: 'rgba(0,0,0,0.5)', color: '#ffd700', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #ffd700', padding: '0.5rem 1rem', borderRadius: '5px', backdropFilter: 'blur(5px)' }}>JUDGE PORTAL</a>
                        <a href="/admin" style={{ background: 'rgba(0,0,0,0.5)', color: '#e63946', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #e63946', padding: '0.5rem 1rem', borderRadius: '5px', backdropFilter: 'blur(5px)' }}>ADMIN ACCESS</a>
                    </div>

                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '0.5rem', color: 'white', textShadow: '0 0 20px rgba(76, 201, 240, 0.5)' }}>HACKATHON 2025</h1>
                    <p style={{ color: '#a8dadc', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '600' }}>National Level Coding Championship</p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem', alignItems: 'start' }}>
                    {/* Left Column: Form */}
                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px' }}>
                            <form onSubmit={handleSubmit}>
                                {/* Team Details */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ marginBottom: '1rem', color: '#4cc9f0' }}>Team Identity</h3>
                                    <input
                                        type="text"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        className="input-field"
                                        placeholder="ENTER TEAM NAME"
                                        required
                                        style={{ fontSize: '1.2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                                    />
                                </div>

                                {/* Progress Indicator */}
                                <div style={{ display: 'flex', gap: '5px', marginBottom: '1.5rem' }}>
                                    {[1, 2, 3, 4, 5].map((step) => (
                                        <div key={step} style={{
                                            flex: 1,
                                            height: '4px',
                                            background: step <= members.length ? '#4cc9f0' : 'rgba(255,255,255,0.1)',
                                            borderRadius: '2px',
                                            transition: 'all 0.3s'
                                        }} />
                                    ))}
                                </div>

                                {/* Members List */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4cc9f0' }}>
                                        <Users size={20} /> Team Members ({members.length}/5)
                                    </h3>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <AnimatePresence>
                                        {members.map((member, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                    <span style={{ color: index === 0 ? '#ffd700' : '#a8dadc', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {index === 0 && <Crown size={16} />}
                                                        {index === 0 ? 'TEAM LEADER' : `MEMBER #${index + 1}`}
                                                    </span>
                                                    {members.length > 2 && (
                                                        <button type="button" onClick={() => removeMember(index)} style={{ color: '#e63946', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: '1rem' }}>
                                                    {/* Photo & Resume Upload Combined Block */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100px' }}>
                                                        {/* Photo */}
                                                        <div className="upload-box" style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', position: 'relative', border: '2px solid rgba(255,255,255,0.2)' }}>
                                                            {member.photoPreview ? (
                                                                <img src={member.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)' }}>
                                                                    <Camera size={24} />
                                                                </div>
                                                            )}
                                                            <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(index, e)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                                                        </div>

                                                        {/* Resume Button */}
                                                        <div style={{ position: 'relative', overflow: 'hidden' }}>
                                                            <button type="button" style={{
                                                                width: '100%', background: member.resume ? 'rgba(76, 201, 240, 0.2)' : 'rgba(255,255,255,0.1)',
                                                                color: member.resume ? '#4cc9f0' : 'white',
                                                                border: member.resume ? '1px solid #4cc9f0' : '1px dashed rgba(255,255,255,0.3)',
                                                                padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                                                            }}>
                                                                <Upload size={12} /> {member.resume ? 'UPDATED' : 'RESUME'}
                                                            </button>
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.doc,.docx"
                                                                onChange={(e) => handleResumeUpload(index, e)}
                                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Inputs */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                        <input
                                                            placeholder="Full Name"
                                                            className="input-field"
                                                            value={member.fullName}
                                                            onChange={(e) => handleMemberChange(index, 'fullName', e.target.value)}
                                                            required
                                                            style={{ gridColumn: 'span 2', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                                                        />
                                                        <input
                                                            placeholder="Email Address"
                                                            type="email"
                                                            className="input-field"
                                                            value={member.email}
                                                            onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                                                            required
                                                            style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                                                        />
                                                        <input
                                                            placeholder="Phone Number"
                                                            className="input-field"
                                                            value={member.phone}
                                                            onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                                                            required
                                                            style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                    {members.length < 5 && (
                                        <button type="button" onClick={addMember} style={{ background: 'rgba(76, 201, 240, 0.1)', color: '#4cc9f0', padding: '0.8rem 1.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px dashed #4cc9f0', fontWeight: '600', cursor: 'pointer' }}>
                                            <Plus size={18} /> Add Member
                                        </button>
                                    )}
                                </div>

                                {/* Submit */}
                                <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                                        <span style={{ color: '#a8dadc' }}>Total Fee (₹500 x {members.length})</span>
                                        <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4cc9f0' }}>₹{members.length * 500}</span>
                                    </div>

                                    <button type="submit" className="primary-btn" disabled={status === 'loading'} style={{ width: '100%', fontSize: '1.2rem', padding: '1.2rem', background: '#4cc9f0', color: '#000', border: 'none', fontWeight: 'bold' }}>
                                        {status === 'loading' ? 'PROCESSING...' : 'COMPLETE REGISTRATION'}
                                    </button>
                                </div>

                                {status === 'error' && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(230, 57, 70, 0.2)', border: '1px solid #e63946', borderRadius: '4px', color: '#ffadad' }}>
                                        {errorMsg}
                                    </div>
                                )}
                            </form>
                        </div>
                    </motion.div>

                    {/* Right Column: Holographic Preview */}
                    <div style={{ position: 'sticky', top: '2rem' }}>
                        <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} perspective={1000}>
                            <HolographicCard
                                teamName={teamName}
                                memberName={members[0].fullName}
                                role="TEAM LEADER"
                                photoUrl={members[0].photoPreview}
                                idNumber="PREVIEW"
                            />
                        </Tilt>
                        <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <p>LIVE ID CARD PREVIEW</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Registration;

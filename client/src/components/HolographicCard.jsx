import React from 'react';
import QRCode from 'react-qr-code';

const HolographicCard = ({ teamName, memberName, role, photoUrl, idNumber }) => {
    // Generate QR URL directly
    // idNumber format expected to be "ID-123" or just "123"
    // We will clean it in the URL construction if needed, but passing raw idNumber is safer if it's consistent.
    // Assuming idNumber passed from dashboard is "ID-123"

    // Use window.location.origin to point to the current frontend host
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const qrData = `${origin}/verify/${idNumber}`;

    return (
        <div id="id-card-print" style={{
            width: '350px',
            height: '550px',
            background: '#ffffff',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: '1px solid #e0e0e0',
            backgroundImage: 'radial-gradient(circle at 50% 0%, #f8f9fa 0%, #ffffff 100%)'
        }}>
            {/* Holographic Overlay Effect (Subtle) */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(125deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 40%, rgba(255,255,255,0) 60%)',
                opacity: 0.3,
                pointerEvents: 'none',
                zIndex: 10
            }}></div>

            {/* Premium Header */}
            <div style={{
                width: '100%',
                height: '140px',
                background: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)', // Rich gradient
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
                    opacity: 0.1
                }}></div>
                <div style={{ textAlign: 'center', zIndex: 2, color: '#fff', marginTop: '-20px' }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '26px',
                        fontWeight: '900',
                        letterSpacing: '2px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>HACKATHON</h2>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        opacity: 0.9,
                        letterSpacing: '4px',
                        fontWeight: '300'
                    }}>2025 ACCESS PASS</p>
                </div>
            </div>

            {/* Imposing Photo Section */}
            <div style={{
                marginTop: '-60px',
                position: 'relative',
                zIndex: 5
            }}>
                <div style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '25px', // Squircle for modern look
                    background: '#fff',
                    padding: '5px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                    transform: 'rotate(-2deg)' // Slight tilt for dynamism
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        background: '#f0f2f5',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '1px solid #ddd'
                    }}>
                        {photoUrl ? (
                            <img
                                src={photoUrl}
                                alt="Member"
                                crossOrigin="anonymous"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <span style={{ fontSize: '4rem', color: '#ccc' }}>?</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Member Details */}
            <div style={{ textAlign: 'center', marginTop: '20px', padding: '0 20px', width: '100%' }}>
                <h1 style={{
                    margin: '0',
                    fontSize: '28px',
                    fontWeight: '800',
                    color: '#111',
                    letterSpacing: '-0.5px'
                }}>
                    {memberName || 'MEMBER NAME'}
                </h1>

                <div style={{
                    display: 'inline-block',
                    background: 'linear-gradient(90deg, #e63946 0%, #d62828 100%)',
                    color: '#fff',
                    padding: '4px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginTop: '8px',
                    boxShadow: '0 2px 8px rgba(230, 57, 70, 0.3)'
                }}>
                    {role || 'PARTICIPANT'}
                </div>

                <div style={{ marginTop: '20px', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>REPRESENTING</p>
                    <h3 style={{
                        margin: '5px 0 0 0',
                        fontSize: '20px',
                        color: '#1d3557',
                        fontWeight: '700',
                        borderBottom: '2px solid #eee',
                        paddingBottom: '10px',
                        display: 'inline-block'
                    }}>
                        {teamName || 'TEAM NAME'}
                    </h3>
                </div>
            </div>

            {/* Footer / QR Code */}
            <div style={{
                marginTop: 'auto',
                marginBottom: '20px',
                textAlign: 'center',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
            }}>
                <div style={{
                    background: '#fff',
                    padding: '10px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #eee'
                }}>
                    <QRCode
                        value={qrData}
                        size={80}
                        viewBox={`0 0 256 256`}
                        fgColor="#1d3557"
                        bgColor="#ffffff"
                        level="M"
                    />
                </div>
                <div style={{ fontSize: '10px', color: '#adb5bd', fontFamily: 'monospace', letterSpacing: '2px' }}>
                    {idNumber || '0000-0000'}
                </div>
            </div>

            {/* Bottom Accent */}
            <div style={{
                width: '100%',
                height: '8px',
                background: 'linear-gradient(90deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)'
            }}></div>
        </div>
    );
};

export default HolographicCard;

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#1a1a1a',
            color: '#fff',
            fontFamily: 'sans-serif',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <AlertTriangle size={64} color="#e63946" style={{ marginBottom: '1rem' }} />
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Mission Critical Error</h1>
            <p style={{ color: '#aaa', maxWidth: '600px', marginBottom: '2rem' }}>
                Something went wrong in the application visuals.
                <br />
                <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', background: '#333', padding: '0.2rem' }}>{error.message}</span>
            </p>
            <button
                onClick={resetErrorBoundary}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem 2rem',
                    background: '#e63946',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            >
                <RefreshCw size={20} /> Reboot System
            </button>
        </div>
    );
};

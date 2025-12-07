import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Registration from './pages/Registration';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import SetPassword from './pages/SetPassword';
import TeamLogin from './pages/TeamLogin';
import TeamDashboard from './pages/TeamDashboard';
import VerifyPass from './pages/VerifyPass';

import JudgeLogin from './pages/JudgeLogin';
import JudgeDashboard from './pages/JudgeDashboard';

import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './components/ErrorFallback';

function App() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Router>
                <div className="app-container">
                    <Routes>
                        <Route path="/" element={<Registration />} />
                        <Route path="/admin" element={<AdminLogin />} />
                        <Route path="/admin/dashboard" element={<Dashboard />} />
                        <Route path="/set-password" element={<SetPassword />} />
                        <Route path="/team/login" element={<TeamLogin />} />
                        <Route path="/team/dashboard" element={<TeamDashboard />} />
                        <Route path="/verify/:id" element={<VerifyPass />} />

                        {/* Judge Routes */}
                        <Route path="/judge/login" element={<JudgeLogin />} />
                        <Route path="/judge/dashboard" element={<JudgeDashboard />} />
                    </Routes>
                </div>
            </Router>
        </ErrorBoundary>
    );
}

export default App;

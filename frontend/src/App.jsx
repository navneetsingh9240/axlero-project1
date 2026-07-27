import React, { useState } from 'react';
import Login from './Login.jsx';
import Register from './Register.jsx';
import Workspace from './Workspace.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [activeDocumentId, setActiveDocumentId] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveDocumentId(null);
    localStorage.removeItem('token');
  };

  const handleJoinRoom = (e) => {
      e.preventDefault();
      if (joinRoomId.trim()) {
          setActiveDocumentId(joinRoomId.trim());
      }
  };

  const handleCreateRoom = () => {
      const newRoomId = Math.random().toString(36).substring(2, 11);
      setActiveDocumentId(newRoomId);
  };

  if (user) {
    if (activeDocumentId) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
                <header style={{ padding: '12px 24px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="brand-title" style={{ margin: 0, fontSize: '24px' }}>SyncSpace</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '16px', background: '#f1f5f9', padding: '8px 16px', borderRadius: '20px' }}>
                        <span>👋 {user.username}</span>
                        <div style={{ width: '4px', height: '4px', background: '#cbd5e1', borderRadius: '50%' }}></div>
                        <span>Room: <strong style={{ color: '#8b5cf6', fontFamily: 'monospace', fontSize: '15px' }}>{activeDocumentId}</strong></span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={() => setActiveDocumentId(null)} 
                            className="btn-secondary"
                            style={{ marginTop: 0, textDecoration: 'none', padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}
                        >
                            Leave Room
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="btn-primary btn-danger"
                            style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '8px' }}
                        >
                            Logout
                        </button>
                    </div>
                </header>
                <Workspace user={user} documentId={activeDocumentId} />
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="card dashboard-card">
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '24px' }}>
                    <h1 className="brand-title" style={{ margin: 0 }}>SyncSpace</h1>
                    <button 
                        onClick={handleLogout}
                        className="btn-secondary"
                        style={{ marginTop: 0, background: '#f1f5f9', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}
                    >
                        Sign out
                    </button>
                </header>
                
                <div style={{ background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', padding: '24px', borderRadius: '16px', borderLeft: '4px solid #3b82f6', marginBottom: '40px' }}>
                    <h3 style={{ color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🎯</span> Mission Control
                    </h3>
                    <p style={{ color: '#475569', fontSize: '14.5px', lineHeight: '1.6' }}>
                        <strong>Use Case:</strong> A distributed engineering team uses SyncSpace for technical interviews. Candidate A draws an architecture diagram on the left side of the screen using the React canvas, while Interviewer B simultaneously writes Node.js code on the right side. The system uses WebSockets to broadcast changes instantly, and Conflict-free Replicated Data Types (CRDTs) to ensure that if both users edit the same line of code at the exact same millisecond, the final state merges perfectly without breaking the document.
                    </p>
                </div>

                <div>
                    <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Welcome back, <span style={{ color: '#3b82f6' }}>{user.username}</span>!</h2>
                    <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '16px' }}>What would you like to do today?</p>
                    
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        {/* Create Room Section */}
                        <div className="glass-panel" style={{ flex: 1, minWidth: '300px' }}>
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🚀</div>
                            <h3 style={{ marginBottom: '12px', color: '#0f172a', fontSize: '20px' }}>New Session</h3>
                            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', minHeight: '40px', lineHeight: '1.5' }}>
                                Start a fresh collaborative workspace. You'll receive a unique secure Room ID to share with your team.
                            </p>
                            <button onClick={handleCreateRoom} className="btn-primary btn-success">
                                <span>➕</span> Create Workspace
                            </button>
                        </div>

                        {/* Join Room Section */}
                        <div className="glass-panel" style={{ flex: 1, minWidth: '300px' }}>
                            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🤝</div>
                            <h3 style={{ marginBottom: '12px', color: '#0f172a', fontSize: '20px' }}>Join Team</h3>
                            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', minHeight: '40px', lineHeight: '1.5' }}>
                                Have an invite code? Enter the Room ID below to instantly join an active session.
                            </p>
                            <form onSubmit={handleJoinRoom}>
                                <input 
                                    type="text" 
                                    className="input-field"
                                    placeholder="e.g., k39d1nf0s" 
                                    value={joinRoomId} 
                                    onChange={(e) => setJoinRoomId(e.target.value)} 
                                    required 
                                    style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
                                />
                                <button type="submit" className="btn-primary">
                                    <span>➡️</span> Enter Room
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="auth-container">
      {showRegister ? (
        <Register onRegister={handleLogin} onSwitchToLogin={() => setShowRegister(false)} />
      ) : (
        <Login onLogin={handleLogin} onSwitchToRegister={() => setShowRegister(true)} />
      )}
    </div>
  );
}

export default App;
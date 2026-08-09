import React, { useState, useEffect } from 'react';
import Login from './Login.jsx';
import Register from './Register.jsx';
import Workspace from './Workspace.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState(null);
  const [viewMode, setViewMode] = useState('split');
  const [activeUsers, setActiveUsers] = useState([]);
  
  // Role Selection State
  const [handle, setHandle] = useState('');
  const [roomId, setRoomId] = useState('');
  const [role, setRole] = useState('Candidate');
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentRooms, setRecentRooms] = useState([]);

  const handleLogin = (userData) => {
    setUser(userData);
    setHandle(userData.username); 
    if (userData.recentRooms) {
        setRecentRooms(userData.recentRooms);
    }
    setShowRoleSelection(true);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveDocumentId(null);
    setShowRoleSelection(false);
    setRecentRooms([]);
    localStorage.removeItem('token');
  };

  const handleGenerateId = () => {
      const newRoomId = 'interview-' + Math.random().toString(36).substring(2, 6);
      setRoomId(newRoomId);
  };

  const handleJoinSession = async (e) => {
    e.preventDefault();
    if (!handle.trim() || !roomId.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const backendUrl = 'https://axlero-backend-1.onrender.com';
      // Hit the new join endpoint to get a fresh token with role and handle
      const response = await fetch(`${backendUrl}/api/auth/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, role, roomId, userId: user?.id }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token); // Overwrite token with the session token
        setUser(data.user);
        setActiveDocumentId(roomId);
        if (data.user.recentRooms) {
            setRecentRooms(data.user.recentRooms);
        }
      } else {
        setError(data.error || 'Failed to join session');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Workspace View (Inside a Session)
  if (user && activeDocumentId) {
      return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a' }}>
              <header style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 24px', 
                  background: '#1e293b', 
                  borderBottom: '1px solid #334155' 
              }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <h2 style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 'bold',
                          background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                      }}>
                          <span>✨</span> SyncSpace
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                          <span>— Real-Time Collaboration</span>
                          <div style={{ padding: '4px 8px', background: '#064e3b', color: '#34d399', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '6px', height: '6px', background: '#34d399', borderRadius: '50%' }}></div>
                              Yjs CRDT Active
                          </div>
                      </div>
                  </div>

                  <div style={{ display: 'flex', background: '#1e293b', borderRadius: '8px', padding: '4px' }}>
                      <button 
                          onClick={() => setViewMode('canvas')}
                          style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px', border: 'none', background: viewMode === 'canvas' ? '#6366f1' : 'transparent', color: viewMode === 'canvas' ? 'white' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                          🎨 Canvas
                      </button>
                      <button 
                          onClick={() => setViewMode('split')}
                          style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px', border: 'none', background: viewMode === 'split' ? '#6366f1' : 'transparent', color: viewMode === 'split' ? 'white' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                          ◫ Split View
                      </button>
                      <button 
                          onClick={() => setViewMode('code')}
                          style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px', border: 'none', background: viewMode === 'code' ? '#6366f1' : 'transparent', color: viewMode === 'code' ? 'white' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                          {'</>'} Code Editor
                      </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>Room: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{activeDocumentId}</strong></span>
                      </div>
                      <button style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '20px', border: '1px solid #334155', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '16px' }}>+</span> Invite
                      </button>
                      
                      {/* Active User Avatars */}
                      <div style={{ display: 'flex', marginLeft: '8px' }}>
                          {activeUsers.map((u, i) => {
                              const colors = ['#d946ef', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
                              const bgColor = colors[i % colors.length];
                              const username = u?.username || 'U';
                              const initials = username.substring(0, 2).toUpperCase();
                              return (
                                  <div 
                                      key={u.id || i}
                                      title={`${u.username} (${u.role})`}
                                      style={{ 
                                          width: '32px', 
                                          height: '32px', 
                                          borderRadius: '50%', 
                                          background: bgColor, 
                                          color: 'white', 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center', 
                                          fontWeight: 'bold', 
                                          fontSize: '14px',
                                          marginLeft: i === 0 ? 0 : '-10px',
                                          border: '2px solid #0f172a',
                                          position: 'relative',
                                          zIndex: activeUsers.length - i
                                      }}
                                  >
                                      {initials}
                                  </div>
                              );
                          })}
                      </div>

                      <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px', marginLeft: '12px' }}>
                          🚪
                      </button>
                  </div>
              </header>
              <Workspace user={user} documentId={activeDocumentId} isSpectator={user.role === 'Spectator'} viewMode={viewMode} onActiveUsersChange={setActiveUsers} />
          </div>
      );
  }

  // 2. Role/Room Selection View (After Login)
  if (user && showRoleSelection) {
      return (
        <div className="auth-container dark-theme">
            <div className="card dark-card">
                <div className="logo-icon">✨</div>
                <h1 className="brand-title-dark" style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Welcome to SyncSpace</h1>
                <p className="brand-subtitle-dark">
                    Real-Time Collaborative Technical Interview Platform powered by Yjs CRDTs & WebSockets.
                </p>
                
                {error && <p className="error-text">{error}</p>}
                
                <form onSubmit={handleJoinSession} className="join-form">
                    <div className="input-group">
                        <label>YOUR NAME / HANDLE</label>
                        <input 
                            type="text" 
                            className="input-field-dark"
                            placeholder="e.g. Alex (Candidate)" 
                            value={handle} 
                            onChange={(e) => setHandle(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <label>INTERVIEW ROOM ID</label>
                            <button type="button" className="text-btn" onClick={handleGenerateId}>
                                + Generate Random ID
                            </button>
                        </div>
                        <input 
                            type="text" 
                            className="input-field-dark"
                            placeholder="e.g. interview-782a" 
                            value={roomId} 
                            onChange={(e) => setRoomId(e.target.value)} 
                            required 
                        />
                        {recentRooms.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#94a3b8', marginRight: '8px' }}>Recent Rooms:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                    {recentRooms.map((room, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setRoomId(room)}
                                            style={{
                                                background: '#1e293b',
                                                border: '1px solid #334155',
                                                color: '#cbd5e1',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#334155'}
                                            onMouseLeave={(e) => e.target.style.background = '#1e293b'}
                                        >
                                            {room}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="input-group" style={{ marginBottom: '30px' }}>
                        <label>SELECT SESSION ROLE</label>
                        <div className="role-selector">
                            <button 
                                type="button" 
                                className={`role-btn ${role === 'Candidate' ? 'active' : ''}`}
                                onClick={() => setRole('Candidate')}
                            >
                                <span className="role-icon">{'</>'}</span>
                                Candidate
                            </button>
                            <button 
                                type="button" 
                                className={`role-btn ${role === 'Interviewer' ? 'active' : ''}`}
                                onClick={() => setRole('Interviewer')}
                            >
                                <span className="role-icon">📚</span>
                                Interviewer
                            </button>
                            <button 
                                type="button" 
                                className={`role-btn ${role === 'Spectator' ? 'active' : ''}`}
                                onClick={() => setRole('Spectator')}
                            >
                                <span className="role-icon">👁️</span>
                                Spectator
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary-dark" disabled={isLoading}>
                        {isLoading ? 'Connecting...' : 'Enter SyncSpace Session ➔'}
                    </button>
                    <button type="button" onClick={handleLogout} className="btn-secondary" style={{ width: '100%', marginTop: '16px' }}>
                        Sign out
                    </button>
                </form>
            </div>
        </div>
      );
  }

  // 3. Initial Login/Register View
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

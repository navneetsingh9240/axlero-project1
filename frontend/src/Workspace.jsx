import React, { useEffect, useRef, useState } from 'react';
import Whiteboard from './Whiteboard.jsx';
import CodeEditor from './CodeEditor.jsx';
import * as Y from 'yjs';
import { io } from 'socket.io-client';

function Workspace({ user, documentId }) {
  const [ydoc, setYdoc] = useState(null);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  
  // Replay feature state
  const [snapshots, setSnapshots] = useState([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replayDoc, setReplayDoc] = useState(null);
  const ydocRef = useRef(null); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    const newYdoc = new Y.Doc();
    ydocRef.current = newYdoc;

    const newSocket = io('/', {
      query: { documentId },
      auth: { token }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setError(`Connection Error: ${err.message}`);
    });

    newSocket.on('disconnect', () => {
      setError("Disconnected from server.");
    });

    newSocket.on('sync-update', (update) => {
      Y.applyUpdate(newYdoc, new Uint8Array(update), newSocket);
    });

    newYdoc.on('update', (update, origin) => {
      if (origin !== newSocket) {
        newSocket.emit('sync-update', update);
      }
    });

    setYdoc(newYdoc);
    setSocket(newSocket);
    setError(null);

    const snapshotInterval = setInterval(() => {
      setSnapshots(prev => {
        const newState = Y.encodeStateAsUpdate(ydocRef.current);
        if (prev.length === 0 || prev[prev.length - 1].length !== newState.length) {
            return [...prev, newState];
        }
        return prev;
      });
    }, 2000);

    return () => {
      clearInterval(snapshotInterval);
      newSocket.disconnect();
      newYdoc.destroy();
    };
  }, [documentId]);

  useEffect(() => {
    if (isReplaying && snapshots.length > 0) {
      const stateToApply = snapshots[replayIndex];
      if (stateToApply) {
        const tempDoc = new Y.Doc();
        Y.applyUpdate(tempDoc, stateToApply);
        setReplayDoc(tempDoc);
      }
    } else {
      setReplayDoc(null);
    }
  }, [isReplaying, replayIndex, snapshots]);

  if (error) {
    return (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
            <div style={{ padding: '24px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>Network Error</h3>
                    <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
                </div>
            </div>
        </div>
    );
  }

  if (!ydoc || !socket) {
      return (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
             <div style={{ color: '#64748b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <span className="spinner" style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                 Connecting to secure workspace...
             </div>
             <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
      );
  }

  const docToRender = isReplaying && replayDoc ? replayDoc : ydoc;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      
      {/* Replay Controls - Modern Dark Glass Theme */}
      <div style={{ 
          padding: '12px 24px', 
          backgroundColor: isReplaying ? '#1e293b' : '#f1f5f9', 
          color: isReplaying ? 'white' : '#334155',
          borderBottom: '1px solid #e2e8f0', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '24px',
          transition: 'all 0.3s ease'
      }}>
        <label className="switch-label" style={{ color: isReplaying ? 'white' : '#475569' }}>
          <input 
            type="checkbox" 
            checked={isReplaying} 
            onChange={(e) => setIsReplaying(e.target.checked)} 
          />
          <span>⏱️ Time Travel / Replay Mode</span>
        </label>
        
        {isReplaying && (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
              <input 
                type="range" 
                min="0" 
                max={snapshots.length > 0 ? snapshots.length - 1 : 0} 
                value={replayIndex}
                onChange={(e) => setReplayIndex(Number(e.target.value))}
                style={{ flex: 1 }}
                disabled={snapshots.length === 0}
              />
              <span style={{ fontSize: '13px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', minWidth: '120px', textAlign: 'center' }}>
                  Snapshot: {replayIndex + 1} / {snapshots.length || 0}
              </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '2px solid #e2e8f0', position: 'relative' }}>
          <Whiteboard user={user} ydoc={docToRender} socket={socket} isReadOnly={isReplaying} />
        </div>
        <div style={{ flex: 1, position: 'relative', background: '#1e1e1e' }}>
          <CodeEditor user={user} ydoc={docToRender} socket={socket} isReadOnly={isReplaying} />
        </div>
      </div>
    </div>
  );
}

export default Workspace;
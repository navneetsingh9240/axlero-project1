import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';

function CodeEditor({ user, ydoc, socket, isReadOnly }) {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(true);
  const [output, setOutput] = useState('');
  const editorRef = useRef(null);
  const bindingRef = useRef(null);

  useEffect(() => {
    if (!isEditorReady || !editorRef.current || !ydoc) return;

    if (bindingRef.current) {
        bindingRef.current.destroy();
    }

    const ytext = ydoc.getText('monaco');

    const binding = new MonacoBinding(
      ytext,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
    );
    bindingRef.current = binding;

    editorRef.current.updateOptions({ readOnly: isReadOnly });

    return () => {
      binding.destroy();
      bindingRef.current = null;
    };
  }, [isEditorReady, ydoc, isReadOnly]);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    setIsEditorReady(true);
  }

  const handleRunCode = async () => {
    if (!editorRef.current) return;
    setIsRunning(true);
    setIsOutputExpanded(true);
    setOutput('Running code...\n');
    try {
        const code = editorRef.current.getValue();
        // Mock execution for now
        setTimeout(() => {
            setOutput(prev => prev + `[Execution Complete]\nNo output for ${language}`);
            setIsRunning(false);
        }, 1000);
    } catch (e) {
        setOutput(`Error: ${e.message}`);
        setIsRunning(false);
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Enhanced Editor Header */}
      <div style={{ 
          padding: '8px 16px', 
          backgroundColor: '#0f172a', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#38bdf8', fontSize: '14px' }}>{'</>'}</span>
                <span style={{ fontWeight: '600', color: '#94a3b8', fontSize: '13px' }}>Monaco Editor</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ 
                      padding: '4px 8px', 
                      background: 'transparent', 
                      color: 'white', 
                      border: 'none', 
                      outline: 'none',
                      fontSize: '12px',
                      cursor: 'pointer'
                  }}
                  disabled={isReadOnly}
                >
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="python">Python 3</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="typescript">TypeScript</option>
                </select>
            </div>
            <button style={{ padding: '4px 8px', background: 'transparent', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>📋</span> Boilerplate
            </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>
                📋
            </button>
            <button 
                onClick={handleRunCode}
                disabled={isRunning || isReadOnly}
                style={{ 
                    padding: '6px 16px', 
                    background: isRunning ? '#64748b' : '#10b981', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '20px', 
                    fontSize: '13px', 
                    fontWeight: '600',
                    cursor: (isRunning || isReadOnly) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            >
                {isRunning ? 'Running...' : '▶ Run Code'}
            </button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            lineHeight: 1.5,
            padding: { top: 16 }
          }}
        />
      </div>

      <div style={{ 
          height: isOutputExpanded ? '200px' : '40px', 
          backgroundColor: '#0a0a1a', 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'height 0.3s ease'
      }}>
        <div 
          onClick={() => setIsOutputExpanded(!isOutputExpanded)}
          style={{ 
              padding: '8px 16px', 
              backgroundColor: '#0f172a', 
              color: '#94a3b8', 
              fontSize: '12px', 
              fontWeight: '600', 
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: isOutputExpanded ? '1px solid rgba(255,255,255,0.05)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>&gt;_</span> Console Output
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                  <span>⏱</span> Performance Telemetry
              </span>
          </div>
          <span>{isOutputExpanded ? '▼' : '▲'}</span>
        </div>
        
        {isOutputExpanded && (
            <div style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace', overflowY: 'auto', flex: 1 }}>
              {output || <span style={{ color: '#475569' }}>Click "Run Code" above to execute code snippets live.</span>}
            </div>
        )}
      </div>
    </div>
  );
}

export default CodeEditor;

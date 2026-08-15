import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { WebrtcProvider } from 'y-webrtc';

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
      bindingRef.current.binding.destroy();
      bindingRef.current.provider.destroy();
    }

    const ytext = ydoc.getText('monaco');

    const provider = new WebrtcProvider(
      'syncspace-awareness-room',
      ydoc,
      { signaling: [] }
    );

    const binding = new MonacoBinding(
      ytext,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );

    bindingRef.current = { binding, provider };

    editorRef.current.updateOptions({
      readOnly: isReadOnly
    });

    return () => {
      binding.destroy();
      provider.destroy();
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

      // Deployed Render backend
      const backendUrl = 'https://axlero-backend-1.onrender.com';

      const response = await fetch(`${backendUrl}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          language
        })
      });

      const data = await response.json();

      if (data.error) {
        setOutput(`[Error Execution]
${data.output}`);
      } else {
        setOutput(`[Execution Output]
${data.output}`);
      }
    } catch (e) {
      setOutput(`Network Error: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >

      {/* Modern Pane Header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#1e1e1e',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '18px' }}>💻</span>

          <span
            style={{
              fontWeight: '500',
              color: '#d4d4d4',
              fontSize: '14px',
              letterSpacing: '0.5px'
            }}
          >
            index.js
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          {isReadOnly && (
            <span
              style={{
                color: '#f87171',
                fontWeight: '600',
                fontSize: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              READ ONLY
            </span>
          )}

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            style={{
              padding: '6px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ▶ {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }}>
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

      {/* Output Panel */}
      {isOutputExpanded && (
        <div
          style={{
            height: '250px',
            borderTop: '1px solid #333',
            backgroundColor: '#1e1e1e',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: '#252526',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span
              style={{
                color: '#d4d4d4',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              OUTPUT
            </span>

            <button
              onClick={() => setIsOutputExpanded(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✖
            </button>
          </div>

          <div
            style={{
              padding: '16px',
              flex: 1,
              overflowY: 'auto',
              color: output.includes('[Error Execution]')
                ? '#f87171'
                : '#a3be8c',
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontSize: '13px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {output || 'No output to display.'}
          </div>
        </div>
      )}
    </div>
  );
}

export default CodeEditor;

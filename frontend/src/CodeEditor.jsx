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

    const provider = new WebrtcProvider('syncspace-awareness-room', ydoc, { signaling: [] }); // Dummy provider just for awareness object
    const binding = new MonacoBinding(
      ytext,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );
    bindingRef.current = { binding, provider };


    editorRef.current.updateOptions({ readOnly: isReadOnly });

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
        const backendUrl = 'https://axlero-backend-1.onrender.com';
        
        const response = await fetch(`${backendUrl}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language })
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
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Modern Pane Header */}
      <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#1e1e1e', // Match VS Code Dark Theme
          borderBottom: '1px solid #333',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>💻</span>
            <span style={{ fontWeight: '500', color: '#d4d4d4', fontSize: '14px', letterSpacing: '0.5px' }}>index.js</span>
        </div>
        
        {isReadOnly && <span style={{ color: '#f87171', fontWeight: '600', fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>READ ONLY</span>}
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
    </div>
  );
}

export default CodeEditor;

import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';

function CodeEditor({ user, ydoc, socket, isReadOnly }) {
  const [isEditorReady, setIsEditorReady] = useState(false);
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
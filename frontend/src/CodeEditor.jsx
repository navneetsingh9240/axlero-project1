import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { WebrtcProvider } from 'y-webrtc'; // Using as a local awareness fallback if needed

function CodeEditor({ ydoc, user }) {
    const [editor, setEditor] = useState(null);

    function handleEditorDidMount(editor, monaco) {
        setEditor(editor);
    }

    useEffect(() => {
        if (!editor || !ydoc) return;

        const type = ydoc.getText('monaco');
        
        // Setup awareness for Monaco binding
        const provider = new WebrtcProvider('syncspace-awareness-room', ydoc, { signaling: [] }); // Dummy provider just for awareness object
        
        const binding = new MonacoBinding(type, editor.getModel(), new Set([editor]), provider.awareness);

        return () => {
            binding.destroy();
            provider.destroy();
        };
    }, [editor, ydoc]);

    const runCode = async () => {
        const code = editor.getValue();
        const backendUrl = 'http://localhost:3001';
        try {
            const response = await fetch(`${backendUrl}/api/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await response.json();
            alert(`Output:\n${data.output}`);
        } catch (error) {
            console.error("Error executing code:", error);
            alert("Error executing code.");
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', backgroundColor: '#2d2d2d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ color: 'white', fontWeight: 'bold' }}>Code Editor</span>
                <button onClick={runCode} style={{ padding: '4px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>Run</button>
            </div>
            <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                onMount={handleEditorDidMount}
            />
        </div>
    );
}

export default CodeEditor;

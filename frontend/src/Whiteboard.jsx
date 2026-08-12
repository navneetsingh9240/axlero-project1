import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Text } from 'react-konva';

function Whiteboard({ ydoc, socket, user }) {
    const [lines, setLines] = useState([]);
    const isDrawing = useRef(false);
    const [cursors, setCursors] = useState({});

    useEffect(() => {
        const yLines = ydoc.getArray('lines');
        setLines(yLines.toArray());

        yLines.observe(() => {
            setLines(yLines.toArray());
        });

        if (socket) {
            socket.on('cursor-move', (data) => {
                setCursors(prev => ({
                    ...prev,
                    [data.id]: { x: data.x, y: data.y, username: data.username }
                }));
            });

            socket.on('cursor-leave', (id) => {
                setCursors(prev => {
                    const newCursors = { ...prev };
                    delete newCursors[id];
                    return newCursors;
                });
            });
        }

        return () => {
            if (socket) {
                socket.off('cursor-move');
                socket.off('cursor-leave');
            }
        };
    }, [ydoc, socket]);

    const handleMouseDown = (e) => {
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        const newLine = { tool: 'pen', points: [pos.x, pos.y] };
        ydoc.getArray('lines').push([newLine]);
    };

    const handleMouseMove = (e) => {
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();

        if (socket && user) {
            socket.emit('cursor-move', { x: point.x, y: point.y, username: user.displayName || user.username });
        }

        if (!isDrawing.current) {
            return;
        }

        const yLines = ydoc.getArray('lines');
        const lastLine = yLines.get(yLines.length - 1);
        
        if(lastLine) {
            const newPoints = lastLine.points.concat([point.x, point.y]);
            const updatedLine = { ...lastLine, points: newPoints };
            yLines.delete(yLines.length - 1, 1);
            yLines.push([updatedLine]);
        }
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0' }}>
            <Stage
                width={window.innerWidth / 2}
                height={window.innerHeight - 60}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
            >
                <Layer>
                    {lines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke="#df4b26"
                            strokeWidth={5}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                        />
                    ))}
                    {Object.entries(cursors).map(([id, cursor]) => (
                         <React.Fragment key={id}>
                            <Line
                                points={[cursor.x, cursor.y, cursor.x + 10, cursor.y + 10]}
                                stroke="blue"
                                strokeWidth={2}
                            />
                            <Text x={cursor.x + 12} y={cursor.y} text={cursor.username} fill="blue" />
                        </React.Fragment>
                    ))}
                </Layer>
            </Stage>
        </div>
    );
}

export default Whiteboard;

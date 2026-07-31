import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Rect, Circle, RegularPolygon, Text } from 'react-konva';

function Whiteboard({ user, ydoc, socket, isReadOnly }) {
  const [shapes, setShapes] = useState([]);
  const [tool, setTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#df4b26');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [cursors, setCursors] = useState({});
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth / 2, height: window.innerHeight - 150 });
  const isDrawing = useRef(false);
  const currentShapeId = useRef(null);

  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current) {
            setStageSize({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    };
    
    // Initial size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    // Add an observer to catch flexbox layout shifts
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
    };
  }, []);
  const yShapesMapRef = useRef(null);

  useEffect(() => {
    if (!ydoc) return;
    const ymap = ydoc.getMap('shapesMap');
    yShapesMapRef.current = ymap;

    const updateShapes = () => {
      const currentShapes = Array.from(ymap.values());
      setShapes(currentShapes);
    };

    ymap.observe(updateShapes);
    updateShapes();
    
    // Remote cursors
    if (socket) {
      const handleMouseMove = (e) => {
         if (isReadOnly) return;
         socket.emit('cursor-move', { x: e.clientX, y: e.clientY, userId: user?.id, username: user?.username });
      };
      
      socket.on('cursor-update', (cursorData) => {
         setCursors(prev => ({ ...prev, [cursorData.userId]: cursorData }));
      });
      
      window.addEventListener('mousemove', handleMouseMove);
      return () => {
         ymap.unobserve(updateShapes);
         window.removeEventListener('mousemove', handleMouseMove);
         socket.off('cursor-update');
      };
    }

    return () => {
      ymap.unobserve(updateShapes);
    };
  }, [ydoc, socket, user, isReadOnly]);

  const handleMouseDown = (e) => {
    if (isReadOnly) return;
    
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    const id = Date.now().toString();
    currentShapeId.current = id;

    if (tool === 'text') {
        const textValue = prompt('Enter text:');
        if (textValue) {
            yShapesMapRef.current.set(id, {
                type: 'text',
                id,
                x: pos.x,
                y: pos.y,
                text: textValue,
                strokeColor,
                strokeWidth
            });
        }
        isDrawing.current = false;
        return;
    }

    const newShape = {
      type: (tool === 'pen' || tool === 'eraser') ? 'line' : tool,
      id,
      points: (tool === 'pen' || tool === 'eraser' || tool === 'straight_line') ? [pos.x, pos.y] : [],
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      radius: 0,
      tool,
      strokeColor,
      strokeWidth
    };
    
    yShapesMapRef.current.set(id, newShape);
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    if (socket && !isReadOnly) {
      // broadcast precise stage cursor coordinates
      socket.emit('cursor-move', { 
         x: point.x, 
         y: point.y, 
         userId: user?.id, 
         username: user?.username 
      });
    }

    if (!isDrawing.current || !currentShapeId.current || isReadOnly || tool === 'text') {
      return;
    }

    const currentShape = yShapesMapRef.current.get(currentShapeId.current);
    if (currentShape) {
        if (currentShape.type === 'line') {
            const newPoints = currentShape.points.concat([point.x, point.y]);
            yShapesMapRef.current.set(currentShapeId.current, { ...currentShape, points: newPoints });
        } else if (currentShape.type === 'straight_line') {
            const newPoints = [currentShape.points[0], currentShape.points[1], point.x, point.y];
            yShapesMapRef.current.set(currentShapeId.current, { ...currentShape, points: newPoints });
        } else if (currentShape.type === 'rect') {
            const newWidth = point.x - currentShape.x;
            const newHeight = point.y - currentShape.y;
            yShapesMapRef.current.set(currentShapeId.current, { ...currentShape, width: newWidth, height: newHeight });
        } else if (currentShape.type === 'square') {
            const dx = point.x - currentShape.x;
            const dy = point.y - currentShape.y;
            const size = Math.max(Math.abs(dx), Math.abs(dy));
            const width = dx < 0 ? -size : size;
            const height = dy < 0 ? -size : size;
            yShapesMapRef.current.set(currentShapeId.current, { ...currentShape, width: width, height: height }); 
        } else if (currentShape.type === 'circle' || currentShape.type === 'triangle' || currentShape.type === 'hexagon') {
            const dx = point.x - currentShape.x;
            const dy = point.y - currentShape.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            yShapesMapRef.current.set(currentShapeId.current, { ...currentShape, radius: radius });
        }
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    currentShapeId.current = null;
  };

  const getCursorStyle = () => {
    if (isReadOnly) return 'default';
    if (tool === 'eraser') {
      return 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="none" stroke="black" stroke-width="2"/></svg>\') 10 10, auto';
    }
    if (tool === 'text') {
        return 'text';
    }
    return 'crosshair';
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0a1a' }}>
      
      {/* Modern Pane Header */}
      <div style={{ 
          padding: '8px 16px', 
          backgroundColor: '#0a0a1a', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '10px' 
      }}>
        {!isReadOnly && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', background: 'transparent', padding: '4px', borderRadius: '4px' }}>
                <button onClick={() => setTool('rect')} style={{ background: tool === 'rect' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>⬜</button>
                <button onClick={() => setTool('circle')} style={{ background: tool === 'circle' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>⭕</button>
                <button onClick={() => setTool('straight_line')} style={{ background: tool === 'straight_line' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>→</button>
                <button style={{ background: 'transparent', border: 'none', color: '#0ea5e9', cursor: 'pointer', padding: '4px' }}>⚏</button>
                <button style={{ background: 'transparent', border: 'none', color: '#0ea5e9', cursor: 'pointer', padding: '4px' }}>☁</button>
                <button onClick={() => setTool('square')} style={{ background: tool === 'square' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: '#eab308', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>⎕</button>
                <button onClick={() => setTool('text')} style={{ background: tool === 'text' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>T</button>
                <button onClick={() => setTool('pen')} style={{ background: tool === 'pen' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>✎</button>
            </div>
            
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ffffff'].map(color => (
                    <button 
                        key={color}
                        onClick={() => setStrokeColor(color)}
                        style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            background: color, 
                            border: strokeColor === color ? '2px solid white' : 'none',
                            cursor: 'pointer'
                        }}
                    />
                ))}
            </div>

            <button style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>📋</span> Template
            </button>
            <button style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>↺</button>
            <button onClick={() => setTool('eraser')} style={{ background: tool === 'eraser' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', fontSize: '16px' }}>🗑</button>
          </div>
        )}
        {isReadOnly && <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '4px' }}>READ ONLY</span>}
      </div>

      <div ref={containerRef} style={{ 
          flex: 1, 
          backgroundColor: '#0a0a1a', 
          backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          cursor: getCursorStyle(), 
          overflow: 'hidden' 
      }}>
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer>
            {shapes.map((shape) => {
                if (!shape || !shape.type) return null; 

                const type = shape.type || 'line';

                if (type === 'line' || type === 'straight_line') {
                    return (
                        <Line
                            key={shape.id}
                            points={shape.points}
                            stroke={shape.strokeColor || '#df4b26'}
                            strokeWidth={shape.strokeWidth || 5}
                            tension={type === 'straight_line' ? 0 : 0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation={
                                shape.tool === 'eraser' ? 'destination-out' : 'source-over'
                            }
                        />
                    );
                } else if (type === 'rect' || type === 'square') {
                    return (
                        <Rect
                            key={shape.id}
                            x={shape.x}
                            y={shape.y}
                            width={shape.width}
                            height={shape.height}
                            stroke={shape.strokeColor || '#df4b26'}
                            strokeWidth={shape.strokeWidth || 5}
                            globalCompositeOperation="source-over"
                        />
                    );
                } else if (type === 'circle') {
                    return (
                        <Circle
                            key={shape.id}
                            x={shape.x}
                            y={shape.y}
                            radius={shape.radius}
                            stroke={shape.strokeColor || '#df4b26'}
                            strokeWidth={shape.strokeWidth || 5}
                            globalCompositeOperation="source-over"
                        />
                    );
                } else if (type === 'triangle') {
                    return (
                        <RegularPolygon
                            key={shape.id}
                            x={shape.x}
                            y={shape.y}
                            sides={3}
                            radius={shape.radius}
                            stroke={shape.strokeColor || '#df4b26'}
                            strokeWidth={shape.strokeWidth || 5}
                            globalCompositeOperation="source-over"
                        />
                    );
                } else if (type === 'hexagon') {
                    return (
                        <RegularPolygon
                            key={shape.id}
                            x={shape.x}
                            y={shape.y}
                            sides={6}
                            radius={shape.radius}
                            stroke={shape.strokeColor || '#df4b26'}
                            strokeWidth={shape.strokeWidth || 5}
                            globalCompositeOperation="source-over"
                        />
                    );
                } else if (type === 'text') {
                    return (
                        <Text
                            key={shape.id}
                            x={shape.x}
                            y={shape.y}
                            text={shape.text}
                            fill={shape.strokeColor || '#df4b26'}
                            fontSize={Math.max(16, (shape.strokeWidth || 5) * 3)}
                            globalCompositeOperation="source-over"
                        />
                    );
                }
                return null;
            })}
            
            {Object.values(cursors).map((cursor) => {
              if (cursor.userId === user?.id || isReadOnly) return null;
              
              return (
                <React.Fragment key={cursor.userId}>
                  <Text
                    x={cursor.x}
                    y={cursor.y}
                    text={`👆 ${cursor.username}`}
                    fontSize={12}
                    fill="blue"
                  />
                </React.Fragment>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default Whiteboard;

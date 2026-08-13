import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Text, Rect, Circle, RegularPolygon } from 'react-konva';

function Whiteboard({ user, ydoc, socket, isReadOnly }) {
  const [shapes, setShapes] = useState([]);
  const [cursors, setCursors] = useState({});
  const isDrawing = useRef(false);
  const currentShapeId = useRef(null);

  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
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

  // State for drawing tools
  const [tool, setTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#df4b26');
  const [strokeWidth, setStrokeWidth] = useState(5);

  useEffect(() => {
    if (!ydoc) return;

    const yShapesMap = ydoc.getMap('linesMap');
    yShapesMapRef.current = yShapesMap;

    const observeMap = () => {
      const shapesArray = Array.from(yShapesMap.values());
      setShapes(shapesArray);
    };

    yShapesMap.observe(observeMap);
    observeMap();

    const handleCursorMove = (cursorData) => {
      setCursors(prev => ({
        ...prev,
        [cursorData.userId]: cursorData
      }));
    };

    if (socket) {
        socket.on('cursor-move', handleCursorMove);
    }

    return () => {
      yShapesMap.unobserve(observeMap);
      if (socket) {
          socket.off('cursor-move', handleCursorMove);
      }
    };
  }, [ydoc, socket]);

  const handleMouseDown = (e) => {
    if (isReadOnly || !user) return;
    
    if (tool === 'text') {
        const textStr = window.prompt("Enter text:");
        if (textStr) {
            const pos = e.target.getStage().getPointerPosition();
            const shapeId = `${user.id}-${Date.now()}`;
            const newText = {
                id: shapeId,
                type: 'text',
                x: pos.x,
                y: pos.y,
                text: textStr,
                userId: user.id,
                strokeColor: strokeColor,
                strokeWidth: strokeWidth
            };
            yShapesMapRef.current.set(shapeId, newText);
        }
        return;
    }

    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    
    currentShapeId.current = `${user.id}-${Date.now()}`;
    
    let newShape = null;

    if (tool === 'pen' || tool === 'eraser') {
        newShape = { 
            id: currentShapeId.current, 
            type: 'line',
            tool: tool, 
            points: [pos.x, pos.y],
            userId: user.id,
            strokeColor: tool === 'eraser' ? '#ffffff' : strokeColor,
            strokeWidth: strokeWidth
        };
    } else if (tool === 'straight_line') {
        newShape = { 
            id: currentShapeId.current, 
            type: 'straight_line',
            points: [pos.x, pos.y, pos.x, pos.y], // start and end points
            userId: user.id,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth
        };
    } else if (tool === 'rect') {
        newShape = {
            id: currentShapeId.current,
            type: 'rect',
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            userId: user.id,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth
        };
    } else if (tool === 'square') {
        newShape = {
            id: currentShapeId.current,
            type: 'square',
            x: pos.x,
            y: pos.y,
            size: 0,
            userId: user.id,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth
        };
    } else if (tool === 'circle') {
        newShape = {
            id: currentShapeId.current,
            type: 'circle',
            x: pos.x,
            y: pos.y,
            radius: 0,
            userId: user.id,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth
        };
    } else if (tool === 'triangle') {
        newShape = {
            id: currentShapeId.current,
            type: 'triangle',
            x: pos.x,
            y: pos.y,
            radius: 0,
            userId: user.id,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth
        };
    } else if (tool === 'hexagon') {
        newShape = {
            id: currentShapeId.current,
            type: 'hexagon',
            x: pos.x,
            y: pos.y,
            radius: 0,
            userId: user.id,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth
        };
    }
    
    if (newShape) {
        yShapesMapRef.current.set(currentShapeId.current, newShape);
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    if (socket && user && !isReadOnly) {
      socket.emit('cursor-move', {
        userId: user.id,
        username: user.username,
        x: point.x,
        y: point.y
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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Modern Pane Header */}
      <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#f8fafc', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '10px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎨</span>
            <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Canvas</span>
        </div>

        {!isReadOnly && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', background: 'white', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <select className="tool-select" value={tool} onChange={(e) => setTool(e.target.value)} style={{ border: 'none', background: 'transparent' }}>
              <option value="pen">✏️ Pen</option>
              <option value="eraser">🧹 Eraser</option>
              <option value="straight_line">📏 Line</option>
              <option value="rect">🟦 Rectangle</option>
              <option value="square">🔲 Square</option>
              <option value="circle">⭕ Circle</option>
              <option value="triangle">🔺 Triangle</option>
              <option value="hexagon">⬡ Hexagon</option>
              <option value="text">📝 Text</option>
            </select>
            
            <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }}></div>
            
            {tool !== 'eraser' && (
              <input 
                type="color" 
                value={strokeColor} 
                onChange={(e) => setStrokeColor(e.target.value)} 
                title="Color"
                style={{ cursor: 'pointer', border: 'none', width: '24px', height: '24px', padding: 0, background: 'transparent' }}
              />
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Size</span>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={strokeWidth} 
                  onChange={(e) => setStrokeWidth(Number(e.target.value))} 
                  title="Stroke Width"
                />
            </div>
          </div>
        )}
        {isReadOnly && <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '12px', background: '#fef2f2', padding: '4px 8px', borderRadius: '4px' }}>READ ONLY</span>}
      </div>

      <div ref={containerRef} style={{ flex: 1, backgroundColor: 'white', cursor: getCursorStyle(), overflow: 'hidden' }}>
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

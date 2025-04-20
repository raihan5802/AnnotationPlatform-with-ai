// KeypointsCanvas.js
import React, { useEffect, useRef, useState } from 'react';
import {
    Stage,
    Layer,
    Group,
    Image as KonvaImage,
    Circle,
    Label,
    Tag,
    Text,
} from 'react-konva';
import './DetectionCanvas.css';

// Helper function to clamp a point inside the image boundaries.
function clampPointToRect(pt, w, h) {
    return {
        x: Math.max(0, Math.min(w, pt.x)),
        y: Math.max(0, Math.min(h, pt.y)),
    };
}

// Simplified clipping: only handles "point" and "points" annotations.
function clipAnnotationToBoundary(ann, w, h) {
    if (ann.type === 'points') {
        const newPts = ann.points.map((p) => clampPointToRect(p, w, h));
        return { ...ann, points: newPts };
    } else if (ann.type === 'point') {
        const clamped = clampPointToRect({ x: ann.x, y: ann.y }, w, h);
        return { ...ann, x: clamped.x, y: clamped.y };
    }
    return ann;
}

// Compute a simple bounding box for "point" and "points" annotations.
function shapeBoundingBox(ann) {
    if (ann.type === 'point') {
        return { x1: ann.x, y1: ann.y, x2: ann.x, y2: ann.y };
    } else if (ann.type === 'points') {
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        ann.points.forEach((pt) => {
            if (pt.x < minX) minX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y > maxY) maxY = pt.y;
        });
        return { x1: minX, y1: minY, x2: maxX, y2: maxY };
    }
    return null;
}

// Get the pointer position relative to the annotation group.
function getGroupPos(evt, stageRef) {
    const group = stageRef.current?.findOne('#anno-group');
    return group ? group.getRelativePointerPosition() : null;
}

export default function KeypointsCanvas({
    fileUrl,
    annotations,
    onAnnotationsChange,
    selectedTool,
    scale,
    onWheelZoom,
    activeLabelColor,
    labelClasses,
    onFinishShape,
    onDeleteAnnotation,
    activeLabel,
    pointsLimit, // new prop for point-based tools
    initialPosition, // new prop for initial positioning
    externalSelectedIndex,  // New name for external selected index
    onSelectAnnotation,     // New name for selection callback
    showPointLabels, // New prop
    pointLabels, // New prop
}) {
    const stageRef = useRef(null);
    const containerRef = useRef(null);

    const [dims, setDims] = useState({ width: 0, height: 0 });
    const [konvaImg, setKonvaImg] = useState(null);
    const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);

    // Master group offset (image panning)
    const [imagePos, setImagePos] = useState(initialPosition || { x: 0, y: 0 });

    // In-progress points drawing
    const [tempPointPoints, setTempPointPoints] = useState([]);
    const [drawingPoint, setDrawingPoint] = useState(false);

    // For selecting an annotation (only "point" and "points" supported now)
    const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState(null);
    const [copiedAnnotation, setCopiedAnnotation] = useState(null);

    // For double-click detection
    const lastClickTimeRef = useRef(0);
    const doubleClickThreshold = 250; // milliseconds

    const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

    // Add keydown listener for ESC key to dispatch cancel-annotation event
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                window.dispatchEvent(new Event('cancel-annotation'));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ----------- Synchronize external selection -----------
    useEffect(() => {
        setSelectedAnnotationIndex(externalSelectedIndex);
    }, [externalSelectedIndex]);

    // ----------- Window / container sizing -----------
    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current) return;
            setDims({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
            });
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ----------- Load image -----------
    useEffect(() => {
        if (fileUrl) {
            const img = new window.Image();
            img.src = fileUrl;
            img.onload = () => {
                setKonvaImg(img);
                setImgDims({ width: img.width, height: img.height });
                setImageLoaded(true);
                if (containerRef.current) {
                    const canvasWidth = containerRef.current.offsetWidth;
                    const canvasHeight = containerRef.current.offsetHeight;
                    const xPos = Math.max(0, (canvasWidth - img.width) / 2);
                    const yPos = Math.max(0, (canvasHeight - img.height) / 2);
                    setImagePos({ x: xPos, y: yPos });
                }
            };
        }
    }, [fileUrl]);

    useEffect(() => {
        setImagePos(initialPosition);
    }, [initialPosition]);

    // ----------- Cancel annotation (e.g. on ESC) -----------
    useEffect(() => {
        const onCancelAnnotation = () => {
            setTempPointPoints([]);
            setDrawingPoint(false);
        };
        window.addEventListener('cancel-annotation', onCancelAnnotation);
        return () => window.removeEventListener('cancel-annotation', onCancelAnnotation);
    }, []);

    // ----------- Wheel Zoom -----------
    function handleWheel(evt) {
        evt.evt.preventDefault();
        onWheelZoom(evt.evt.deltaY);
    }

    // ----------- Right-click: remove last drawing point -----------
    function handleContextMenu(evt) {
        evt.evt.preventDefault();
        if (selectedTool === 'point' && drawingPoint && tempPointPoints.length > 0) {
            setTempPointPoints((prev) => prev.slice(0, -1));
        }
    }

    // ----------- Mouse events for point creation -----------
    function handleMouseDown(evt) {
        if (selectedTool === 'move' && evt.target.name() === 'background-image') {
            onSelectAnnotation(null);
        }
        if (selectedTool === 'move') {
            return;
        }
        const pos = getGroupPos(evt, stageRef);
        if (!pos) return;

        const now = Date.now();
        const delta = now - lastClickTimeRef.current;
        // If this click happens too quickly after the previous one, assume it's part of a double click and do not add a point.
        if (delta < doubleClickThreshold) {
            lastClickTimeRef.current = now;
            return;
        }
        lastClickTimeRef.current = now;

        if (selectedTool === 'point') {
            addPointToPoints(pos);
        }
    }

    function handleMouseMove(evt) {
        // No dynamic updates required for point annotations.
    }

    function handleMouseUp() {
        // No additional logic needed on mouse up.
    }

    // Double-click finalizes the point drawing.
    function handleDblClick(evt) {
        console.log('Double click received', evt);
        if (selectedTool === 'point' && drawingPoint) {
            console.log('Finalizing annotation via double click');
            finalizePoint();
        }
    }

    // ----------- Creating Points (multiple point tool) -----------
    function addPointToPoints(pos) {
        setTempPointPoints((prev) => {
            const newPoints = [...prev, pos];
            if (pointsLimit > 0 && newPoints.length === pointsLimit) {
                setTimeout(() => finalizePoint(newPoints), 0);
            }
            return newPoints;
        });
        setDrawingPoint(true);
    }
    function finalizePoint(pointsParam) {
        const pointsToUse = pointsParam || tempPointPoints;
        if (pointsToUse.length > 0) {
            const newAnn = {
                type: 'points',
                points: pointsToUse,
                label: activeLabel,
                color: activeLabelColor,
                opacity: 0.55, // Default opacity
            };
            if (konvaImg) {
                const clipped = clipAnnotationToBoundary(
                    newAnn,
                    konvaImg.width,
                    konvaImg.height
                );
                if (clipped) {
                    onAnnotationsChange([...annotations, clipped]);
                }
            } else {
                onAnnotationsChange([...annotations, newAnn]);
            }
        }
        setTempPointPoints([]);
        setDrawingPoint(false);
        onFinishShape && onFinishShape();
    }

    // ----------- Copy/Paste Keyboard Listener -----------
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Copy selected annotation
            if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
                if (selectedAnnotationIndex !== null) {
                    e.preventDefault();
                    setCopiedAnnotation(annotations[selectedAnnotationIndex]);
                }
            }
            // Paste copied annotation
            if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
                if (copiedAnnotation) {
                    e.preventDefault();
                    const newAnn = JSON.parse(JSON.stringify(copiedAnnotation));
                    // Shift it slightly
                    if (newAnn.x !== undefined && newAnn.y !== undefined) {
                        newAnn.x += 10;
                        newAnn.y += 10;
                    } else if (newAnn.points) {
                        newAnn.points = newAnn.points.map((pt) => ({
                            x: pt.x + 10,
                            y: pt.y + 10,
                        }));
                    }
                    onAnnotationsChange([...annotations, newAnn]);
                }
            }
            // Remove last drawing point while in point creation mode
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (selectedTool === 'point' && drawingPoint && tempPointPoints.length > 0) {
                    e.preventDefault();
                    setTempPointPoints((prev) => prev.slice(0, -1));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        annotations,
        onAnnotationsChange,
        selectedAnnotationIndex,
        copiedAnnotation,
        selectedTool,
        drawingPoint,
        tempPointPoints,
    ]);

    // ----------- Draggable logic for individual point -----------
    const handlePointDragEnd = (index, e) => {
        const { x, y } = e.target.position();
        const updated = [...annotations];
        updated[index] = { ...updated[index], x, y };
        if (konvaImg) {
            const clipped = clipAnnotationToBoundary(
                updated[index],
                konvaImg.width,
                konvaImg.height
            );
            if (!clipped) {
                updated.splice(index, 1);
            } else {
                updated[index] = clipped;
            }
        }
        onAnnotationsChange(updated);
    };

    // Draggable logic for groups of points (type "points")
    const handlePointsDragEnd = (index, e) => {
        const { x, y } = e.target.position();
        const ann = annotations[index];
        const newPoints = ann.points.map((pt) => ({
            x: pt.x + x,
            y: pt.y + y,
        }));
        const updated = [...annotations];
        updated[index] = { ...ann, points: newPoints };
        e.target.position({ x: 0, y: 0 });
        if (konvaImg) {
            const clipped = clipAnnotationToBoundary(
                updated[index],
                konvaImg.width,
                konvaImg.height
            );
            if (!clipped) {
                updated.splice(index, 1);
            } else {
                updated[index] = clipped;
            }
        }
        onAnnotationsChange(updated);
    };

    // Draggable logic for individual vertices within a "points" annotation.
    const handleVertexDragEnd = (annIndex, vertexIndex, e) => {
        e.cancelBubble = true;
        const { x, y } = e.target.position();
        const updated = [...annotations];
        const shapePoints = [...updated[annIndex].points];
        shapePoints[vertexIndex] = { x, y };
        updated[annIndex] = { ...updated[annIndex], points: shapePoints };
        if (konvaImg) {
            const clipped = clipAnnotationToBoundary(
                updated[annIndex],
                konvaImg.width,
                konvaImg.height
            );
            if (!clipped) {
                updated.splice(annIndex, 1);
            } else {
                updated[annIndex] = clipped;
            }
        }
        onAnnotationsChange(updated);
    };

    // Remove an individual vertex from a "points" annotation.
    function handleRemoveVertex(annIndex, vertexIndex) {
        const updated = [...annotations];
        const ann = { ...updated[annIndex] };
        const shapePoints = [...ann.points];
        shapePoints.splice(vertexIndex, 1);
        if (ann.type === 'points' && shapePoints.length < 1) {
            updated.splice(annIndex, 1);
        } else {
            ann.points = shapePoints;
            updated[annIndex] = ann;
        }
        onAnnotationsChange(updated);
    }

    // Insert a new vertex between two existing ones (only for "points" annotation).
    // function handleInsertVertex(annIndex, vertexIndex) {
    //     const updated = [...annotations];
    //     const ann = { ...updated[annIndex] };

    //     if (ann.type !== 'points') return;

    //     const shapePoints = [...ann.points];
    //     const length = shapePoints.length;
    //     if (length < 1) return;
    //     if (vertexIndex === length - 1) {
    //         return;
    //     }
    //     const currentPt = shapePoints[vertexIndex];
    //     const nextPt = shapePoints[vertexIndex + 1];
    //     const midX = (currentPt.x + nextPt.x) / 2;
    //     const midY = (currentPt.y + nextPt.y) / 2;
    //     shapePoints.splice(vertexIndex + 1, 0, { x: midX, y: midY });
    //     ann.points = shapePoints;
    //     updated[annIndex] = ann;
    //     onAnnotationsChange(updated);
    // }

    // Insert a new vertex between two existing ones (only for "points" annotation).
    function handleInsertVertex(annIndex, vertexIndex) {
        const updated = [...annotations];
        const ann = { ...updated[annIndex] };

        if (ann.type !== 'points') return;

        const shapePoints = [...ann.points];
        const length = shapePoints.length;
        if (length < 1) return;

        // Check if the points limit is reached
        if (pointsLimit > 0 && shapePoints.length >= pointsLimit) {
            // Don't add more points if limit is reached
            return;
        }

        if (vertexIndex === length - 1) {
            return;
        }

        const currentPt = shapePoints[vertexIndex];
        const nextPt = shapePoints[vertexIndex + 1];
        const midX = (currentPt.x + nextPt.x) / 2;
        const midY = (currentPt.y + nextPt.y) / 2;
        shapePoints.splice(vertexIndex + 1, 0, { x: midX, y: midY });
        ann.points = shapePoints;
        updated[annIndex] = ann;
        onAnnotationsChange(updated);
    }

    return (
        <div className="canvas-container" ref={containerRef}>
            {dims.width > 0 && dims.height > 0 && konvaImg && konvaImg.width > 0 && konvaImg.height > 0 ? (
                <Stage
                    ref={stageRef}
                    width={dims.width}
                    height={dims.height}
                    scaleX={scale}
                    scaleY={scale}
                    style={{
                        background: '#dfe6e9',
                        cursor: selectedTool === 'move' ? 'grab' : 'crosshair',
                    }}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onDblClick={handleDblClick}
                    onContextMenu={handleContextMenu}
                >
                    <Layer>
                        {/* Attach double-click handler also on the annotation group */}
                        <Group
                            id="anno-group"
                            draggable={selectedTool === 'move'}
                            x={imagePos.x}
                            y={imagePos.y}
                            onDragEnd={(e) => {
                                setImagePos({ x: e.target.x(), y: e.target.y() });
                            }}
                            onDblClick={handleDblClick}
                        >
                            {/* Background image */}
                            {konvaImg && konvaImg.width > 0 && konvaImg.height > 0 && (
                                <KonvaImage
                                    image={konvaImg}
                                    width={konvaImg.width}
                                    height={konvaImg.height}
                                    name="background-image"
                                />
                            )}

                            {/* Render existing annotations */}
                            {annotations.map((ann, i) => {
                                const annColor = ann.color || activeLabelColor || '#ff0000';
                                const opacity = ann.opacity !== undefined ? ann.opacity : 1.0;

                                if (ann.type === 'point') {
                                    return (
                                        <React.Fragment key={i}>
                                            <Circle
                                                x={ann.x}
                                                y={ann.y}
                                                radius={6 / scale}
                                                fill="#fff"
                                                stroke={annColor}
                                                strokeWidth={2 / scale}
                                                opacity={opacity}
                                                draggable
                                                onMouseDown={(e) => (e.cancelBubble = true)}
                                                onDragEnd={(e) => {
                                                    e.cancelBubble = true;
                                                    handlePointDragEnd(i, e);
                                                }}
                                                onClick={(e) => {
                                                    if (selectedTool === 'move') {
                                                        e.cancelBubble = true;
                                                        onSelectAnnotation(i);
                                                    }
                                                }}
                                                onMouseEnter={() => setHoveredPointIndex(i)}
                                                onMouseLeave={() => setHoveredPointIndex(null)}
                                            />
                                            {/* Point Label (shown based on toggle or hover) */}
                                            {pointLabels && pointLabels.length > 0 &&
                                                (showPointLabels || hoveredPointIndex === i) && (
                                                    <Label
                                                        x={ann.x}
                                                        y={ann.y - 15 / scale}
                                                        scaleX={1 / scale}
                                                        scaleY={1 / scale}
                                                    >
                                                        <Tag fill={annColor} opacity={0.8} pointerDirection="down" pointerWidth={10} pointerHeight={5} />
                                                        <Text text={pointLabels[i % pointLabels.length]} fill="#fff" padding={5} fontSize={12} />
                                                    </Label>
                                                )}
                                            {selectedAnnotationIndex === i && (
                                                <DeleteLabel
                                                    annotation={ann}
                                                    scale={scale}
                                                    shapeBoundingBox={shapeBoundingBox}
                                                    onDelete={() => onDeleteAnnotation(i)}
                                                    color={annColor}
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                } else if (ann.type === 'points') {
                                    return (
                                        <React.Fragment key={i}>
                                            <Group
                                                draggable
                                                onMouseDown={(e) => (e.cancelBubble = true)}
                                                onDragEnd={(e) => {
                                                    e.cancelBubble = true;
                                                    handlePointsDragEnd(i, e);
                                                }}
                                                onClick={(e) => {
                                                    if (selectedTool === 'move') {
                                                        e.cancelBubble = true;
                                                        onSelectAnnotation(i);
                                                    }
                                                }}
                                            >
                                                {ann.points.map((pt, idx) => (
                                                    <React.Fragment key={idx}>
                                                        <Circle
                                                            x={pt.x}
                                                            y={pt.y}
                                                            radius={6 / scale}
                                                            fill={annColor}
                                                            opacity={opacity}
                                                            draggable
                                                            onMouseDown={(ev) => (ev.cancelBubble = true)}
                                                            onDragEnd={(ev) => handleVertexDragEnd(i, idx, ev)}
                                                            onContextMenu={(ev) => {
                                                                ev.evt.preventDefault();
                                                                ev.cancelBubble = true;
                                                                handleRemoveVertex(i, idx);
                                                            }}
                                                            onClick={(ev) => {
                                                                ev.cancelBubble = true;
                                                                handleInsertVertex(i, idx);
                                                            }}
                                                            onMouseEnter={() => setHoveredPointIndex(`${i}-${idx}`)}
                                                            onMouseLeave={() => setHoveredPointIndex(null)}
                                                        />
                                                        {/* Point Label (shown based on toggle or hover) */}
                                                        {pointLabels && pointLabels.length > 0 &&
                                                            (showPointLabels || hoveredPointIndex === `${i}-${idx}`) && (
                                                                <Label
                                                                    x={pt.x}
                                                                    y={pt.y - 15 / scale}
                                                                    scaleX={1 / scale}
                                                                    scaleY={1 / scale}
                                                                >
                                                                    <Tag fill={annColor} opacity={0.8} pointerDirection="down" pointerWidth={10} pointerHeight={5} />
                                                                    <Text text={pointLabels[idx % pointLabels.length]} fill="#fff" padding={5} fontSize={12} />
                                                                </Label>
                                                            )}
                                                    </React.Fragment>
                                                ))}
                                            </Group>
                                            {selectedAnnotationIndex === i && (
                                                <DeleteLabel
                                                    annotation={ann}
                                                    scale={scale}
                                                    shapeBoundingBox={shapeBoundingBox}
                                                    onDelete={() => onDeleteAnnotation(i)}
                                                    color={annColor}
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                }
                                return null;
                            })}

                            {/* In-progress Points */}
                            {drawingPoint && selectedTool === 'point' && (
                                <>
                                    {tempPointPoints.map((pt, idx) => (
                                        <Circle
                                            key={idx}
                                            x={pt.x}
                                            y={pt.y}
                                            radius={4 / scale}
                                            fill="#fff"
                                            stroke={activeLabelColor}
                                            strokeWidth={1 / scale}
                                        />
                                    ))}
                                </>
                            )}
                        </Group>
                    </Layer>
                </Stage>
            ) : (
                <div>Loading image...</div>
            )}
        </div>
    );
}

// A small Konva Label to let user delete a selected annotation.
function DeleteLabel({ annotation, scale, shapeBoundingBox, onDelete, color }) {
    const box = shapeBoundingBox(annotation);
    if (!box) return null;

    const xPos = box.x1;
    const yPos = box.y1 - 20 / scale; // 20 px above, scaled

    return (
        <Label
            x={xPos}
            y={yPos}
            onClick={(e) => {
                e.cancelBubble = true;
                onDelete();
            }}
            scaleX={1 / scale}
            scaleY={1 / scale}
        >
            <Tag fill={color || 'red'} opacity={0.8} cornerRadius={4} />
            <Text text="Delete" fill="#fff" padding={5} fontSize={14} />
        </Label>
    );
}

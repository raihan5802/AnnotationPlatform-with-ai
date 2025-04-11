// src/components/CaptionCanvas.js
import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Group, Image as KonvaImage } from 'react-konva';
import './DetectionCanvas.css';

export default function CaptionCanvas({
    fileUrl,
    scale,
    onWheelZoom,
    initialPosition,
    // annotations and onAddCaption props are no longer used to render icons on the image.
    onAddCaption,
}) {
    const stageRef = useRef(null);
    const containerRef = useRef(null);
    const [dims, setDims] = useState({ width: 0, height: 0 });
    const [konvaImg, setKonvaImg] = useState(null);
    const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imagePos, setImagePos] = useState(initialPosition || { x: 0, y: 0 });

    // Update container dimensions on resize
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

    // Load image
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

    // Handle wheel zoom event
    function handleWheel(evt) {
        evt.evt.preventDefault();
        onWheelZoom(evt.evt.deltaY);
    }

    // onDoubleClick handler (if needed for adding captions)
    function handleDblClick(evt) {
        // Get the pointer position relative to the image group.
        const group = stageRef.current.findOne('#image-group');
        if (group) {
            const pointerPos = group.getRelativePointerPosition();
            if (onAddCaption) {
                onAddCaption(pointerPos);
            }
        }
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
                        cursor: 'grab'
                    }}
                    onWheel={handleWheel}
                    onDblClick={handleDblClick}
                >
                    <Layer>
                        <Group
                            id="image-group"
                            draggable={true}
                            x={imagePos.x}
                            y={imagePos.y}
                            onDragEnd={(e) => {
                                setImagePos({ x: e.target.x(), y: e.target.y() });
                            }}
                        >
                            <KonvaImage
                                image={konvaImg}
                                width={konvaImg.width}
                                height={konvaImg.height}
                                name="background-image"
                            />
                        </Group>
                    </Layer>
                </Stage>
            ) : (
                <div>Loading image...</div>
            )}
        </div>
    );
}

// SegmentationCanvas.js
import React, { useEffect, useRef, useState } from 'react';
import {
    Stage,
    Layer,
    Group,
    Image as KonvaImage,
    Line,
    Circle,
    Path,
    Label,
    Tag,
    Text,
    Arrow,
    Ellipse,
} from 'react-konva';
import './SegmentationCanvas.css';

// Helper function to flatten points
function flattenPoints(pts) {
    return pts.flatMap((p) => [p.x, p.y]);
}

// Helper function to create an SVG path for a polygon with holes
function polygonToPath(outer, holes) {
    let path = 'M ' + outer[0].x + ' ' + outer[0].y + ' ';
    for (let i = 1; i < outer.length; i++) {
        path += 'L ' + outer[i].x + ' ' + outer[i].y + ' ';
    }
    path += 'Z ';
    if (holes && holes.length > 0) {
        holes.forEach((hole) => {
            if (hole.length > 0) {
                path += 'M ' + hole[0].x + ' ' + hole[0].y + ' ';
                for (let i = 1; i < hole.length; i++) {
                    path += 'L ' + hole[i].x + ' ' + hole[i].y + ' ';
                }
                path += 'Z ';
            }
        });
    }
    return path;
}

export default function SegmentationCanvas({
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
    segmentationType,
    panopticOption,
    pointsLimit,
    initialPosition = { x: 0, y: 0 },
    externalSelectedIndex,
    onSelectAnnotation,
}) {
    const stageRef = useRef(null);
    const containerRef = useRef(null);

    const [dims, setDims] = useState({ width: 0, height: 0 });
    const [konvaImg, setKonvaImg] = useState(null);
    const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);

    // Master group offset (image panning)
    const [imagePos, setImagePos] = useState(initialPosition);

    // In-progress shape states
    const [tempPoints, setTempPoints] = useState([]);
    const [drawingPolygon, setDrawingPolygon] = useState(false);
    const [tempInstancePoints, setTempInstancePoints] = useState([]);
    const [drawingInstancePolygon, setDrawingInstancePolygon] = useState(false);
    const [tempSemanticPoints, setTempSemanticPoints] = useState([]);
    const [drawingSemanticPolygon, setDrawingSemanticPolygon] = useState(false);
    const [tempEllipse, setTempEllipse] = useState(null);
    const [drawingEllipse, setDrawingEllipse] = useState(false);

    // For selection and copy/paste
    const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState(null);
    const [copiedAnnotation, setCopiedAnnotation] = useState(null);

    // For Ctrl+Click dragging feature
    const [isDraggingWithCtrl, setIsDraggingWithCtrl] = useState(false);
    const [lastDragPoint, setLastDragPoint] = useState(null);
    const minDistanceBetweenPoints = 10;

    // For point reduction panel (polygons only)
    const [showPointReductionPanel, setShowPointReductionPanel] = useState(false);
    const [currentAnnotationPoints, setCurrentAnnotationPoints] = useState([]);
    const [currentAnnotationType, setCurrentAnnotationType] = useState('');
    const [distanceThreshold, setDistanceThreshold] = useState(10);
    const [originalPoints, setOriginalPoints] = useState([]);
    const [isShowingReducedPreview, setIsShowingReducedPreview] = useState(false);

    const crosshairCursor = `url('data:image/svg+xml;utf8,<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><line x1="50" y1="10" x2="50" y2="45" stroke="black" stroke-width="2"/><line x1="50" y1="55" x2="50" y2="90" stroke="black" stroke-width="2"/><line x1="10" y1="50" x2="45" y2="50" stroke="black" stroke-width="2"/><line x1="55" y1="50" x2="90" y2="50" stroke="black" stroke-width="2"/><circle cx="50" cy="50" r="1" fill="black"/></svg>') 50 50, crosshair`;

    useEffect(() => {
        setSelectedAnnotationIndex(externalSelectedIndex);
    }, [externalSelectedIndex]);

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

    function getGroupPos(evt) {
        const group = stageRef.current?.findOne('#anno-group');
        if (!group) return null;
        const pos = group.getRelativePointerPosition();
        // Adjust for scale to match the preview coordinates
        return {
            x: pos.x,
            y: pos.y,
        };
    }

    function shapeBoundingBox(ann) {
        if (ann.type === 'polygon') {
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
        } else if (ann.type === 'ellipse') {
            return {
                x1: ann.x - ann.radiusX,
                y1: ann.y - ann.radiusY,
                x2: ann.x + ann.radiusX,
                y2: ann.y + ann.radiusY,
            };
        }
        return null;
    }

    function isOutsideImage(ann) {
        if (!konvaImg) return false;
        const box = shapeBoundingBox(ann);
        if (!box) return false;
        const { x1, y1, x2, y2 } = box;
        return x2 < 0 || x1 > konvaImg.width || y2 < 0 || y1 > konvaImg.height;
    }

    function clipPolygonToRect(points, w, h) {
        const clipRectEdges = [
            { side: 'left', x: 0 },
            { side: 'right', x: w },
            { side: 'top', y: 0 },
            { side: 'bottom', y: h },
        ];

        let outputList = points;

        clipRectEdges.forEach((edge) => {
            const inputList = outputList;
            outputList = [];
            if (inputList.length === 0) return;

            for (let i = 0; i < inputList.length; i++) {
                const current = inputList[i];
                const prev = inputList[(i + inputList.length - 1) % inputList.length];

                const currentInside = isInside(current, edge);
                const prevInside = isInside(prev, edge);

                if (prevInside && currentInside) {
                    outputList.push(current);
                } else if (prevInside && !currentInside) {
                    const inter = computeIntersection(prev, current, edge);
                    if (inter) outputList.push(inter);
                } else if (!prevInside && currentInside) {
                    const inter = computeIntersection(prev, current, edge);
                    if (inter) outputList.push(inter);
                    outputList.push(current);
                }
            }
        });

        return outputList;

        function isInside(pt, edge) {
            if (edge.side === 'left') return pt.x >= edge.x;
            if (edge.side === 'right') return pt.x <= edge.x;
            if (edge.side === 'top') return pt.y >= edge.y;
            if (edge.side === 'bottom') return pt.y <= edge.y;
            return true;
        }

        function computeIntersection(a, b, edge) {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            let t;
            if (edge.side === 'left' || edge.side === 'right') {
                if (Math.abs(dx) < 1e-8) return null;
                t = (edge.x - a.x) / dx;
                const y = a.y + t * dy;
                return { x: edge.x, y };
            } else {
                if (Math.abs(dy) < 1e-8) return null;
                t = (edge.y - a.y) / dy;
                const x = a.x + t * dx;
                return { x, y: edge.y };
            }
        }
    }

    function clipEllipseToRect(ellipse, w, h) {
        let { x, y, radiusX, radiusY } = ellipse;
        const left = x - radiusX;
        const right = x + radiusX;
        const top = y - radiusY;
        const bottom = y + radiusY;

        // If entirely outside, return null
        if (right < 0 || left > w || bottom < 0 || top > h) return null;

        // Adjust radii to fit within bounds without shifting center unless necessary
        if (left < 0) radiusX = x;
        if (right > w) radiusX = w - x;
        if (top < 0) radiusY = y;
        if (bottom > h) radiusY = h - y;

        // Only shift center if radii become negative or zero
        if (radiusX <= 0 || radiusY <= 0) {
            if (left < 0) x = radiusX = Math.min(radiusX + left, w / 2);
            if (right > w) x = w - (radiusX = Math.min(radiusX - (right - w), w / 2));
            if (top < 0) y = radiusY = Math.min(radiusY + top, h / 2);
            if (bottom > h) y = h - (radiusY = Math.min(radiusY - (bottom - h), h / 2));
        }

        if (radiusX <= 0 || radiusY <= 0) return null;
        return { ...ellipse, x, y, radiusX, radiusY };
    }

    function clipAnnotationToBoundary(ann, w, h) {
        if (ann.type === 'polygon') {
            const clipped = clipPolygonToRect(ann.points, w, h);
            if (clipped.length < 3) return null;
            return { ...ann, points: clipped };
        } else if (ann.type === 'ellipse') {
            return clipEllipseToRect(ann, w, h);
        }
        return null;
    }

    function addPolygonPoint(pos) {
        setTempPoints((prev) => {
            const newPoints = [...prev, pos];
            if (pointsLimit > 0 && newPoints.length === pointsLimit) {
                setTimeout(() => finalizePolygon(newPoints), 0);
            }
            return newPoints;
        });
        setDrawingPolygon(true);
    }

    function finalizePolygon(pointsParam) {
        const pointsToUse = pointsParam || tempPoints;
        if (pointsToUse.length >= 3) {
            const newAnn = {
                type: 'polygon',
                points: pointsToUse,
                label: activeLabel,
                color: activeLabelColor,
                opacity: 0.55,
            };
            if (konvaImg) {
                const clipped = clipAnnotationToBoundary(newAnn, konvaImg.width, konvaImg.height);
                if (clipped) {
                    onAnnotationsChange([...annotations, clipped]);
                }
            } else {
                onAnnotationsChange([...annotations, newAnn]);
            }
        }
        setTempPoints([]);
        setDrawingPolygon(false);
        onFinishShape && onFinishShape();
    }

    function addInstancePolygonPoint(pos) {
        setTempInstancePoints((prev) => {
            const newPoints = [...prev, pos];
            if (pointsLimit > 0 && newPoints.length === pointsLimit) {
                setTimeout(() => finalizeInstancePolygon(newPoints), 0);
            }
            return newPoints;
        });
        setDrawingInstancePolygon(true);
    }

    function finalizeInstancePolygon(pointsParam) {
        const pointsToUse = pointsParam || tempInstancePoints;
        if (pointsToUse.length >= 3) {
            let newAnn = {
                type: 'polygon',
                points: pointsToUse,
                label: activeLabel,
                opacity: 0.55,
            };
            const currentInstances = annotations.filter(
                (ann) => ann.label === activeLabel && ann.instanceId
            );
            const newCount = currentInstances.length + 1;
            const instanceId = activeLabel + '-' + newCount;
            const instanceColor = getUniqueInstanceColor();
            newAnn.instanceId = instanceId;
            newAnn.color = instanceColor;

            if (konvaImg) {
                const clipped = clipAnnotationToBoundary(newAnn, konvaImg.width, konvaImg.height);
                if (clipped) {
                    onAnnotationsChange([...annotations, clipped]);
                }
            } else {
                onAnnotationsChange([...annotations, newAnn]);
            }
        }
        setTempInstancePoints([]);
        setDrawingInstancePolygon(false);
        onFinishShape && onFinishShape();
    }

    function addSemanticPolygonPoint(pos) {
        setTempSemanticPoints((prev) => {
            const newPoints = [...prev, pos];
            if (pointsLimit > 0 && newPoints.length === pointsLimit) {
                setTimeout(() => finalizeSemanticPolygon(newPoints), 0);
            }
            return newPoints;
        });
        setDrawingSemanticPolygon(true);
    }

    function finalizeSemanticPolygon(pointsParam) {
        const pointsToUse = pointsParam || tempSemanticPoints;
        if (pointsToUse.length >= 3) {
            const newAnn = {
                type: 'polygon',
                points: pointsToUse,
                label: activeLabel,
                color: activeLabelColor,
                opacity: 0.55,
            };
            if (konvaImg) {
                const clipped = clipAnnotationToBoundary(newAnn, konvaImg.width, konvaImg.height);
                if (clipped) {
                    onAnnotationsChange([...annotations, clipped]);
                }
            } else {
                onAnnotationsChange([...annotations, newAnn]);
            }
        }
        setTempSemanticPoints([]);
        setDrawingSemanticPolygon(false);
        onFinishShape && onFinishShape();
    }

    function startEllipse(pos) {
        setTempEllipse({
            type: 'ellipse',
            x: pos.x,
            y: pos.y,
            radiusX: 0,
            radiusY: 0,
            label: activeLabel,
            color: activeLabelColor,
            opacity: 0.55,
        });
        setDrawingEllipse(true);
    }

    function updateEllipse(pos) {
        if (!tempEllipse) return;
        const radiusX = Math.abs(pos.x - tempEllipse.x);
        const radiusY = Math.abs(pos.y - tempEllipse.y);
        setTempEllipse({ ...tempEllipse, radiusX, radiusY });
    }

    function finalizeEllipse() {
        if (tempEllipse && tempEllipse.radiusX > 0 && tempEllipse.radiusY > 0) {
            // Ensure coordinates are consistent with preview (relative to #anno-group)
            const finalEllipse = { ...tempEllipse };
            if (konvaImg) {
                const clipped = clipEllipseToRect(finalEllipse, konvaImg.width, konvaImg.height);
                if (clipped) {
                    onAnnotationsChange([...annotations, clipped]);
                }
            } else {
                onAnnotationsChange([...annotations, finalEllipse]);
            }
        }
        setTempEllipse(null);
        setDrawingEllipse(false);
        onFinishShape && onFinishShape();
    }

    useEffect(() => {
        const onCancelAnnotation = () => {
            setTempPoints([]);
            setDrawingPolygon(false);
            setTempInstancePoints([]);
            setDrawingInstancePolygon(false);
            setTempSemanticPoints([]);
            setDrawingSemanticPolygon(false);
            setTempEllipse(null);
            setDrawingEllipse(false);
            setIsDraggingWithCtrl(false);
            setLastDragPoint(null);
        };
        window.addEventListener('cancel-annotation', onCancelAnnotation);
        return () => window.removeEventListener('cancel-annotation', onCancelAnnotation);
    }, []);

    function handleWheel(evt) {
        evt.evt.preventDefault();
        onWheelZoom(evt.evt.deltaY);
    }

    function handleContextMenu(evt) {
        evt.evt.preventDefault();
        if (selectedTool === 'polygon' && drawingPolygon && tempPoints.length > 0) {
            setTempPoints((prev) => prev.slice(0, -1));
        } else if (
            selectedTool === 'instance' &&
            drawingInstancePolygon &&
            tempInstancePoints.length > 0
        ) {
            setTempInstancePoints((prev) => prev.slice(0, -1));
        } else if (
            selectedTool === 'semantic' &&
            drawingSemanticPolygon &&
            tempSemanticPoints.length > 0
        ) {
            setTempSemanticPoints((prev) => prev.slice(0, -1));
        } else if (
            selectedTool === 'panoptic' &&
            panopticOption === 'instance' &&
            drawingInstancePolygon &&
            tempInstancePoints.length > 0
        ) {
            setTempInstancePoints((prev) => prev.slice(0, -1));
        } else if (
            selectedTool === 'panoptic' &&
            panopticOption === 'semantic' &&
            drawingSemanticPolygon &&
            tempSemanticPoints.length > 0
        ) {
            setTempSemanticPoints((prev) => prev.slice(0, -1));
        } else if (selectedTool === 'ellipse' && drawingEllipse) {
            setTempEllipse(null);
            setDrawingEllipse(false);
        }
    }

    const lastClickTimeRef = useRef(0);
    const doubleClickThreshold = 250;

    function handleMouseDown(evt) {
        if (selectedTool === 'move' && evt.target.name() === 'background-image') {
            onSelectAnnotation(null);
        }
        if (selectedTool === 'move') return;

        const pos = getGroupPos(evt);
        if (!pos) return;

        const isCtrlPressed = evt.evt.ctrlKey;

        if (isCtrlPressed && ['polygon', 'instance', 'semantic', 'panoptic'].includes(selectedTool)) {
            setIsDraggingWithCtrl(true);
            setLastDragPoint(pos);
            if (selectedTool === 'polygon') {
                addPolygonPoint(pos);
            } else if (selectedTool === 'instance') {
                addInstancePolygonPoint(pos);
            } else if (selectedTool === 'semantic') {
                addSemanticPolygonPoint(pos);
            } else if (selectedTool === 'panoptic') {
                if (panopticOption === 'instance') {
                    addInstancePolygonPoint(pos);
                } else if (panopticOption === 'semantic') {
                    addSemanticPolygonPoint(pos);
                }
            }
            return;
        }

        const now = Date.now();
        const delta = now - lastClickTimeRef.current;
        const usesDoubleClick = ['polygon', 'instance', 'semantic', 'panoptic'].includes(selectedTool);

        if (usesDoubleClick && delta < doubleClickThreshold) {
            return;
        }
        lastClickTimeRef.current = now;

        if (selectedTool === 'polygon') {
            addPolygonPoint(pos);
        } else if (selectedTool === 'instance') {
            addInstancePolygonPoint(pos);
        } else if (selectedTool === 'semantic') {
            addSemanticPolygonPoint(pos);
        } else if (selectedTool === 'panoptic') {
            if (panopticOption === 'instance') {
                addInstancePolygonPoint(pos);
            } else if (panopticOption === 'semantic') {
                addSemanticPolygonPoint(pos);
            }
        } else if (selectedTool === 'ellipse' && !drawingEllipse) {
            startEllipse(pos);
        }
    }

    function handleMouseMove(evt) {
        if (isDraggingWithCtrl) {
            const pos = getGroupPos(evt);
            if (!pos || !lastDragPoint) return;

            const distance = getDistance(lastDragPoint, pos);
            if (distance >= minDistanceBetweenPoints) {
                if (selectedTool === 'polygon' && drawingPolygon) {
                    if (pointsLimit === 0 || tempPoints.length < pointsLimit) {
                        addPolygonPoint(pos);
                    } else if (tempPoints.length >= pointsLimit) {
                        setIsDraggingWithCtrl(false);
                        finalizePolygon();
                        return;
                    }
                } else if (selectedTool === 'instance' && drawingInstancePolygon) {
                    if (pointsLimit === 0 || tempInstancePoints.length < pointsLimit) {
                        addInstancePolygonPoint(pos);
                    } else if (tempInstancePoints.length >= pointsLimit) {
                        setIsDraggingWithCtrl(false);
                        finalizeInstancePolygon();
                        return;
                    }
                } else if (selectedTool === 'semantic' && drawingSemanticPolygon) {
                    if (pointsLimit === 0 || tempSemanticPoints.length < pointsLimit) {
                        addSemanticPolygonPoint(pos);
                    } else if (tempSemanticPoints.length >= pointsLimit) {
                        setIsDraggingWithCtrl(false);
                        finalizeSemanticPolygon();
                        return;
                    }
                } else if (selectedTool === 'panoptic') {
                    if (panopticOption === 'instance' && drawingInstancePolygon) {
                        if (pointsLimit === 0 || tempInstancePoints.length < pointsLimit) {
                            addInstancePolygonPoint(pos);
                        } else if (tempInstancePoints.length >= pointsLimit) {
                            setIsDraggingWithCtrl(false);
                            finalizeInstancePolygon();
                            return;
                        }
                    } else if (panopticOption === 'semantic' && drawingSemanticPolygon) {
                        if (pointsLimit === 0 || tempSemanticPoints.length < pointsLimit) {
                            addSemanticPolygonPoint(pos);
                        } else if (tempSemanticPoints.length >= pointsLimit) {
                            setIsDraggingWithCtrl(false);
                            finalizeSemanticPolygon();
                            return;
                        }
                    }
                }
                setLastDragPoint(pos);
            }
        } else if (selectedTool === 'ellipse' && drawingEllipse) {
            const pos = getGroupPos(evt);
            if (pos) updateEllipse(pos);
        }
    }

    function handleMouseUp() {
        if (isDraggingWithCtrl) {
            setIsDraggingWithCtrl(false);
            setLastDragPoint(null);

            let points = [];
            let annotationType = '';

            if (selectedTool === 'polygon' && drawingPolygon && tempPoints.length >= 3) {
                points = [...tempPoints];
                annotationType = 'polygon';
                setOriginalPoints([...tempPoints]);
                setCurrentAnnotationPoints([...tempPoints]);
                setCurrentAnnotationType('polygon');
                setShowPointReductionPanel(true);
            } else if (selectedTool === 'instance' && drawingInstancePolygon && tempInstancePoints.length >= 3) {
                points = [...tempInstancePoints];
                annotationType = 'instance';
                setOriginalPoints([...tempInstancePoints]);
                setCurrentAnnotationPoints([...tempInstancePoints]);
                setCurrentAnnotationType('instance');
                setShowPointReductionPanel(true);
            } else if (selectedTool === 'semantic' && drawingSemanticPolygon && tempSemanticPoints.length >= 3) {
                points = [...tempSemanticPoints];
                annotationType = 'semantic';
                setOriginalPoints([...tempSemanticPoints]);
                setCurrentAnnotationPoints([...tempSemanticPoints]);
                setCurrentAnnotationType('semantic');
                setShowPointReductionPanel(true);
            } else if (selectedTool === 'panoptic') {
                if (panopticOption === 'instance' && drawingInstancePolygon && tempInstancePoints.length >= 3) {
                    points = [...tempInstancePoints];
                    annotationType = 'panoptic-instance';
                    setOriginalPoints([...tempInstancePoints]);
                    setCurrentAnnotationPoints([...tempInstancePoints]);
                    setCurrentAnnotationType('panoptic-instance');
                    setShowPointReductionPanel(true);
                } else if (panopticOption === 'semantic' && drawingSemanticPolygon && tempSemanticPoints.length >= 3) {
                    points = [...tempSemanticPoints];
                    annotationType = 'panoptic-semantic';
                    setOriginalPoints([...tempSemanticPoints]);
                    setCurrentAnnotationPoints([...tempSemanticPoints]);
                    setCurrentAnnotationType('panoptic-semantic');
                    setShowPointReductionPanel(true);
                }
            }
        } else if (selectedTool === 'ellipse' && drawingEllipse) {
            finalizeEllipse();
        }
    }

    function getDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    function reducePoints(points, threshold) {
        if (points.length <= 3) return points;
        const result = [points[0]];
        for (let i = 1; i < points.length; i++) {
            const prevPoint = result[result.length - 1];
            const currentPoint = points[i];
            if (getDistance(prevPoint, currentPoint) >= threshold) {
                result.push(currentPoint);
            }
        }
        if (result.length < 3) {
            return points.filter((_, index) => index % Math.floor(points.length / 3) === 0);
        }
        return result;
    }

    function applyPointReduction() {
        if (currentAnnotationType === 'polygon') {
            finalizePolygon(currentAnnotationPoints);
        } else if (currentAnnotationType === 'instance') {
            finalizeInstancePolygon(currentAnnotationPoints);
        } else if (currentAnnotationType === 'semantic') {
            finalizeSemanticPolygon(currentAnnotationPoints);
        } else if (currentAnnotationType === 'panoptic-instance') {
            finalizeInstancePolygon(currentAnnotationPoints);
        } else if (currentAnnotationType === 'panoptic-semantic') {
            finalizeSemanticPolygon(currentAnnotationPoints);
        }
        setIsShowingReducedPreview(false);
        setShowPointReductionPanel(false);
        setCurrentAnnotationPoints([]);
        setCurrentAnnotationType('');
    }

    function cancelPointReduction() {
        if (currentAnnotationType === 'polygon') {
            finalizePolygon(originalPoints);
        } else if (currentAnnotationType === 'instance') {
            finalizeInstancePolygon(originalPoints);
        } else if (currentAnnotationType === 'semantic') {
            finalizeSemanticPolygon(originalPoints);
        } else if (currentAnnotationType === 'panoptic-instance') {
            finalizeInstancePolygon(originalPoints);
        } else if (currentAnnotationType === 'panoptic-semantic') {
            finalizeSemanticPolygon(originalPoints);
        }
        setIsShowingReducedPreview(false);
        setShowPointReductionPanel(false);
        setCurrentAnnotationPoints([]);
        setCurrentAnnotationType('');
    }

    function handleDistanceChange(e) {
        const newThreshold = parseInt(e.target.value);
        setDistanceThreshold(newThreshold);
        const reducedPoints = reducePoints(originalPoints, newThreshold);
        setCurrentAnnotationPoints(reducedPoints);
        setIsShowingReducedPreview(true);
    }

    function handleDblClick() {
        if (selectedTool === 'polygon' && drawingPolygon) {
            finalizePolygon();
        } else if (selectedTool === 'instance' && drawingInstancePolygon) {
            finalizeInstancePolygon();
        } else if (selectedTool === 'semantic' && drawingSemanticPolygon) {
            finalizeSemanticPolygon();
        } else if (selectedTool === 'panoptic') {
            if (panopticOption === 'instance' && drawingInstancePolygon) {
                finalizeInstancePolygon();
            } else if (panopticOption === 'semantic' && drawingSemanticPolygon) {
                finalizeSemanticPolygon();
            }
        }
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
                if (selectedAnnotationIndex !== null) {
                    e.preventDefault();
                    setCopiedAnnotation(annotations[selectedAnnotationIndex]);
                }
            }
            if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
                if (copiedAnnotation) {
                    e.preventDefault();
                    const newAnn = JSON.parse(JSON.stringify(copiedAnnotation));
                    if (newAnn.points) {
                        newAnn.points = newAnn.points.map((pt) => ({
                            x: pt.x + 10,
                            y: pt.y + 10,
                        }));
                    } else if (newAnn.type === 'ellipse') {
                        newAnn.x += 10;
                        newAnn.y += 10;
                    }
                    onAnnotationsChange([...annotations, newAnn]);
                }
            }
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (selectedTool === 'polygon' && drawingPolygon && tempPoints.length > 0) {
                    e.preventDefault();
                    setTempPoints((prev) => prev.slice(0, -1));
                } else if (
                    selectedTool === 'instance' &&
                    drawingInstancePolygon &&
                    tempInstancePoints.length > 0
                ) {
                    e.preventDefault();
                    setTempInstancePoints((prev) => prev.slice(0, -1));
                } else if (
                    selectedTool === 'semantic' &&
                    drawingSemanticPolygon &&
                    tempSemanticPoints.length > 0
                ) {
                    e.preventDefault();
                    setTempSemanticPoints((prev) => prev.slice(0, -1));
                } else if (
                    selectedTool === 'panoptic' &&
                    panopticOption === 'instance' &&
                    drawingInstancePolygon &&
                    tempInstancePoints.length > 0
                ) {
                    e.preventDefault();
                    setTempInstancePoints((prev) => prev.slice(0, -1));
                } else if (
                    selectedTool === 'panoptic' &&
                    panopticOption === 'semantic' &&
                    drawingSemanticPolygon &&
                    tempSemanticPoints.length > 0
                ) {
                    e.preventDefault();
                    setTempSemanticPoints((prev) => prev.slice(0, -1));
                } else if (selectedTool === 'ellipse' && drawingEllipse) {
                    e.preventDefault();
                    setTempEllipse(null);
                    setDrawingEllipse(false);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        annotations,
        onAnnotationsChange,
        selectedTool,
        drawingPolygon,
        tempPoints,
        drawingInstancePolygon,
        tempInstancePoints,
        drawingSemanticPolygon,
        tempSemanticPoints,
        drawingEllipse,
        tempEllipse,
        panopticOption,
        selectedAnnotationIndex,
        copiedAnnotation,
    ]);

    const handleVertexDragEnd = (annIndex, vertexIndex, e) => {
        e.cancelBubble = true;
        const { x, y } = e.target.position();
        const updated = [...annotations];
        const shapePoints = [...updated[annIndex].points];
        shapePoints[vertexIndex] = { x, y };
        updated[annIndex] = { ...updated[annIndex], points: shapePoints };

        if (konvaImg) {
            const clipped = clipAnnotationToBoundary(updated[annIndex], konvaImg.width, konvaImg.height);
            if (!clipped) {
                updated.splice(annIndex, 1);
            } else {
                updated[annIndex] = clipped;
            }
        }
        onAnnotationsChange(updated);
    };

    const handleShapeDragEnd = (index, e) => {
        const { x, y } = e.target.position();
        const ann = annotations[index];
        const updated = [...annotations];
        if (ann.type === 'polygon') {
            const newPoints = ann.points.map((pt) => ({
                x: pt.x + x,
                y: pt.y + y,
            }));
            updated[index] = { ...ann, points: newPoints };
        } else if (ann.type === 'ellipse') {
            updated[index] = { ...ann, x: ann.x + x, y: ann.y + y };
        }
        e.target.position({ x: 0, y: 0 });

        if (konvaImg) {
            const clipped = clipAnnotationToBoundary(updated[index], konvaImg.width, konvaImg.height);
            if (!clipped) {
                updated.splice(index, 1);
            } else {
                updated[index] = clipped;
            }
        }
        onAnnotationsChange(updated);
    };

    function getUniqueInstanceColor() {
        function randomColor() {
            const letters = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }
        let newColor = randomColor();
        const usedColors = new Set();
        if (labelClasses) {
            labelClasses.forEach((lc) => usedColors.add(lc.color.toUpperCase()));
        }
        annotations.forEach((ann) => {
            if (ann.color) usedColors.add(ann.color.toUpperCase());
        });
        let attempts = 0;
        while (usedColors.has(newColor.toUpperCase()) && attempts < 100) {
            newColor = randomColor();
            attempts++;
        }
        return newColor;
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
                        cursor: selectedTool === 'move' ? 'grab' : crosshairCursor,
                    }}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onDblClick={handleDblClick}
                    onContextMenu={handleContextMenu}
                >
                    <Layer>
                        <Group
                            id="anno-group"
                            draggable={selectedTool === 'move'}
                            x={imagePos.x}
                            y={imagePos.y}
                            onDragEnd={(e) => {
                                setImagePos({ x: e.target.x(), y: e.target.y() });
                            }}
                        >
                            {konvaImg && (
                                <KonvaImage
                                    image={konvaImg}
                                    width={konvaImg.width}
                                    height={konvaImg.height}
                                    name="background-image"
                                />
                            )}

                            {annotations.map((ann, i) => {
                                const annColor = ann.color || activeLabelColor || '#ff0000';
                                const fillColor = annColor + '55';
                                const opacity = ann.opacity !== undefined ? ann.opacity : 1.0;

                                if (ann.type === 'polygon') {
                                    if (ann.holes && ann.holes.length > 0) {
                                        const pathData = polygonToPath(ann.points, ann.holes);
                                        return (
                                            <React.Fragment key={i}>
                                                <Group
                                                    draggable
                                                    onMouseDown={(e) => (e.cancelBubble = true)}
                                                    onDragEnd={(e) => {
                                                        e.cancelBubble = true;
                                                        handleShapeDragEnd(i, e);
                                                    }}
                                                    onClick={(e) => {
                                                        if (selectedTool === 'move') {
                                                            e.cancelBubble = true;
                                                            onSelectAnnotation(i);
                                                        }
                                                    }}
                                                >
                                                    <Path
                                                        data={pathData}
                                                        fill={annColor}
                                                        stroke={annColor}
                                                        strokeWidth={2 / scale}
                                                        fillRule="evenodd"
                                                        opacity={opacity}
                                                    />
                                                    {ann.points.map((pt, idx) => (
                                                        <Circle
                                                            key={idx}
                                                            x={pt.x}
                                                            y={pt.y}
                                                            radius={4 / scale}
                                                            fill="#fff"
                                                            stroke={annColor}
                                                            strokeWidth={1 / scale}
                                                            opacity={opacity}
                                                            draggable
                                                            onMouseDown={(ev) => (ev.cancelBubble = true)}
                                                            onDragEnd={(ev) => handleVertexDragEnd(i, idx, ev)}
                                                            onContextMenu={(ev) => {
                                                                ev.evt.preventDefault();
                                                                ev.cancelBubble = true;
                                                                const updated = [...annotations];
                                                                const shapePoints = [...ann.points];
                                                                shapePoints.splice(idx, 1);
                                                                if (shapePoints.length < 3) {
                                                                    updated.splice(i, 1);
                                                                } else {
                                                                    updated[i] = { ...ann, points: shapePoints };
                                                                }
                                                                onAnnotationsChange(updated);
                                                            }}
                                                            onClick={(ev) => {
                                                                ev.cancelBubble = true;
                                                                const updated = [...annotations];
                                                                const shapePoints = [...ann.points];
                                                                const length = shapePoints.length;
                                                                let nextIndex = (idx + 1) % length;
                                                                const currentPt = shapePoints[idx];
                                                                const nextPt = shapePoints[nextIndex];
                                                                const midX = (currentPt.x + nextPt.x) / 2;
                                                                const midY = (currentPt.y + nextPt.y) / 2;
                                                                shapePoints.splice(idx + 1, 0, { x: midX, y: midY });
                                                                updated[i] = { ...ann, points: shapePoints };
                                                                onAnnotationsChange(updated);
                                                            }}
                                                        />
                                                    ))}
                                                </Group>
                                                {ann.instanceId && (
                                                    <InstanceIdLabel
                                                        annotation={ann}
                                                        scale={scale}
                                                        shapeBoundingBox={shapeBoundingBox}
                                                        color={annColor}
                                                    />
                                                )}
                                                <DeleteLabel
                                                    annotation={ann}
                                                    scale={scale}
                                                    shapeBoundingBox={shapeBoundingBox}
                                                    onDelete={() => onDeleteAnnotation(i)}
                                                    color={annColor}
                                                />
                                            </React.Fragment>
                                        );
                                    } else {
                                        const pts = flattenPoints(ann.points);
                                        const firstPt = ann.points[0];
                                        const secondPt =
                                            ann.points[1] || { x: firstPt.x + 10, y: firstPt.y };
                                        return (
                                            <React.Fragment key={i}>
                                                <Group
                                                    draggable
                                                    onMouseDown={(e) => (e.cancelBubble = true)}
                                                    onDragEnd={(e) => {
                                                        e.cancelBubble = true;
                                                        handleShapeDragEnd(i, e);
                                                    }}
                                                    onClick={(e) => {
                                                        if (selectedTool === 'move') {
                                                            e.cancelBubble = true;
                                                            onSelectAnnotation(i);
                                                        }
                                                    }}
                                                >
                                                    <Line
                                                        points={pts}
                                                        fill={annColor}
                                                        stroke={annColor}
                                                        strokeWidth={2 / scale}
                                                        opacity={opacity}
                                                        closed
                                                    />
                                                    {ann.points.map((pt, idx) => (
                                                        <Circle
                                                            key={idx}
                                                            x={pt.x}
                                                            y={pt.y}
                                                            radius={4 / scale}
                                                            fill="#fff"
                                                            stroke={annColor}
                                                            strokeWidth={1 / scale}
                                                            opacity={opacity}
                                                            draggable
                                                            onMouseDown={(ev) => (ev.cancelBubble = true)}
                                                            onDragEnd={(ev) => handleVertexDragEnd(i, idx, ev)}
                                                            onContextMenu={(ev) => {
                                                                ev.evt.preventDefault();
                                                                ev.cancelBubble = true;
                                                                const updated = [...annotations];
                                                                const shapePoints = [...ann.points];
                                                                shapePoints.splice(idx, 1);
                                                                if (shapePoints.length < 3) {
                                                                    updated.splice(i, 1);
                                                                } else {
                                                                    updated[i] = { ...ann, points: shapePoints };
                                                                }
                                                                onAnnotationsChange(updated);
                                                            }}
                                                            onClick={(ev) => {
                                                                ev.cancelBubble = true;
                                                                const updated = [...annotations];
                                                                const shapePoints = [...ann.points];
                                                                const length = shapePoints.length;
                                                                let nextIndex = (idx + 1) % length;
                                                                const currentPt = shapePoints[idx];
                                                                const nextPt = shapePoints[nextIndex];
                                                                const midX = (currentPt.x + nextPt.x) / 2;
                                                                const midY = (currentPt.y + nextPt.y) / 2;
                                                                shapePoints.splice(idx + 1, 0, { x: midX, y: midY });
                                                                updated[i] = { ...ann, points: shapePoints };
                                                                onAnnotationsChange(updated);
                                                            }}
                                                        />
                                                    ))}
                                                    <Arrow
                                                        points={[secondPt.x, secondPt.y, firstPt.x, firstPt.y]}
                                                        fill={annColor}
                                                        stroke={annColor}
                                                        strokeWidth={2 / scale}
                                                        opacity={opacity}
                                                        pointerLength={10 / scale}
                                                        pointerWidth={8 / scale}
                                                    />
                                                </Group>
                                                {ann.instanceId && (
                                                    <InstanceIdLabel
                                                        annotation={ann}
                                                        scale={scale}
                                                        shapeBoundingBox={shapeBoundingBox}
                                                        color={annColor}
                                                    />
                                                )}
                                                <DeleteLabel
                                                    annotation={ann}
                                                    scale={scale}
                                                    shapeBoundingBox={shapeBoundingBox}
                                                    onDelete={() => onDeleteAnnotation(i)}
                                                    color={annColor}
                                                />
                                            </React.Fragment>
                                        );
                                    }
                                } else if (ann.type === 'ellipse') {
                                    return (
                                        <React.Fragment key={i}>
                                            <Group
                                                draggable
                                                onMouseDown={(e) => (e.cancelBubble = true)}
                                                onDragEnd={(e) => {
                                                    e.cancelBubble = true;
                                                    handleShapeDragEnd(i, e);
                                                }}
                                                onClick={(e) => {
                                                    if (selectedTool === 'move') {
                                                        e.cancelBubble = true;
                                                        onSelectAnnotation(i);
                                                    }
                                                }}
                                            >
                                                <Ellipse
                                                    x={ann.x}
                                                    y={ann.y}
                                                    radiusX={ann.radiusX}
                                                    radiusY={ann.radiusY}
                                                    fill={annColor}
                                                    stroke={annColor}
                                                    strokeWidth={2 / scale}
                                                    opacity={opacity}
                                                />
                                            </Group>
                                            <DeleteLabel
                                                annotation={ann}
                                                scale={scale}
                                                shapeBoundingBox={shapeBoundingBox}
                                                onDelete={() => onDeleteAnnotation(i)}
                                                color={annColor}
                                            />
                                        </React.Fragment>
                                    );
                                }
                                return null;
                            })}

                            {showPointReductionPanel && (
                                <>
                                    {(isShowingReducedPreview ? currentAnnotationPoints : originalPoints).length > 1 && (
                                        <Line
                                            points={flattenPoints([
                                                ...(isShowingReducedPreview ? currentAnnotationPoints : originalPoints),
                                                (isShowingReducedPreview ? currentAnnotationPoints : originalPoints)[0],
                                            ])}
                                            fill={activeLabelColor + '55'}
                                            stroke={activeLabelColor}
                                            strokeWidth={2 / scale}
                                            closed
                                        />
                                    )}
                                    {(isShowingReducedPreview ? currentAnnotationPoints : originalPoints).map((pt, idx) => (
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

                            {!showPointReductionPanel && (
                                <>
                                    {drawingPolygon && selectedTool === 'polygon' && (
                                        <>
                                            {tempPoints.length > 1 && (
                                                <Line
                                                    points={flattenPoints([...tempPoints, tempPoints[0]])}
                                                    fill={activeLabelColor + '55'}
                                                    stroke={activeLabelColor}
                                                    strokeWidth={2 / scale}
                                                    closed
                                                />
                                            )}
                                            {tempPoints.map((pt, idx) => (
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

                                    {drawingInstancePolygon && selectedTool === 'instance' && (
                                        <>
                                            {tempInstancePoints.length > 1 && (
                                                <Line
                                                    points={flattenPoints([...tempInstancePoints, tempInstancePoints[0]])}
                                                    fill={activeLabelColor + '55'}
                                                    stroke={activeLabelColor}
                                                    strokeWidth={2 / scale}
                                                    closed
                                                />
                                            )}
                                            {tempInstancePoints.map((pt, idx) => (
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

                                    {drawingSemanticPolygon && selectedTool === 'semantic' && (
                                        <>
                                            {tempSemanticPoints.length > 1 && (
                                                <Line
                                                    points={flattenPoints([...tempSemanticPoints, tempSemanticPoints[0]])}
                                                    fill={activeLabelColor + '55'}
                                                    stroke={activeLabelColor}
                                                    strokeWidth={2 / scale}
                                                    closed
                                                />
                                            )}
                                            {tempSemanticPoints.map((pt, idx) => (
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

                                    {drawingInstancePolygon && selectedTool === 'panoptic' && panopticOption === 'instance' && (
                                        <>
                                            {tempInstancePoints.length > 1 && (
                                                <Line
                                                    points={flattenPoints([...tempInstancePoints, tempInstancePoints[0]])}
                                                    fill={activeLabelColor + '55'}
                                                    stroke={activeLabelColor}
                                                    strokeWidth={2 / scale}
                                                    closed
                                                />
                                            )}
                                            {tempInstancePoints.map((pt, idx) => (
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

                                    {drawingSemanticPolygon && selectedTool === 'panoptic' && panopticOption === 'semantic' && (
                                        <>
                                            {tempSemanticPoints.length > 1 && (
                                                <Line
                                                    points={flattenPoints([...tempSemanticPoints, tempSemanticPoints[0]])}
                                                    fill={activeLabelColor + '55'}
                                                    stroke={activeLabelColor}
                                                    strokeWidth={2 / scale}
                                                    closed
                                                />
                                            )}
                                            {tempSemanticPoints.map((pt, idx) => (
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

                                    {drawingEllipse && selectedTool === 'ellipse' && tempEllipse && (
                                        <Ellipse
                                            x={tempEllipse.x}
                                            y={tempEllipse.y}
                                            radiusX={tempEllipse.radiusX}
                                            radiusY={tempEllipse.radiusY}
                                            fill={activeLabelColor + '55'}
                                            stroke={activeLabelColor}
                                            strokeWidth={2 / scale}
                                        />
                                    )}
                                </>
                            )}
                        </Group>
                    </Layer>
                </Stage>
            ) : (
                <div>Loading image...</div>
            )}

            {showPointReductionPanel && (
                <div
                    className="point-reduction-panel"
                    style={{
                        position: 'absolute',
                        top: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: '5px',
                        padding: '10px',
                        zIndex: 1000,
                        color: 'white',
                        width: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                            Reduce Points: {originalPoints.length} →
                            <span style={{ color: originalPoints.length !== currentAnnotationPoints.length ? '#FFC107' : 'white' }}>
                                {currentAnnotationPoints.length}
                            </span>
                        </span>
                        <button
                            onClick={cancelPointReduction}
                            style={{
                                backgroundColor: '#f44336',
                                border: 'none',
                                color: 'white',
                                padding: '5px 10px',
                                borderRadius: '3px',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                    <div>
                        <input
                            type="range"
                            min="5"
                            max="100"
                            value={distanceThreshold}
                            onChange={handleDistanceChange}
                            style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Less Points</span>
                            <span>More Points</span>
                        </div>
                    </div>
                    <button
                        onClick={applyPointReduction}
                        style={{
                            backgroundColor: '#4CAF50',
                            border: 'none',
                            color: 'white',
                            padding: '8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                        }}
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}

function DeleteLabel({ annotation, scale, shapeBoundingBox, onDelete, color }) {
    const box = shapeBoundingBox(annotation);
    if (!box) return null;

    const xPos = box.x1;
    const yPos = box.y1 - 20 / scale;

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

function InstanceIdLabel({ annotation, scale, shapeBoundingBox, color }) {
    const box = shapeBoundingBox(annotation);
    if (!box || !annotation.instanceId) return null;

    const xPos = box.x1;
    const yPos = box.y1 - 35 / scale;

    return (
        <Label x={xPos} y={yPos} scaleX={1 / scale} scaleY={1 / scale}>
            <Tag fill={color || '#ff0000'} opacity={0.9} cornerRadius={4} />
            <Text text={annotation.instanceId} fill="#fff" padding={5} fontSize={14} />
        </Label>
    );
}
// src/pages/Segmentation.js
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import UserHomeTopBar from '../../../components/UserHomeTopBar';
import SegmentationCanvas from '../../../components/SegmentationCanvas';
import AnnotationListSidebar from '../../../components/AnnotationListSidebar';
import './Segmentation.css';

// SVG Icon Components
const UndoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 14L4 9l5-5" />
        <path d="M4 9h10c3 0 7 1 7 6v1" />
    </svg>
);

const RedoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 14l5-5-5-5" />
        <path d="M20 9H10C7 9 3 10 3 15v1" />
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const BackgroundIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
    </svg>
);

const MoveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="5 9 2 12 5 15" />
        <polyline points="9 5 12 2 15 5" />
        <polyline points="15 19 12 22 9 19" />
        <polyline points="19 9 22 12 19 15" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
);

const PolygonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L3 12l4 8h10l4-8z" />
    </svg>
);

const EllipseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="12" rx="10" ry="6" />
    </svg>
);

const SegmentationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4v7l9 9 7-7-9-9z" />
        <path d="M20 20L9 9" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const PaletteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="10.5" r="2.5" />
        <circle cx="8.5" cy="7.5" r="2.5" />
        <circle cx="6.5" cy="12.5" r="2.5" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.688h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
);

const ToolsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
);

const CenterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
);

const FitIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="3" width="18" height="18" />
        <path d="M12 3v18" />
        <path d="M3 12h18" />
    </svg>
);

const AddImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
        <line x1="12" y1="9" x2="12" y2="15" />
        <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
);

const DeleteImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
);

// Function to convert an ellipse to a polygon
// const ellipseToPolygon = (ellipse, numPoints = 32) => {
//     const { x, y, radiusX, radiusY, label, color, opacity } = ellipse;
//     // Calculate center from top-left coordinates and radii
//     const centerX = x + radiusX;
//     const centerY = y + radiusY;
//     const points = [];
//     for (let i = 0; i < numPoints; i++) {
//         const angle = (i / numPoints) * 2 * Math.PI;
//         const px = centerX + radiusX * Math.cos(angle);
//         const py = centerY + radiusY * Math.sin(angle);
//         points.push({ x: px, y: py });
//     }
//     return {
//         type: 'polygon',
//         points,
//         label,
//         color,
//         opacity: opacity || 0.5,
//     };
// };

// Function to convert all ellipses in an annotation array to polygons

const ellipseToPolygon = (ellipse, numPoints = 20) => {
    const { x, y, radiusX, radiusY, label, color, opacity } = ellipse;
    const points = [];
    for (let i = 0; i < numPoints; i++) {
        const angle = (2 * Math.PI * i) / numPoints;
        const px = x + radiusX * Math.cos(angle);
        const py = y + radiusY * Math.sin(angle);
        points.push({ x: px, y: py });
    }
    // Close the polygon by adding the first point again
    points.push(points[0]);

    return {
        type: 'polygon',
        points,
        label,
        color,
        opacity: opacity || 0.5,
    };
};

const convertEllipsesToPolygons = (shapes) => {
    return shapes.map((shape) => {
        if (shape.type === 'ellipse') {
            return ellipseToPolygon(shape);
        }
        return shape;
    });
};

export default function Segmentation() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const taskId = state?.taskId;

    // New states for task, project, and file management
    const [taskData, setTaskData] = useState(null);
    const [projectData, setProjectData] = useState(null);
    const [filesList, setFilesList] = useState([]);
    const [allFiles, setAllFiles] = useState([]);
    const [taskFolderPaths, setTaskFolderPaths] = useState([]);

    // Annotation and UI states
    const [annotations, setAnnotations] = useState({});
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [showHelperText, setShowHelperText] = useState(false);
    const [helperText, setHelperText] = useState('');
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
    const [selectedTool, setSelectedTool] = useState('move');
    const [segmentationType, setSegmentationType] = useState('instance');
    const [panopticOption, setPanopticOption] = useState('instance');
    const [selectedLabelClass, setSelectedLabelClass] = useState('');
    const [localLabelClasses, setLocalLabelClasses] = useState([]);
    const [scale, setScale] = useState(1.0);

    // Points limit modal state for polygon/segmentation tools
    const [showPointsLimitModal, setShowPointsLimitModal] = useState(false);
    const [pointsLimitInput, setPointsLimitInput] = useState('');
    const [pendingTool, setPendingTool] = useState('');
    const [currentPointsLimit, setCurrentPointsLimit] = useState(0);

    // Selected annotation state for opacity control
    const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState(null);

    // State for last tool settings
    const [lastToolState, setLastToolState] = useState({
        tool: null,
        pointsLimit: 0,
        segmentationType: null,
        panopticOption: null,
    });

    // New states for Add Image modal
    const [showAddImageModal, setShowAddImageModal] = useState(false);
    const [newFiles, setNewFiles] = useState(null);
    const [selectedAddFolder, setSelectedAddFolder] = useState('');

    // States for Add Label Modal
    const [showAddLabelModal, setShowAddLabelModal] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#ff0000');

    // Other UI refs
    const fileInputRef = useRef(null);
    const canvasHelperRef = useRef(null);
    const canvasAreaRef = useRef(null);

    // State for Keyboard Shortcuts Modal
    const [showKeyboardShortcutsModal, setShowKeyboardShortcutsModal] = useState(false);

    // Helper to extract files from a folder tree
    const extractFilesFromTree = (node, basePath) => {
        let files = [];
        if (node.type === 'file') {
            const url = `http://localhost:4000/uploads/${basePath}/${node.name}`;
            files.push({ originalname: node.name, url });
        } else if (node.type === 'folder' && node.children) {
            const baseParts = basePath.split('/');
            const lastSegment = baseParts[baseParts.length - 1];
            const newBasePath = node.name === lastSegment ? basePath : `${basePath}/${node.name}`;
            node.children.forEach((child) => {
                files = files.concat(extractFilesFromTree(child, newBasePath));
            });
        }
        return files;
    };

    // Fetch task and project data based on taskId
    useEffect(() => {
        if (!taskId) {
            alert("No task id provided. Please create a task first.");
            navigate('/tasks');
            return;
        }

        const userSessionData = localStorage.getItem('user');
        if (!userSessionData) {
            navigate('/signin');
            return;
        }

        const user = JSON.parse(userSessionData);

        fetch(`http://localhost:4000/api/tasks?userId=${user.id}`)
            .then(res => res.json())
            .then(tasks => {
                const task = tasks.find(t => t.task_id === taskId);
                if (!task) {
                    alert("Task not found.");
                    navigate('/tasks');
                    return;
                }

                setTaskData(task);
                const folderPaths = task.selected_files.split(';').filter(x => x);
                setTaskFolderPaths(folderPaths);

                // Fetch the project details
                fetch('http://localhost:4000/api/projects')
                    .then(res => res.json())
                    .then(projects => {
                        const project = projects.find(p => p.project_id === task.project_id);
                        if (!project) {
                            alert("Project not found.");
                            navigate('/userhome');
                            return;
                        }

                        setProjectData(project);
                        setLocalLabelClasses(project.label_classes || []);
                        if (project.label_classes && project.label_classes.length > 0) {
                            setSelectedLabelClass(project.label_classes[0].name);
                        }

                        // Instead of fetching and processing each folder separately,
                        // use our new filtered API endpoint
                        fetch(`http://localhost:4000/api/project-files/${project.project_id}?includePaths=true`)
                            .then(res => res.json())
                            .then(data => {
                                // Format the files to match our expected structure
                                const formattedFiles = data.files.map(file => {
                                    if (typeof file === 'string') {
                                        return { url: file, originalname: file.split('/').pop() };
                                    }
                                    return { url: file.url, originalname: file.path.split('/').pop() };
                                });

                                // Only keep files that belong to the task's selected folder paths
                                const taskFiles = formattedFiles.filter(file => {
                                    const fileUrl = file.url;
                                    // Check if the file URL contains any of the task folder paths
                                    return folderPaths.some(folderPath => fileUrl.includes(folderPath));
                                });

                                setFilesList(taskFiles);
                                setAllFiles(taskFiles);
                            })
                            .catch(err => console.error("Error fetching project files", err));
                    });
            })
            .catch(err => console.error("Error fetching tasks", err));
    }, [taskId, navigate]);

    const taskName = taskData ? taskData.task_name : '';
    const currentFileUrl = filesList[currentIndex]?.url;
    const currentShapes = annotations[currentFileUrl] || [];

    const showHelper = (text) => {
        setHelperText(text);
        setShowHelperText(true);
        if (canvasHelperRef.current) {
            canvasHelperRef.current.classList.add('visible');
        }
        setTimeout(() => {
            if (canvasHelperRef.current) {
                canvasHelperRef.current.classList.remove('visible');
            }
            setTimeout(() => setShowHelperText(false), 300);
        }, 3000);
    };

    // Load annotations from the project folder
    useEffect(() => {
        if (projectData) {
            const folderId = projectData.folder_path.split('/')[1];
            fetch(`http://localhost:4000/api/annotations/${folderId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.annotations) {
                        // Convert any loaded ellipses to polygons if needed
                        const convertedAnnotations = {};
                        for (const [url, shapes] of Object.entries(data.annotations)) {
                            convertedAnnotations[url] = convertEllipsesToPolygons(shapes);
                        }
                        setAnnotations(convertedAnnotations);
                    }
                })
                .catch((err) => console.error('Error fetching annotations', err));
        }
    }, [projectData]);

    const fitImage = () => {
        if (currentFileUrl && canvasAreaRef.current) {
            const img = new Image();
            img.src = currentFileUrl;
            img.onload = () => {
                const canvasWidth = canvasAreaRef.current.offsetWidth;
                const canvasHeight = canvasAreaRef.current.offsetHeight;
                const imageWidth = img.width;
                const imageHeight = img.height;

                const fitScale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
                const groupX = (canvasWidth / 2 / fitScale) - (imageWidth / 2);
                const groupY = (canvasHeight / 2 / fitScale) - (imageHeight / 2);

                setScale(fitScale);
                setImagePosition({ x: groupX, y: groupY });
            };
        }
    };

    const handleFit = () => {
        fitImage();
        showHelper('Image fitted to canvas');
    };

    useEffect(() => {
        fitImage();
    }, [currentFileUrl]);

    useEffect(() => {
        setScale(1.0);
    }, [currentIndex]);

    const handleCenterImage = () => {
        if (currentFileUrl) {
            const img = new Image();
            img.src = currentFileUrl;
            img.onload = () => {
                if (canvasAreaRef.current) {
                    const canvasWidth = canvasAreaRef.current.offsetWidth;
                    const canvasHeight = canvasAreaRef.current.offsetHeight;
                    const logicalCanvasWidth = canvasWidth / scale;
                    const logicalCanvasHeight = canvasHeight / scale;
                    const xPos = (logicalCanvasWidth - img.width) / 2;
                    const yPos = (logicalCanvasHeight - img.height) / 2;
                    setImagePosition({ x: xPos, y: yPos });
                    showHelper('Image centered');
                }
            };
        }
    };

    const undo = () => {
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1];
        setRedoStack([...redoStack, annotations]);
        setUndoStack(undoStack.slice(0, -1));
        setAnnotations(prev);
        showHelper('Undo successful');
    };

    const redo = () => {
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        setUndoStack([...undoStack, annotations]);
        setRedoStack(redoStack.slice(0, -1));
        setAnnotations(next);
        showHelper('Redo successful');
    };

    const handleAnnotationsChange = (newShapes) => {
        const convertedShapes = convertEllipsesToPolygons(newShapes);
        const updated = {
            ...annotations,
            [currentFileUrl]: convertedShapes,
        };
        setUndoStack([...undoStack, annotations]);
        setRedoStack([]);
        setAnnotations(updated);
    };

    const handleUpdateAllAnnotations = (updatedAnnotations) => {
        const convertedAnnotations = convertEllipsesToPolygons(updatedAnnotations);
        const updated = {
            ...annotations,
            [currentFileUrl]: convertedAnnotations,
        };
        setUndoStack([...undoStack, annotations]);
        setRedoStack([]);
        setAnnotations(updated);
    };

    useEffect(() => {
        setSelectedAnnotationIndex(null);
    }, [currentIndex, currentFileUrl]);

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    };

    const handleNext = async () => {
        if (currentIndex < filesList.length - 1) {
            const saved = await handleSave();
            if (saved) {
                setCurrentIndex((i) => i + 1);
            } else {
                alert('Failed to save annotations. Please try again.');
            }
        }
    };

    const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 5));
    const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.2));
    const handleWheelZoom = (deltaY) => {
        if (deltaY < 0) handleZoomIn();
        else handleZoomOut();
    };

    const handleSave = async () => {
        setIsSaving(true);
        const folderId = projectData ? projectData.folder_path.split('/')[1] : '';
        const convertedAnnotations = {};
        for (const [url, shapes] of Object.entries(annotations)) {
            convertedAnnotations[url] = convertEllipsesToPolygons(shapes);
        }
        const bodyData = {
            folderId,
            taskName,
            labelClasses: localLabelClasses,
            annotations: convertedAnnotations,
        };
        try {
            const res = await fetch('http://localhost:4000/api/annotations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });
            if (!res.ok) {
                throw new Error('Failed to save annotations');
            }
            await res.json();
            showHelper('Annotations saved successfully');
            return true;
        } catch (err) {
            console.error(err);
            showHelper('Error saving annotations');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleFillBackground = () => {
        if (!currentFileUrl) return;
        const img = new Image();
        img.src = currentFileUrl;
        img.onload = () => {
            const width = img.width;
            const height = img.height;
            const convertedShapes = convertEllipsesToPolygons(currentShapes);
            const bgAnn = computeBackgroundPolygon(width, height, convertedShapes, localLabelClasses);
            const newShapes = convertedShapes.filter((ann) => ann.label.toLowerCase() !== 'background');
            newShapes.push(bgAnn);
            handleAnnotationsChange(newShapes);
            showHelper('Background filled');
        };
    };

    function computeBackgroundPolygon(imageWidth, imageHeight, shapes, labelClasses) {
        const outer = [
            { x: 0, y: 0 },
            { x: imageWidth, y: 0 },
            { x: imageWidth, y: imageHeight },
            { x: 0, y: imageHeight },
        ];
        const holes = [];
        shapes.forEach((ann) => {
            if (ann.type === 'polygon' && ann.label.toLowerCase() !== 'background') {
                holes.push(ann.points);
            }
            // Since ellipses are converted to polygons, no need for separate ellipse handling here
        });
        let bgColor = '#000000';
        if (
            labelClasses &&
            labelClasses.some(
                (lc) =>
                    lc.color.toLowerCase() === '#000000' &&
                    lc.name.toLowerCase() !== 'background'
            )
        ) {
            bgColor = '#010101';
        }
        return {
            type: 'polygon',
            points: outer,
            holes: holes,
            label: 'background',
            color: bgColor,
            opacity: 0.5,
        };
    }

    // useEffect(() => {
    //     const handleKeyDown = (e) => {
    //         const key = e.key;
    //         if ((key === 's' || key === 'S') && e.ctrlKey) {
    //             e.preventDefault();
    //             handleSave();
    //         } else if (key === 'm' || key === 'M') {
    //             setSelectedTool('move');
    //         } else if (key === 'p' || key === 'P') {
    //             handleToolChange('polygon');
    //         } else if (key === 'i' || key === 'I') {
    //             handleToolChange('instance');
    //         } else if (key === 's' || key === 'S') {
    //             handleToolChange('semantic');
    //         } else if (key === 'a' || key === 'A') {
    //             handleToolChange('panoptic');
    //         } else if (key === 'e' || key === 'E') {
    //             handleToolChange('ellipse');
    //         } else if (key === 'c' || key === 'C') {
    //             handleCenterImage();
    //         }
    //         if (key === 'Escape') {
    //             if (selectedAnnotationIndex !== null) {
    //                 setSelectedAnnotationIndex(null);
    //             } else {
    //                 const event = new CustomEvent('cancel-annotation');
    //                 window.dispatchEvent(event);
    //             }
    //         }
    //         if (key === 'ArrowRight') {
    //             if (currentIndex < filesList.length - 1) handleNext();
    //         }
    //         if (key === 'ArrowLeft') {
    //             if (currentIndex > 0) handlePrev();
    //         }
    //         if (e.ctrlKey && (key === 'z' || key === 'Z')) {
    //             e.preventDefault();
    //             undo();
    //         } else if (e.ctrlKey && (key === 'y' || key === 'Y')) {
    //             e.preventDefault();
    //             redo();
    //         }
    //         if (key === 'n' || key === 'N') {
    //             if (lastToolState.tool) {
    //                 setCurrentPointsLimit(lastToolState.pointsLimit);
    //                 setSelectedTool(lastToolState.tool);
    //                 if (lastToolState.segmentationType) {
    //                     setSegmentationType(lastToolState.segmentationType);
    //                     setPanopticOption(lastToolState.panopticOption);
    //                 }
    //                 showHelper(`Resumed ${lastToolState.tool} tool`);
    //             }
    //         }
    //     };
    //     window.addEventListener('keydown', handleKeyDown);
    //     return () => window.removeEventListener('keydown', handleKeyDown);
    // }, [annotations, undoStack, redoStack, selectedAnnotationIndex, panopticOption]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger shortcuts if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Handle Ctrl + key combinations
            if (e.ctrlKey) {
                switch (e.key) {
                    case 'z':
                        e.preventDefault();
                        if (undoStack.length > 0) undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        if (redoStack.length > 0) redo();
                        break;
                    case 's':
                        e.preventDefault();
                        handleSave();
                        break;
                    case 'b':
                        e.preventDefault();
                        handleFillBackground();
                        break;
                    case '-':
                        e.preventDefault();
                        handleZoomOut();
                        break;
                    case '+':
                    case '=': // For keyboards where + is on the same key as =
                        e.preventDefault();
                        handleZoomIn();
                        break;
                    default:
                        break;
                }
            } else {
                // Handle single key shortcuts
                switch (e.key) {
                    case 'n':
                    case 'N':
                        e.preventDefault();
                        if (lastToolState.tool) {
                            setCurrentPointsLimit(lastToolState.pointsLimit);
                            setSelectedTool(lastToolState.tool);
                            if (lastToolState.segmentationType) {
                                setSegmentationType(lastToolState.segmentationType);
                                setPanopticOption(lastToolState.panopticOption);
                            }
                            showHelper(`Resumed ${lastToolState.tool} tool`);
                        }
                        break;
                    case 'f':
                    case 'F':
                        handleFit();
                        break;
                    case 'ArrowLeft':
                        if (currentIndex > 0) handlePrev();
                        break;
                    case 'ArrowRight':
                        if (currentIndex < filesList.length - 1) handleNext();
                        break;
                    case 'm':
                    case 'M':
                        setSelectedTool('move');
                        break;
                    case 'p':
                    case 'P':
                        handleToolChange('polygon');
                        break;
                    case 'i':
                    case 'I':
                        handleToolChange('instance');
                        break;
                    case 's':
                    case 'S':
                        handleToolChange('semantic');
                        break;
                    case 'a':
                    case 'A':
                        handleToolChange('panoptic');
                        break;
                    case 'e':
                    case 'E':
                        handleToolChange('ellipse');
                        break;
                    case 'c':
                    case 'C':
                        e.preventDefault();
                        handleCenterImage();
                        break;
                    case 'Escape':
                        if (selectedAnnotationIndex !== null) {
                            setSelectedAnnotationIndex(null);
                        } else {
                            const event = new CustomEvent('cancel-annotation');
                            window.dispatchEvent(event);
                        }
                        break;
                    default:
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [annotations, undoStack, redoStack, currentIndex, filesList.length, selectedAnnotationIndex, panopticOption, handleCenterImage]);


    const handleToolChange = (tool) => {
        // For point-based tools, set the selected tool directly
        if (['polygon', 'instance', 'semantic', 'panoptic'].includes(tool)) {
            setSelectedTool(tool);
            // Optionally, reset the points limit if needed
            setCurrentPointsLimit(0);
            showHelper(`Selected ${tool} tool`);
        } else {
            setSelectedTool(tool);
            setCurrentPointsLimit(0);
            showHelper(`Selected ${tool} tool`);
        }
    };

    const activeLabelColor = localLabelClasses.find((l) => l.name === selectedLabelClass)?.color || '#ff0000';

    const handleAddImage = () => {
        setShowAddImageModal(true);
    };

    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

    const handleDeleteImage = () => {
        if (!filesList.length || currentIndex < 0 || currentIndex >= filesList.length) {
            showHelper('No image to delete');
            return;
        }
        setShowConfirmDeleteModal(true);
    };

    const confirmDeleteImage = async () => {
        if (!filesList.length || currentIndex < 0 || currentIndex >= filesList.length) return;
        const currentFile = filesList[currentIndex];
        setIsDeleting(true);
        try {
            const relativePathFull = currentFile.url.split('/uploads/')[1];
            const parts = relativePathFull.split('/');
            const folderId = parts.shift();
            const relativePath = parts.join('/');
            const response = await fetch(`http://localhost:4000/api/images/${folderId}/${relativePath}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete image');
            }
            const updatedFiles = [...filesList];
            updatedFiles.splice(currentIndex, 1);
            setFilesList(updatedFiles);
            showHelper('Image deleted successfully');
        } catch (error) {
            console.error('Error deleting image:', error);
            showHelper('Error deleting image');
        } finally {
            setIsDeleting(false);
            setShowConfirmDeleteModal(false);
        }
    };

    return (
        <div className="annotate-container">
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={() => { }}
                accept="image/*"
                multiple
            />
            <UserHomeTopBar taskName={taskName} showControls={true} isSaving={isSaving} />

            <div className="annotate-actions">
                <button onClick={undo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">
                    <UndoIcon /> Undo
                </button>
                <button onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)">
                    <RedoIcon /> Redo
                </button>
                <div className="divider"></div>
                <button onClick={handleSave} className="primary" disabled={isSaving} title="Save (Ctrl+S)">
                    <SaveIcon /> {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleFillBackground} title="Fill Background">
                    <BackgroundIcon /> Background
                </button>
                <button onClick={handleCenterImage} title="Center Image (C)">
                    <CenterIcon /> Center
                </button>
                <button onClick={handleFit} title="Fit Image to Canvas">
                    <FitIcon /> Fit
                </button>
                <div className="divider"></div>
                <button onClick={handlePrev} disabled={currentIndex <= 0}>Prev</button>
                <button
                    onClick={handleNext}
                    disabled={isSaving || currentIndex >= filesList.length - 1}
                >
                    Next
                </button>
                <button onClick={handleAddImage} disabled={isSaving} title="Add Image">
                    <AddImageIcon /> Add Image
                </button>
                <button onClick={handleDeleteImage} disabled={isDeleting || filesList.length === 0} title="Delete Current Image">
                    <DeleteImageIcon /> Delete Image
                </button>
                <button onClick={() => setShowKeyboardShortcutsModal(true)}>
                    Keyboard Shortcuts
                </button>
                <div className="divider"></div>
                <button onClick={handleZoomOut}>- Zoom</button>
                <button onClick={handleZoomIn}>+ Zoom</button>
                <button onClick={() => { }}>Export</button>
                <span className="img-count">{currentIndex + 1} / {filesList.length}</span>
            </div>

            <div className="annotate-main">
                <div className="tools-sidebar">
                    <div className="sidebar-section">
                        <h3><ToolsIcon /> Tools</h3>
                        <div className="tool-grid">
                            <div
                                className={`tool-button ${selectedTool === 'move' ? 'active' : ''}`}
                                onClick={() => setSelectedTool('move')}
                                title="Move Tool (M)"
                            >
                                <div className="tool-icon"><MoveIcon /></div>
                                <div className="tool-name">Move</div>
                                <div className="keyboard-hint">M</div>
                            </div>
                            <div
                                className={`tool-button ${selectedTool === 'polygon' ? 'active' : ''}`}
                                onClick={() => handleToolChange('polygon')}
                                title="Polygon Tool (P)"
                            >
                                <div className="tool-icon"><PolygonIcon /></div>
                                <div className="tool-name">Polygon</div>
                                <div className="keyboard-hint">P</div>
                            </div>
                            <div
                                className={`tool-button ${selectedTool === 'ellipse' ? 'active' : ''}`}
                                onClick={() => handleToolChange('ellipse')}
                                title="Ellipse Tool (E)"
                            >
                                <div className="tool-icon"><EllipseIcon /></div>
                                <div className="tool-name">Ellipse</div>
                                <div className="keyboard-hint">E</div>
                            </div>
                        </div>

                        {(['polygon'].includes(selectedTool)) && (
                            <div className="points-limit-option" style={{ marginTop: '10px', fontSize: '0.9em' }}>
                                <label htmlFor={`${selectedTool}-points-limit`}>Points Limit (0 for unlimited): </label>
                                <input
                                    id={`${selectedTool}-points-limit`}
                                    type="number"
                                    value={currentPointsLimit}
                                    onChange={(e) => setCurrentPointsLimit(parseInt(e.target.value) || 0)}
                                    style={{ width: '80px', marginLeft: '8px' }}
                                />
                            </div>
                        )}

                        <div className="segmentation-section">
                            <h4 className="segmentation-heading">Segmentation</h4>
                            <div className="tool-grid">
                                <div
                                    className={`tool-button ${selectedTool === 'instance' ? 'active' : ''}`}
                                    onClick={() => handleToolChange('instance')}
                                    title="Instance Segmentation Tool (I)"
                                >
                                    <div className="tool-icon"><SegmentationIcon /></div>
                                    <div className="tool-name">Instance</div>
                                    <div className="keyboard-hint">I</div>
                                </div>
                                <div
                                    className={`tool-button ${selectedTool === 'semantic' ? 'active' : ''}`}
                                    onClick={() => handleToolChange('semantic')}
                                    title="Semantic Segmentation Tool (S)"
                                >
                                    <div className="tool-icon"><SegmentationIcon /></div>
                                    <div className="tool-name">Semantic</div>
                                    <div className="keyboard-hint">S</div>
                                </div>
                                <div
                                    className={`tool-button ${selectedTool === 'panoptic' ? 'active' : ''}`}
                                    onClick={() => handleToolChange('panoptic')}
                                    title="Panoptic Segmentation Tool (A)"
                                >
                                    <div className="tool-icon"><SegmentationIcon /></div>
                                    <div className="tool-name">Panoptic</div>
                                    <div className="keyboard-hint">A</div>
                                </div>
                            </div>
                            {(['instance', 'semantic', 'panoptic'].includes(selectedTool)) && (
                                <div className="points-limit-option" style={{ marginTop: '10px', fontSize: '0.9em' }}>
                                    <label htmlFor={`${selectedTool}-points-limit`}>Points Limit (0 for unlimited): </label>
                                    <input
                                        id={`${selectedTool}-points-limit`}
                                        type="number"
                                        value={currentPointsLimit}
                                        onChange={(e) => setCurrentPointsLimit(parseInt(e.target.value) || 0)}
                                        style={{ width: '80px', marginLeft: '8px' }}
                                    />
                                </div>
                            )}
                        </div>
                        {selectedTool === 'panoptic' && (
                            <div className="option-section">
                                <h4>Panoptic Option</h4>
                                <div className="radio-group">
                                    <label className="radio-button">
                                        <input
                                            type="radio"
                                            name="panopticOption"
                                            value="instance"
                                            checked={panopticOption === 'instance'}
                                            onChange={() => setPanopticOption('instance')}
                                        />
                                        <span className="radio-label">Instance</span>
                                    </label>
                                    <label className="radio-button">
                                        <input
                                            type="radio"
                                            name="panopticOption"
                                            value="semantic"
                                            checked={panopticOption === 'semantic'}
                                            onChange={() => setPanopticOption('semantic')}
                                        />
                                        <span className="radio-label">Semantic</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="sidebar-section">
                        <h3><PaletteIcon /> Active Label</h3>
                        <div className="label-selection">
                            <select value={selectedLabelClass} onChange={(e) => setSelectedLabelClass(e.target.value)}>
                                {localLabelClasses.map((lc, i) => (
                                    <option key={i} value={lc.name}>{lc.name}</option>
                                ))}
                            </select>
                            <button onClick={() => setShowAddLabelModal(true)}>
                                <PlusIcon /> Add Label
                            </button>
                        </div>
                        <div className="label-preview">
                            <div className="label-color" style={{ backgroundColor: activeLabelColor }}></div>
                            <span>Current Label: {selectedLabelClass}</span>
                        </div>
                    </div>
                </div>
                <div className="canvas-area" ref={canvasAreaRef}>
                    {currentFileUrl ? (
                        <>
                            <SegmentationCanvas
                                key={currentFileUrl}
                                fileUrl={currentFileUrl}
                                annotations={currentShapes}
                                onAnnotationsChange={handleAnnotationsChange}
                                selectedTool={selectedTool}
                                scale={scale}
                                onWheelZoom={handleWheelZoom}
                                activeLabelColor={activeLabelColor}
                                onFinishShape={() => {
                                    setLastToolState({
                                        tool: selectedTool,
                                        pointsLimit: currentPointsLimit,
                                        segmentationType: segmentationType,
                                        panopticOption: panopticOption,
                                    });
                                    setSelectedTool('move');
                                    setSelectedAnnotationIndex(null);
                                    showHelper('Annotation completed');
                                }}
                                onDeleteAnnotation={(index) => {
                                    const arr = [...currentShapes];
                                    arr.splice(index, 1);
                                    handleAnnotationsChange(arr);
                                    showHelper('Annotation deleted');
                                    if (selectedAnnotationIndex === index) {
                                        setSelectedAnnotationIndex(null);
                                    } else if (selectedAnnotationIndex > index) {
                                        setSelectedAnnotationIndex(selectedAnnotationIndex - 1);
                                    }
                                }}
                                activeLabel={selectedLabelClass}
                                labelClasses={localLabelClasses}
                                segmentationType={segmentationType}
                                panopticOption={panopticOption}
                                pointsLimit={currentPointsLimit}
                                initialPosition={imagePosition}
                                externalSelectedIndex={selectedAnnotationIndex}
                                onSelectAnnotation={setSelectedAnnotationIndex}
                            />
                            {showHelperText && (
                                <div className="canvas-helper visible" ref={canvasHelperRef}>
                                    {helperText}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', margin: 'auto', padding: '40px' }}>
                            No images found
                        </div>
                    )}
                </div>
                <AnnotationListSidebar
                    annotations={currentShapes}
                    onDeleteAnnotation={(index) => {
                        const arr = [...currentShapes];
                        arr.splice(index, 1);
                        handleAnnotationsChange(arr);
                    }}
                    onUpdateAnnotation={(index, changes) => {
                        const arr = [...currentShapes];
                        arr[index] = { ...arr[index], ...changes };
                        handleAnnotationsChange(arr);
                    }}
                    labelClasses={localLabelClasses}
                    selectedAnnotationIndex={selectedAnnotationIndex}
                    setSelectedAnnotationIndex={setSelectedAnnotationIndex}
                    currentShapes={currentShapes}
                    onUpdateAllAnnotations={handleUpdateAllAnnotations}
                />
            </div>

            {showAddLabelModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Add New Label</h3>
                        <div>
                            <input
                                type="text"
                                placeholder="Label Name"
                                value={newLabelName}
                                onChange={(e) => setNewLabelName(e.target.value)}
                            />
                        </div>
                        <div className="color-palette">
                            {[
                                '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
                                '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
                                '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000',
                                '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9',
                            ].map((color, idx) => (
                                <div
                                    key={idx}
                                    className={`color-option ${newLabelColor === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setNewLabelColor(color)}
                                />
                            ))}
                        </div>
                        <div>
                            <input
                                type="color"
                                value={newLabelColor}
                                onChange={(e) => setNewLabelColor(e.target.value)}
                            />
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={async () => {
                                    if (!newLabelName.trim()) {
                                        showHelper('Label name cannot be empty');
                                        return;
                                    }
                                    const nameExists = localLabelClasses.some((lc) => lc.name.toLowerCase() === newLabelName.trim().toLowerCase());
                                    if (nameExists) {
                                        showHelper('Label already exists');
                                        return;
                                    }
                                    const colorExists = localLabelClasses.some((lc) => lc.color.toLowerCase() === newLabelColor.trim().toLowerCase());
                                    if (colorExists) {
                                        showHelper('Label color already used. Please choose a different color.');
                                        return;
                                    }
                                    const newLabel = { name: newLabelName.trim(), color: newLabelColor };
                                    const updatedLabels = [...localLabelClasses, newLabel];
                                    try {
                                        await fetch(`http://localhost:4000/api/projects/${projectData.project_id}/labels`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ labelClasses: updatedLabels }),
                                        });
                                        await fetch('http://localhost:4000/api/annotations', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                folderId: projectData ? projectData.folder_path.split('/')[1] : '',
                                                taskName,
                                                labelClasses: updatedLabels,
                                                annotations,
                                            }),
                                        });
                                        setLocalLabelClasses(updatedLabels);
                                        setSelectedLabelClass(newLabel.name);
                                        setNewLabelName('');
                                        setNewLabelColor('#ff0000');
                                        setShowAddLabelModal(false);
                                        showHelper(`Added new label: ${newLabel.name}`);
                                    } catch (error) {
                                        console.error('Error updating labels:', error);
                                        showHelper('Failed to add new label: ' + error.message);
                                    }
                                }}
                                className="primary"
                            >
                                Add
                            </button>
                            <button onClick={() => setShowAddLabelModal(false)} className="secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* {showPointsLimitModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>
                            {(() => {
                                if (pendingTool === 'polygon') return 'Polygon';
                                if (pendingTool === 'instance') return 'Instance';
                                if (pendingTool === 'semantic') return 'Semantic';
                                if (pendingTool === 'panoptic') return 'Panoptic';
                                return pendingTool.charAt(0).toUpperCase() + pendingTool.slice(1);
                            })()} Annotation Points Limit
                        </h3>
                        <div>
                            <input
                                type="number"
                                placeholder="Number of points (0 for unlimited)"
                                value={pointsLimitInput}
                                onChange={(e) => setPointsLimitInput(e.target.value)}
                            />
                        </div>
                        <div className="modal-footer">
                            <button
                                className="primary"
                                onClick={() => {
                                    const limit = parseInt(pointsLimitInput);
                                    setCurrentPointsLimit(isNaN(limit) ? 0 : limit);
                                    setSelectedTool(pendingTool);
                                    setShowPointsLimitModal(false);
                                    setPointsLimitInput('');
                                    showHelper(`Selected ${pendingTool} tool with ${isNaN(limit) ? 0 : limit} points limit`);
                                }}
                            >
                                Apply
                            </button>
                            <button
                                className="secondary"
                                onClick={() => {
                                    setShowPointsLimitModal(false);
                                    setPointsLimitInput('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )} */}

            {showConfirmDeleteModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Confirm Delete</h3>
                        <p>Are you sure you want to delete this image? This action cannot be undone.</p>
                        <div className="modal-footer">
                            <button onClick={confirmDeleteImage} className="primary" disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                            <button onClick={() => setShowConfirmDeleteModal(false)} className="secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAddImageModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Upload New Image</h3>
                        <div className="modal-section">
                            <h4>Select File(s)</h4>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => setNewFiles(e.target.files)}
                            />
                        </div>
                        <div className="modal-section">
                            <h4>Select Target Folder</h4>
                            <select
                                value={selectedAddFolder}
                                onChange={(e) => setSelectedAddFolder(e.target.value)}
                            >
                                <option value="">Select a folder</option>
                                {taskFolderPaths.map((fp, idx) => (
                                    <option key={idx} value={fp}>{fp}</option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="primary"
                                onClick={async () => {
                                    if (!newFiles || newFiles.length === 0 || !selectedAddFolder) {
                                        showHelper('Please select file(s) and a target folder.');
                                        return;
                                    }
                                    setIsSaving(true);
                                    showHelper('Uploading image(s)...');
                                    const formData = new FormData();
                                    for (let i = 0; i < newFiles.length; i++) {
                                        formData.append('files', newFiles[i]);
                                    }
                                    try {
                                        const response = await fetch(`http://localhost:4000/api/images/${encodeURIComponent(selectedAddFolder)}`, {
                                            method: 'POST',
                                            body: formData,
                                        });
                                        if (!response.ok) {
                                            throw new Error('Failed to upload image(s)');
                                        }
                                        const result = await response.json();
                                        if (result.files && result.files.length > 0) {
                                            const newFilesList = [...filesList, ...result.files];
                                            setFilesList(newFilesList);
                                            setCurrentIndex(newFilesList.length - result.files.length);
                                            showHelper(`Uploaded ${result.files.length} image(s) successfully`);
                                        } else {
                                            showHelper('No new images were uploaded');
                                        }
                                    } catch (error) {
                                        console.error('Error uploading images:', error);
                                        showHelper('Error uploading image(s): ' + error.message);
                                    } finally {
                                        setIsSaving(false);
                                        setShowAddImageModal(false);
                                        setNewFiles(null);
                                        setSelectedAddFolder('');
                                    }
                                }}
                            >
                                Upload
                            </button>
                            <button
                                className="secondary"
                                onClick={() => {
                                    setShowAddImageModal(false);
                                    setNewFiles(null);
                                    setSelectedAddFolder('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts Modal */}
            {showKeyboardShortcutsModal && (
                <div className="modal-backdrop">
                    <div className="modal shortcuts-modal">
                        <h3>Keyboard Shortcuts <span className="modal-subtitle">// Quick Commands</span></h3>
                        <div className="shortcuts-container">
                            <div className="shortcuts-column">
                                <div className="shortcuts-section">
                                    <h4>Navigation</h4>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">←</span></div>
                                        <div className="shortcut-description">Previous Image</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">→</span></div>
                                        <div className="shortcut-description">Next Image</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">C</span></div>
                                        <div className="shortcut-description">Center Image</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">F</span></div>
                                        <div className="shortcut-description">Fit Image to Canvas</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">N</span></div>
                                        <div className="shortcut-description">Use Last Selected Tool</div>
                                    </div>
                                </div>

                                <div className="shortcuts-section">
                                    <h4>Actions</h4>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">Ctrl</span> + <span className="key">Z</span></div>
                                        <div className="shortcut-description">Undo</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">Ctrl</span> + <span className="key">Y</span></div>
                                        <div className="shortcut-description">Redo</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">Ctrl</span> + <span className="key">S</span></div>
                                        <div className="shortcut-description">Save</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">Ctrl</span> + <span className="key">B</span></div>
                                        <div className="shortcut-description">Fill Background</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">Ctrl</span> + <span className="key">C</span></div>
                                        <div className="shortcut-description">Copy Selected Annotation</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">Ctrl</span> + <span className="key">V</span></div>
                                        <div className="shortcut-description">Paste Annotation</div>
                                    </div>
                                </div>
                            </div>

                            <div className="shortcuts-column">
                                <div className="shortcuts-section">
                                    <h4>Tools</h4>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">M</span></div>
                                        <div className="shortcut-description">Move Tool</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">P</span></div>
                                        <div className="shortcut-description">Polygon Tool</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">E</span></div>
                                        <div className="shortcut-description">Ellipse Tool</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">I</span></div>
                                        <div className="shortcut-description">Instance Segmentation</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">S</span></div>
                                        <div className="shortcut-description">Semantic Segmentation</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">P</span></div>
                                        <div className="shortcut-description">Panoptic Segmentation</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">Backspace/Delete</span></div>
                                        <div className="shortcut-description">Remove Last Point</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">Escape</span></div>
                                        <div className="shortcut-description">Cancel Current Annotation</div>
                                    </div>
                                </div>

                                <div className="shortcuts-section">
                                    <h4>Zoom</h4>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">Ctrl</span> + <span className="key">+</span></div>
                                        <div className="shortcut-description">Zoom In</div>
                                    </div>
                                    <div className="shortcut-row">
                                        <div className="key-combo"><span className="key">Ctrl</span> + <span className="key">-</span></div>
                                        <div className="shortcut-description">Zoom Out</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="terminal-footer">
                            <div className="terminal-prompt">
                                <span className="prompt-user">user</span>
                                <span className="prompt-separator">@</span>
                                <span className="prompt-machine">annotator</span>
                                <span className="prompt-tilde">:</span>
                                <span className="prompt-path">~</span>
                                <span className="prompt-dollar">$</span>
                                <span className="prompt-command blink">close</span>
                            </div>
                            <button onClick={() => setShowKeyboardShortcutsModal(false)} className="terminal-btn">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
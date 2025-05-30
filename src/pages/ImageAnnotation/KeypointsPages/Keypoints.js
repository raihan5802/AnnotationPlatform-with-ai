// src/pages/Keypoints.js
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import UserHomeTopBar from '../../../components/UserHomeTopBar';
import KeypointsCanvas from '../../../components/KeypointsCanvas';
import AnnotationListSidebar from '../../../components/AnnotationListSidebar';
import KeypointsExport from './KeypointsExport';
import './Keypoints.css';

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

const PointIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
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

const KeypointsListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="3" cy="6" r="2" />
        <circle cx="3" cy="12" r="2" />
        <circle cx="3" cy="18" r="2" />
    </svg>
);

export default function Keypoints() {
    const navigate = useNavigate();
    const { state } = useLocation();
    // Expect taskId from location.state
    const taskId = state?.taskId;

    // New state variables for task & project data and files list
    const [taskData, setTaskData] = useState(null);
    const [projectData, setProjectData] = useState(null);
    const [filesList, setFilesList] = useState([]);
    const [allFiles, setAllFiles] = useState([]);

    // Retain annotation and UI states
    const [annotations, setAnnotations] = useState({});
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [showHelperText, setShowHelperText] = useState(false);
    const [helperText, setHelperText] = useState('');
    const [imageDimensions, setImageDimensions] = useState({});
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
    const [selectedTool, setSelectedTool] = useState('move');
    const [selectedLabelClass, setSelectedLabelClass] = useState('');
    const [localLabelClasses, setLocalLabelClasses] = useState([]);
    const [scale, setScale] = useState(1.0);
    const [currentPointsLimit, setCurrentPointsLimit] = useState(0);
    const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState(null);
    const [lastToolState, setLastToolState] = useState({ tool: null, pointsLimit: 0 });
    const [showAddLabelModal, setShowAddLabelModal] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#ff0000');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

    // NEW: State for Add Image modal – for uploading a new image
    const [showAddImageModal, setShowAddImageModal] = useState(false);
    // We use task.selected_files (split by ';') to list available folder paths
    const [taskFolderPaths, setTaskFolderPaths] = useState([]);
    // NEW: State to hold the new file(s) chosen by the user for upload
    const [newFiles, setNewFiles] = useState(null);
    // NEW: State for the target folder (the full folder path from the task) chosen by the user
    const [selectedAddFolder, setSelectedAddFolder] = useState('');

    // NEW: State to trigger export modal visibility
    const [triggerExportModal, setTriggerExportModal] = useState(false);

    const fileInputRef = useRef(null);
    const canvasHelperRef = useRef(null);
    const canvasAreaRef = useRef(null);

    // States for keypoints-limited functionality
    const [isKeypointsLimited, setIsKeypointsLimited] = useState(false);
    const [keypointsConfig, setKeypointsConfig] = useState(null);
    const [currentPointIndex, setCurrentPointIndex] = useState(0);
    const [newPointLabel, setNewPointLabel] = useState('');
    const [showPointLabels, setShowPointLabels] = useState(false);

    // State for Keyboard Shortcuts Modal
    const [showKeyboardShortcutsModal, setShowKeyboardShortcutsModal] = useState(false);


    // Helper: extract files from the folder tree given a base path
    const extractFilesFromTree = (node, basePath) => {
        let files = [];
        if (node.type === 'file') {
            const url = `http://localhost:4000/uploads/${basePath}/${node.name}`;
            files.push({ originalname: node.name, url });
        } else if (node.type === 'folder' && node.children) {
            const baseParts = basePath.split('/');
            const lastSegment = baseParts[baseParts.length - 1];
            const newBasePath = (node.name === lastSegment) ? basePath : basePath + '/' + node.name;
            node.children.forEach(child => {
                files = files.concat(extractFilesFromTree(child, newBasePath));
            });
        }
        return files;
    };

    // Fetch task and project data based on taskId and check if it's keypoints(limited)
    useEffect(() => {
        if (!taskId) {
            alert("No task id provided. Please create a task first.");
            navigate('/userhome');
            return;
        }
        fetch('http://localhost:4000/api/tasks')
            .then(res => res.json())
            .then(tasks => {
                const task = tasks.find(t => t.task_id === taskId);
                if (!task) {
                    alert("Task not found.");
                    navigate('/userhome');
                    return;
                }
                setTaskData(task);
                const folderPaths = task.selected_files.split(';').filter(x => x);
                setTaskFolderPaths(folderPaths);

                // Check if this is a keypoints(limited) task
                setIsKeypointsLimited(task.annotation_type === 'keypoints(limited)');

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

                        // If this is keypoints(limited), fetch the keypoints configuration
                        if (task.annotation_type === 'keypoints(limited)') {
                            const folderId = project.folder_path.split('/')[1];
                            fetch(`http://localhost:4000/api/keypoints-config/${folderId}/${taskId}`)
                                .then(res => {
                                    if (!res.ok) {
                                        throw new Error('Keypoints configuration not found');
                                    }
                                    return res.json();
                                })
                                .then(configData => {
                                    setKeypointsConfig(configData);
                                    setCurrentPointsLimit(configData.numberOfPoints);
                                })
                                .catch(err => {
                                    console.error("Error fetching keypoints configuration:", err);
                                    showHelper('Error loading keypoints configuration');
                                });
                        }

                        const fetchFolderPromises = folderPaths.map(folderPath => {
                            return fetch(`http://localhost:4000/api/folder-structure/${encodeURIComponent(folderPath)}`)
                                .then(res => res.json());
                        });
                        Promise.all(fetchFolderPromises)
                            .then(results => {
                                let allFilesFetched = [];
                                results.forEach((tree, idx) => {
                                    const filesFromTree = extractFilesFromTree(tree, folderPaths[idx]);
                                    allFilesFetched = allFilesFetched.concat(filesFromTree);
                                });
                                setFilesList(allFilesFetched);
                            })
                            .catch(err => console.error("Error fetching folder structures", err));
                    });
            })
            .catch(err => console.error("Error fetching tasks", err));
    }, [taskId, navigate]);

    const taskName = taskData ? taskData.task_name : '';
    const currentFileUrl = filesList[currentIndex]?.url;
    // Do not filter the annotations since we now want to store what is returned by the canvas.
    const currentShapes = annotations[currentFileUrl] || [];

    // Helper function to show helper text
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

    // load annotations
    useEffect(() => {
        if (projectData) {
            const folderId = projectData.folder_path.split('/')[1];
            fetch(`http://localhost:4000/api/annotations/${folderId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.annotations) {
                        setAnnotations(data.annotations);
                    }
                })
                .catch(err => console.error("Error fetching annotations", err));
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

                // Calculate the scale to fit the image within the canvas
                const fitScale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);

                // Calculate position to center the image in the scaled coordinate system
                const groupX = (canvasWidth / 2 / fitScale) - (imageWidth / 2);
                const groupY = (canvasHeight / 2 / fitScale) - (imageHeight / 2);

                // Update the states
                setScale(fitScale);
                setImagePosition({ x: groupX, y: groupY });
            };
        }
    };

    useEffect(() => {
        fitImage();
    }, [currentFileUrl]);

    const handleFit = () => {
        fitImage();
        showHelper('Image fitted to canvas');
    };

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

    useEffect(() => {
        setScale(1.0);
    }, [currentIndex]);

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

    // Store shapes as they are without filtering.
    const handleAnnotationsChange = (newShapes) => {
        const updated = {
            ...annotations,
            [currentFileUrl]: newShapes,
        };
        setUndoStack([...undoStack, annotations]);
        setRedoStack([]);
        setAnnotations(updated);
    };

    const handleUpdateAllAnnotations = (updatedAnnotations) => {
        const updated = {
            ...annotations,
            [currentFileUrl]: updatedAnnotations,
        };
        setUndoStack([...undoStack, annotations]);
        setRedoStack([]);
        setAnnotations(updated);
    };

    useEffect(() => {
        setSelectedAnnotationIndex(null);
    }, [currentIndex, currentFileUrl]);

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(i => i - 1);
    };

    const handleNext = async () => {
        if (currentIndex < filesList.length - 1) {
            const saved = await handleSave();
            if (saved) {
                setCurrentIndex(i => i + 1);
            } else {
                alert('Failed to save annotations. Please try again.');
            }
        }
    };

    const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 5));
    const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.2));
    const handleWheelZoom = (deltaY) => {
        if (deltaY < 0) handleZoomIn();
        else handleZoomOut();
    };

    const handleSave = async () => {
        setIsSaving(true);
        const folderId = projectData ? projectData.folder_path.split('/')[1] : '';
        const bodyData = {
            folderId,
            taskName,
            labelClasses: localLabelClasses,
            annotations,
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

    const handleToolChange = (tool) => {
        if (isKeypointsLimited && tool === 'point') {
            // For keypoints(limited), we don't need to prompt for points limit
            // It's already set from the configuration
            setSelectedTool(tool);
            showHelper(`Point tool selected (${currentPointsLimit} points limit)`);
        } else {
            setSelectedTool(tool);
        }
    };

    // Function to select the current point to label in keypoints(limited) mode
    const selectKeypointToLabel = (index) => {
        if (!keypointsConfig || !keypointsConfig.pointLabels) return;

        // Make sure the index is valid
        const validIndex = Math.min(Math.max(0, index), keypointsConfig.pointLabels.length - 1);
        setCurrentPointIndex(validIndex);

        // Set active label for this point
        if (localLabelClasses.length > 0) {
            const pointLabel = keypointsConfig.pointLabels[validIndex];
            // Find or create a label with this name
            const existingLabel = localLabelClasses.find(lc => lc.name === pointLabel);
            if (existingLabel) {
                setSelectedLabelClass(existingLabel.name);
            } else {
                // If no label exists with this name, use the first available label
                setSelectedLabelClass(localLabelClasses[0].name);
            }
        }
    };

    // When adding a point in keypoints(limited) mode, auto-advance to the next point
    const handlePointAdded = () => {
        if (isKeypointsLimited && keypointsConfig && keypointsConfig.pointLabels) {
            const nextIndex = (currentPointIndex + 1) % keypointsConfig.pointLabels.length;
            selectKeypointToLabel(nextIndex);
        }
    };

    const handleAddPointLabel = async () => {
        if (!newPointLabel.trim() || !keypointsConfig || !projectData || !taskId) {
            return;
        }

        const folderId = projectData.folder_path.split('/')[1];

        // Create updated config with new label
        const updatedConfig = {
            ...keypointsConfig,
            numberOfPoints: keypointsConfig.numberOfPoints + 1,
            pointLabels: [...keypointsConfig.pointLabels, newPointLabel.trim()]
        };

        try {
            const response = await fetch(`http://localhost:4000/api/keypoints-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folderId: folderId,
                    taskId: taskId,
                    keypointsData: updatedConfig
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update keypoints configuration');
            }

            // Update local state
            setKeypointsConfig(updatedConfig);
            setCurrentPointsLimit(updatedConfig.numberOfPoints);
            setNewPointLabel('');
            showHelper(`Added new point label: ${newPointLabel}`);
        } catch (error) {
            console.error('Error updating keypoints configuration:', error);
            showHelper('Failed to add new point label');
        }
    };

    const activeLabelColor = localLabelClasses.find(l => l.name === selectedLabelClass)?.color || '#ff0000';

    // NEW: Updated Add Image handler – now opens modal for uploading a new image
    const handleAddImage = () => {
        setShowAddImageModal(true);
    };

    // Updated Delete Image Handler
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
            // Extract folderId and relative path from URL.
            const relativePathFull = currentFile.url.split('/uploads/')[1];
            const parts = relativePathFull.split('/');
            const folderId = parts.shift();
            const relativePath = parts.join('/');
            const response = await fetch(`http://localhost:4000/api/images/${folderId}/${relativePath}`, {
                method: 'DELETE'
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

    // Trigger export modal (set to true for one render cycle)
    const handleExportTrigger = () => {
        setTriggerExportModal(true);
        // Optionally, you might auto-close the export modal after export.
    };

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
                        //fix - how is this even working?
                        if (lastToolState.tool) {
                            setCurrentPointsLimit(lastToolState.pointsLimit);
                            setSelectedTool(lastToolState.tool);
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
                    case 'o':
                    case 'O':
                        handleToolChange('point');
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
                    // Add inside the switch statement for keydown events:
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                    case '8':
                    case '9':
                        // If in keypoints(limited) mode, number keys select the point to label
                        if (isKeypointsLimited && keypointsConfig && keypointsConfig.pointLabels) {
                            const index = parseInt(e.key) - 1;
                            if (index >= 0 && index < keypointsConfig.pointLabels.length) {
                                selectKeypointToLabel(index);
                                showHelper(`Selected point ${index + 1}: ${keypointsConfig.pointLabels[index]}`);
                            }
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
    }, [annotations, undoStack, redoStack, currentIndex, filesList.length, selectedAnnotationIndex, handleCenterImage]);

    return (
        <div className="annotate-container">
            {/* Hidden file input remains for other purposes */}
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
                <button onClick={handleExportTrigger}>Export</button>
                <span className="img-count">{currentIndex + 1} / {filesList.length}</span>
            </div>
            <div className="annotate-main">
                {/* Tools Sidebar */}
                <div className="tools-sidebar">
                    <div className="sidebar-section">
                        <h3><ToolsIcon /> Tools</h3>
                        <div className="tool-grid">
                            <div className={`tool-button ${selectedTool === 'move' ? 'active' : ''}`} onClick={() => setSelectedTool('move')} title="Move Tool (M)">
                                <div className="tool-icon"><MoveIcon /></div>
                                <div className="tool-name">Move</div>
                                <div className="keyboard-hint">M</div>
                            </div>
                            <div className={`tool-button ${selectedTool === 'point' ? 'active' : ''}`} onClick={() => handleToolChange('point')} title="Point Tool (O)">
                                <div className="tool-icon"><PointIcon /></div>
                                <div className="tool-name">Point</div>
                                <div className="keyboard-hint">O</div>
                            </div>
                        </div>
                        {/* Inline option for points limit when using point tool */}
                        {selectedTool === 'point' && (
                            <div className="points-limit-option" style={{ marginTop: '10px', fontSize: '0.9em' }}>
                                <label htmlFor="point-points-limit">Points Limit (0 for unlimited): </label>
                                <input
                                    id="point-points-limit"
                                    type="number"
                                    value={currentPointsLimit}
                                    onChange={(e) => setCurrentPointsLimit(parseInt(e.target.value) || 0)}
                                    style={{ width: '80px', marginLeft: '8px' }}
                                />
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
                    {/* new Points Labels section */}
                    {isKeypointsLimited && keypointsConfig && (
                        <div className="sidebar-section">
                            <div className="section-header-with-toggle">
                                <h3><KeypointsListIcon /> Points Labels</h3>
                                <div className="toggle-switch">
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={showPointLabels}
                                            onChange={() => setShowPointLabels(!showPointLabels)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                    <span className="toggle-label">Show Labels</span>
                                </div>
                            </div>
                            <div className="points-labels-list">
                                {keypointsConfig.pointLabels.map((label, idx) => (
                                    <div
                                        key={idx}
                                        className={`point-label-item ${currentPointIndex === idx ? 'active' : ''}`}
                                        onClick={() => selectKeypointToLabel(idx)}
                                    >
                                        <span className="point-number">{idx + 1}</span>
                                        <span className="point-label-name">{label}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Add Points Label input and button */}
                            <div className="add-point-label-row">
                                <input
                                    type="text"
                                    placeholder="New point label"
                                    value={newPointLabel}
                                    onChange={(e) => setNewPointLabel(e.target.value)}
                                    className="new-point-label-input"
                                />
                                <button
                                    className="add-point-btn"
                                    onClick={handleAddPointLabel}
                                    disabled={!newPointLabel.trim()}
                                >
                                    <PlusIcon /> Add
                                </button>
                            </div>
                        </div>
                    )}


                </div>
                {/* Canvas */}
                <div className="canvas-area" ref={canvasAreaRef}>
                    {currentFileUrl ? (
                        <>
                            <KeypointsCanvas
                                key={currentFileUrl}
                                fileUrl={currentFileUrl}
                                annotations={currentShapes}
                                onAnnotationsChange={handleAnnotationsChange}
                                selectedTool={selectedTool}
                                scale={scale}
                                onWheelZoom={handleWheelZoom}
                                activeLabelColor={activeLabelColor}
                                onFinishShape={() => {
                                    setLastToolState({ tool: selectedTool, pointsLimit: currentPointsLimit });
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
                                pointsLimit={currentPointsLimit}
                                initialPosition={imagePosition}
                                externalSelectedIndex={selectedAnnotationIndex}
                                onSelectAnnotation={setSelectedAnnotationIndex}
                                isKeypointsLimited={isKeypointsLimited}
                                onPointAdded={handlePointAdded}
                                currentPointLabel={isKeypointsLimited && keypointsConfig ? keypointsConfig.pointLabels[currentPointIndex] : null}
                                showPointLabels={showPointLabels}
                                pointLabels={isKeypointsLimited && keypointsConfig ? keypointsConfig.pointLabels : []}

                            />
                            {showHelperText && (
                                <div className="canvas-helper visible" ref={canvasHelperRef}>
                                    {helperText}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', margin: 'auto', padding: '40px' }}>No images found</div>
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
            {/* Re-implemented KeypointsExport with export logic */}
            {/* <KeypointsExport
                annotations={annotations}
                filesList={filesList}
                imageDimensions={imageDimensions}
                localLabelClasses={localLabelClasses}
                handleSave={handleSave}
                showHelper={showHelper}
                isSaving={isSaving}
                triggerExportModal={triggerExportModal}
                setTriggerExportModal={setTriggerExportModal}
            /> */}
            {showAddLabelModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Add New Label</h3>
                        <div>
                            <input type="text" placeholder="Label Name" value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} />
                        </div>
                        <div className="color-palette">
                            {[
                                '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
                                '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
                                '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000',
                                '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9'
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
                            <input type="color" value={newLabelColor} onChange={(e) => setNewLabelColor(e.target.value)} />
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={async () => {
                                    if (!newLabelName.trim()) {
                                        showHelper('Label name cannot be empty');
                                        return;
                                    }
                                    const nameExists = localLabelClasses.some(lc => lc.name.toLowerCase() === newLabelName.trim().toLowerCase());
                                    if (nameExists) {
                                        showHelper('Label already exists');
                                        return;
                                    }
                                    const colorExists = localLabelClasses.some(lc => lc.color.toLowerCase() === newLabelColor.trim().toLowerCase());
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
                                            body: JSON.stringify({ labelClasses: updatedLabels })
                                        });
                                        await fetch('http://localhost:4000/api/annotations', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                folderId: projectData ? projectData.folder_path.split('/')[1] : '',
                                                taskName,
                                                labelClasses: updatedLabels,
                                                annotations
                                            })
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
                            <button className="primary" onClick={async () => {
                                if (!newFiles || newFiles.length === 0 || !selectedAddFolder) {
                                    showHelper("Please select file(s) and a target folder.");
                                    return;
                                }
                                setIsSaving(true);
                                showHelper("Uploading image(s)...");
                                const formData = new FormData();
                                for (let i = 0; i < newFiles.length; i++) {
                                    formData.append('files', newFiles[i]);
                                }
                                try {
                                    const response = await fetch(`http://localhost:4000/api/images/${encodeURIComponent(selectedAddFolder)}`, {
                                        method: 'POST',
                                        body: formData
                                    });
                                    if (!response.ok) {
                                        throw new Error("Failed to upload image(s)");
                                    }
                                    const result = await response.json();
                                    if (result.files && result.files.length > 0) {
                                        const newFilesList = [...filesList, ...result.files];
                                        setFilesList(newFilesList);
                                        setCurrentIndex(newFilesList.length - result.files.length);
                                        showHelper(`Uploaded ${result.files.length} image(s) successfully`);
                                    } else {
                                        showHelper("No new images were uploaded");
                                    }
                                } catch (error) {
                                    console.error("Error uploading images:", error);
                                    showHelper("Error uploading image(s): " + error.message);
                                } finally {
                                    setIsSaving(false);
                                    setShowAddImageModal(false);
                                    setNewFiles(null);
                                    setSelectedAddFolder("");
                                }
                            }}>
                                Upload
                            </button>
                            <button className="secondary" onClick={() => {
                                setShowAddImageModal(false);
                                setNewFiles(null);
                                setSelectedAddFolder("");
                            }}>
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
                                        <div className="key-combo"><span className="key">O</span></div>
                                        <div className="shortcut-description">Point Tool</div>
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


// // src/pages/Keypoints.js
// import React, { useState, useEffect, useRef } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';

// import UserHomeTopBar from '../../../components/UserHomeTopBar';
// import KeypointsCanvas from '../../../components/KeypointsCanvas';
// import AnnotationListSidebar from '../../../components/AnnotationListSidebar';
// import KeypointsExport from './KeypointsExport';
// import './Keypoints.css';

// // SVG Icon Components
// const UndoIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M9 14L4 9l5-5" />
//         <path d="M4 9h10c3 0 7 1 7 6v1" />
//     </svg>
// );

// const RedoIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M15 14l5-5-5-5" />
//         <path d="M20 9H10C7 9 3 10 3 15v1" />
//     </svg>
// );

// const SaveIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
//         <polyline points="17 21 17 13 7 13 7 21" />
//         <polyline points="7 3 7 8 15 8" />
//     </svg>
// );

// const MoveIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <polyline points="5 9 2 12 5 15" />
//         <polyline points="9 5 12 2 15 5" />
//         <polyline points="15 19 12 22 9 19" />
//         <polyline points="19 9 22 12 19 15" />
//         <line x1="2" y1="12" x2="22" y2="12" />
//         <line x1="12" y1="2" x2="12" y2="22" />
//     </svg>
// );

// const FitIcon = () => (
//     <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="16"
//         height="16"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//     >
//         <rect x="3" y="3" width="18" height="18" />
//         <path d="M12 3v18" />
//         <path d="M3 12h18" />
//     </svg>
// );

// const PointIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <circle cx="12" cy="12" r="10" />
//         <circle cx="12" cy="12" r="3" />
//     </svg>
// );

// const PlusIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <line x1="12" y1="5" x2="12" y2="19" />
//         <line x1="5" y1="12" x2="19" y2="12" />
//     </svg>
// );

// const PaletteIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <circle cx="13.5" cy="6.5" r="2.5" />
//         <circle cx="17.5" cy="10.5" r="2.5" />
//         <circle cx="8.5" cy="7.5" r="2.5" />
//         <circle cx="6.5" cy="12.5" r="2.5" />
//         <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.688h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
//     </svg>
// );

// const ToolsIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
//     </svg>
// );

// const CenterIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <circle cx="12" cy="12" r="10" />
//         <line x1="12" y1="8" x2="12" y2="16" />
//         <line x1="8" y1="12" x2="16" y2="12" />
//     </svg>
// );

// const AddImageIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
//         <circle cx="8.5" cy="8.5" r="1.5" />
//         <polyline points="21 15 16 10 5 21" />
//         <line x1="12" y1="9" x2="12" y2="15" />
//         <line x1="9" y1="12" x2="15" y2="12" />
//     </svg>
// );

// const DeleteImageIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
//         <circle cx="8.5" cy="8.5" r="1.5" />
//         <polyline points="21 15 16 10 5 21" />
//         <line x1="9" y1="9" x2="15" y2="15" />
//         <line x1="15" y1="9" x2="9" y2="15" />
//     </svg>
// );

// export default function Keypoints() {
//     const navigate = useNavigate();
//     const { state } = useLocation();
//     // Expect taskId from location.state
//     const taskId = state?.taskId;

//     // New state variables for task & project data and files list
//     const [taskData, setTaskData] = useState(null);
//     const [projectData, setProjectData] = useState(null);
//     const [filesList, setFilesList] = useState([]);
//     const [allFiles, setAllFiles] = useState([]);

//     // Retain annotation and UI states
//     const [annotations, setAnnotations] = useState({});
//     const [undoStack, setUndoStack] = useState([]);
//     const [redoStack, setRedoStack] = useState([]);
//     const [currentIndex, setCurrentIndex] = useState(0);
//     const [isSaving, setIsSaving] = useState(false);
//     const [showHelperText, setShowHelperText] = useState(false);
//     const [helperText, setHelperText] = useState('');
//     const [imageDimensions, setImageDimensions] = useState({});
//     const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
//     const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
//     const [selectedTool, setSelectedTool] = useState('move');
//     const [selectedLabelClass, setSelectedLabelClass] = useState('');
//     const [localLabelClasses, setLocalLabelClasses] = useState([]);
//     const [scale, setScale] = useState(1.0);
//     const [currentPointsLimit, setCurrentPointsLimit] = useState(0);
//     const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState(null);
//     const [lastToolState, setLastToolState] = useState({ tool: null, pointsLimit: 0 });
//     const [showAddLabelModal, setShowAddLabelModal] = useState(false);
//     const [newLabelName, setNewLabelName] = useState('');
//     const [newLabelColor, setNewLabelColor] = useState('#ff0000');
//     const [isDeleting, setIsDeleting] = useState(false);
//     const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

//     // NEW: State for Add Image modal – for uploading a new image
//     const [showAddImageModal, setShowAddImageModal] = useState(false);
//     // We use task.selected_files (split by ';') to list available folder paths
//     const [taskFolderPaths, setTaskFolderPaths] = useState([]);
//     // NEW: State to hold the new file(s) chosen by the user for upload
//     const [newFiles, setNewFiles] = useState(null);
//     // NEW: State for the target folder (the full folder path from the task) chosen by the user
//     const [selectedAddFolder, setSelectedAddFolder] = useState('');

//     // NEW: State to trigger export modal visibility
//     const [triggerExportModal, setTriggerExportModal] = useState(false);

//     const fileInputRef = useRef(null);
//     const canvasHelperRef = useRef(null);
//     const canvasAreaRef = useRef(null);

//     // Helper: extract files from the folder tree given a base path
//     const extractFilesFromTree = (node, basePath) => {
//         let files = [];
//         if (node.type === 'file') {
//             const url = `http://localhost:4000/uploads/${basePath}/${node.name}`;
//             files.push({ originalname: node.name, url });
//         } else if (node.type === 'folder' && node.children) {
//             const baseParts = basePath.split('/');
//             const lastSegment = baseParts[baseParts.length - 1];
//             const newBasePath = (node.name === lastSegment) ? basePath : basePath + '/' + node.name;
//             node.children.forEach(child => {
//                 files = files.concat(extractFilesFromTree(child, newBasePath));
//             });
//         }
//         return files;
//     };

//     // Fetch task and project data based on taskId
//     useEffect(() => {
//         if (!taskId) {
//             alert("No task id provided. Please create a task first.");
//             navigate('/userhome');
//             return;
//         }
//         fetch('http://localhost:4000/api/tasks')
//             .then(res => res.json())
//             .then(tasks => {
//                 const task = tasks.find(t => t.task_id === taskId);
//                 if (!task) {
//                     alert("Task not found.");
//                     navigate('/userhome');
//                     return;
//                 }
//                 setTaskData(task);
//                 const folderPaths = task.selected_files.split(';').filter(x => x);
//                 setTaskFolderPaths(folderPaths);
//                 fetch('http://localhost:4000/api/projects')
//                     .then(res => res.json())
//                     .then(projects => {
//                         const project = projects.find(p => p.project_id === task.project_id);
//                         if (!project) {
//                             alert("Project not found.");
//                             navigate('/userhome');
//                             return;
//                         }
//                         setProjectData(project);
//                         setLocalLabelClasses(project.label_classes || []);
//                         if (project.label_classes && project.label_classes.length > 0) {
//                             setSelectedLabelClass(project.label_classes[0].name);
//                         }
//                         const fetchFolderPromises = folderPaths.map(folderPath => {
//                             return fetch(`http://localhost:4000/api/folder-structure/${encodeURIComponent(folderPath)}`)
//                                 .then(res => res.json());
//                         });
//                         Promise.all(fetchFolderPromises)
//                             .then(results => {
//                                 let allFilesFetched = [];
//                                 results.forEach((tree, idx) => {
//                                     const filesFromTree = extractFilesFromTree(tree, folderPaths[idx]);
//                                     allFilesFetched = allFilesFetched.concat(filesFromTree);
//                                 });
//                                 setFilesList(allFilesFetched);
//                             })
//                             .catch(err => console.error("Error fetching folder structures", err));
//                     });
//             })
//             .catch(err => console.error("Error fetching tasks", err));
//     }, [taskId, navigate]);

//     const taskName = taskData ? taskData.task_name : '';
//     const currentFileUrl = filesList[currentIndex]?.url;
//     // Do not filter the annotations since we now want to store what is returned by the canvas.
//     const currentShapes = annotations[currentFileUrl] || [];

//     // Helper function to show helper text
//     const showHelper = (text) => {
//         setHelperText(text);
//         setShowHelperText(true);
//         if (canvasHelperRef.current) {
//             canvasHelperRef.current.classList.add('visible');
//         }
//         setTimeout(() => {
//             if (canvasHelperRef.current) {
//                 canvasHelperRef.current.classList.remove('visible');
//             }
//             setTimeout(() => setShowHelperText(false), 300);
//         }, 3000);
//     };

//     // load annotations
//     useEffect(() => {
//         if (projectData) {
//             const folderId = projectData.folder_path.split('/')[1];
//             fetch(`http://localhost:4000/api/annotations/${folderId}`)
//                 .then(res => res.json())
//                 .then(data => {
//                     if (data.annotations) {
//                         setAnnotations(data.annotations);
//                     }
//                 })
//                 .catch(err => console.error("Error fetching annotations", err));
//         }
//     }, [projectData]);

//     const fitImage = () => {
//         if (currentFileUrl && canvasAreaRef.current) {
//             const img = new Image();
//             img.src = currentFileUrl;
//             img.onload = () => {
//                 const canvasWidth = canvasAreaRef.current.offsetWidth;
//                 const canvasHeight = canvasAreaRef.current.offsetHeight;
//                 const imageWidth = img.width;
//                 const imageHeight = img.height;

//                 // Calculate the scale to fit the image within the canvas
//                 const fitScale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);

//                 // Calculate position to center the image in the scaled coordinate system
//                 const groupX = (canvasWidth / 2 / fitScale) - (imageWidth / 2);
//                 const groupY = (canvasHeight / 2 / fitScale) - (imageHeight / 2);

//                 // Update the states
//                 setScale(fitScale);
//                 setImagePosition({ x: groupX, y: groupY });
//             };
//         }
//     };

//     useEffect(() => {
//         fitImage();
//     }, [currentFileUrl]);

//     const handleFit = () => {
//         fitImage();
//         showHelper('Image fitted to canvas');
//     };

//     const handleCenterImage = () => {
//         if (currentFileUrl) {
//             const img = new Image();
//             img.src = currentFileUrl;
//             img.onload = () => {
//                 if (canvasAreaRef.current) {
//                     const canvasWidth = canvasAreaRef.current.offsetWidth;
//                     const canvasHeight = canvasAreaRef.current.offsetHeight;
//                     const logicalCanvasWidth = canvasWidth / scale;
//                     const logicalCanvasHeight = canvasHeight / scale;
//                     const xPos = (logicalCanvasWidth - img.width) / 2;
//                     const yPos = (logicalCanvasHeight - img.height) / 2;
//                     setImagePosition({ x: xPos, y: yPos });
//                     showHelper('Image centered');
//                 }
//             };
//         }
//     };

//     useEffect(() => {
//         setScale(1.0);
//     }, [currentIndex]);

//     const undo = () => {
//         if (undoStack.length === 0) return;
//         const prev = undoStack[undoStack.length - 1];
//         setRedoStack([...redoStack, annotations]);
//         setUndoStack(undoStack.slice(0, -1));
//         setAnnotations(prev);
//         showHelper('Undo successful');
//     };

//     const redo = () => {
//         if (redoStack.length === 0) return;
//         const next = redoStack[redoStack.length - 1];
//         setUndoStack([...undoStack, annotations]);
//         setRedoStack(redoStack.slice(0, -1));
//         setAnnotations(next);
//         showHelper('Redo successful');
//     };

//     // Store shapes as they are without filtering.
//     const handleAnnotationsChange = (newShapes) => {
//         const updated = {
//             ...annotations,
//             [currentFileUrl]: newShapes,
//         };
//         setUndoStack([...undoStack, annotations]);
//         setRedoStack([]);
//         setAnnotations(updated);
//     };

//     const handleUpdateAllAnnotations = (updatedAnnotations) => {
//         const updated = {
//             ...annotations,
//             [currentFileUrl]: updatedAnnotations,
//         };
//         setUndoStack([...undoStack, annotations]);
//         setRedoStack([]);
//         setAnnotations(updated);
//     };

//     useEffect(() => {
//         setSelectedAnnotationIndex(null);
//     }, [currentIndex, currentFileUrl]);

//     const handlePrev = () => {
//         if (currentIndex > 0) setCurrentIndex(i => i - 1);
//     };

//     const handleNext = async () => {
//         if (currentIndex < filesList.length - 1) {
//             const saved = await handleSave();
//             if (saved) {
//                 setCurrentIndex(i => i + 1);
//             } else {
//                 alert('Failed to save annotations. Please try again.');
//             }
//         }
//     };

//     const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 5));
//     const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.2));
//     const handleWheelZoom = (deltaY) => {
//         if (deltaY < 0) handleZoomIn();
//         else handleZoomOut();
//     };

//     const handleSave = async () => {
//         setIsSaving(true);
//         const folderId = projectData ? projectData.folder_path.split('/')[1] : '';
//         const bodyData = {
//             folderId,
//             taskName,
//             labelClasses: localLabelClasses,
//             annotations,
//         };
//         try {
//             const res = await fetch('http://localhost:4000/api/annotations', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(bodyData),
//             });
//             if (!res.ok) {
//                 throw new Error('Failed to save annotations');
//             }
//             await res.json();
//             showHelper('Annotations saved successfully');
//             return true;
//         } catch (err) {
//             console.error(err);
//             showHelper('Error saving annotations');
//             return false;
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     const handleToolChange = (tool) => {
//         setSelectedTool(tool);
//     };

//     const activeLabelColor = localLabelClasses.find(l => l.name === selectedLabelClass)?.color || '#ff0000';

//     // NEW: Updated Add Image handler – now opens modal for uploading a new image
//     const handleAddImage = () => {
//         setShowAddImageModal(true);
//     };

//     // Updated Delete Image Handler
//     const handleDeleteImage = () => {
//         if (!filesList.length || currentIndex < 0 || currentIndex >= filesList.length) {
//             showHelper('No image to delete');
//             return;
//         }
//         setShowConfirmDeleteModal(true);
//     };

//     const confirmDeleteImage = async () => {
//         if (!filesList.length || currentIndex < 0 || currentIndex >= filesList.length) return;
//         const currentFile = filesList[currentIndex];
//         setIsDeleting(true);
//         try {
//             // Extract folderId and relative path from URL.
//             const relativePathFull = currentFile.url.split('/uploads/')[1];
//             const parts = relativePathFull.split('/');
//             const folderId = parts.shift();
//             const relativePath = parts.join('/');
//             const response = await fetch(`http://localhost:4000/api/images/${folderId}/${relativePath}`, {
//                 method: 'DELETE'
//             });
//             if (!response.ok) {
//                 throw new Error('Failed to delete image');
//             }
//             const updatedFiles = [...filesList];
//             updatedFiles.splice(currentIndex, 1);
//             setFilesList(updatedFiles);
//             showHelper('Image deleted successfully');
//         } catch (error) {
//             console.error('Error deleting image:', error);
//             showHelper('Error deleting image');
//         } finally {
//             setIsDeleting(false);
//             setShowConfirmDeleteModal(false);
//         }
//     };

//     // Trigger export modal (set to true for one render cycle)
//     const handleExportTrigger = () => {
//         setTriggerExportModal(true);
//         // Optionally, you might auto-close the export modal after export.
//     };

//     return (
//         <div className="annotate-container">
//             {/* Hidden file input remains for other purposes */}
//             <input
//                 type="file"
//                 ref={fileInputRef}
//                 style={{ display: 'none' }}
//                 onChange={() => { }}
//                 accept="image/*"
//                 multiple
//             />
//             <UserHomeTopBar taskName={taskName} showControls={true} isSaving={isSaving} />
//             <div className="annotate-actions">
//                 <button onClick={undo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">
//                     <UndoIcon /> Undo
//                 </button>
//                 <button onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)">
//                     <RedoIcon /> Redo
//                 </button>
//                 <div className="divider"></div>
//                 <button onClick={handleSave} className="primary" disabled={isSaving} title="Save (Ctrl+S)">
//                     <SaveIcon /> {isSaving ? 'Saving...' : 'Save'}
//                 </button>
//                 <button onClick={handleCenterImage} title="Center Image (C)">
//                     <CenterIcon /> Center
//                 </button>
//                 <button onClick={handleFit} title="Fit Image to Canvas">
//                     <FitIcon /> Fit
//                 </button>
//                 <div className="divider"></div>
//                 <button onClick={handlePrev} disabled={currentIndex <= 0}>Prev</button>
//                 <button
//                     onClick={handleNext}
//                     disabled={isSaving || currentIndex >= filesList.length - 1}
//                 >
//                     Next
//                 </button>
//                 <button onClick={handleAddImage} disabled={isSaving} title="Add Image">
//                     <AddImageIcon /> Add Image
//                 </button>
//                 <button onClick={handleDeleteImage} disabled={isDeleting || filesList.length === 0} title="Delete Current Image">
//                     <DeleteImageIcon /> Delete Image
//                 </button>
//                 <button onClick={() => { /* Show shortcuts modal if implemented */ }}>
//                     Keyboard Shortcuts
//                 </button>
//                 <div className="divider"></div>
//                 <button onClick={handleZoomOut}>- Zoom</button>
//                 <button onClick={handleZoomIn}>+ Zoom</button>
//                 <button onClick={handleExportTrigger}>Export</button>
//                 <span className="img-count">{currentIndex + 1} / {filesList.length}</span>
//             </div>
//             <div className="annotate-main">
//                 {/* Tools Sidebar */}
//                 <div className="tools-sidebar">
//                     <div className="sidebar-section">
//                         <h3><ToolsIcon /> Tools</h3>
//                         <div className="tool-grid">
//                             <div className={`tool-button ${selectedTool === 'move' ? 'active' : ''}`} onClick={() => setSelectedTool('move')} title="Move Tool (M)">
//                                 <div className="tool-icon"><MoveIcon /></div>
//                                 <div className="tool-name">Move</div>
//                                 <div className="keyboard-hint">M</div>
//                             </div>
//                             <div className={`tool-button ${selectedTool === 'point' ? 'active' : ''}`} onClick={() => handleToolChange('point')} title="Point Tool (O)">
//                                 <div className="tool-icon"><PointIcon /></div>
//                                 <div className="tool-name">Point</div>
//                                 <div className="keyboard-hint">O</div>
//                             </div>
//                         </div>
//                         {/* Inline option for points limit when using point tool */}
//                         {selectedTool === 'point' && (
//                             <div className="points-limit-option" style={{ marginTop: '10px', fontSize: '0.9em' }}>
//                                 <label htmlFor="point-points-limit">Points Limit (0 for unlimited): </label>
//                                 <input
//                                     id="point-points-limit"
//                                     type="number"
//                                     value={currentPointsLimit}
//                                     onChange={(e) => setCurrentPointsLimit(parseInt(e.target.value) || 0)}
//                                     style={{ width: '80px', marginLeft: '8px' }}
//                                 />
//                             </div>
//                         )}
//                     </div>
//                     <div className="sidebar-section">
//                         <h3><PaletteIcon /> Active Label</h3>
//                         <div className="label-selection">
//                             <select value={selectedLabelClass} onChange={(e) => setSelectedLabelClass(e.target.value)}>
//                                 {localLabelClasses.map((lc, i) => (
//                                     <option key={i} value={lc.name}>{lc.name}</option>
//                                 ))}
//                             </select>
//                             <button onClick={() => setShowAddLabelModal(true)}>
//                                 <PlusIcon /> Add Label
//                             </button>
//                         </div>
//                         <div className="label-preview">
//                             <div className="label-color" style={{ backgroundColor: activeLabelColor }}></div>
//                             <span>Current Label: {selectedLabelClass}</span>
//                         </div>
//                     </div>
//                 </div>
//                 {/* Canvas */}
//                 <div className="canvas-area" ref={canvasAreaRef}>
//                     {currentFileUrl ? (
//                         <>
//                             <KeypointsCanvas
//                                 key={currentFileUrl}
//                                 fileUrl={currentFileUrl}
//                                 annotations={currentShapes}
//                                 onAnnotationsChange={handleAnnotationsChange}
//                                 selectedTool={selectedTool}
//                                 scale={scale}
//                                 onWheelZoom={handleWheelZoom}
//                                 activeLabelColor={activeLabelColor}
//                                 onFinishShape={() => {
//                                     setLastToolState({ tool: selectedTool, pointsLimit: currentPointsLimit });
//                                     setSelectedTool('move');
//                                     setSelectedAnnotationIndex(null);
//                                     showHelper('Annotation completed');
//                                 }}
//                                 onDeleteAnnotation={(index) => {
//                                     const arr = [...currentShapes];
//                                     arr.splice(index, 1);
//                                     handleAnnotationsChange(arr);
//                                     showHelper('Annotation deleted');
//                                     if (selectedAnnotationIndex === index) {
//                                         setSelectedAnnotationIndex(null);
//                                     } else if (selectedAnnotationIndex > index) {
//                                         setSelectedAnnotationIndex(selectedAnnotationIndex - 1);
//                                     }
//                                 }}
//                                 activeLabel={selectedLabelClass}
//                                 labelClasses={localLabelClasses}
//                                 pointsLimit={currentPointsLimit}
//                                 initialPosition={imagePosition}
//                                 externalSelectedIndex={selectedAnnotationIndex}
//                                 onSelectAnnotation={setSelectedAnnotationIndex}
//                             />
//                             {showHelperText && (
//                                 <div className="canvas-helper visible" ref={canvasHelperRef}>
//                                     {helperText}
//                                 </div>
//                             )}
//                         </>
//                     ) : (
//                         <div style={{ textAlign: 'center', margin: 'auto', padding: '40px' }}>No images found</div>
//                     )}
//                 </div>
//                 <AnnotationListSidebar
//                     annotations={currentShapes}
//                     onDeleteAnnotation={(index) => {
//                         const arr = [...currentShapes];
//                         arr.splice(index, 1);
//                         handleAnnotationsChange(arr);
//                     }}
//                     onUpdateAnnotation={(index, changes) => {
//                         const arr = [...currentShapes];
//                         arr[index] = { ...arr[index], ...changes };
//                         handleAnnotationsChange(arr);
//                     }}
//                     labelClasses={localLabelClasses}
//                     selectedAnnotationIndex={selectedAnnotationIndex}
//                     setSelectedAnnotationIndex={setSelectedAnnotationIndex}
//                     currentShapes={currentShapes}
//                     onUpdateAllAnnotations={handleUpdateAllAnnotations}
//                 />
//             </div>
//             {/* Re-implemented KeypointsExport with export logic */}
//             {/* <KeypointsExport
//                 annotations={annotations}
//                 filesList={filesList}
//                 imageDimensions={imageDimensions}
//                 localLabelClasses={localLabelClasses}
//                 handleSave={handleSave}
//                 showHelper={showHelper}
//                 isSaving={isSaving}
//                 triggerExportModal={triggerExportModal}
//                 setTriggerExportModal={setTriggerExportModal}
//             /> */}
//             {showAddLabelModal && (
//                 <div className="modal-backdrop">
//                     <div className="modal">
//                         <h3>Add New Label</h3>
//                         <div>
//                             <input type="text" placeholder="Label Name" value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} />
//                         </div>
//                         <div className="color-palette">
//                             {[
//                                 '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
//                                 '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
//                                 '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000',
//                                 '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9'
//                             ].map((color, idx) => (
//                                 <div
//                                     key={idx}
//                                     className={`color-option ${newLabelColor === color ? 'selected' : ''}`}
//                                     style={{ backgroundColor: color }}
//                                     onClick={() => setNewLabelColor(color)}
//                                 />
//                             ))}
//                         </div>
//                         <div>
//                             <input type="color" value={newLabelColor} onChange={(e) => setNewLabelColor(e.target.value)} />
//                         </div>
//                         <div className="modal-footer">
//                             <button
//                                 onClick={async () => {
//                                     if (!newLabelName.trim()) {
//                                         showHelper('Label name cannot be empty');
//                                         return;
//                                     }
//                                     const nameExists = localLabelClasses.some(lc => lc.name.toLowerCase() === newLabelName.trim().toLowerCase());
//                                     if (nameExists) {
//                                         showHelper('Label already exists');
//                                         return;
//                                     }
//                                     const colorExists = localLabelClasses.some(lc => lc.color.toLowerCase() === newLabelColor.trim().toLowerCase());
//                                     if (colorExists) {
//                                         showHelper('Label color already used. Please choose a different color.');
//                                         return;
//                                     }
//                                     const newLabel = { name: newLabelName.trim(), color: newLabelColor };
//                                     const updatedLabels = [...localLabelClasses, newLabel];
//                                     try {
//                                         await fetch(`http://localhost:4000/api/projects/${projectData.project_id}/labels`, {
//                                             method: 'PUT',
//                                             headers: { 'Content-Type': 'application/json' },
//                                             body: JSON.stringify({ labelClasses: updatedLabels })
//                                         });
//                                         await fetch('http://localhost:4000/api/annotations', {
//                                             method: 'POST',
//                                             headers: { 'Content-Type': 'application/json' },
//                                             body: JSON.stringify({
//                                                 folderId: projectData ? projectData.folder_path.split('/')[1] : '',
//                                                 taskName,
//                                                 labelClasses: updatedLabels,
//                                                 annotations
//                                             })
//                                         });
//                                         setLocalLabelClasses(updatedLabels);
//                                         setSelectedLabelClass(newLabel.name);
//                                         setNewLabelName('');
//                                         setNewLabelColor('#ff0000');
//                                         setShowAddLabelModal(false);
//                                         showHelper(`Added new label: ${newLabel.name}`);
//                                     } catch (error) {
//                                         console.error('Error updating labels:', error);
//                                         showHelper('Failed to add new label: ' + error.message);
//                                     }
//                                 }}
//                                 className="primary"
//                             >
//                                 Add
//                             </button>
//                             <button onClick={() => setShowAddLabelModal(false)} className="secondary">
//                                 Cancel
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//             {showConfirmDeleteModal && (
//                 <div className="modal-backdrop">
//                     <div className="modal">
//                         <h3>Confirm Delete</h3>
//                         <p>Are you sure you want to delete this image? This action cannot be undone.</p>
//                         <div className="modal-footer">
//                             <button onClick={confirmDeleteImage} className="primary" disabled={isDeleting}>
//                                 {isDeleting ? 'Deleting...' : 'Delete'}
//                             </button>
//                             <button onClick={() => setShowConfirmDeleteModal(false)} className="secondary">
//                                 Cancel
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//             {showAddImageModal && (
//                 <div className="modal-backdrop">
//                     <div className="modal">
//                         <h3>Upload New Image</h3>
//                         <div className="modal-section">
//                             <h4>Select File(s)</h4>
//                             <input
//                                 type="file"
//                                 multiple
//                                 accept="image/*"
//                                 onChange={(e) => setNewFiles(e.target.files)}
//                             />
//                         </div>
//                         <div className="modal-section">
//                             <h4>Select Target Folder</h4>
//                             <select
//                                 value={selectedAddFolder}
//                                 onChange={(e) => setSelectedAddFolder(e.target.value)}
//                             >
//                                 <option value="">Select a folder</option>
//                                 {taskFolderPaths.map((fp, idx) => (
//                                     <option key={idx} value={fp}>{fp}</option>
//                                 ))}
//                             </select>
//                         </div>
//                         <div className="modal-footer">
//                             <button className="primary" onClick={async () => {
//                                 if (!newFiles || newFiles.length === 0 || !selectedAddFolder) {
//                                     showHelper("Please select file(s) and a target folder.");
//                                     return;
//                                 }
//                                 setIsSaving(true);
//                                 showHelper("Uploading image(s)...");
//                                 const formData = new FormData();
//                                 for (let i = 0; i < newFiles.length; i++) {
//                                     formData.append('files', newFiles[i]);
//                                 }
//                                 try {
//                                     const response = await fetch(`http://localhost:4000/api/images/${encodeURIComponent(selectedAddFolder)}`, {
//                                         method: 'POST',
//                                         body: formData
//                                     });
//                                     if (!response.ok) {
//                                         throw new Error("Failed to upload image(s)");
//                                     }
//                                     const result = await response.json();
//                                     if (result.files && result.files.length > 0) {
//                                         const newFilesList = [...filesList, ...result.files];
//                                         setFilesList(newFilesList);
//                                         setCurrentIndex(newFilesList.length - result.files.length);
//                                         showHelper(`Uploaded ${result.files.length} image(s) successfully`);
//                                     } else {
//                                         showHelper("No new images were uploaded");
//                                     }
//                                 } catch (error) {
//                                     console.error("Error uploading images:", error);
//                                     showHelper("Error uploading image(s): " + error.message);
//                                 } finally {
//                                     setIsSaving(false);
//                                     setShowAddImageModal(false);
//                                     setNewFiles(null);
//                                     setSelectedAddFolder("");
//                                 }
//                             }}>
//                                 Upload
//                             </button>
//                             <button className="secondary" onClick={() => {
//                                 setShowAddImageModal(false);
//                                 setNewFiles(null);
//                                 setSelectedAddFolder("");
//                             }}>
//                                 Cancel
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// src/pages/Caption.js
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import UserHomeTopBar from '../../../components/UserHomeTopBar';
// Note: we now import our updated CaptionCanvas that only renders the image.
import CaptionCanvas from '../../../components/CaptionCanvas';
import './Caption.css';

// SVG Icon Components (same as before)
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

// New Caption icon (used only for the tool button)
const CaptionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <text x="3" y="16" fontSize="16" fill="currentColor">T</text>
    </svg>
);

export default function Caption() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const taskId = state?.taskId;

    // Basic state for task, project, files, annotations, undo/redo, etc.
    const [taskData, setTaskData] = useState(null);
    const [projectData, setProjectData] = useState(null);
    const [filesList, setFilesList] = useState([]);
    const [allFiles, setAllFiles] = useState([]);
    const [annotations, setAnnotations] = useState({});
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [showHelperText, setShowHelperText] = useState(false);
    const [helperText, setHelperText] = useState('');
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1.0);
    const [selectedTool, setSelectedTool] = useState('move');

    // States for Add Image modal (unchanged)
    const [showAddImageModal, setShowAddImageModal] = useState(false);
    const [taskFolderPaths, setTaskFolderPaths] = useState([]);
    const [newFiles, setNewFiles] = useState(null);
    const [selectedAddFolder, setSelectedAddFolder] = useState('');

    // NEW: State for caption annotation modal
    const [showCaptionModal, setShowCaptionModal] = useState(false);
    const [captionModalPos, setCaptionModalPos] = useState({ x: 0, y: 0 });
    const [captionText, setCaptionText] = useState('');

    // NEW: State for managing which caption icon’s tooltip is active in the overlay
    const [activeCaptionIndex, setActiveCaptionIndex] = useState(null);

    const fileInputRef = useRef(null);
    const canvasAreaRef = useRef(null);

    const [triggerExportModal, setTriggerExportModal] = useState(false);

    // State for Keyboard Shortcuts Modal
    const [showKeyboardShortcutsModal, setShowKeyboardShortcutsModal] = useState(false);

    // Utility: extract files from folder tree (same as before)
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

    // Fetch task and project data (same as before)
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
                                setAllFiles(allFilesFetched);
                            })
                            .catch(err => console.error("Error fetching folder structures", err));
                    });
            })
            .catch(err => console.error("Error fetching tasks", err));
    }, [taskId, navigate]);

    const taskName = taskData ? taskData.task_name : '';
    const currentFileUrl = filesList[currentIndex]?.url;
    const currentShapes = annotations[currentFileUrl] || [];

    // Helper: show helper text (same as before)
    const showHelper = (text) => {
        setHelperText(text);
        setShowHelperText(true);
        if (canvasAreaRef.current) {
            canvasAreaRef.current.classList.add('visible');
        }
        setTimeout(() => {
            if (canvasAreaRef.current) {
                canvasAreaRef.current.classList.remove('visible');
            }
            setTimeout(() => setShowHelperText(false), 300);
        }, 3000);
    };

    // Load annotations from backend (same as before)
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

    // Image fit & center functions (same as before)
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

    // Undo/Redo handlers (same as before)
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

    // For captioning, we no longer update annotations via drawing on the canvas.
    // Instead, we add a caption annotation when the user clicks the Caption button or presses "c".
    const handleAnnotationsChange = (newShapes) => {
        const updated = {
            ...annotations,
            [currentFileUrl]: newShapes,
        };
        setUndoStack([...undoStack, annotations]);
        setRedoStack([]);
        setAnnotations(updated);
    };

    // When image changes, we can reset any selection (if applicable)
    useEffect(() => {
        // Reset selection logic (if needed)
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

    // Save annotation logic: similar to detection.js, now with caption annotations included.
    const handleSave = async () => {
        setIsSaving(true);
        const folderId = projectData ? projectData.folder_path.split('/')[1] : '';
        const bodyData = {
            folderId,
            taskName,
            labelClasses: projectData ? projectData.label_classes || [] : [],
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

    // Delete and Add Image handlers remain the same...
    const handleDeleteImage = () => {
        if (!filesList.length || currentIndex < 0 || currentIndex >= filesList.length) {
            showHelper('No image to delete');
            return;
        }
        setShowConfirmDeleteModal(true);
    };

    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

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

    const handleAddImage = () => {
        setShowAddImageModal(true);
    };

    const handleExportTrigger = () => {
        setTriggerExportModal(true);
        setTimeout(() => setTriggerExportModal(false), 0);
    };

    // NEW: Function to handle Caption addition via the button or "c" key.
    const handleCaptionButton = () => {
        if (canvasAreaRef.current) {
            const canvasWidth = canvasAreaRef.current.offsetWidth;
            const canvasHeight = canvasAreaRef.current.offsetHeight;
            // Calculate default caption position (center in logical coordinates)
            const defaultPos = { x: (canvasWidth / 2) / scale, y: (canvasHeight / 2) / scale };
            setCaptionModalPos(defaultPos);
            setCaptionText('');
            setShowCaptionModal(true);
            setSelectedTool('caption');
        }
    };

    // Keyboard shortcut: pressing "t" (or "T") triggers caption addition.
    // useEffect(() => {
    //     const handleKeyDown = (e) => {
    //         if (e.key.toLowerCase() === 't') {
    //             if (!showCaptionModal) {
    //                 handleCaptionButton();
    //             }
    //         }
    //     };
    //     window.addEventListener('keydown', handleKeyDown);
    //     return () => {
    //         window.removeEventListener('keydown', handleKeyDown);
    //     };
    // }, [showCaptionModal, scale]);

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
                        // does this need fix?
                        if (!showCaptionModal) {
                            handleCaptionButton();
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
                    case 't':
                    case 'T':
                        if (!showCaptionModal) {
                            handleCaptionButton();
                        }
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
    }, [annotations, undoStack, redoStack, currentIndex, filesList.length, handleCenterImage, showCaptionModal, scale]);


    // Function to submit caption from modal.
    const submitCaption = () => {
        if (!captionText.trim()) {
            showHelper('Caption cannot be empty');
            return;
        }
        // Calculate the new caption id in the format T-01, T-02, ...
        const captionCount = currentShapes.filter(ann => ann.type === 'caption').length;
        const newId = `T-${(captionCount + 1).toString().padStart(2, '0')}`;
        const newCaption = {
            id: newId,
            type: 'caption',
            text: captionText.trim(),
            x: captionModalPos.x,
            y: captionModalPos.y,
            fontSize: 12, // default settings
            color: '#000000'
        };
        const updatedShapes = [...currentShapes, newCaption];
        handleAnnotationsChange(updatedShapes);
        setShowCaptionModal(false);
        showHelper('Caption added');
    };

    // NEW: Function to delete a caption from the right sidebar.
    const handleDeleteCaption = (index) => {
        const updatedCaptions = currentShapes.filter((ann, idx) => idx !== index);
        handleAnnotationsChange(updatedCaptions);
        showHelper('Caption deleted');
    };

    return (
        <div className="annotate-container">
            {/* Hidden file input remains */}
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
                <button onClick={handleNext} disabled={isSaving || currentIndex >= filesList.length - 1}>
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
                {/* Left Sidebar: Tools */}
                <div className="tools-sidebar">
                    <div className="sidebar-section">
                        <h3>Tools</h3>
                        <div className="tool-grid">
                            <div className={`tool-button ${selectedTool === 'move' ? 'active' : ''}`} onClick={() => setSelectedTool('move')} title="Move Tool (M)">
                                <div className="tool-icon"><MoveIcon /></div>
                                <div className="tool-name">Move</div>
                                <div className="keyboard-hint">M</div>
                            </div>
                            {/* New Caption button */}
                            <div className={`tool-button ${selectedTool === 'caption' ? 'active' : ''}`} onClick={handleCaptionButton} title="Caption (C)">
                                <div className="tool-icon"><CaptionIcon /></div>
                                <div className="tool-name">Caption</div>
                                <div className="keyboard-hint">T</div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Canvas Area */}
                <div className="canvas-area" ref={canvasAreaRef} style={{ position: 'relative' }}>
                    {currentFileUrl ? (
                        <>
                            <CaptionCanvas
                                key={currentFileUrl}
                                fileUrl={currentFileUrl}
                                scale={scale}
                                onWheelZoom={handleWheelZoom}
                                initialPosition={imagePosition}
                                // CaptionCanvas now only renders the image.
                                annotations={[]}
                            />
                            {showHelperText && (
                                <div className="canvas-helper visible">
                                    {helperText}
                                </div>
                            )}
                            {/* NEW: Overlay for caption icons at top left */}
                            <div className="caption-icon-overlay" style={{ position: 'absolute', top: 10, left: 10 }}>
                                {currentShapes.filter(ann => ann.type === 'caption').map((ann, idx) => (
                                    <div
                                        key={idx}
                                        className="caption-icon"
                                        style={{ marginBottom: 5, cursor: 'pointer', position: 'relative' }}
                                        onClick={() => setActiveCaptionIndex(activeCaptionIndex === idx ? null : idx)}
                                    >
                                        <div
                                            className="caption-icon-inner"
                                            style={{
                                                width: 24,
                                                height: 24,
                                                backgroundColor: '#3498db',
                                                border: '2px solid #2980b9',
                                                borderRadius: 6,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#ffffff',
                                                fontWeight: 'bold',
                                                fontSize: 16,
                                            }}
                                        >
                                            T
                                        </div>
                                        {activeCaptionIndex === idx && (
                                            <div
                                                className="caption-tooltip"
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 30,
                                                    backgroundColor: 'white',
                                                    border: '1px solid #000',
                                                    padding: '4px 8px',
                                                    borderRadius: 4,
                                                    whiteSpace: 'nowrap',
                                                    zIndex: 10
                                                }}
                                            >
                                                {ann.text}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', margin: 'auto', padding: '40px' }}>No images found</div>
                    )}
                </div>
                {/* Right Sidebar for viewing/deleting added captions remains */}
                <div className="captions-sidebar">
                    <h3>Captions</h3>
                    {currentShapes.filter(ann => ann.type === 'caption').length === 0 ? (
                        <p>No captions added</p>
                    ) : (
                        <ul>
                            {currentShapes.filter(ann => ann.type === 'caption').map((caption, idx) => (
                                <li key={idx}>
                                    <span>{caption.id}</span>
                                    <button onClick={() => handleDeleteCaption(idx)}>Delete</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            {/* Caption Modal */}
            {showCaptionModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Add Caption</h3>
                        <div>
                            <input
                                type="text"
                                placeholder="Enter caption text"
                                value={captionText}
                                onChange={(e) => setCaptionText(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="modal-footer">
                            <button onClick={submitCaption} className="primary">
                                Add
                            </button>
                            <button onClick={() => setShowCaptionModal(false)} className="secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Image Modal */}
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
            {/* Add Image Modal */}
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
                                        <div className="key-combo"><span className="key">T</span></div>
                                        <div className="shortcut-description">Caption Tool</div>
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


// // src/pages/Caption.js
// import React, { useState, useEffect, useRef } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';

// import UserHomeTopBar from '../../../components/UserHomeTopBar';
// // Note: we now import our updated CaptionCanvas that only renders the image.
// import CaptionCanvas from '../../../components/CaptionCanvas';
// import './Caption.css';

// // SVG Icon Components (same as before)
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

// const CenterIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <circle cx="12" cy="12" r="10" />
//         <line x1="12" y1="8" x2="12" y2="16" />
//         <line x1="8" y1="12" x2="16" y2="12" />
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

// // New Caption icon (used only for the tool button)
// const CaptionIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//         <text x="3" y="16" fontSize="16" fill="currentColor">T</text>
//     </svg>
// );

// export default function Caption() {
//     const navigate = useNavigate();
//     const { state } = useLocation();
//     const taskId = state?.taskId;

//     // Basic state for task, project, files, annotations, undo/redo, etc.
//     const [taskData, setTaskData] = useState(null);
//     const [projectData, setProjectData] = useState(null);
//     const [filesList, setFilesList] = useState([]);
//     const [allFiles, setAllFiles] = useState([]);
//     const [annotations, setAnnotations] = useState({});
//     const [undoStack, setUndoStack] = useState([]);
//     const [redoStack, setRedoStack] = useState([]);
//     const [currentIndex, setCurrentIndex] = useState(0);
//     const [isSaving, setIsSaving] = useState(false);
//     const [showHelperText, setShowHelperText] = useState(false);
//     const [helperText, setHelperText] = useState('');
//     const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
//     const [scale, setScale] = useState(1.0);
//     const [selectedTool, setSelectedTool] = useState('move');

//     // States for Add Image modal (unchanged)
//     const [showAddImageModal, setShowAddImageModal] = useState(false);
//     const [taskFolderPaths, setTaskFolderPaths] = useState([]);
//     const [newFiles, setNewFiles] = useState(null);
//     const [selectedAddFolder, setSelectedAddFolder] = useState('');

//     // NEW: State for caption annotation modal
//     const [showCaptionModal, setShowCaptionModal] = useState(false);
//     const [captionModalPos, setCaptionModalPos] = useState({ x: 0, y: 0 });
//     const [captionText, setCaptionText] = useState('');

//     // NEW: State for managing which caption icon’s tooltip is active in the overlay
//     const [activeCaptionIndex, setActiveCaptionIndex] = useState(null);

//     const fileInputRef = useRef(null);
//     const canvasAreaRef = useRef(null);

//     const [triggerExportModal, setTriggerExportModal] = useState(false);

//     // Utility: extract files from folder tree (same as before)
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

//     // Fetch task and project data (same as before)
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
//                                 setAllFiles(allFilesFetched);
//                             })
//                             .catch(err => console.error("Error fetching folder structures", err));
//                     });
//             })
//             .catch(err => console.error("Error fetching tasks", err));
//     }, [taskId, navigate]);

//     const taskName = taskData ? taskData.task_name : '';
//     const currentFileUrl = filesList[currentIndex]?.url;
//     const currentShapes = annotations[currentFileUrl] || [];

//     // Helper: show helper text (same as before)
//     const showHelper = (text) => {
//         setHelperText(text);
//         setShowHelperText(true);
//         if (canvasAreaRef.current) {
//             canvasAreaRef.current.classList.add('visible');
//         }
//         setTimeout(() => {
//             if (canvasAreaRef.current) {
//                 canvasAreaRef.current.classList.remove('visible');
//             }
//             setTimeout(() => setShowHelperText(false), 300);
//         }, 3000);
//     };

//     // Load annotations from backend (same as before)
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

//     // Image fit & center functions (same as before)
//     const fitImage = () => {
//         if (currentFileUrl && canvasAreaRef.current) {
//             const img = new Image();
//             img.src = currentFileUrl;
//             img.onload = () => {
//                 const canvasWidth = canvasAreaRef.current.offsetWidth;
//                 const canvasHeight = canvasAreaRef.current.offsetHeight;
//                 const imageWidth = img.width;
//                 const imageHeight = img.height;
//                 const fitScale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
//                 const groupX = (canvasWidth / 2 / fitScale) - (imageWidth / 2);
//                 const groupY = (canvasHeight / 2 / fitScale) - (imageHeight / 2);
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

//     // Undo/Redo handlers (same as before)
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

//     // For captioning, we no longer update annotations via drawing on the canvas.
//     // Instead, we add a caption annotation when the user clicks the Caption button or presses "c".
//     const handleAnnotationsChange = (newShapes) => {
//         const updated = {
//             ...annotations,
//             [currentFileUrl]: newShapes,
//         };
//         setUndoStack([...undoStack, annotations]);
//         setRedoStack([]);
//         setAnnotations(updated);
//     };

//     // When image changes, we can reset any selection (if applicable)
//     useEffect(() => {
//         // Reset selection logic (if needed)
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

//     // Save annotation logic: similar to detection.js, now with caption annotations included.
//     const handleSave = async () => {
//         setIsSaving(true);
//         const folderId = projectData ? projectData.folder_path.split('/')[1] : '';
//         const bodyData = {
//             folderId,
//             taskName,
//             labelClasses: projectData ? projectData.label_classes || [] : [],
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

//     // Delete and Add Image handlers remain the same...
//     const handleDeleteImage = () => {
//         if (!filesList.length || currentIndex < 0 || currentIndex >= filesList.length) {
//             showHelper('No image to delete');
//             return;
//         }
//         setShowConfirmDeleteModal(true);
//     };

//     const [isDeleting, setIsDeleting] = useState(false);
//     const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

//     const confirmDeleteImage = async () => {
//         if (!filesList.length || currentIndex < 0 || currentIndex >= filesList.length) return;
//         const currentFile = filesList[currentIndex];
//         setIsDeleting(true);
//         try {
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

//     const handleAddImage = () => {
//         setShowAddImageModal(true);
//     };

//     const handleExportTrigger = () => {
//         setTriggerExportModal(true);
//         setTimeout(() => setTriggerExportModal(false), 0);
//     };

//     // NEW: Function to handle Caption addition via the button or "c" key.
//     const handleCaptionButton = () => {
//         if (canvasAreaRef.current) {
//             const canvasWidth = canvasAreaRef.current.offsetWidth;
//             const canvasHeight = canvasAreaRef.current.offsetHeight;
//             // Calculate default caption position (center in logical coordinates)
//             const defaultPos = { x: (canvasWidth / 2) / scale, y: (canvasHeight / 2) / scale };
//             setCaptionModalPos(defaultPos);
//             setCaptionText('');
//             setShowCaptionModal(true);
//             setSelectedTool('caption');
//         }
//     };

//     // Keyboard shortcut: pressing "c" (or "C") triggers caption addition.
//     useEffect(() => {
//         const handleKeyDown = (e) => {
//             if (e.key.toLowerCase() === 'c') {
//                 if (!showCaptionModal) {
//                     handleCaptionButton();
//                 }
//             }
//         };
//         window.addEventListener('keydown', handleKeyDown);
//         return () => {
//             window.removeEventListener('keydown', handleKeyDown);
//         };
//     }, [showCaptionModal, scale]);

//     // Function to submit caption from modal.
//     const submitCaption = () => {
//         if (!captionText.trim()) {
//             showHelper('Caption cannot be empty');
//             return;
//         }
//         const newCaption = {
//             type: 'caption',
//             text: captionText.trim(),
//             x: captionModalPos.x,
//             y: captionModalPos.y,
//             fontSize: 12, // default settings
//             color: '#000000'
//         };
//         const updatedShapes = [...currentShapes, newCaption];
//         handleAnnotationsChange(updatedShapes);
//         setShowCaptionModal(false);
//         showHelper('Caption added');
//     };

//     // NEW: Function to delete a caption from the right sidebar.
//     const handleDeleteCaption = (index) => {
//         const updatedCaptions = currentShapes.filter((ann, idx) => idx !== index);
//         handleAnnotationsChange(updatedCaptions);
//         showHelper('Caption deleted');
//     };

//     return (
//         <div className="annotate-container">
//             {/* Hidden file input remains */}
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
//                 <button onClick={handleNext} disabled={isSaving || currentIndex >= filesList.length - 1}>
//                     Next
//                 </button>
//                 <button onClick={handleAddImage} disabled={isSaving} title="Add Image">
//                     <AddImageIcon /> Add Image
//                 </button>
//                 <button onClick={handleDeleteImage} disabled={isDeleting || filesList.length === 0} title="Delete Current Image">
//                     <DeleteImageIcon /> Delete Image
//                 </button>
//                 <button onClick={() => { /* Keyboard Shortcuts modal if needed */ }}>
//                     Keyboard Shortcuts
//                 </button>
//                 <div className="divider"></div>
//                 <button onClick={handleZoomOut}>- Zoom</button>
//                 <button onClick={handleZoomIn}>+ Zoom</button>
//                 <button onClick={handleExportTrigger}>Export</button>
//                 <span className="img-count">{currentIndex + 1} / {filesList.length}</span>
//             </div>
//             <div className="annotate-main">
//                 {/* Left Sidebar: Tools */}
//                 <div className="tools-sidebar">
//                     <div className="sidebar-section">
//                         <h3>Tools</h3>
//                         <div className="tool-grid">
//                             <div className={`tool-button ${selectedTool === 'move' ? 'active' : ''}`} onClick={() => setSelectedTool('move')} title="Move Tool (M)">
//                                 <div className="tool-icon"><MoveIcon /></div>
//                                 <div className="tool-name">Move</div>
//                                 <div className="keyboard-hint">M</div>
//                             </div>
//                             {/* New Caption button */}
//                             <div className={`tool-button ${selectedTool === 'caption' ? 'active' : ''}`} onClick={handleCaptionButton} title="Caption (C)">
//                                 <div className="tool-icon"><CaptionIcon /></div>
//                                 <div className="tool-name">Caption</div>
//                                 <div className="keyboard-hint">C</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//                 {/* Canvas Area */}
//                 <div className="canvas-area" ref={canvasAreaRef} style={{ position: 'relative' }}>
//                     {currentFileUrl ? (
//                         <>
//                             <CaptionCanvas
//                                 key={currentFileUrl}
//                                 fileUrl={currentFileUrl}
//                                 scale={scale}
//                                 onWheelZoom={handleWheelZoom}
//                                 initialPosition={imagePosition}
//                                 // CaptionCanvas now only renders the image.
//                                 annotations={[]}
//                             />
//                             {showHelperText && (
//                                 <div className="canvas-helper visible">
//                                     {helperText}
//                                 </div>
//                             )}
//                             {/* NEW: Overlay for caption icons at top left */}
//                             <div className="caption-icon-overlay" style={{ position: 'absolute', top: 10, left: 10 }}>
//                                 {currentShapes.filter(ann => ann.type === 'caption').map((ann, idx) => (
//                                     <div
//                                         key={idx}
//                                         className="caption-icon"
//                                         style={{ marginBottom: 5, cursor: 'pointer', position: 'relative' }}
//                                         onClick={() => setActiveCaptionIndex(activeCaptionIndex === idx ? null : idx)}
//                                     >
//                                         <div
//                                             className="caption-icon-inner"
//                                             style={{
//                                                 width: 24,
//                                                 height: 24,
//                                                 backgroundColor: '#3498db',
//                                                 border: '2px solid #2980b9',
//                                                 borderRadius: 6,
//                                                 display: 'flex',
//                                                 alignItems: 'center',
//                                                 justifyContent: 'center',
//                                                 color: '#ffffff',
//                                                 fontWeight: 'bold',
//                                                 fontSize: 16,
//                                             }}
//                                         >
//                                             T
//                                         </div>
//                                         {activeCaptionIndex === idx && (
//                                             <div
//                                                 className="caption-tooltip"
//                                                 style={{
//                                                     position: 'absolute',
//                                                     top: 0,
//                                                     left: 30,
//                                                     backgroundColor: 'white',
//                                                     border: '1px solid #000',
//                                                     padding: '4px 8px',
//                                                     borderRadius: 4,
//                                                     whiteSpace: 'nowrap',
//                                                     zIndex: 10
//                                                 }}
//                                             >
//                                                 {ann.text}
//                                             </div>
//                                         )}
//                                     </div>
//                                 ))}
//                             </div>
//                         </>
//                     ) : (
//                         <div style={{ textAlign: 'center', margin: 'auto', padding: '40px' }}>No images found</div>
//                     )}
//                 </div>
//                 {/* Right Sidebar for viewing/deleting added captions remains */}
//                 <div className="captions-sidebar">
//                     <h3>Captions</h3>
//                     {currentShapes.filter(ann => ann.type === 'caption').length === 0 ? (
//                         <p>No captions added</p>
//                     ) : (
//                         <ul>
//                             {currentShapes.filter(ann => ann.type === 'caption').map((caption, idx) => (
//                                 <li key={idx}>
//                                     <span>{caption.text}</span>
//                                     <button onClick={() => handleDeleteCaption(idx)}>Delete</button>
//                                 </li>
//                             ))}
//                         </ul>
//                     )}
//                 </div>
//             </div>
//             {/* Caption Modal */}
//             {showCaptionModal && (
//                 <div className="modal-backdrop">
//                     <div className="modal">
//                         <h3>Add Caption</h3>
//                         <div>
//                             <input
//                                 type="text"
//                                 placeholder="Enter caption text"
//                                 value={captionText}
//                                 onChange={(e) => setCaptionText(e.target.value)}
//                                 autoFocus
//                             />
//                         </div>
//                         <div className="modal-footer">
//                             <button onClick={submitCaption} className="primary">
//                                 Add
//                             </button>
//                             <button onClick={() => setShowCaptionModal(false)} className="secondary">
//                                 Cancel
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//             {/* Delete Image Modal */}
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
//             {/* Add Image Modal */}
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

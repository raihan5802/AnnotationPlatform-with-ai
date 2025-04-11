// src/pages/TextAnnotation/Relation.js
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import UserHomeTopBar from '../../components/UserHomeTopBar';
import AnnotationListSidebar from '../../components/AnnotationListSidebar';
import './Relation.css';

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

const CursorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3l10 10-3 8-10-10z" />
        <path d="M13 13l6 6" />
    </svg>
);

const NERIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M8 7h8" />
        <path d="M8 17h8" />
    </svg>
);

// Add this after NERIcon component (around line 56)
const RelationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="7" x2="17" y2="17" />
        <polyline points="17 7 17 17 7 17" />
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

const AddTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v2H4z" />
        <path d="M4 10h16v2H4z" />
        <line x1="12" y1="16" x2="12" y2="22" />
        <line x1="9" y1="19" x2="15" y2="19" />
    </svg>
);

const DeleteTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v2H4z" />
        <path d="M4 10h16v2H4z" />
        <line x1="9" y1="16" x2="15" y2="22" />
        <line x1="9" y1="22" x2="15" y2="16" />
    </svg>
);

export default function Relation() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const taskId = state?.taskId;

    const [taskData, setTaskData] = useState(null);
    const [projectData, setProjectData] = useState(null);
    const [filesList, setFilesList] = useState([]);
    const [allFiles, setAllFiles] = useState([]);
    const [textContent, setTextContent] = useState('');

    const [annotations, setAnnotations] = useState({});
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [showHelperText, setShowHelperText] = useState(false);
    const [helperText, setHelperText] = useState('');
    const [selectedTool, setSelectedTool] = useState('cursor');
    const [selectedLabelClass, setSelectedLabelClass] = useState('');
    const [localLabelClasses, setLocalLabelClasses] = useState([]);
    const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState(null);
    const [showAddLabelModal, setShowAddLabelModal] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#ff0000');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

    const [showAddTextModal, setShowAddTextModal] = useState(false);
    const [taskFolderPaths, setTaskFolderPaths] = useState([]);
    const [newFiles, setNewFiles] = useState(null);
    const [selectedAddFolder, setSelectedAddFolder] = useState('');

    // Updated state for read/write checkboxes (mutually exclusive, default to read)
    const [mode, setMode] = useState('read'); // 'read' or 'write'

    // Add these state variables near other useState declarations (around line 75)
    const [isCreatingRelation, setIsCreatingRelation] = useState(false);
    const [relationSourceIndex, setRelationSourceIndex] = useState(null);

    // NEW STATE: active entity id for arrow drawing
    const [activeEntityId, setActiveEntityId] = useState(null);

    const textDisplayRef = useRef(null);
    const textAreaRef = useRef(null);
    const canvasHelperRef = useRef(null);
    // NEW REF: store refs for each entity annotation element
    const entityRefs = useRef({});

    // Active label options now always use the project labels.
    const activeLabelOptions = localLabelClasses;

    // Active label color lookup (if nothing is selected, default to red)
    const activeLabelColor = activeLabelOptions.find(l => l.name === selectedLabelClass)?.color || '#ff0000';

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

    // Helper: extract files from the folder tree given a base path (unchanged)
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

    // Fetch task and project data based on taskId and load text files (unchanged)
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
                        setLocalLabelClasses(project.label_classes || []);
                        if (project.label_classes && project.label_classes.length > 0) {
                            setSelectedLabelClass(project.label_classes[0].name);
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
                                    allFilesFetched = allFilesFetched.concat(filesFromTree.filter(file =>
                                        file.originalname.endsWith('.txt') ||
                                        file.originalname.endsWith('.doc') ||
                                        file.originalname.endsWith('.docx') ||
                                        file.originalname.endsWith('.pdf')
                                    ));
                                });
                                setFilesList(allFilesFetched);
                                setAllFiles(allFilesFetched);
                            })
                            .catch(err => console.error("Error fetching folder structures", err));
                    });
            })
            .catch(err => console.error("Error fetching tasks", err));
    }, [taskId, navigate]);

    // Load text content when currentIndex or filesList changes (unchanged)
    useEffect(() => {
        const loadTextContent = async () => {
            const currentFileUrl = filesList[currentIndex]?.url;
            if (!currentFileUrl) {
                setTextContent('');
                return;
            }
            try {
                const response = await fetch(currentFileUrl);
                const fileName = filesList[currentIndex].originalname.toLowerCase();
                if (fileName.endsWith('.txt')) {
                    const text = await response.text();
                    setTextContent(text);
                } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
                    const text = await response.text();
                    setTextContent(text);
                } else if (fileName.endsWith('.pdf')) {
                    const text = await response.text();
                    setTextContent(text);
                }
            } catch (err) {
                console.error("Error loading text content:", err);
                setTextContent('Error loading text content');
            }
        };
        loadTextContent();
    }, [currentIndex, filesList]);

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

    // Add to existing useEffect for keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'c' || e.key === 'C') {
                setSelectedTool('cursor');
            } else if (e.key === 'r' || e.key === 'R') {
                setSelectedTool('ner');
            } else if (e.key === 'l' || e.key === 'L') {
                setSelectedTool('relation');
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const taskName = taskData ? taskData.task_name : '';
    const currentFileUrl = filesList[currentIndex]?.url;
    const currentAnnotations = annotations[currentFileUrl] || [];

    // Function to render text with NER annotations.
    const renderTextWithHighlights = () => {
        if (!textContent || !currentAnnotations.length) return textContent;

        const nerAnnotations = currentAnnotations.filter(a => a.type === 'NER');
        const sortedAnnotations = [...nerAnnotations].sort((a, b) => a.start - b.start);

        let result = [];
        let lastIndex = 0;

        sortedAnnotations.forEach((annotation, index) => {
            const { start, end, label } = annotation;
            const options = localLabelClasses;
            const color = options.find(l => l.name === label)?.color || '#ff0000';

            if (start > lastIndex) {
                result.push(textContent.substring(lastIndex, start));
            }

            // Add click handler for relation creation or arrow display
            result.push(
                <span
                    key={index}
                    ref={(el) => {
                        if (el && annotation.id) {
                            entityRefs.current[annotation.id] = el;
                        }
                    }}
                    className={`ner-annotation ${selectedTool === 'relation' ? 'relation-selectable' : ''} ${activeEntityId === annotation.id ? 'active-entity' : ''}`}
                    style={{
                        backgroundColor: `${color}${decimalToHexOpacity(annotation.opacity || 0.55)}`,
                        cursor: selectedTool === 'relation' ? 'pointer' : 'default'
                    }}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent click from bubbling to container
                        if (selectedTool === 'relation') {
                            handleEntityClick(nerAnnotations.findIndex(a => a.start === start && a.end === end));
                        } else {
                            // Toggle active entity selection for arrow display
                            if (activeEntityId === annotation.id) {
                                setActiveEntityId(null);
                            } else {
                                setActiveEntityId(annotation.id);
                            }
                        }
                    }}
                >
                    {textContent.substring(start, end)}
                </span>
            );
            lastIndex = end;
        });

        if (lastIndex < textContent.length) {
            result.push(textContent.substring(lastIndex));
        }

        return (
            <div className="text-content-wrapper">
                {result}
                {renderRelationLines()}
            </div>
        );
    };

    const renderRelationLines = () => {
        const relationAnnotations = currentAnnotations.filter(a => a.type === 'RELATION');
        const nerAnnotations = currentAnnotations.filter(a => a.type === 'NER');

        return relationAnnotations.map((relation, index) => {
            const sourceIndex = nerAnnotations.findIndex(a => a.id === relation.sourceId);
            const targetIndex = nerAnnotations.findIndex(a => a.id === relation.targetId);

            if (sourceIndex === -1 || targetIndex === -1) return null;

            const options = localLabelClasses;
            const color = options.find(l => l.name === relation.label)?.color || '#ff0000';

            return (
                <div
                    key={`relation-${index}`}
                    className="relation-annotation"
                    style={{
                        borderBottom: `2px solid ${color}${decimalToHexOpacity(relation.opacity || 0.75)}`,
                        position: 'absolute'
                    }}
                >
                    <span className="relation-label">{relation.label}</span>
                </div>
            );
        });
    };

    // Render arrow always from source to target.
    const renderArrowForActiveEntity = () => {
        if (!activeEntityId) return null;
        const relationAnnotations = currentAnnotations.filter(a =>
            a.type === 'RELATION' && (a.sourceId === activeEntityId || a.targetId === activeEntityId)
        );
        if (relationAnnotations.length === 0) return null;

        const container = textDisplayRef.current;
        if (!container) return null;
        const containerRect = container.getBoundingClientRect();

        const lines = relationAnnotations.map((relation, index) => {
            const sourceEl = entityRefs.current[relation.sourceId];
            const targetEl = entityRefs.current[relation.targetId];
            if (!sourceEl || !targetEl) return null;
            const sourceRect = sourceEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();
            const sourceX = sourceRect.left + sourceRect.width / 2 - containerRect.left;
            const sourceY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
            const targetX = targetRect.left + targetRect.width / 2 - containerRect.left;
            const targetY = targetRect.top + targetRect.height / 2 - containerRect.top;
            const color = '#000000'; // Fixed black color

            return (
                <line
                    key={`arrow-${index}`}
                    x1={sourceX}
                    y1={sourceY}
                    x2={targetX}
                    y2={targetY}
                    stroke={color}
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                />
            );
        });

        return (
            <svg className="arrow-overlay" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%' }}>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="black" />
                    </marker>
                </defs>
                {lines}
            </svg>
        );
    };

    const handleEntityClick = (entityIndex) => {
        if (selectedTool !== 'relation') return;

        if (!isCreatingRelation) {
            setIsCreatingRelation(true);
            setRelationSourceIndex(entityIndex);
            showHelper('Select target entity to create relation');
        } else {
            if (entityIndex === relationSourceIndex) {
                showHelper('Cannot create relation to the same entity');
                return;
            }

            const sourceEntity = currentAnnotations.filter(a => a.type === 'NER')[relationSourceIndex];
            const targetEntity = currentAnnotations.filter(a => a.type === 'NER')[entityIndex];

            const sourceId = sourceEntity.id || `entity-${Date.now()}-${relationSourceIndex}`;
            const targetId = targetEntity.id || `entity-${Date.now()}-${entityIndex}`;

            if (!sourceEntity.id || !targetEntity.id) {
                const updatedAnnotations = currentAnnotations.map((ann, idx) => {
                    if (ann.type === 'NER') {
                        if (idx === relationSourceIndex && !ann.id) {
                            return { ...ann, id: sourceId };
                        }
                        if (idx === entityIndex && !ann.id) {
                            return { ...ann, id: targetId };
                        }
                    }
                    return ann;
                });
                handleUpdateAllAnnotations(updatedAnnotations);
            }

            const newRelation = {
                type: 'RELATION',
                label: selectedLabelClass,
                sourceId: sourceId,
                targetId: targetId,
                opacity: 0.75
            };

            const updatedAnnotations = [...currentAnnotations, newRelation];
            handleAnnotationsChange(updatedAnnotations);

            setIsCreatingRelation(false);
            setRelationSourceIndex(null);
            showHelper(`${selectedLabelClass} relation added`);
            setSelectedTool('cursor');
        }
    };

    const handleTextSelection = (e) => {
        if (selectedTool !== 'ner') return;
        let start, end;
        if (mode === 'write') {
            const textarea = textAreaRef.current;
            if (!textarea) return;
            start = textarea.selectionStart;
            end = textarea.selectionEnd;
        } else {
            const container = e.currentTarget;
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            const range = selection.getRangeAt(0);
            const preRange = document.createRange();
            preRange.selectNodeContents(container);
            preRange.setEnd(range.startContainer, range.startOffset);
            start = preRange.toString().length;
            end = start + range.toString().length;
        }
        if (start !== end) {
            let newAnnotation = {
                type: 'NER',
                label: selectedLabelClass,
                start,
                end,
                id: `entity-${Date.now()}-${currentAnnotations.length}`
            };
            const updatedAnnotations = [...currentAnnotations, newAnnotation];
            handleAnnotationsChange(updatedAnnotations);
            showHelper(`${selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} annotation added`);
            setSelectedTool('cursor');
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
        }
    };

    const handleAddText = () => {
        setShowAddTextModal(true);
    };

    const handleDeleteText = () => {
        if (!filesList.length || currentIndex < 0 || currentIndex >= filesList.length) {
            showHelper('No text file to delete');
            return;
        }
        setShowConfirmDeleteModal(true);
    };

    const confirmDeleteText = async () => {
        if (!filesList.length || currentIndex < 0 || currentIndex >= filesList.length) return;
        const currentFile = filesList[currentIndex];
        setIsDeleting(true);
        try {
            const relativePathFull = currentFile.url.split('/uploads/')[1];
            const parts = relativePathFull.split('/');
            const folderId = parts.shift();
            const relativePath = parts.join('/');
            const response = await fetch(`http://localhost:4000/api/files/${folderId}/${relativePath}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Failed to delete text file');
            }
            const updatedFiles = [...filesList];
            updatedFiles.splice(currentIndex, 1);
            setFilesList(updatedFiles);
            setTextContent('');
            showHelper('Text file deleted successfully');
        } catch (error) {
            console.error('Error deleting text file:', error);
            showHelper('Error deleting text file');
        } finally {
            setIsDeleting(false);
            setShowConfirmDeleteModal(false);
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

    const handleAnnotationsChange = (newAnnotations) => {
        const updated = {
            ...annotations,
            [currentFileUrl]: newAnnotations,
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

    const handleNext = () => {
        if (currentIndex < filesList.length - 1) setCurrentIndex(i => i + 1);
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
            await res.json();
            showHelper('Annotations saved successfully');
        } catch (err) {
            console.error(err);
            showHelper('Error saving annotations');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="annotate-container">
            <input
                type="file"
                onChange={() => { }}
                style={{ display: 'none' }}
                accept=".txt,.doc,.docx,.pdf"
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
                <div className="divider"></div>
                <button onClick={handlePrev} disabled={currentIndex <= 0}>Prev</button>
                <button onClick={handleNext} disabled={currentIndex >= filesList.length - 1}>Next</button>
                <div className="divider"></div>
                <label>
                    <input
                        type="checkbox"
                        checked={mode === 'read'}
                        onChange={() => setMode('read')}
                    />
                    Read
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={mode === 'write'}
                        onChange={() => setMode('write')}
                    />
                    Write
                </label>
                <div className="divider"></div>
                <button onClick={handleAddText} disabled={isSaving} title="Add Text File">
                    <AddTextIcon /> Add Text
                </button>
                <button onClick={handleDeleteText} disabled={isDeleting || filesList.length === 0} title="Delete Current Text File">
                    <DeleteTextIcon /> Delete Text
                </button>
                <button onClick={() => { }}>Keyboard Shortcuts</button>
                <div className="divider"></div>
                <button onClick={() => { }}>Export</button>
                <span className="img-count">{currentIndex + 1} / {filesList.length}</span>
            </div>
            <div className="annotate-main">
                <div className="tools-sidebar">
                    <div className="sidebar-section">
                        <h3><ToolsIcon /> Tools</h3>
                        <div className="tool-grid">
                            <div className={`tool-button ${selectedTool === 'cursor' ? 'active' : ''}`} onClick={() => setSelectedTool('cursor')} title="Cursor Tool (C)">
                                <div className="tool-icon"><CursorIcon /></div>
                                <div className="tool-name">Cursor</div>
                                <div className="keyboard-hint">C</div>
                            </div>
                            <div className={`tool-button ${selectedTool === 'ner' ? 'active' : ''}`} onClick={() => setSelectedTool('ner')} title="NER Tool (R)">
                                <div className="tool-icon"><NERIcon /></div>
                                <div className="tool-name">NER</div>
                                <div className="keyboard-hint">R</div>
                            </div>
                            <div className={`tool-button ${selectedTool === 'relation' ? 'active' : ''}`} onClick={() => setSelectedTool('relation')} title="Relation Tool (L)">
                                <div className="tool-icon"><RelationIcon /></div>
                                <div className="tool-name">Relation</div>
                                <div className="keyboard-hint">L</div>
                            </div>
                        </div>
                    </div>
                    <div className="sidebar-section">
                        <h3><PaletteIcon /> Active Label</h3>
                        <div className="label-selection">
                            <select value={selectedLabelClass} onChange={(e) => setSelectedLabelClass(e.target.value)}>
                                {activeLabelOptions.map((lc, i) => (
                                    <option key={i} value={lc.name}>{lc.name}</option>
                                ))}
                            </select>
                            <button onClick={() => { setShowAddLabelModal(true); }}>
                                <PlusIcon /> Add Label
                            </button>
                        </div>
                        <div className="label-preview">
                            <div className="label-color" style={{ backgroundColor: activeLabelColor }}></div>
                            <span>Current Label: {selectedLabelClass}</span>
                        </div>
                    </div>
                </div>
                <div className="text-area">
                    {filesList.length > 0 ? (
                        <>
                            {mode === 'write' ? (
                                <textarea
                                    ref={textAreaRef}
                                    value={textContent}
                                    onChange={(e) => setTextContent(e.target.value)}
                                    onMouseUp={handleTextSelection}
                                    onKeyUp={handleTextSelection}
                                    placeholder="Select text to annotate..."
                                />
                            ) : (
                                <div
                                    className="text-display"
                                    ref={textDisplayRef}
                                    onMouseUp={handleTextSelection}
                                    onKeyUp={handleTextSelection}
                                    onClick={() => setActiveEntityId(null)}  /* Clear arrows if click outside */
                                    style={{ userSelect: 'text', position: 'relative' }}
                                >
                                    {renderTextWithHighlights()}
                                    {renderArrowForActiveEntity()}
                                </div>
                            )}
                            {showHelperText && (
                                <div className="canvas-helper visible" ref={canvasHelperRef}>
                                    {helperText}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', margin: 'auto', padding: '40px' }}>No text files found</div>
                    )}
                </div>
                <AnnotationListSidebar
                    annotations={currentAnnotations}
                    onDeleteAnnotation={(index) => {
                        const arr = [...currentAnnotations];
                        arr.splice(index, 1);
                        handleAnnotationsChange(arr);
                    }}
                    onUpdateAnnotation={(index, changes) => {
                        const arr = [...currentAnnotations];
                        arr[index] = { ...arr[index], ...changes };
                        handleAnnotationsChange(arr);
                    }}
                    labelClasses={localLabelClasses}
                    selectedAnnotationIndex={selectedAnnotationIndex}
                    setSelectedAnnotationIndex={setSelectedAnnotationIndex}
                    currentShapes={currentAnnotations}
                    onUpdateAllAnnotations={handleUpdateAllAnnotations}
                />
            </div>
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
                        <p>Are you sure you want to delete this text file? This action cannot be undone.</p>
                        <div className="modal-footer">
                            <button onClick={confirmDeleteText} className="primary" disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                            <button onClick={() => setShowConfirmDeleteModal(false)} className="secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showAddTextModal && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Upload New Text File</h3>
                        <div className="modal-section">
                            <h4>Select File(s)</h4>
                            <input
                                type="file"
                                multiple
                                accept=".txt,.doc,.docx,.pdf"
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
                                showHelper("Uploading text file(s)...");
                                const formData = new FormData();
                                for (let i = 0; i < newFiles.length; i++) {
                                    formData.append('files', newFiles[i]);
                                }
                                try {
                                    const response = await fetch(`http://localhost:4000/api/files/${encodeURIComponent(selectedAddFolder)}`, {
                                        method: 'POST',
                                        body: formData
                                    });
                                    if (!response.ok) {
                                        throw new Error("Failed to upload text file(s)");
                                    }
                                    const result = await response.json();
                                    if (result.files && result.files.length > 0) {
                                        const newFilesList = [...filesList, ...result.files];
                                        setFilesList(newFilesList);
                                        setCurrentIndex(newFilesList.length - result.files.length);
                                        showHelper(`Uploaded ${result.files.length} text file(s) successfully`);
                                    } else {
                                        showHelper("No new text files were uploaded");
                                    }
                                } catch (error) {
                                    console.error("Error uploading text files:", error);
                                    showHelper("Error uploading text file(s): " + error.message);
                                } finally {
                                    setIsSaving(false);
                                    setShowAddTextModal(false);
                                    setNewFiles(null);
                                    setSelectedAddFolder("");
                                }
                            }}>
                                Upload
                            </button>
                            <button className="secondary" onClick={() => {
                                setShowAddTextModal(false);
                                setNewFiles(null);
                                setSelectedAddFolder("");
                            }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function decimalToHexOpacity(decimal) {
    const hex = Math.round(decimal * 255).toString(16);
    return hex.padStart(2, '0');
}

// src/pages/ProjectInfo.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UserHomeTopBar from '../components/UserHomeTopBar';
import FolderTree from '../components/FolderTree';
import './ProjectInfo.css';

// Import icons - you'll need to install react-icons package
// npm install react-icons
import {
    FiFolder,
    FiFile,
    FiTag,
    FiPlusCircle,
    FiUploadCloud,
    FiCheckSquare,
    FiInfo,
    FiGrid,
    FiChevronRight,
    FiEdit,
    FiCalendar,
    FiUsers
} from 'react-icons/fi';

// A set of candidate colors to choose from.
const candidateColors = [
    '#FF5733', '#33FF57', '#3357FF', '#F1C40F',
    '#8E44AD', '#1ABC9C', '#E74C3C', '#2ECC71',
    '#3498DB', '#9B59B6'
];

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(ch => ch + ch).join('');
    }
    const bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function colorDistance(hex1, hex2) {
    const c1 = hexToRgb(hex1);
    const c2 = hexToRgb(hex2);
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
}

function getSuggestedColor(existingColors) {
    // If there are no existing colors, return the first candidate.
    if (existingColors.length === 0) return candidateColors[0];

    let bestCandidate = candidateColors[0];
    let bestDistance = 0;
    candidateColors.forEach(candidate => {
        let minDistance = Infinity;
        existingColors.forEach(existing => {
            const d = colorDistance(candidate, existing);
            if (d < minDistance) {
                minDistance = d;
            }
        });
        if (minDistance > bestDistance) {
            bestDistance = minDistance;
            bestCandidate = candidate;
        }
    });
    return bestCandidate;
}

// Enhanced FolderTree component with icons
const EnhancedFolderTree = ({ node }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!node) return null;

    if (node.type === 'folder') {
        return (
            <li>
                <div className="folder-node">
                    <span
                        className={`folder-toggle ${isOpen ? 'open' : ''}`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <FiChevronRight />
                    </span>
                    <span className="folder-icon"><FiFolder /></span>
                    <span className="folder-name" onClick={() => setIsOpen(!isOpen)}>
                        {node.name}
                    </span>
                </div>
                {isOpen && node.children && (
                    <ul>
                        {node.children.map((child, index) => (
                            <EnhancedFolderTree key={index} node={child} />
                        ))}
                    </ul>
                )}
            </li>
        );
    } else {
        return (
            <li>
                <div className="file-node">
                    <span className="file-icon"><FiFile /></span>
                    <span className="file-name">{node.name}</span>
                </div>
            </li>
        );
    }
};

export default function ProjectInfo() {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [folderTree, setFolderTree] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddLabelForm, setShowAddLabelForm] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [suggestedColor, setSuggestedColor] = useState('');

    // Fetch project details.
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch('http://localhost:4000/api/projects');
                if (res.ok) {
                    const data = await res.json();
                    const found = data.find((proj) => proj.project_id === projectId);
                    setProject(found);
                } else {
                    console.error('Failed to fetch projects');
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId]);

    // Fetch folder tree once project is loaded.
    useEffect(() => {
        if (project) {
            const parts = project.folder_path.split('/');
            const folderId = parts[1];
            const fetchFolderTree = async () => {
                try {
                    const res = await fetch(`http://localhost:4000/api/folder-structure/${folderId}`);
                    if (res.ok) {
                        const treeData = await res.json();
                        setFolderTree(treeData);
                    } else {
                        console.error('Failed to fetch folder structure');
                    }
                } catch (error) {
                    console.error('Error fetching folder structure:', error);
                }
            };
            fetchFolderTree();
        }
    }, [project]);

    // When the add-label modal is shown, compute a suggested color that is different from existing ones.
    useEffect(() => {
        if (showAddLabelForm && project) {
            const usedColors = project.label_classes
                .filter(label => typeof label === 'object' && label.color)
                .map(label => label.color);
            const suggested = getSuggestedColor(usedColors);
            setSuggestedColor(suggested);
        }
    }, [showAddLabelForm, project]);

    // Handle adding a new label.
    const handleAddLabel = async () => {
        if (!newLabelName.trim()) return;
        const newLabel = { name: newLabelName.trim(), color: suggestedColor };
        const updatedLabels = [...(project.label_classes || []), newLabel];
        try {
            const res = await fetch(`http://localhost:4000/api/projects/${project.project_id}/labels`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ labelClasses: updatedLabels })
            });
            if (res.ok) {
                setProject({ ...project, label_classes: updatedLabels });
                setShowAddLabelForm(false);
                setNewLabelName('');
            } else {
                console.error('Failed to update labels');
            }
        } catch (error) {
            console.error('Error updating labels:', error);
        }
    };

    if (loading) {
        return (
            <div className="project-info-page">
                <UserHomeTopBar />
                <div className="project-info-container">
                    <div className="loading-spinner">Loading...</div>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="project-info-page">
                <UserHomeTopBar />
                <div className="project-info-container">
                    <div className="error-message">Project not found.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="project-info-page">
            <UserHomeTopBar />
            <div className="project-info-container">
                <h2>Project Information</h2>

                {/* Project Info Card */}
                <div className="project-info-card">
                    <div className="info-item">
                        <div className="info-icon">
                            <FiEdit />
                        </div>
                        <span className="info-label">Project Name:</span>
                        <span className="info-value">{project.project_name}</span>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">
                            <FiGrid />
                        </div>
                        <span className="info-label">Project Type:</span>
                        <span className="info-value">{project.project_type}</span>
                    </div>

                    {project.created_at && (
                        <div className="info-item">
                            <div className="info-icon">
                                <FiCalendar />
                            </div>
                            <span className="info-label">Created:</span>
                            <span className="info-value">
                                {new Date(project.created_at.trim()).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    )}

                    {project.team_members && (
                        <div className="info-item">
                            <div className="info-icon">
                                <FiUsers />
                            </div>
                            <span className="info-label">Team:</span>
                            <span className="info-value">
                                {project.team_members.join(', ') || 'No team members'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Labels Section */}
                <div className="labels-section">
                    <div className="labels-header">
                        <h3><FiTag /> Labels</h3>
                        <button className="add-label-btn" onClick={() => setShowAddLabelForm(true)}>
                            <FiPlusCircle /> Add Label
                        </button>
                    </div>

                    <div className="labels-grid">
                        {project.label_classes.map((label, index) => {
                            const labelObj = typeof label === 'object' ? label : { name: label, color: candidateColors[index % candidateColors.length] };
                            return (
                                <div
                                    key={index}
                                    className="label-chip"
                                    style={{
                                        backgroundColor: `${labelObj.color}20`, // 20% opacity
                                        color: labelObj.color
                                    }}
                                >
                                    <div
                                        className="label-color"
                                        style={{ backgroundColor: labelObj.color }}
                                    ></div>
                                    {labelObj.name}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Folder Structure Section */}
                <div className="folder-structure-section">
                    <div className="folder-structure-header">
                        <h3><FiFolder /> Folder Structure</h3>
                    </div>

                    {folderTree ? (
                        <div className="folder-tree">
                            <ul>
                                <EnhancedFolderTree node={folderTree} />
                            </ul>
                        </div>
                    ) : (
                        <p>No folder structure available.</p>
                    )}
                </div>

                {/* Actions Section */}
                <div className="actions-section">
                    <button className="btn upload-more-btn">
                        <FiUploadCloud /> Upload More Data
                    </button>
                    <button className="btn create-task-btn">
                        <FiCheckSquare /> Create New Task
                    </button>
                </div>

                {/* Add Label Modal */}
                {showAddLabelForm && (
                    <div className="modal-overlay">
                        <div className="modal-box">
                            <h3>Add New Label</h3>
                            <input
                                type="text"
                                placeholder="Enter label name"
                                value={newLabelName}
                                onChange={(e) => setNewLabelName(e.target.value)}
                            />
                            <div className="color-picker-container">
                                <label>Label Color:</label>
                                <input
                                    type="color"
                                    value={suggestedColor}
                                    onChange={(e) => setSuggestedColor(e.target.value)}
                                    className="color-input"
                                />
                            </div>
                            <div className="modal-buttons">
                                <button className="btn" onClick={handleAddLabel}>Add Label</button>
                                <button className="btn cancel-btn" onClick={() => setShowAddLabelForm(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
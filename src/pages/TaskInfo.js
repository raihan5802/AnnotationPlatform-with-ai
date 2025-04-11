// src/pages/TaskInfo.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserHomeTopBar from '../components/UserHomeTopBar';
import './TaskInfo.css';

// Import icons - you'll need to install react-icons package if not already installed
import {
  FiFolder,
  FiFile,
  FiTag,
  FiCheckSquare,
  FiInfo,
  FiChevronRight,
  FiEdit,
  FiCalendar,
  FiUsers,
  FiGrid,
  FiPlay
} from 'react-icons/fi';

// Enhanced SelectedFilesTree component with icons
const EnhancedFilesTree = ({ node }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!node) return null;

  if (node.children && node.children.length > 0) {
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
        {isOpen && (
          <ul>
            {node.children.map((child, index) => (
              <EnhancedFilesTree key={index} node={child} />
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

export default function TaskInfo() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the task by ID
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/tasks');
        if (res.ok) {
          const data = await res.json();
          const foundTask = data.find(t => t.task_id === taskId);
          setTask(foundTask);
        } else {
          console.error('Failed to fetch tasks');
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId]);

  // Helpers to build a tree structure from selected_files string
  const buildTreeFromPaths = (paths) => {
    const tree = {};
    paths.forEach((pathStr) => {
      const parts = pathStr.split('/');
      let currentLevel = tree;
      parts.forEach((part) => {
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part];
      });
    });
    return tree;
  };

  const convertToTreeNode = (obj, name = 'root') => {
    const children = Object.keys(obj).map((key) =>
      convertToTreeNode(obj[key], key)
    );
    return { name, children };
  };

  const treeData = useMemo(() => {
    if (!task || !task.selected_files) return null;
    const selectedFilesArray = task.selected_files.split(';').filter(Boolean);
    const treeObject = buildTreeFromPaths(selectedFilesArray);
    return convertToTreeNode(treeObject, 'Selected Files');
  }, [task]);

  // Function to create a new job
  const handleCreateJob = async () => {
    const userSession = JSON.parse(localStorage.getItem('user'));
    if (!userSession) {
      alert("User not logged in");
      return;
    }
    try {
      const res = await fetch('http://localhost:4000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userSession.id,
          taskId: task.task_id,
          projectId: task.project_id
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert("Job created successfully with job id: " + data.jobId);
        navigate('/jobs');
      } else {
        const errorData = await res.json();
        alert("Error creating job: " + errorData.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error creating job");
    }
  };

  if (loading) {
    return (
      <div className="task-info-page">
        <UserHomeTopBar />
        <div className="task-info-container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-info-page">
        <UserHomeTopBar />
        <div className="task-info-container">
          <div className="error-message">Task not found.</div>
        </div>
      </div>
    );
  }

  // Format creation date
  const formattedDate = task.created_at
    ? new Date(task.created_at.trim()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    : 'Not available';

  return (
    <div className="task-info-page">
      <UserHomeTopBar />
      <div className="task-info-container">
        <h2>Task Information</h2>

        {/* Task Info Card */}
        <div className="task-info-card">
          <div className="info-item">
            <div className="info-icon">
              <FiEdit />
            </div>
            <span className="info-label">Task Name:</span>
            <span className="info-value">{task.task_name}</span>
          </div>

          <div className="info-item">
            <div className="info-icon">
              <FiGrid />
            </div>
            <span className="info-label">Project:</span>
            <span className="info-value">{task.project_name}</span>
          </div>

          {task.created_at && (
            <div className="info-item">
              <div className="info-icon">
                <FiCalendar />
              </div>
              <span className="info-label">Created:</span>
              <span className="info-value">{formattedDate}</span>
            </div>
          )}

          {task.assigned_to && (
            <div className="info-item">
              <div className="info-icon">
                <FiUsers />
              </div>
              <span className="info-label">Assigned To:</span>
              <span className="info-value">{task.assigned_to}</span>
            </div>
          )}
        </div>

        {/* Annotation Type Section */}
        <div className="annotation-type-section">
          <div className="annotation-type-header">
            <h3><FiTag /> Annotation Type</h3>
          </div>

          <div className="annotation-badge">
            <FiCheckSquare /> {task.annotation_type}
          </div>
        </div>

        {/* Selected Files Section */}
        <div className="selected-files-section">
          <div className="selected-files-header">
            <h3><FiFolder /> Selected Files</h3>
          </div>

          {treeData ? (
            <div className="files-tree">
              <ul>
                <EnhancedFilesTree node={treeData} />
              </ul>
            </div>
          ) : (
            <p>No selected files available.</p>
          )}
        </div>

        {/* Create Job Button */}
        <button className="create-job-btn" onClick={handleCreateJob}>
          <FiPlay /> Create New Job
        </button>
      </div>
    </div>
  );
}
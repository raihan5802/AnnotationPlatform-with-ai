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
  FiPlay,
  FiEye
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
  const [projectType, setProjectType] = useState('');
  const [userSession, setUserSession] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const [accessLevel, setAccessLevel] = useState(null);

  // First fetch the user session
  useEffect(() => {
    const session = localStorage.getItem('user');
    if (!session) {
      localStorage.setItem('redirectAfterLogin', JSON.stringify({
        path: `/task-info/${taskId}`
      }));
      navigate('/signin');
      return;
    }
    const user = JSON.parse(session);
    setUserSession(user);
  }, [navigate, taskId]);

  // Fetch the task by ID
  useEffect(() => {
    if (!userSession) return;

    const fetchTask = async () => {
      try {
        // Fetch tasks filtered by current user ID
        const res = await fetch(`http://localhost:4000/api/tasks?userId=${userSession.id}`);
        if (res.ok) {
          const data = await res.json();
          const foundTask = data.find(t => t.task_id === taskId);

          // Handle unauthorized access
          if (!foundTask) {
            setUnauthorized(true);
            setLoading(false);
            return;
          }

          setTask(foundTask);

          // Fetch project type
          if (foundTask && foundTask.project_id) {
            const projectRes = await fetch(`http://localhost:4000/api/projects?userId=${userSession.id}`);
            if (projectRes.ok) {
              const projectsData = await projectRes.json();
              const project = projectsData.find(p => p.project_id === foundTask.project_id);
              if (project) {
                setProjectType(project.project_type);
                // Add project_type to task object
                foundTask.project_type = project.project_type;
                setTask(foundTask);
              }
            }
          }
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
  }, [taskId, userSession]);

  // Add this useEffect to fetch the user's access level
  useEffect(() => {
    if (!task || !userSession) return;

    // Fetch the user's access level for this task
    fetch(`http://localhost:4000/api/task-access/${task.task_id}/${userSession.id}`)
      .then(res => res.json())
      .then(data => {
        setAccessLevel(data.access_level);
      })
      .catch(error => {
        console.error('Error fetching access level:', error);
      });
  }, [task, userSession]);

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

  // Function to start annotating directly
  // const handleStartAnnotating = () => {
  //   if (!task) return;

  //   const annType = task.annotation_type ? task.annotation_type.trim().toLowerCase() : '';
  //   const projType = task.project_type ? task.project_type.trim().toLowerCase() : '';
  //   let redirectPath = '/detection'; // Default to detection page

  //   if (annType === 'all') {
  //     if (projType === 'image detection') redirectPath = '/detection';
  //     else if (projType === 'image segmentation') redirectPath = '/segmentation';
  //     else if (projType === 'image classification') redirectPath = '/classification';
  //     else if (projType === '3d image annotation') redirectPath = '/3d';
  //     else if (projType === 'span annotation') redirectPath = '/span';
  //     else if (projType === 'relation annotation') redirectPath = '/relation';
  //   } else if (annType === 'keypoints(unlimited)' || annType === 'keypoints(limited)') {
  //     redirectPath = '/keypoints';
  //   } else if (annType === 'caption') {
  //     redirectPath = '/caption';
  //   } else if (annType.includes('bbox') || annType === 'bounding box') {
  //     redirectPath = '/detection';
  //   } else if (annType.includes('segmentation') || annType === 'polygon') {
  //     redirectPath = '/segmentation';
  //   }

  //   navigate(redirectPath, { state: { taskId: task.task_id } });
  // };

  const handleStartAnnotating = () => {
    if (!task) return;

    const annType = task.annotation_type ? task.annotation_type.trim().toLowerCase() : '';
    const projType = task.project_type ? task.project_type.trim().toLowerCase() : '';
    let redirectPath = '/detection'; // Default to detection page

    if (annType === 'all') {
      if (projType === 'image detection') redirectPath = '/detection';
      else if (projType === 'image segmentation') redirectPath = '/segmentation';
      else if (projType === 'image classification') redirectPath = '/classification';
      else if (projType === '3d image annotation') redirectPath = '/3d';
      else if (projType === 'span annotation') redirectPath = '/span';
      else if (projType === 'relation annotation') redirectPath = '/relation';
    } else if (annType === 'keypoints(unlimited)' || annType === 'keypoints(limited)') {
      redirectPath = '/keypoints';
    } else if (annType === 'caption') {
      redirectPath = '/caption';
    } else if (annType.includes('bbox') || annType === 'bounding box') {
      redirectPath = '/detection';
    } else if (annType.includes('segmentation') || annType === 'polygon') {
      redirectPath = '/segmentation';
    }

    // Include access level in the state
    navigate(redirectPath, {
      state: {
        taskId: task.task_id,
        accessLevel: accessLevel
      }
    });
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

  if (unauthorized) {
    return (
      <div className="task-info-page">
        <UserHomeTopBar />
        <div className="task-info-container">
          <div className="error-message">
            <h2>Access Denied</h2>
            <p>You don't have permission to access this task.</p>
            <button onClick={() => navigate('/tasks')} className="back-btn">
              Back to Tasks
            </button>
          </div>
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

          {task.project_type && (
            <div className="info-item">
              <div className="info-icon">
                <FiInfo />
              </div>
              <span className="info-label">Project Type:</span>
              <span className="info-value">{task.project_type}</span>
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

        {/* Start Annotating Button */}
        {accessLevel && (
          <button
            className="start-annotating-btn"
            onClick={handleStartAnnotating}
          >
            {accessLevel === 'viewer' ? (
              <>
                <FiEye /> View Annotations
              </>
            ) : (
              <>
                <FiPlay /> Start Annotating
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
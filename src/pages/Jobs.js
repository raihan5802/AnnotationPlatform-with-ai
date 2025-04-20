// src/pages/Jobs.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHomeTopBar from '../components/UserHomeTopBar';
import { FiFolder, FiSearch } from 'react-icons/fi';
import './Jobs.css';

export default function Jobs() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // useEffect(() => {
    //     const fetchData = async () => {
    //         setIsLoading(true);
    //         try {
    //             // Fetch jobs
    //             const jobsRes = await fetch('http://localhost:4000/api/jobs');
    //             if (!jobsRes.ok) throw new Error('Failed to fetch jobs');
    //             const jobsData = await jobsRes.json();
    //             setJobs(jobsData);

    //             // Fetch tasks
    //             const tasksRes = await fetch('http://localhost:4000/api/tasks');
    //             if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
    //             const tasksData = await tasksRes.json();
    //             setTasks(tasksData);

    //             // Fetch projects
    //             const projectsRes = await fetch('http://localhost:4000/api/projects');
    //             if (!projectsRes.ok) throw new Error('Failed to fetch projects');
    //             const projectsData = await projectsRes.json();
    //             setProjects(projectsData);
    //         } catch (error) {
    //             console.error('Error fetching data:', error);
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };

    //     fetchData();
    // }, []);

    // Modified useEffect for fetching data in Jobs.js
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Get user session from localStorage
                const userSession = localStorage.getItem('user');
                if (!userSession) {
                    navigate('/signin');
                    return;
                }

                // Extract the user ID from the session
                const user = JSON.parse(userSession);
                const userId = user.id;

                // Fetch jobs with userId
                const jobsRes = await fetch(`http://localhost:4000/api/jobs?userId=${userId}`);
                if (!jobsRes.ok) throw new Error('Failed to fetch jobs');
                const jobsData = await jobsRes.json();
                setJobs(jobsData);

                // Fetch tasks with userId
                const tasksRes = await fetch(`http://localhost:4000/api/tasks?userId=${userId}`);
                if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
                const tasksData = await tasksRes.json();
                setTasks(tasksData);

                // Fetch projects with userId
                const projectsRes = await fetch(`http://localhost:4000/api/projects?userId=${userId}`);
                if (!projectsRes.ok) throw new Error('Failed to fetch projects');
                const projectsData = await projectsRes.json();
                setProjects(projectsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Check if user is logged in
        const userSession = localStorage.getItem('user');
        if (!userSession) {
            navigate('/signin');
            return;
        }

        fetchData();
    }, [navigate]);

    const combinedJobs = jobs.map(job => {
        const task = tasks.find(t => t.task_id === job.task_id) || {};
        const project = projects.find(p => p.project_id === job.project_id) || {};
        return {
            ...job,
            taskName: task.task_name || 'Unknown Task',
            projectName: project.project_name || 'Unknown Project',
            projectType: project.project_type || '',
            annotation_type: task.annotation_type || ''
        };
    });

    const filteredJobs = combinedJobs.filter(job =>
        job.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.job_id.toString().includes(searchQuery)
    );

    const handleContinueAnnotating = (job) => {
        const annType = job.annotation_type ? job.annotation_type.trim().toLowerCase() : '';
        const projType = job.projectType ? job.projectType.trim().toLowerCase() : '';
        let redirectPath = `/task-info/${job.task_id}`;

        if (annType === 'all') {
            if (projType === 'image detection') redirectPath = '/detection';
            else if (projType === 'image segmentation') redirectPath = '/segmentation';
            else if (projType === 'image classification') redirectPath = '/classification';
            else if (projType === '3d image annotation') redirectPath = '/3d';
            else if (projType === 'span annotation') redirectPath = '/span';
            else if (projType === 'relation annotation') redirectPath = '/relation';
        } else if (annType === 'keypoints(unlimited)') {
            redirectPath = '/keypoints';
        } else if (annType === 'keypoints(limited)') {
            redirectPath = '/keypoints';
        } else if (annType === 'caption') {
            redirectPath = '/caption';
        }
        navigate(redirectPath, { state: { taskId: job.task_id } });
    };

    return (
        <div className="jobs-page">
            <UserHomeTopBar />
            <div className="jobs-container">
                <h2>
                    <FiFolder className="header-icon" />
                    My Jobs
                </h2>
                <div className="search-bar-container">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by project, task, or job ID..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="jobs-list">
                    {isLoading ? (
                        <div className="loading-spinner">Loading jobs...</div>
                    ) : filteredJobs.length > 0 ? (
                        filteredJobs.map(job => (
                            <div key={job.job_id} className="job-card">
                                <div className="job-info">
                                    <p><strong>Project:</strong> {job.projectName}</p>
                                    <p><strong>Task:</strong> {job.taskName}</p>
                                    <p><strong>Job ID:</strong> {job.job_id}</p>
                                    <p><strong>Progress:</strong> {job.progress}%</p>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${job.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <button
                                    className="continue-btn"
                                    onClick={() => handleContinueAnnotating(job)}
                                >
                                    Continue Annotating
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="no-jobs">
                            <p>No jobs found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
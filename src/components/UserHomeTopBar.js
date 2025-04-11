import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './UserHomeTopBar.css';

function UserHomeTopBar({
    taskName,
    onPrev,
    onNext,
    onSave,
    onZoomIn,
    onZoomOut,
    onExport,
    currentIndex,
    total,
    showControls = false,
    isSaving = false
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
        }

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem('user');
        setUser(null);
        setIsDropdownOpen(false);
        navigate('/');
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Regular menu items for home/images pages
    const regularMenu = (
        <>
            <div className="menu-item">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M2 9.88L5.12 13 8.88 7 12 13l3.88-5.88L19.12 13 22 9.88"></path>
                    <rect x="3" y="13" width="18" height="8" rx="2"></rect>
                </svg>
                <span onClick={() => navigate('/projects')}>Projects</span>
            </div>
            <div className="menu-item">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span onClick={() => navigate('/tasks')}>Tasks</span>
            </div>
            <div className="menu-item">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span onClick={() => navigate('/jobs')}>Jobs</span>
            </div>
        </>
    );

    // Task name and controls for annotation pages
    const annotationMenu = (
        <div className="annotation-menu">
            {taskName && (
                <div className="task-name">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                        <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
                        <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
                    </svg>
                    <span>{taskName}</span>
                </div>
            )}
            {/* {showControls && currentIndex !== undefined && total !== undefined && (
                <div className="annotation-progress">
                    <span>{currentIndex + 1} of {total}</span>
                </div>
            )}
            {showControls && (
                <div className="annotation-controls">
                    <button className="control-btn" onClick={onPrev} title="Previous">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button className="control-btn" onClick={onNext} title="Next">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    <button className="control-btn" onClick={onZoomIn} title="Zoom In">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </button>
                    <button className="control-btn" onClick={onZoomOut} title="Zoom Out">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </button>
                    <button 
                        className={`save-btn ${isSaving ? 'saving' : ''}`} 
                        onClick={onSave} 
                        disabled={isSaving}
                        title="Save"
                    >
                        {isSaving ? (
                            <>
                                <svg className="spinner" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                    <circle cx="12" cy="12" r="10" strokeDasharray="42" strokeDashoffset="0"></circle>
                                </svg>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                <span>Save</span>
                            </>
                        )}
                    </button>
                    <button className="export-btn" onClick={onExport} title="Export">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span>Export</span>
                    </button>
                </div>
            )} */}
        </div>
    );

    return (
        <header className="user-home-topbar">
            <div className="topbar-container">
                <div className="topbar-logo" onClick={() => navigate('/userhome')}>
                    <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none">
                        <path d="M4 12 L8 4 L16 20 L20 12" />
                        <circle cx="12" cy="12" r="2" />
                        <path d="M12 10 V4 M12 14 V20" />
                    </svg>
                    <span>Nexlify</span>
                </div>

                <div className="topbar-menu-toggle" onClick={toggleMobileMenu}>
                    <div className={`menu-toggle-bar ${isMobileMenuOpen ? 'open' : ''}`}></div>
                </div>

                <nav className={`topbar-menu ${isMobileMenuOpen ? 'open' : ''}`} ref={mobileMenuRef}>
                    {showControls ? annotationMenu : regularMenu}
                </nav>

                <div className="topbar-actions">
                    {user ? (
                        <div className="user-profile" ref={dropdownRef}>
                            <div className="user-avatar" onClick={toggleDropdown}>
                                <span>{user.username.charAt(0).toUpperCase()}</span>
                            </div>

                            {isDropdownOpen && (
                                <div className="user-dropdown">
                                    <div className="dropdown-header">
                                        <span className="user-name">{user.username}</span>
                                        <span className="user-email">{user.email || 'user@example.com'}</span>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <div className="dropdown-item" onClick={() => navigate('/account')}>
                                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <span>Account</span>
                                    </div>
                                    <div className="dropdown-item" onClick={() => navigate('/tasks')}>
                                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                        <span>Tasks</span>
                                    </div>
                                    <div className="dropdown-item" onClick={handleSignOut}>
                                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                        <span>Logout</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="signin-btn" onClick={() => navigate('/signin')}>
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

export default UserHomeTopBar;
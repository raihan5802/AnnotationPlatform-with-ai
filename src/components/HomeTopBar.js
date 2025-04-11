// src/components/HomeTopBar.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeTopBar.css';

function HomeTopBar({
    taskName,
    showControls = false
}) {
    const navigate = useNavigate();
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

    return (
        <header className="topbar">
            <div className="topbar-container">
                <div className="topbar-logo" onClick={() => navigate('/')}>
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
                    {showControls ? (
                        <div className="topbar-task">
                            {taskName && <span>Current Task: {taskName}</span>}
                        </div>
                    ) : (
                        <>
                            <div className="menu-item">
                                <span>Product</span>
                                <div className="menu-dropdown">
                                    <a href="#" onClick={e => { e.preventDefault(); handleGoImages(); }}>Image Detection</a>
                                    <a href="#" onClick={e => { e.preventDefault(); handleGoSegmentation(); }}>Image Segmentation</a>
                                    <a href="#" onClick={e => { e.preventDefault(); handleGoClassification(); }}>Classification</a>
                                    <a href="#" onClick={e => { e.preventDefault(); handleGo3DAnnotation(); }}>3D Annotation</a>
                                </div>
                            </div>
                            <div className="menu-item">
                                <span>Pricing</span>
                            </div>
                            <div className="menu-item">
                                <span>Resources</span>
                                <div className="menu-dropdown">
                                    <a href="#">Documentation</a>
                                    <a href="#">API</a>
                                    <a href="#">Community</a>
                                </div>
                            </div>
                            <div className="menu-item">
                                <span>Company</span>
                            </div>
                        </>
                    )}
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

    function handleGoImages() {
        handleNavigation('/images', { segmentationMode: false, classificationMode: false });
    }

    function handleGoSegmentation() {
        handleNavigation('/images', { segmentationMode: true, classificationMode: false });
    }

    function handleGoClassification() {
        handleNavigation('/images', { segmentationMode: false, classificationMode: true });
    }

    function handleGo3DAnnotation() {
        handleNavigation('/images', { segmentationMode: false, classificationMode: false, threeDMode: true });
    }

    function handleNavigation(path, state) {
        if (!user) {
            localStorage.setItem('redirectAfterLogin', JSON.stringify({ path, state }));
            navigate('/signin');
        } else {
            navigate(path, { state });
        }
    }
}

export default HomeTopBar;
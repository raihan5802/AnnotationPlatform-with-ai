// src/pages/Home.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeTopBar from '../components/HomeTopBar';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const userSession = localStorage.getItem('user');
    setIsAuthenticated(!!userSession);
  }, []);

  const handleNavigation = (path, state) => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', JSON.stringify({
        path,
        state
      }));
      navigate('/signin');
    } else {
      navigate(path, { state });
    }
  };

  const handleGoImages = () => {
    handleNavigation('/images', {
      segmentationMode: false,
      classificationMode: false
    });
  };

  const handleGoSegmentation = () => {
    handleNavigation('/images', {
      segmentationMode: true,
      classificationMode: false
    });
  };

  const handleGoClassification = () => {
    handleNavigation('/images', {
      segmentationMode: false,
      classificationMode: true
    });
  };

  const handleGo3DAnnotation = () => {
    handleNavigation('/images', {
      segmentationMode: false,
      classificationMode: false,
      threeDMode: true
    });
  };

  const slides = [
    {
      title: 'Image Detection',
      description: 'Powerful tools for object detection including bounding box, polygon, polyline, point, and ellipse annotations.',
      image: 'https://images.unsplash.com/photo-1633412802994-5c058f151b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      action: handleGoImages,
      color: '#3498db'
    },
    {
      title: 'Image Segmentation',
      description: 'Advanced segmentation tools supporting instance, semantic, and panoptic segmentation for detailed image analysis.',
      image: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      action: handleGoSegmentation,
      color: '#2ecc71'
    },
    {
      title: 'Image Classification',
      description: 'Streamlined tools to assign labels and categories to entire images for efficient dataset organization.',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      action: handleGoClassification,
      color: '#9b59b6'
    },
    {
      title: '3D Image Annotation',
      description: 'Cutting-edge tools for annotating 3D volumetric data and depth-enhanced imagery.',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      action: handleGo3DAnnotation,
      color: '#e74c3c'
    },
  ];

  const handlePrevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const handleNextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
  };

  // Add this useEffect inside your Home component, after other useEffects
  useEffect(() => {
    const blocks = document.querySelectorAll('.hero-3d-blocks-container .block');
    const columns = 8; // Match this to your grid-template-columns

    blocks.forEach((block, index) => {
      block.addEventListener('mouseenter', () => {
        // Define surrounding block indices
        const surroundingIndices = [
          index - columns - 1, index - columns, index - columns + 1, // Top row
          index - 1, index + 1,             // Middle row
          index + columns - 1, index + columns, index + columns + 1  // Bottom row
        ];

        // Light up surrounding blocks
        surroundingIndices.forEach(idx => {
          if (idx >= 0 && idx < blocks.length) {
            // Make sure we don't wrap around the grid
            const row = Math.floor(index / columns);
            const targetRow = Math.floor(idx / columns);

            // Only apply if we're within 1 row (prevents wrapping)
            if (Math.abs(row - targetRow) <= 1) {
              blocks[idx].classList.add('surrounding-active');
            }
          }
        });
      });

      block.addEventListener('mouseleave', () => {
        blocks.forEach(b => b.classList.remove('surrounding-active'));
      });
    });

    return () => {
      // Clean up event listeners
      blocks.forEach(block => {
        block.replaceWith(block.cloneNode(true));
      });
    };
  }, []);

  return (
    <div className="home-container">
      <HomeTopBar />
      <div className="home-hero">
        <div className="hero-content">
          <h1>
            {Array.from("Next-Gen AI Annotation Platform").map((char, index) => {
              if (char === ' ') {
                return ' ';
              } else {
                return <span key={index}>{char}</span>;
              }
            })}
          </h1>
          <p>Streamline your machine learning workflows with our powerful annotation tools</p>
          <button className="cta-button" onClick={() => navigate('/signin')}>
            Get Started For Free
          </button>
        </div>

        {/* Add grid of uniform 3D blocks */}
        <div className="hero-3d-blocks-container">
          {Array(64).fill().map((_, index) => (
            <div key={index} className="block" data-index={index}></div>
          ))}
        </div>

        <div className="hero-image">
          <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" alt="AI annotation" />
        </div>
      </div>

      <div className="services-section">
        <div className="section-header">
          <h2>Annotation Services</h2>
          <p>Comprehensive tools for all your data labeling needs</p>
        </div>

        <div className="carousel-wrapper">
          <div className="carousel-indicators">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`indicator ${currentSlide === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                style={{ backgroundColor: currentSlide === index ? slides[index].color : '' }}
              />
            ))}
          </div>

          <div className="carousel-container">
            <button
              className="carousel-btn prev"
              onClick={handlePrevSlide}
              disabled={currentSlide === 0}
            >
              &#10094;
            </button>

            <div className="carousel-track">
              {slides.map((slide, index) => (
                <div
                  className={`carousel-card ${currentSlide === index ? 'active' : ''}`}
                  key={index}
                  style={{
                    transform: `translateX(${(index - currentSlide) * 110}%)`,
                    opacity: currentSlide === index ? 1 : 0.3,
                    zIndex: currentSlide === index ? 10 : 1
                  }}
                >
                  <div className="card-content">
                    <div className="card-text">
                      <h3 style={{ color: slide.color }}>{slide.title}</h3>
                      <p>{slide.description}</p>
                      <button
                        className="service-btn"
                        onClick={slide.action}
                        style={{ backgroundColor: slide.color }}
                      >
                        Try {slide.title}
                      </button>
                    </div>
                    <div className="card-image">
                      <img src={slide.image} alt={slide.title} />
                      <div className="image-overlay" style={{ backgroundColor: slide.color }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="carousel-btn next"
              onClick={handleNextSlide}
              disabled={currentSlide === slides.length - 1}
            >
              &#10095;
            </button>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="section-header">
          <h2>Why Choose Our Platform</h2>
          <p>Industry-leading features to accelerate your AI development</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h3>AI-Assisted Labeling</h3>
            <p>Smart pre-annotations and auto-labeling to speed up workflows</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3>Real-time Collaboration</h3>
            <p>Work simultaneously with your team on the same project</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>Quality Assurance</h3>
            <p>Built-in review workflows and consensus mechanisms</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h3>Model Integration</h3>
            <p>Seamlessly connect with your ML pipelines and frameworks</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Data?</h2>
          <p>Start building better AI models with high-quality annotations today</p>
          <div className="cta-buttons">
            <button className="cta-button primary" onClick={() => navigate('/signin')}>
              Start Free Trial
            </button>
            <button className="cta-button secondary" onClick={() => window.scrollTo(0, 0)}>
              Learn More
            </button>
          </div>
        </div>
      </div>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">AI Platform</div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#">Features</a>
              <a href="#">Solutions</a>
              <a href="#">Integrations</a>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">API</a>
              <a href="#">Community</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 AI Annotation Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
// Animation Controller
class AnimationController {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupParallaxEffects();
        this.setupHoverAnimations();
        this.setupLoadingAnimations();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, this.observerOptions);

        // Observe elements that should animate on scroll
        document.querySelectorAll('.feature-card, .history-item, .qr-result, .scan-result')
            .forEach(el => {
                el.classList.add('animate-on-scroll');
                observer.observe(el);
            });
    }

    setupParallaxEffects() {
        const bubbles = document.querySelectorAll('.bg-bubble');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;

            bubbles.forEach((bubble, index) => {
                const speed = (index + 1) * 0.2;
                bubble.style.transform = `translate3d(0, ${rate * speed}px, 0)`;
            });
        });
    }

    setupHoverAnimations() {
        // Card hover effects
        document.querySelectorAll('.feature-card, .history-item').forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.animateCardHover(card, true);
            });
            
            card.addEventListener('mouseleave', () => {
                this.animateCardHover(card, false);
            });
        });

        // Button hover effects
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.animateButtonHover(btn, true);
            });
            
            btn.addEventListener('mouseleave', () => {
                this.animateButtonHover(btn, false);
            });
        });
    }

    animateCardHover(card, isEntering) {
        if (isEntering) {
            card.style.transform = 'translateY(-10px) scale(1.02)';
            card.style.boxShadow = '0 20px 60px rgba(102, 126, 234, 0.3)';
        } else {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '';
        }
    }

    animateButtonHover(btn, isEntering) {
        if (isEntering) {
            btn.style.transform = 'translateY(-2px) scale(1.05)';
        } else {
            btn.style.transform = 'translateY(0) scale(1)';
        }
    }

    setupLoadingAnimations() {
        const loadingSpinner = document.querySelector('.spinner');
        
        if (loadingSpinner) {
            // Add pulsing effect to loading spinner
            setInterval(() => {
                loadingSpinner.style.borderLeftColor = this.getRandomColor();
            }, 1000);
        }
    }

    getRandomColor() {
        const colors = [
            'var(--primary-color)',
            'var(--secondary-color)',
            'var(--accent-color)',
            'var(--success-color)',
            'var(--warning-color)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Smooth scroll to element
    scrollToElement(elementId, offset = 0) {
        const element = document.getElementById(elementId);
        if (element) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    // Fade in animation
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            
            element.style.opacity = Math.min(progress / duration, 1);
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Fade out animation
    fadeOut(element, duration = 300) {
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            
            element.style.opacity = Math.max(1 - (progress / duration), 0);
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Slide in from direction
    slideIn(element, direction = 'up', duration = 300) {
        const directions = {
            up: 'translateY(20px)',
            down: 'translateY(-20px)',
            left: 'translateX(20px)',
            right: 'translateX(-20px)'
        };

        element.style.transform = directions[direction];
        element.style.opacity = '0';
        element.style.display = 'block';

        setTimeout(() => {
            element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            element.style.transform = 'translate(0)';
            element.style.opacity = '1';
        }, 10);
    }

    // Bounce animation
    bounce(element, intensity = 10) {
        let bounces = 3;
        const animate = () => {
            element.style.transform = `translateY(-${intensity}px)`;
            
            setTimeout(() => {
                element.style.transform = 'translateY(0)';
                bounces--;
                
                if (bounces > 0) {
                    intensity *= 0.6; // Reduce bounce intensity
                    setTimeout(animate, 150);
                }
            }, 150);
        };
        
        animate();
    }

    // Shake animation for errors
    shake(element) {
        const originalTransform = element.style.transform;
        const shakes = 3;
        let currentShake = 0;
        
        const doShake = () => {
            element.style.transform = `translateX(${currentShake % 2 ? '5px' : '-5px'})`;
            currentShake++;
            
            if (currentShake < shakes * 2) {
                setTimeout(doShake, 100);
            } else {
                element.style.transform = originalTransform;
            }
        };
        
        doShake();
    }

    // Pulse animation
    pulse(element, scale = 1.1, duration = 600) {
        const originalTransform = element.style.transform;
        
        element.style.transition = `transform ${duration/2}ms ease-in-out`;
        element.style.transform = `scale(${scale})`;
        
        setTimeout(() => {
            element.style.transform = originalTransform;
        }, duration/2);
    }

    // Typing effect
    typeWriter(element, text, speed = 50) {
        element.innerHTML = '';
        let i = 0;
        
        const type = () => {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        };
        
        type();
    }

    // Counter animation
    animateCounter(element, endValue, duration = 2000) {
        const startValue = 0;
        const startTime = Date.now();
        
        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            
            const currentValue = Math.floor(progress * endValue);
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.animationController = new AnimationController();
});

// Add CSS for scroll animations
const scrollAnimationCSS = `
.animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-on-scroll.animate-in {
    opacity: 1;
    transform: translateY(0);
}

.scan-progress {
    position: absolute;
    bottom: 70px;
    left: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 1rem;
    color: white;
    font-size: 0.9rem;
}

.progress-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.progress-fill {
    height: 100%;
    background: var(--primary-gradient);
    width: 0;
    transition: width 0.3s ease;
    border-radius: 2px;
}

.progress-text {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.progress-label {
    font-weight: 500;
}

.progress-count {
    font-weight: 600;
    color: var(--primary-color);
}

@media (prefers-reduced-motion: reduce) {
    .animate-on-scroll {
        transition: opacity 0.3s ease;
        transform: none;
    }
}
`;

// Inject scroll animation CSS
const style = document.createElement('style');
style.textContent = scrollAnimationCSS;
document.head.appendChild(style);

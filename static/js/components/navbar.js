// Navbar Component JavaScript

const NavbarComponent = {
    elements: {},
    
    // Initialize the component
    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.setupScrollEffect();
        this.setupActiveNavigation();
        console.log('Navbar Component initialized');
    },

    // Cache DOM elements
    cacheElements: function() {
        this.elements = {
            navbar: document.querySelector('.custom-navbar'),
            navLinks: document.querySelectorAll('.navbar-nav-link'),
            actionBtns: document.querySelectorAll('.navbar-action-btn'),
            helpBtn: document.querySelector('.navbar-action-btn[title="Yardım"]'),
            settingsBtn: document.querySelector('.navbar-action-btn[title="Ayarlar"]'),
            themeBtn: document.querySelector('.navbar-action-btn.theme-btn'),
            mobileToggle: document.querySelector('.mobile-menu-toggle'),
            brandIcon: document.querySelector('.navbar-brand-icon')
        };
    },

    // Bind events
    bindEvents: function() {
        // Navigation link clicks
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', this.handleNavClick.bind(this));
        });

        // Action button clicks
        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener('click', this.showHelp.bind(this));
        }

        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', this.openSettings.bind(this));
        }

        if (this.elements.themeBtn) {
            this.elements.themeBtn.addEventListener('click', this.toggleTheme.bind(this));
        }

        if (this.elements.mobileToggle) {
            this.elements.mobileToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }


    },

    // Handle navigation link clicks
    handleNavClick: function(e) {
        // Don't prevent default for actual links, only for placeholder links
        if (e.target.closest('a').getAttribute('href') === '#') {
            e.preventDefault();
            this.showComingSoon(e.target.textContent.trim());
        }
        
        this.setActiveNavItem(e.target.closest('a'));
    },

    // Set active navigation item
    setActiveNavItem: function(activeLink) {
        // Remove active class from all links
        this.elements.navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to clicked link
        if (activeLink) {
            activeLink.classList.add('active');
        }
    },

    // Setup scroll effect
    setupScrollEffect: function() {
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (this.elements.navbar) {
                if (currentScrollY > 50) {
                    this.elements.navbar.classList.add('scrolled');
                } else {
                    this.elements.navbar.classList.remove('scrolled');
                }
            }
            
            lastScrollY = currentScrollY;
        });
    },

    // Setup active navigation based on current page
    setupActiveNavigation: function() {
        const currentPath = window.location.pathname;
        
        this.elements.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            if (href === currentPath || 
                (currentPath === '/' && href === '/') ||
                (currentPath.includes('/news') && link.textContent.includes('Haber'))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    // Show help modal
    showHelp: function() {
        const helpContent = `
            <div class="help-content">
                <h5><i class="fas fa-question-circle me-2"></i>Yardım</h5>
                <div class="help-sections">
                    <div class="help-section">
                        <h6>Klavye Kısayolları:</h6>
                        <ul>
                            <li><kbd>Ctrl + Enter</kbd> - Haber işle</li>
                            <li><kbd>Ctrl + S</kbd> - Kaydet</li>
                            <li><kbd>Esc</kbd> - Temizle</li>
                            <li><kbd>F1</kbd> - Bu yardım menüsü</li>
                        </ul>
                    </div>
                    <div class="help-section">
                        <h6>Özellikler:</h6>
                        <ul>
                            <li>Otomatik kayıt</li>
                            <li>Metin doğrulama</li>
                            <li>AI ile haber işleme</li>
                            <li>Geçmiş takibi</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        if (typeof Utils !== 'undefined') {
            Utils.showNotification(helpContent, 'info', 8000);
        }
        
        // Animate help button
        this.animateActionButton(this.elements.helpBtn);
    },

    // Open settings
    openSettings: function() {
        // For now, show a coming soon message
        // Later this will open a settings modal
        if (typeof Utils !== 'undefined') {
            Utils.showNotification('Ayarlar paneli yakında eklenecek!', 'info', 3000);
        }
        
        // Animate settings button
        this.animateActionButton(this.elements.settingsBtn);
    },

    // Toggle theme
    toggleTheme: function() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        
        // Update theme button state
        if (newTheme === 'dark') {
            this.elements.themeBtn.classList.add('active');
        } else {
            this.elements.themeBtn.classList.remove('active');
        }
        
        // Save theme preference
        if (typeof Utils !== 'undefined') {
            Utils.storage.set('theme', newTheme);
            Utils.showNotification(`${newTheme === 'dark' ? 'Karanlık' : 'Aydınlık'} tema aktif`, 'success', 2000);
        }
        
        // Animate theme button
        this.animateActionButton(this.elements.themeBtn);
    },

    // Toggle mobile menu
    toggleMobileMenu: function() {
        const navSection = document.querySelector('.navbar-nav-section');
        
        if (navSection) {
            navSection.classList.toggle('mobile-active');
        }
        
        // Animate mobile toggle
        this.animateActionButton(this.elements.mobileToggle);
    },

    // Animate action button
    animateActionButton: function(button) {
        if (!button || typeof gsap === 'undefined') return;
        
        gsap.fromTo(button, 
            { scale: 1 },
            { 
                scale: 1.2,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut'
            }
        );
    },



    // Show coming soon message
    showComingSoon: function(feature) {
        if (typeof Utils !== 'undefined') {
            Utils.showNotification(`${feature} özelliği yakında eklenecek!`, 'info', 3000);
        }
    },

    // Load saved theme
    loadSavedTheme: function() {
        if (typeof Utils !== 'undefined') {
            const savedTheme = Utils.storage.get('theme', 'light');
            document.body.setAttribute('data-theme', savedTheme);
            
            if (savedTheme === 'dark' && this.elements.themeBtn) {
                this.elements.themeBtn.classList.add('active');
            }
        }
    },

    // Update active navigation programmatically
    updateActiveNav: function(path) {
        this.elements.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            if (href === path) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    // Get current active navigation
    getCurrentActiveNav: function() {
        const activeLink = document.querySelector('.navbar-nav-link.active');
        return activeLink ? activeLink.textContent.trim() : null;
    },

    // Show notification badge on action button
    showNotificationBadge: function(buttonType, count = 1) {
        const button = this.elements[buttonType + 'Btn'];
        if (!button) return;
        
        // Remove existing badge
        const existingBadge = button.querySelector('.notification-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Add new badge
        const badge = document.createElement('span');
        badge.className = 'notification-badge';
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: var(--danger-color);
            color: white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        `;
        
        button.appendChild(badge);
        
        // Animate badge appearance
        if (typeof gsap !== 'undefined') {
            gsap.from(badge, {
                scale: 0,
                duration: 0.3,
                ease: 'back.out(1.7)'
            });
        }
    },

    // Hide notification badge
    hideNotificationBadge: function(buttonType) {
        const button = this.elements[buttonType + 'Btn'];
        if (!button) return;
        
        const badge = button.querySelector('.notification-badge');
        if (badge) {
            if (typeof gsap !== 'undefined') {
                gsap.to(badge, {
                    scale: 0,
                    duration: 0.2,
                    ease: 'power2.in',
                    onComplete: () => badge.remove()
                });
            } else {
                badge.remove();
            }
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    NavbarComponent.init();
    NavbarComponent.loadSavedTheme();
});

// Export for global access
window.NavbarComponent = NavbarComponent;

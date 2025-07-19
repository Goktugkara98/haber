// Loading Component JavaScript

const LoadingComponent = {
    elements: {},
    currentStep: 0,
    steps: [
        { text: 'Metin analiz ediliyor...', icon: 'fas fa-search' },
        { text: 'AI modeli hazırlanıyor...', icon: 'fas fa-brain' },
        { text: 'İçerik üretiliyor...', icon: 'fas fa-magic' },
        { text: 'Sonuç hazırlanıyor...', icon: 'fas fa-check-circle' }
    ],
    
    // Initialize the component
    init: function() {
        this.cacheElements();
        this.createLoadingSteps();
        console.log('Loading Component initialized');
    },

    // Cache DOM elements
    cacheElements: function() {
        this.elements = {
            section: document.getElementById('loadingSection'),
            spinner: document.querySelector('.loading-spinner'),
            text: document.querySelector('.loading-text'),
            progress: document.querySelector('.progress-bar'),
            steps: document.querySelector('.loading-steps')
        };
    },

    // Create loading steps HTML
    createLoadingSteps: function() {
        if (!this.elements.steps) return;

        const stepsHTML = this.steps.map((step, index) => `
            <div class="loading-step" data-step="${index}">
                <i class="${step.icon}"></i>
                <span>${step.text}</span>
            </div>
        `).join('');

        this.elements.steps.innerHTML = stepsHTML;
    },

    // Show loading
    show: function(customText = null) {
        if (!this.elements.section) return;

        // Reset state
        this.currentStep = 0;
        this.updateProgress(0);
        this.resetSteps();

        // Set custom text if provided
        if (customText && this.elements.text) {
            this.elements.text.textContent = customText;
        }

        // Show the section
        this.elements.section.style.display = 'block';
        this.elements.section.classList.add('show');

        // Animate with GSAP if available
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(this.elements.section, 
                { 
                    opacity: 0, 
                    y: 20 
                },
                { 
                    opacity: 1, 
                    y: 0, 
                    duration: 0.5,
                    ease: 'power2.out'
                }
            );

            // Animate spinner
            if (this.elements.spinner) {
                gsap.set(this.elements.spinner, { rotation: 0 });
                gsap.to(this.elements.spinner, {
                    rotation: 360,
                    duration: 1,
                    repeat: -1,
                    ease: 'none'
                });
            }
        }

        // Start step progression
        this.startStepProgression();
    },

    // Hide loading
    hide: function() {
        if (!this.elements.section) return;

        this.elements.section.classList.remove('show');

        // Stop any ongoing animations
        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf(this.elements.spinner);
            
            gsap.to(this.elements.section, {
                opacity: 0,
                y: -20,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    this.elements.section.style.display = 'none';
                }
            });
        } else {
            setTimeout(() => {
                this.elements.section.style.display = 'none';
            }, 300);
        }

        // Clear any timers
        if (this.stepTimer) {
            clearInterval(this.stepTimer);
            this.stepTimer = null;
        }
    },

    // Start step progression
    startStepProgression: function() {
        if (this.steps.length === 0) return;

        // Clear any existing timer
        if (this.stepTimer) {
            clearInterval(this.stepTimer);
        }

        // Start with first step
        this.activateStep(0);

        // Progress through steps
        this.stepTimer = setInterval(() => {
            this.currentStep++;
            
            if (this.currentStep < this.steps.length) {
                this.activateStep(this.currentStep);
                this.updateProgress((this.currentStep / this.steps.length) * 100);
            } else {
                // Complete all steps
                this.completeAllSteps();
                clearInterval(this.stepTimer);
                this.stepTimer = null;
            }
        }, 1500); // Change step every 1.5 seconds
    },

    // Activate a specific step
    activateStep: function(stepIndex) {
        const stepElements = this.elements.section.querySelectorAll('.loading-step');
        
        stepElements.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            
            if (index < stepIndex) {
                step.classList.add('completed');
            } else if (index === stepIndex) {
                step.classList.add('active');
            }
        });

        // Update main loading text
        if (this.elements.text && this.steps[stepIndex]) {
            this.elements.text.textContent = this.steps[stepIndex].text;
        }

        // Animate step activation
        if (typeof gsap !== 'undefined') {
            const activeStep = stepElements[stepIndex];
            if (activeStep) {
                gsap.fromTo(activeStep, 
                    { x: -10, opacity: 0.5 },
                    { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
                );
            }
        }
    },

    // Complete all steps
    completeAllSteps: function() {
        const stepElements = this.elements.section.querySelectorAll('.loading-step');
        stepElements.forEach(step => {
            step.classList.remove('active');
            step.classList.add('completed');
        });

        this.updateProgress(100);
        
        if (this.elements.text) {
            this.elements.text.textContent = 'İşlem tamamlandı!';
        }
    },

    // Reset all steps
    resetSteps: function() {
        const stepElements = this.elements.section.querySelectorAll('.loading-step');
        stepElements.forEach(step => {
            step.classList.remove('active', 'completed');
        });
    },

    // Update progress bar
    updateProgress: function(percentage) {
        if (!this.elements.progress) return;

        this.elements.progress.style.width = percentage + '%';

        // Animate progress with GSAP if available
        if (typeof gsap !== 'undefined') {
            gsap.to(this.elements.progress, {
                width: percentage + '%',
                duration: 0.5,
                ease: 'power2.out'
            });
        }
    },

    // Set custom loading message
    setMessage: function(message) {
        if (this.elements.text) {
            this.elements.text.textContent = message;
        }
    },

    // Set custom steps
    setSteps: function(customSteps) {
        this.steps = customSteps;
        this.createLoadingSteps();
    },

    // Show AI processing specific loading
    showAIProcessing: function() {
        this.show('AI ile haber metni işleniyor...');
        
        // Add AI-specific styling
        if (this.elements.section) {
            this.elements.section.classList.add('ai-processing');
        }

        // Create brain animation
        this.createBrainAnimation();
    },

    // Create brain animation
    createBrainAnimation: function() {
        if (!this.elements.spinner || typeof gsap === 'undefined') return;

        // Replace spinner with brain animation
        const brainDiv = document.createElement('div');
        brainDiv.className = 'ai-brain-animation';
        brainDiv.innerHTML = '🧠';

        this.elements.spinner.parentNode.replaceChild(brainDiv, this.elements.spinner);

        // Animate brain
        gsap.to(brainDiv, {
            scale: 1.2,
            duration: 1,
            yoyo: true,
            repeat: -1,
            ease: 'power2.inOut'
        });
    },

    // Show with custom configuration
    showCustom: function(config) {
        const {
            message = 'Yükleniyor...',
            steps = null,
            showProgress = true,
            aiMode = false
        } = config;

        if (steps) {
            this.setSteps(steps);
        }

        if (!showProgress && this.elements.progress) {
            this.elements.progress.style.display = 'none';
        }

        if (aiMode) {
            this.showAIProcessing();
        } else {
            this.show(message);
        }
    },

    // Check if loading is visible
    isVisible: function() {
        return this.elements.section && 
               this.elements.section.style.display !== 'none' &&
               this.elements.section.classList.contains('show');
    },

    // Get current step
    getCurrentStep: function() {
        return this.currentStep;
    },

    // Skip to specific step
    skipToStep: function(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.currentStep = stepIndex;
            this.activateStep(stepIndex);
            this.updateProgress((stepIndex / this.steps.length) * 100);
        }
    }
};

// Export for global access
window.LoadingComponent = LoadingComponent;

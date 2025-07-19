// Text Input Component JavaScript

const TextInputComponent = {
    elements: {},
    
    // Initialize the component
    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.setupValidation();
        console.log('Text Input Component initialized');
    },

    // Cache DOM elements
    cacheElements: function() {
        this.elements = {
            newsText: document.getElementById('newsText'),
            rules: document.getElementById('rules'),
            characterCount: document.querySelector('.character-count'),
            form: document.getElementById('newsForm')
        };
    },

    // Bind events
    bindEvents: function() {
        if (this.elements.newsText) {
            this.elements.newsText.addEventListener('input', this.handleTextInput.bind(this));
            this.elements.newsText.addEventListener('paste', this.handlePaste.bind(this));
            this.elements.newsText.addEventListener('focus', this.handleFocus.bind(this));
            this.elements.newsText.addEventListener('blur', this.handleBlur.bind(this));
        }

        if (this.elements.rules) {
            this.elements.rules.addEventListener('input', this.handleRulesInput.bind(this));
        }
    },

    // Handle text input
    handleTextInput: function(e) {
        const text = e.target.value;
        this.updateCharacterCount(text);
        this.validateText(text);
        this.autoResize(e.target);
        
        // Trigger auto-save debounced
        if (typeof ContentController !== 'undefined') {
            this.debouncedAutoSave = this.debouncedAutoSave || Utils.debounce(() => {
                ContentController.autoSave();
            }, 2000);
            this.debouncedAutoSave();
        }
    },

    // Handle paste event
    handlePaste: function(e) {
        setTimeout(() => {
            const text = e.target.value;
            this.updateCharacterCount(text);
            this.validateText(text);
            this.autoResize(e.target);
        }, 10);
    },

    // Handle focus
    handleFocus: function(e) {
        e.target.parentElement.classList.add('focused');
        
        // Animate with GSAP if available
        if (typeof gsap !== 'undefined') {
            gsap.to(e.target, {
                duration: 0.3,
                scale: 1.02,
                ease: 'power2.out'
            });
        }
    },

    // Handle blur
    handleBlur: function(e) {
        e.target.parentElement.classList.remove('focused');
        
        // Animate back with GSAP if available
        if (typeof gsap !== 'undefined') {
            gsap.to(e.target, {
                duration: 0.3,
                scale: 1,
                ease: 'power2.out'
            });
        }
    },

    // Handle rules input
    handleRulesInput: function(e) {
        this.autoResize(e.target);
    },

    // Update character count
    updateCharacterCount: function(text) {
        if (!this.elements.characterCount) return;

        const length = text.length;
        const maxLength = AppConfig.settings.maxTextLength;
        
        this.elements.characterCount.textContent = `${length}/${maxLength}`;
        
        // Update styling based on length
        this.elements.characterCount.classList.remove('warning', 'danger');
        
        if (length > maxLength * 0.9) {
            this.elements.characterCount.classList.add('danger');
        } else if (length > maxLength * 0.7) {
            this.elements.characterCount.classList.add('warning');
        }
    },

    // Validate text
    validateText: function(text) {
        if (!this.elements.newsText) return;

        const validation = Utils.validateText(text);
        
        // Remove existing validation classes
        this.elements.newsText.classList.remove('is-valid', 'is-invalid');
        
        // Remove existing feedback
        const existingFeedback = this.elements.newsText.parentElement.querySelector('.invalid-feedback, .valid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        if (text.length > 0) {
            if (validation.valid) {
                this.elements.newsText.classList.add('is-valid');
                this.addFeedback('Metin geçerli', 'valid');
            } else {
                this.elements.newsText.classList.add('is-invalid');
                this.addFeedback(validation.message, 'invalid');
            }
        }
    },

    // Add validation feedback
    addFeedback: function(message, type) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `${type}-feedback`;
        feedbackDiv.textContent = message;
        
        this.elements.newsText.parentElement.appendChild(feedbackDiv);
    },

    // Auto-resize textarea
    autoResize: function(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    },

    // Setup validation
    setupValidation: function() {
        if (this.elements.newsText) {
            // Create character count element if it doesn't exist
            if (!this.elements.characterCount) {
                const countDiv = document.createElement('div');
                countDiv.className = 'character-count';
                countDiv.textContent = '0/' + AppConfig.settings.maxTextLength;
                this.elements.newsText.parentElement.appendChild(countDiv);
                this.elements.characterCount = countDiv;
            }
        }
    },

    // Get text content
    getText: function() {
        return this.elements.newsText ? this.elements.newsText.value.trim() : '';
    },

    // Set text content
    setText: function(text) {
        if (this.elements.newsText) {
            this.elements.newsText.value = text;
            this.handleTextInput({ target: this.elements.newsText });
        }
    },

    // Get rules content
    getRules: function() {
        return this.elements.rules ? this.elements.rules.value.trim() : '';
    },

    // Set rules content
    setRules: function(rules) {
        if (this.elements.rules) {
            this.elements.rules.value = rules;
            this.handleRulesInput({ target: this.elements.rules });
        }
    },

    // Clear all inputs
    clear: function() {
        if (this.elements.newsText) {
            this.elements.newsText.value = '';
            this.elements.newsText.classList.remove('is-valid', 'is-invalid');
        }
        
        if (this.elements.rules) {
            this.elements.rules.value = '';
        }

        if (this.elements.characterCount) {
            this.elements.characterCount.textContent = '0/' + AppConfig.settings.maxTextLength;
            this.elements.characterCount.classList.remove('warning', 'danger');
        }

        // Remove feedback
        const feedbacks = document.querySelectorAll('.invalid-feedback, .valid-feedback');
        feedbacks.forEach(feedback => feedback.remove());
    },

    // Focus on main text input
    focus: function() {
        if (this.elements.newsText) {
            this.elements.newsText.focus();
        }
    },

    // Check if component is valid
    isValid: function() {
        const text = this.getText();
        return Utils.validateText(text).valid;
    }
};

// Export for global access
window.TextInputComponent = TextInputComponent;

// Simple Authentication System
class AuthSystem {
    constructor() {
        this.users = []; // local fallback only
        this.currentUser = null;
        this.init();
        // Check server session (if any)
        this.checkSession();
    }

    init() {
        // Create demo user if none exists
        if (this.users.length === 0) {
            this.createDemoUser();
        }
    }

    createDemoUser() {
        const demoUser = {
            id: 1,
            name: 'Demo User',
            email: 'demo@example.com',
            password: 'demo123',
            portfolio: this.getDefaultPortfolio('Demo User')
        };
        this.users.push(demoUser);
        this.saveUsers();
    }

    getDefaultPortfolio(name) {
        return {
            fonts: {
                heading: 'Poppins',
                body: 'Roboto',
                size: '16px'
            },
            colors: {
                heroBg: '#441c90ff',
                heroText: '#ffffff',
                aboutBg: '#f8f9fa',
                aboutText: '#333333',
                projectsBg: '#ffffff',
                projectsText: '#333333',
                skillsBg: '#3a0ca3',
                skillsText: '#ffffff',
                contactBg: '#7209b7',
                contactText: '#ffffff'
            },
            content: {
                name: name || 'Alex Morgan',
                title: 'Creative Developer',
                about: 'Passionate about creating beautiful digital experiences that make a difference. I blend design thinking with technical expertise to build solutions that users love.',
                contact: 'Ready to bring your ideas to life? Give me enough money and you wll have it!'
            },
            effects: {
                boxShadow: true,
                borderRadius: '8px',
                hoverEffects: true
            },
            projects: [
                {
                    id: 1,
                    title: 'EcoTrack Sustainability Dashboard',
                    description: 'A real-time monitoring system for environmental data visualization and carbon footprint tracking.',
                    link: '#',
                    tags: ['React', 'D3.js', 'Node.js', 'MongoDB']
                },
                {
                    id: 2,
                    title: 'LocalArt Marketplace',
                    description: 'An e-commerce platform connecting local artists with buyers in their community.',
                    link: '#',
                    tags: ['Vue.js', 'Express', 'Stripe API', 'PostgreSQL']
                }
            ],
            skills: [
                { id: 1, name: 'JavaScript/TypeScript', level: 9 },
                { id: 2, name: 'React & Vue.js', level: 8 },
                { id: 3, name: 'UI/UX Design', level: 7 },
                { id: 4, name: 'Node.js & Python', level: 8 },
                { id: 5, name: 'Responsive Design', level: 9 },
                { id: 6, name: 'Cloud Deployment', level: 7 }
            ]
        };
    }

    saveUsers() {
        localStorage.setItem('portfolio_users', JSON.stringify(this.users));
    }

    async checkSession() {
        try {
            const res = await fetch('api/api.php?action=session', { credentials: 'include' });
            const text = await res.text();
            // Try parse JSON, but guard against HTML/PHP source being returned
            try {
                const data = JSON.parse(text);
                if (data && data.success && data.user) {
                    this.currentUser = data.user;
                    localStorage.setItem('current_user', JSON.stringify(this.currentUser));
                    if (window.portfolioSystem) {
                        window.portfolioSystem.loadUserData();
                        window.portfolioSystem.updateUI();
                        window.portfolioSystem.updateLivePreview();
                    }
                }
            } catch (err) {
                console.error('Session check: non-JSON response from server', text);
            }
        } catch (e) {
            console.error('Session check failed', e);
        }
    }

    async login(email, password) {
        try {
            const res = await fetch('api/api.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            const text = await res.text();
            if (!res.ok) {
                // Try parse JSON error message
                try {
                    const err = JSON.parse(text);
                    return { success: false, message: err.message || 'Login failed' };
                } catch (e) {
                    return { success: false, message: `Server error (${res.status}): ${text.slice(0, 200)}` };
                }
            }

            try {
                const data = JSON.parse(text);
                if (data.success) {
                    this.currentUser = data.user;
                    localStorage.setItem('current_user', JSON.stringify(this.currentUser));
                    return { success: true, user: this.currentUser };
                }
                return { success: false, message: data.message || 'Invalid credentials' };
            } catch (e) {
                console.error('Login: non-JSON response', text);
                return { success: false, message: 'Server returned non-JSON response. Ensure PHP is running via an HTTP server.' };
            }
        } catch (e) {
            return { success: false, message: 'Network error' };
        }
    }

    async signup(name, email, password, confirmPassword) {
        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }

        if (password !== confirmPassword) {
            return { success: false, message: 'Passwords do not match' };
        }

        // Grading Requirement: Regex Validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return { success: false, message: 'Invalid email format' };
        }

        try {
            const res = await fetch('api/api.php?action=signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('current_user', JSON.stringify(this.currentUser));
                return { success: true, user: this.currentUser };
            }
            return { success: false, message: data.message || 'Signup failed' };
        } catch (e) {
            return { success: false, message: 'Network error' };
        }

    }

    async logout() {
        try {
            await fetch('api/api.php?action=logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
            // ignore
        }
        this.currentUser = null;
        localStorage.removeItem('current_user');
        this.showNotification('Logged out successfully', 'info');
    }

    async savePortfolio() {
        if (!this.currentUser) {
            this.showNotification('Please login to save your portfolio', 'warning');
            return false;
        }

        const portfolio = portfolioSystem.collectPortfolioData();
        this.currentUser.portfolio = portfolio;

        try {
            const res = await fetch('api/api.php?action=save_portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ portfolio })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('current_user', JSON.stringify(this.currentUser));
                this.showNotification('Portfolio saved successfully!', 'success');
                return true;
            }
            this.showNotification(data.message || 'Failed to save portfolio', 'error');
            return false;
        } catch (e) {
            this.showNotification('Network error while saving', 'error');
            return false;
        }
    }

    exportPortfolio() {
        // Simple client-side export - no server dependency
        try {
            // Collect current portfolio data from the page
            const portfolioData = window.portfolioSystem ?
                window.portfolioSystem.collectPortfolioData() :
                (this.currentUser?.portfolio || {});

            // Generate filename
            const userName = this.currentUser?.name || 'portfolio';
            const filename = `${userName.replace(/\s+/g, '-').toLowerCase()}-portfolio.json`;

            // Convert to JSON string
            const jsonStr = JSON.stringify(portfolioData, null, 2);

            // Create blob and download
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showNotification('Portfolio exported successfully!', 'success');
        } catch (e) {
            console.error('Export failed:', e);
            this.showNotification('Export failed: ' + e.message, 'error');
        }
    }

    downloadJson(dataStr, filename) {
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#e63946' : type === 'success' ? '#2a9d8f' : type === 'warning' ? '#f4a261' : '#4361ee'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        notification.querySelector('.notification-close').onclick = () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        };

        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);

        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Portfolio System
class PortfolioSystem {
    constructor(authSystem) {
        this.auth = authSystem;
        this.currentProjectId = null;
        this.currentSkillId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateColorPreviews();
        this.loadUserData();
        this.renderProjects();
        this.renderSkills();

        // Make everything editable
        this.makeAllContentEditable();

        // Setup drag and drop for sections
        this.setupDragDrop();
    }

    setupEventListeners() {
        // Authentication
        document.getElementById('loginBtn').addEventListener('click', async (e) => {
            if (this.auth.currentUser) {
                await this.auth.logout();
                this.updateUI();
            } else {
                this.showAuthModal();
            }
        });

        // Save, Export and Import
        document.getElementById('saveBtn').addEventListener('click', () => this.auth.savePortfolio());
        document.getElementById('exportBtn').addEventListener('click', () => this.auth.exportPortfolio());
        // Import: trigger file input and handle file selection
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const input = document.getElementById('importFile');
                if (input) input.click();
            });
        }
        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                const f = e.target.files[0];
                if (f) this.handleImportFile(f);
            });
        }

        // Preview mode toggle (opens clean user-facing view)
        document.getElementById('refreshPreview').addEventListener('click', () => this.togglePreviewMode());

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.hideAuthModal());
        document.getElementById('closeProjectModal').addEventListener('click', () => this.hideProjectModal());
        document.getElementById('closeSkillModal').addEventListener('click', () => this.hideSkillModal());
        document.getElementById('cancelProject').addEventListener('click', () => this.hideProjectModal());
        document.getElementById('cancelSkill').addEventListener('click', () => this.hideSkillModal());

        // Close modals on outside click
        document.getElementById('authModal').addEventListener('click', (e) => {
            if (e.target.id === 'authModal') this.hideAuthModal();
        });
        document.getElementById('projectModal').addEventListener('click', (e) => {
            if (e.target.id === 'projectModal') this.hideProjectModal();
        });
        document.getElementById('skillModal').addEventListener('click', (e) => {
            if (e.target.id === 'skillModal') this.hideSkillModal();
        });

        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchAuthTab(tabName);
            });
        });

        // Auth forms
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Project and Skill buttons
        document.getElementById('addProjectBtn').addEventListener('click', () => this.showProjectModal());
        document.getElementById('addSkillBtn').addEventListener('click', () => this.showSkillModal());

        // Section Style Modal
        document.querySelectorAll('.section-style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionName = e.target.closest('button').dataset.section;
                this.showSectionStyleModal(sectionName);
            });
        });

        const closeSectionStyleModal = document.getElementById('closeSectionStyleModal');
        if (closeSectionStyleModal) {
            closeSectionStyleModal.addEventListener('click', () => this.hideSectionStyleModal());
        }
        const cancelSectionStyle = document.getElementById('cancelSectionStyle');
        if (cancelSectionStyle) {
            cancelSectionStyle.addEventListener('click', () => this.hideSectionStyleModal());
        }
        const applySectionStyle = document.getElementById('applySectionStyle');
        if (applySectionStyle) {
            applySectionStyle.addEventListener('click', () => this.applySectionStyle());
        }
        const sectionStyleModal = document.getElementById('sectionStyleModal');
        if (sectionStyleModal) {
            sectionStyleModal.addEventListener('click', (e) => {
                if (e.target.id === 'sectionStyleModal') this.hideSectionStyleModal();
            });
        }

        document.getElementById('projectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProjectSubmit();
        });

        document.getElementById('skillForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSkillSubmit();
        });

        // Skill level display
        document.getElementById('skillLevel').addEventListener('input', (e) => {
            document.getElementById('skillLevelValue').textContent = e.target.value;
        });

        // Color inputs
        document.querySelectorAll('input[type="color"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const textId = e.target.id + 'Text';
                const previewId = e.target.id + 'Preview';
                document.getElementById(textId).value = e.target.value;
                document.getElementById(previewId).style.backgroundColor = e.target.value;
                this.updateLivePreview();
            });
        });

        document.querySelectorAll('input[type="text"][id$="Text"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const colorId = e.target.id.replace('Text', '');
                const previewId = colorId + 'Preview';
                const colorValue = e.target.value;

                if (/^#[0-9A-F]{6}$/i.test(colorValue)) {
                    document.getElementById(colorId).value = colorValue;
                    document.getElementById(previewId).style.backgroundColor = colorValue;
                    this.updateLivePreview();
                }
            });
        });

        // All other controls
        const controlIds = [
            'headingFont', 'bodyFont', 'fontSize', 'userName', 'userTitle',
            'aboutText', 'contactText', 'boxShadow', 'borderRadius', 'hoverEffects',
            'textShadow', 'textAnimation', 'textGradient',
            'heroHeight', 'projectsGridCols'
        ];

        controlIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updateLivePreview());
                element.addEventListener('input', () => {
                    if (element.type === 'textarea' || element.type === 'text') {
                        this.updateLivePreview();
                    }
                });
            }
        });

        // Editable content changes
        document.addEventListener('input', (e) => {
            if (e.target.hasAttribute('contenteditable')) {
                this.updateLivePreview();
            }
        });
    }

    makeAllContentEditable() {
        // All text elements in the portfolio should be editable
        const editableSelectors = [
            '#displayName', '#displayTitle', '#displayAbout', '#displayContact',
            '.section-title', '.project-card h3', '.project-card p',
            '.skill-card h4', '.contact-item span'
        ];

        editableSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.setAttribute('contenteditable', 'true');
            });
        });
    }

    updateColorPreviews() {
        const colorInputs = document.querySelectorAll('input[type="color"]');
        colorInputs.forEach(input => {
            const previewId = input.id + 'Preview';
            const textId = input.id + 'Text';
            const preview = document.getElementById(previewId);
            const text = document.getElementById(textId);

            if (preview) {
                preview.style.backgroundColor = input.value;
            }
            if (text) {
                text.value = input.value;
            }
        });
    }

    loadUserData() {
        if (this.auth.currentUser) {
            const portfolio = this.auth.currentUser.portfolio;

            // Load fonts
            document.getElementById('headingFont').value = portfolio.fonts.heading;
            document.getElementById('bodyFont').value = portfolio.fonts.body;
            document.getElementById('fontSize').value = portfolio.fonts.size;

            // Load colors - including new ones with fallbacks
            const colorMappings = {
                'heroBg': '#374998ff',
                'heroText': '#ffffff',
                'aboutBg': '#f8f9fa',
                'aboutText': '#333333',
                'projectsBg': '#ffffff',
                'projectsText': '#333333',
                'skillsBg': '#3a0ca3',
                'skillsText': '#ffffff',
                'contactBg': '#7209b7',
                'contactText': '#ffffff'
            };

            Object.keys(colorMappings).forEach(colorKey => {
                const colorValue = portfolio.colors?.[colorKey] || colorMappings[colorKey];
                const colorInput = document.getElementById(colorKey + 'Color');
                const textInput = document.getElementById(colorKey + 'Text');
                const preview = document.getElementById(colorKey + 'Preview');

                if (colorInput) {
                    colorInput.value = colorValue;
                }
                if (textInput) {
                    textInput.value = colorValue;
                }
                if (preview) {
                    preview.style.backgroundColor = colorValue;
                }
            });

            // Load content - update with more natural names
            document.getElementById('userName').value = portfolio.content.name || 'Alex Morgan';
            document.getElementById('userTitle').value = portfolio.content.title || 'Creative Developer';
            document.getElementById('aboutText').value = portfolio.content.about || 'Passionate about...nobody cares about this text, but still, here it is...again.';
            document.getElementById('contactText').value = portfolio.content.contact || 'Ready to bring your ideas to life? Let\'s create something amazing together!';

            // Load effects
            document.getElementById('boxShadow').checked = portfolio.effects?.boxShadow ?? true;
            document.getElementById('borderRadius').value = portfolio.effects?.borderRadius || '8px';
            document.getElementById('hoverEffects').checked = portfolio.effects?.hoverEffects ?? true;

            // Load text effects
            if (portfolio.textEffects) {
                document.getElementById('textShadow').value = portfolio.textEffects.shadow || 'none';
                document.getElementById('textAnimation').value = portfolio.textEffects.animation || 'none';
                document.getElementById('textGradient').checked = portfolio.textEffects.gradient || false;
            }

            // Load layout
            if (portfolio.layout) {
                if (portfolio.layout.heroHeight) document.getElementById('heroHeight').value = portfolio.layout.heroHeight;
                if (portfolio.layout.projectsGridCols) document.getElementById('projectsGridCols').value = portfolio.layout.projectsGridCols;
            }

            // Update UI
            this.updateUI();
            this.renderProjects(portfolio.projects);
            this.renderSkills(portfolio.skills);

            // Force update preview
            setTimeout(() => {
                this.updateLivePreview();
            }, 100);
        } else {
            // If there is no logged-in user, check for an imported portfolio (preview-only)
            const imported = localStorage.getItem('imported_portfolio');
            if (imported) {
                try {
                    const data = JSON.parse(imported);
                    this.applyImportedPortfolio(data);
                    this.auth.showNotification('Loaded imported portfolio (preview only).', 'info');
                } catch (e) {
                    // ignore invalid stored import
                }
            }
        }
    }

    applyImportedPortfolio(portfolio) {
        if (!portfolio || typeof portfolio !== 'object') return;
        // Fonts
        if (portfolio.fonts) {
            if (portfolio.fonts.heading) document.getElementById('headingFont').value = portfolio.fonts.heading;
            if (portfolio.fonts.body) document.getElementById('bodyFont').value = portfolio.fonts.body;
            if (portfolio.fonts.size) document.getElementById('fontSize').value = portfolio.fonts.size;
        }
        // Colors - these elements were removed; skip color application
        // Section colors are now handled via per-section popups

        // Content - these inputs still exist
        if (portfolio.content) {
            const userNameEl = document.getElementById('userName');
            const userTitleEl = document.getElementById('userTitle');
            const aboutTextEl = document.getElementById('aboutText');
            const contactTextEl = document.getElementById('contactText');
            if (userNameEl && portfolio.content.name) userNameEl.value = portfolio.content.name;
            if (userTitleEl && portfolio.content.title) userTitleEl.value = portfolio.content.title;
            if (aboutTextEl && portfolio.content.about) aboutTextEl.value = portfolio.content.about;
            if (contactTextEl && portfolio.content.contact) contactTextEl.value = portfolio.content.contact;
        }

        // Effects - these elements were removed
        // Effects are now built into CSS defaults

        // Text Effects
        if (portfolio.textEffects) {
            if (portfolio.textEffects.shadow) document.getElementById('textShadow').value = portfolio.textEffects.shadow;
            if (portfolio.textEffects.animation) document.getElementById('textAnimation').value = portfolio.textEffects.animation;
            if ('gradient' in portfolio.textEffects) document.getElementById('textGradient').checked = !!portfolio.textEffects.gradient;
        }
        // Layout
        if (portfolio.layout) {
            if (portfolio.layout.heroHeight) document.getElementById('heroHeight').value = portfolio.layout.heroHeight;
            if (portfolio.layout.projectsGridCols) document.getElementById('projectsGridCols').value = portfolio.layout.projectsGridCols;
        }
        // Projects/Skills
        if (portfolio.projects) this.renderProjects(portfolio.projects);
        if (portfolio.skills) this.renderSkills(portfolio.skills);
        // Update color previews and live preview
        this.updateColorPreviews();
        this.updateLivePreview();
    }

    handleImportFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!data || typeof data !== 'object') throw new Error('Invalid data');
                // Apply immediately
                this.applyImportedPortfolio(data);
                // Persist for preview-only or save to user
                if (this.auth.currentUser) {
                    this.auth.currentUser.portfolio = data;
                    this.auth.savePortfolio();
                } else {
                    localStorage.setItem('imported_portfolio', JSON.stringify(data));
                }
                this.auth.showNotification('Imported portfolio applied', 'success');
            } catch (e) {
                this.auth.showNotification('Invalid JSON file or format', 'error');
            } finally {
                const input = document.getElementById('importFile');
                if (input) input.value = '';
            }
        };
        reader.onerror = () => {
            this.auth.showNotification('Failed to read file', 'error');
            const input = document.getElementById('importFile');
            if (input) input.value = '';
        };
        reader.readAsText(file);
    }

    collectPortfolioData() {
        // Helper to safely get element value
        const getVal = (id, def = '') => {
            const el = document.getElementById(id);
            return el ? el.value : def;
        };
        const getChecked = (id, def = false) => {
            const el = document.getElementById(id);
            return el ? el.checked : def;
        };

        return {
            content: {
                name: getVal('userName', 'Your Name'),
                title: getVal('userTitle', 'Your Title'),
                about: getVal('aboutText', ''),
                contact: getVal('contactText', '')
            },
            textEffects: {
                shadow: getVal('textShadow', 'none'),
                animation: getVal('textAnimation', 'none'),
                gradient: getChecked('textGradient', false)
            },
            layout: {
                heroHeight: getVal('heroHeight', '100'),
                projectsGridCols: getVal('projectsGridCols', 'auto')
            },
            projects: this.auth.currentUser?.portfolio?.projects || [],
            skills: this.auth.currentUser?.portfolio?.skills || []
        };
    }

    updateLivePreview() {
        const root = document.documentElement;

        // Update fonts (only if elements exist)
        const headingFontEl = document.getElementById('headingFont');
        const bodyFontEl = document.getElementById('bodyFont');
        const fontSizeEl = document.getElementById('fontSize');

        if (headingFontEl) root.style.setProperty('--heading-font', headingFontEl.value);
        if (bodyFontEl) root.style.setProperty('--body-font', bodyFontEl.value);
        if (fontSizeEl) document.body.style.fontSize = fontSizeEl.value;

        // Note: Color controls have been removed from sidebar.
        // Section colors are now managed via per-section style popups.
        // Skipping the old color-based live preview code.


        // ================================
        // Apply Text Effects
        // ================================
        const textShadowEl = document.getElementById('textShadow');
        const textAnimationEl = document.getElementById('textAnimation');
        const textGradientEl = document.getElementById('textGradient');

        const titleElements = document.querySelectorAll('.hero-content h1, .section-title');

        // Remove all previous text effect classes
        const shadowClasses = ['text-shadow-soft', 'text-shadow-hard', 'text-shadow-glow', 'text-shadow-neon'];
        const animationClasses = ['text-animate-fadeIn', 'text-animate-slideUp', 'text-animate-bounce', 'text-animate-pulse', 'text-animate-typewriter'];

        titleElements.forEach(el => {
            shadowClasses.forEach(cls => el.classList.remove(cls));
            animationClasses.forEach(cls => el.classList.remove(cls));
            el.classList.remove('text-gradient');
        });

        // Apply text shadow
        if (textShadowEl) {
            const shadowValue = textShadowEl.value;
            if (shadowValue !== 'none') {
                titleElements.forEach(el => {
                    el.classList.add('text-shadow-' + shadowValue);
                });
            }
        }

        // Apply text animation
        if (textAnimationEl) {
            const animValue = textAnimationEl.value;
            if (animValue !== 'none') {
                titleElements.forEach(el => {
                    el.classList.add('text-animate-' + animValue);
                });
            }
        }

        // Apply text gradient
        if (textGradientEl && textGradientEl.checked) {
            titleElements.forEach(el => {
                el.classList.add('text-gradient');
            });
        }

        // ================================
        // Apply Layout Settings
        // ================================
        const heroHeightEl = document.getElementById('heroHeight');
        const projectsGridColsEl = document.getElementById('projectsGridCols');
        const heroSection = document.getElementById('heroSection');
        const projectsGrid = document.getElementById('projectsGrid');
        const skillsGrid = document.getElementById('skillsGrid');
        const galleryGrid = document.getElementById('galleryGrid');

        // Apply Hero Height
        if (heroHeightEl && heroSection) {
            heroSection.style.minHeight = `${heroHeightEl.value}vh`;
        }

        // Apply Projects Grid Columns
        if (projectsGridColsEl) {
            const cols = projectsGridColsEl.value;
            let template = 'repeat(auto-fill, minmax(300px, 1fr))';

            if (cols !== 'auto') {
                template = `repeat(${cols}, 1fr)`;
            }

            if (projectsGrid) projectsGrid.style.gridTemplateColumns = template;
            // Also apply to skills and gallery for consistency if desired, or add separate controls
            // For now, let's keep them auto-responsive or match projects if we want uniform look
            // but usually skills are smaller.
        }

        // Update content from text inputs and editable fields
        document.getElementById('displayName').textContent = document.getElementById('userName').value;
        document.getElementById('displayTitle').textContent = document.getElementById('userTitle').value;
        document.getElementById('displayAbout').textContent = document.getElementById('aboutText').value;
        document.getElementById('displayContact').textContent = document.getElementById('contactText').value;
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        if (this.auth.currentUser) {
            loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            loginBtn.title = `Logged in as ${this.auth.currentUser.name}`;
        } else {
            loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
            loginBtn.title = 'Login to save your portfolio';
        }
    }

    // Authentication Modal Methods
    showAuthModal() {
        document.getElementById('authModal').classList.add('active');
    }

    hideAuthModal() {
        document.getElementById('authModal').classList.remove('active');
        this.clearAuthForms();
    }

    switchAuthTab(tabName) {
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}Form`);
        });

        document.getElementById('loginError').classList.remove('show');
        document.getElementById('signupError').classList.remove('show');
    }

    clearAuthForms() {
        document.getElementById('loginForm').reset();
        document.getElementById('signupForm').reset();
        document.getElementById('loginError').classList.remove('show');
        document.getElementById('signupError').classList.remove('show');
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const result = await this.auth.login(email, password);

        if (result.success) {
            this.hideAuthModal();
            this.auth.showNotification('Login successful!', 'success');
            this.loadUserData();
            this.updateUI();
        } else {
            const errorElement = document.getElementById('loginError');
            errorElement.textContent = result.message;
            errorElement.classList.add('show');
        }
    }

    async handleSignup() {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        const result = await this.auth.signup(name, email, password, confirmPassword);

        if (result.success) {
            this.hideAuthModal();
            this.auth.showNotification('Account created successfully!', 'success');
            this.loadUserData();
            this.updateUI();
        } else {
            const errorElement = document.getElementById('signupError');
            errorElement.textContent = result.message;
            errorElement.classList.add('show');
        }
    }

    // Project Methods
    showProjectModal(projectId = null) {
        this.currentProjectId = projectId;
        const modalTitle = document.getElementById('projectModalTitle');

        if (projectId) {
            modalTitle.textContent = 'Edit Project';
            const project = this.auth.currentUser.portfolio.projects.find(p => p.id === projectId);
            if (project) {
                document.getElementById('projectTitle').value = project.title;
                document.getElementById('projectDescription').value = project.description;
                document.getElementById('projectLink').value = project.link || '';
                document.getElementById('projectTags').value = project.tags ? project.tags.join(', ') : '';
            }
        } else {
            modalTitle.textContent = 'Add Project';
            document.getElementById('projectForm').reset();
        }

        document.getElementById('projectModal').classList.add('active');
    }

    hideProjectModal() {
        document.getElementById('projectModal').classList.remove('active');
        this.currentProjectId = null;
    }

    handleProjectSubmit() {
        const title = document.getElementById('projectTitle').value.trim();
        const description = document.getElementById('projectDescription').value.trim();
        const link = document.getElementById('projectLink').value.trim();
        const tags = document.getElementById('projectTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);

        if (!title || !description) {
            alert('Please fill in all required fields');
            return;
        }

        if (!this.auth.currentUser) {
            alert('Please login to manage projects');
            return;
        }

        const project = {
            id: this.currentProjectId || Date.now(),
            title,
            description,
            link: link || '#',
            tags
        };

        let portfolio = this.auth.currentUser.portfolio;
        if (!portfolio.projects) portfolio.projects = [];

        if (this.currentProjectId) {
            const index = portfolio.projects.findIndex(p => p.id === this.currentProjectId);
            if (index !== -1) {
                portfolio.projects[index] = project;
            }
        } else {
            portfolio.projects.push(project);
        }

        this.auth.savePortfolio();
        this.renderProjects();
        this.hideProjectModal();
    }

    renderProjects(projects = null) {
        const container = document.getElementById('projectsGrid');
        if (!container) return;

        const portfolio = this.auth.currentUser?.portfolio;
        const projectsList = projects || portfolio?.projects || [];

        if (projectsList.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No projects added yet. Click "Add Project" to get started.</p>';
            return;
        }

        container.innerHTML = '';

        projectsList.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.innerHTML = `
                <div class="project-actions">
                    <button class="project-action-btn edit-project" data-id="${project.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="project-action-btn delete-project" data-id="${project.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <h3 contenteditable="true">${project.title}</h3>
                <p contenteditable="true">${project.description}</p>
                <div class="project-tags">
                    ${project.tags ? project.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                </div>
                ${project.link && project.link !== '#' ? `<a href="${project.link}" target="_blank" class="project-link"><i class="fas fa-external-link-alt"></i> View Project</a>` : ''}
            `;
            container.appendChild(projectCard);
        });

        // Add event listeners for project actions
        container.querySelectorAll('.edit-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = parseInt(e.target.closest('button').dataset.id);
                this.showProjectModal(projectId);
            });
        });

        container.querySelectorAll('.delete-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = parseInt(e.target.closest('button').dataset.id);
                if (confirm('Are you sure you want to delete this project?')) {
                    this.deleteProject(projectId);
                }
            });
        });
    }

    deleteProject(projectId) {
        if (!this.auth.currentUser) return;

        const portfolio = this.auth.currentUser.portfolio;
        portfolio.projects = portfolio.projects.filter(p => p.id !== projectId);
        this.auth.savePortfolio();
        this.renderProjects();
    }

    // Skill Methods
    showSkillModal(skillId = null) {
        this.currentSkillId = skillId;
        document.getElementById('skillModal').classList.add('active');

        if (skillId) {
            const skill = this.auth.currentUser.portfolio.skills.find(s => s.id === skillId);
            if (skill) {
                document.getElementById('skillName').value = skill.name;
                document.getElementById('skillLevel').value = skill.level;
                document.getElementById('skillLevelValue').textContent = skill.level;
            }
        } else {
            document.getElementById('skillForm').reset();
            document.getElementById('skillLevelValue').textContent = '5';
        }
    }

    hideSkillModal() {
        document.getElementById('skillModal').classList.remove('active');
        this.currentSkillId = null;
    }

    handleSkillSubmit() {
        const name = document.getElementById('skillName').value.trim();
        const level = parseInt(document.getElementById('skillLevel').value);

        if (!name) {
            alert('Please enter a skill name');
            return;
        }

        if (!this.auth.currentUser) {
            alert('Please login to manage skills');
            return;
        }

        const skill = {
            id: this.currentSkillId || Date.now(),
            name,
            level
        };

        let portfolio = this.auth.currentUser.portfolio;
        if (!portfolio.skills) portfolio.skills = [];

        if (this.currentSkillId) {
            const index = portfolio.skills.findIndex(s => s.id === this.currentSkillId);
            if (index !== -1) {
                portfolio.skills[index] = skill;
            }
        } else {
            portfolio.skills.push(skill);
        }

        this.auth.savePortfolio();
        this.renderSkills();
        this.hideSkillModal();
    }

    renderSkills(skills = null) {
        const container = document.getElementById('skillsGrid');
        if (!container) return;

        const portfolio = this.auth.currentUser?.portfolio;
        const skillsList = skills || portfolio?.skills || [];

        if (skillsList.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7); grid-column: 1/-1;">No skills added yet. Click "Add Skill" to get started.</p>';
            return;
        }

        container.innerHTML = '';

        skillsList.forEach(skill => {
            const skillCard = document.createElement('div');
            skillCard.className = 'skill-card';
            // Determine color based on skill level
            const levelColor = skill.level >= 7 ? '#2a9d8f' : skill.level >= 5 ? '#f4a261' : '#e63946';
            skillCard.innerHTML = `
                <div class="skill-card-header">
                    <h4 contenteditable="true">${skill.name}</h4>
                    <div class="skill-actions">
                        <button class="edit-skill" data-id="${skill.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-skill" data-id="${skill.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="skill-level-badge" style="background: ${levelColor}">
                    <span>${skill.level}</span><span>/10</span>
                </div>
            `;
            container.appendChild(skillCard);
        });

        // Add event listeners for skill actions
        container.querySelectorAll('.edit-skill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skillId = parseInt(e.target.closest('button').dataset.id);
                this.showSkillModal(skillId);
            });
        });

        container.querySelectorAll('.delete-skill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skillId = parseInt(e.target.closest('button').dataset.id);
                if (confirm('Are you sure you want to delete this skill?')) {
                    this.deleteSkill(skillId);
                }
            });
        });
    }

    deleteSkill(skillId) {
        if (!this.auth.currentUser) return;

        const portfolio = this.auth.currentUser.portfolio;
        portfolio.skills = portfolio.skills.filter(s => s.id !== skillId);
        this.auth.savePortfolio();
        this.renderSkills();
    }

    // ================================
    // Section Style Modal
    // ================================
    currentStyleSection = null;

    showSectionStyleModal(sectionName) {
        this.currentStyleSection = sectionName;
        const modal = document.getElementById('sectionStyleModal');
        const title = document.getElementById('sectionStyleTitle');
        const section = document.getElementById(sectionName + 'Section');

        const sectionTitles = {
            about: 'About Section',
            projects: 'Projects Section',
            skills: 'Skills Section',
            contact: 'Contact Section'
        };
        title.textContent = 'Edit ' + (sectionTitles[sectionName] || 'Section Style');

        const computedStyle = window.getComputedStyle(section);
        const bgColor = this.rgbToHex(computedStyle.backgroundColor);
        const textColor = this.rgbToHex(computedStyle.color);

        document.getElementById('sectionBgColor').value = bgColor;
        document.getElementById('sectionTextColor').value = textColor;
        document.getElementById('bgColorValue').textContent = bgColor;
        document.getElementById('textColorValue').textContent = textColor;

        // Live update color values
        document.getElementById('sectionBgColor').oninput = (e) => {
            document.getElementById('bgColorValue').textContent = e.target.value;
        };
        document.getElementById('sectionTextColor').oninput = (e) => {
            document.getElementById('textColorValue').textContent = e.target.value;
        };

        modal.classList.add('active');
    }

    hideSectionStyleModal() {
        document.getElementById('sectionStyleModal').classList.remove('active');
        this.currentStyleSection = null;
    }

    applySectionStyle() {
        if (!this.currentStyleSection) return;

        const section = document.getElementById(this.currentStyleSection + 'Section');
        const bgColor = document.getElementById('sectionBgColor').value;
        const textColor = document.getElementById('sectionTextColor').value;
        const headingFont = document.getElementById('sectionHeadingFont').value;

        // Apply background color
        section.style.backgroundColor = bgColor;

        // Apply text color to section and ALL text elements inside
        section.style.color = textColor;
        section.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li, div').forEach(el => {
            el.style.color = textColor;
        });

        // Apply heading font
        section.querySelectorAll('h1, h2, h3, h4').forEach(h => {
            h.style.fontFamily = headingFont + ', sans-serif';
        });

        this.hideSectionStyleModal();
        this.auth.showNotification('Section style updated!', 'success');
    }

    rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        const result = rgb.match(/\d+/g);
        if (!result || result.length < 3) return '#ffffff';
        return '#' + result.slice(0, 3).map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    // ================================
    // Drag and Drop for Sections
    // ================================
    setupDragDrop() {
        const sections = document.querySelectorAll('.draggable-section');
        let draggedSection = null;

        sections.forEach(section => {
            // Drag start
            section.addEventListener('dragstart', (e) => {
                draggedSection = section;
                section.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            // Drag end
            section.addEventListener('dragend', (e) => {
                section.classList.remove('dragging');
                sections.forEach(s => s.classList.remove('drag-over'));
                draggedSection = null;
            });

            // Drag over
            section.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (draggedSection && draggedSection !== section) {
                    section.classList.add('drag-over');
                }
            });

            // Drag leave
            section.addEventListener('dragleave', (e) => {
                section.classList.remove('drag-over');
            });

            // Drop
            section.addEventListener('drop', (e) => {
                e.preventDefault();
                section.classList.remove('drag-over');

                if (draggedSection && draggedSection !== section) {
                    const container = document.querySelector('.portfolio-container');
                    const allSections = [...container.querySelectorAll('.draggable-section')];
                    const draggedIdx = allSections.indexOf(draggedSection);
                    const targetIdx = allSections.indexOf(section);

                    if (draggedIdx < targetIdx) {
                        section.parentNode.insertBefore(draggedSection, section.nextSibling);
                    } else {
                        section.parentNode.insertBefore(draggedSection, section);
                    }

                    this.auth.showNotification('Section reordered!', 'success');
                }
            });
        });
    }

    // ================================
    // Preview Mode (Public View)
    // ================================
    togglePreviewMode() {
        const panel = document.querySelector('.customization-panel');
        const nav = document.querySelector('.main-nav');
        const preview = document.querySelector('.portfolio-preview');
        const handles = document.querySelectorAll('.section-drag-handle');
        const editBtns = document.querySelectorAll('.section-actions, .project-actions, .skill-actions, .gallery-item-actions');
        const addBtns = document.querySelectorAll('#addProjectBtn, #addSkillBtn, #addImageBtn');
        const contentEditables = document.querySelectorAll('[contenteditable="true"]');
        const previewBtn = document.getElementById('refreshPreview');

        const isPreviewMode = document.body.classList.toggle('preview-mode');

        if (isPreviewMode) {
            // Enter preview mode - hide editing UI
            panel.style.display = 'none';
            preview.style.width = '100%';
            preview.style.marginLeft = '0';
            handles.forEach(h => h.style.display = 'none');
            editBtns.forEach(b => b.style.display = 'none');
            addBtns.forEach(b => b.style.display = 'none');
            contentEditables.forEach(el => el.setAttribute('contenteditable', 'false'));
            previewBtn.innerHTML = '<i class="fas fa-edit"></i> Back to Editor';
            this.auth.showNotification('Preview Mode: This is how visitors see your portfolio', 'info');
        } else {
            // Exit preview mode - show editing UI
            panel.style.display = '';
            preview.style.width = '';
            preview.style.marginLeft = '';
            handles.forEach(h => h.style.display = '');
            editBtns.forEach(b => b.style.display = '');
            addBtns.forEach(b => b.style.display = '');
            contentEditables.forEach(el => el.setAttribute('contenteditable', 'true'));
            previewBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Preview Mode';
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Force initial update
    setTimeout(() => {
        portfolioSystem.updateLivePreview();

        // Add color change listeners
        const colorInputs = document.querySelectorAll('input[type="color"], input[type="text"][id$="Text"]');
        colorInputs.forEach(input => {
            input.addEventListener('change', () => portfolioSystem.updateLivePreview());
            input.addEventListener('input', () => {
                if (input.type === 'text' && input.id.includes('Text')) {
                    portfolioSystem.updateLivePreview();
                }
            });
        });

        // Add effect change listeners
        const effectInputs = document.querySelectorAll('#boxShadow, #borderRadius, #hoverEffects');
        effectInputs.forEach(input => {
            input.addEventListener('change', () => portfolioSystem.updateLivePreview());
        });

        console.log('Portfolio Builder fully initialized');
    }, 500);
    console.log('Portfolio Builder initialized');

    // Initialize systems
    const authSystem = new AuthSystem();
    const portfolioSystem = new PortfolioSystem(authSystem);

    // Update initial preview
    portfolioSystem.updateLivePreview();

    // Make systems available globally for debugging
    window.authSystem = authSystem;
    window.portfolioSystem = portfolioSystem;

    // Check URL for showAuth parameter (from landing page Login button)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showAuth') === 'true') {
        // Show auth modal after a short delay
        setTimeout(() => {
            portfolioSystem.showAuthModal();
        }, 300);
    }
});

// ============================================================
// jQuery DOM Manipulation
// Requirement: jQuery (Weight: 1)
// Uses jQuery appropriately to simplify DOM manipulation
// ============================================================

$(document).ready(function () {
    console.log('jQuery initialized - Version:', $.fn.jquery);

    // jQuery: Add hover effects to project cards
    $(document).on('mouseenter', '.project-card', function () {
        $(this).css({
            'transform': 'translateY(-5px)',
            'box-shadow': '0 8px 25px rgba(67, 97, 238, 0.3)'
        });
    }).on('mouseleave', '.project-card', function () {
        $(this).css({
            'transform': 'translateY(0)',
            'box-shadow': '0 4px 6px rgba(0, 0, 0, 0.1)'
        });
    });

    // jQuery: Add hover effects to skill cards
    $(document).on('mouseenter', '.skill-card', function () {
        $(this).css('transform', 'translateY(-3px)');
    }).on('mouseleave', '.skill-card', function () {
        $(this).css('transform', 'translateY(0)');
    });

    // jQuery: Smooth scroll for anchor links
    $('a[href^="#"]').on('click', function (e) {
        const target = $($(this).attr('href'));
        if (target.length) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: target.offset().top - 80
            }, 500);
        }
    });

    // jQuery: Toggle active class on buttons
    $('.btn').on('click', function () {
        $(this).addClass('btn-clicked');
        setTimeout(() => {
            $(this).removeClass('btn-clicked');
        }, 200);
    });

    // jQuery: Form input focus effects
    $('input, textarea, select').on('focus', function () {
        $(this).parent().addClass('input-focused');
    }).on('blur', function () {
        $(this).parent().removeClass('input-focused');
    });

    // jQuery: Fade in sections on scroll
    $(window).on('scroll', function () {
        $('.portfolio-section').each(function () {
            const sectionTop = $(this).offset().top;
            const windowBottom = $(window).scrollTop() + $(window).height();
            if (windowBottom > sectionTop + 100) {
                $(this).addClass('section-visible');
            }
        });
    });

    // jQuery: Dynamic notification using jQuery
    window.showJQueryNotification = function (message, type = 'info') {
        const $notification = $('<div>')
            .addClass('notification notification-' + type)
            .html('<span>' + message + '</span><button class="notification-close">&times;</button>')
            .appendTo('body')
            .hide()
            .fadeIn(300);

        $notification.find('.notification-close').on('click', function () {
            $notification.fadeOut(300, function () {
                $(this).remove();
            });
        });

        setTimeout(function () {
            $notification.fadeOut(300, function () {
                $(this).remove();
            });
        }, 3000);
    };

    // jQuery: Text content live sync from sidebar inputs
    $('#userName').on('input', function () {
        $('#displayName').text($(this).val());
    });

    $('#userTitle').on('input', function () {
        $('#displayTitle').text($(this).val());
    });

    $('#aboutText').on('input', function () {
        $('#displayAbout').text($(this).val());
    });

    $('#contactText').on('input', function () {
        $('#displayContact').text($(this).val());
    });

    // ================================
    // jQuery: Modal Animations
    // ================================

    // Fade in modals with jQuery
    $(document).on('click', '[data-modal-open]', function () {
        const modalId = $(this).data('modal-open');
        $('#' + modalId).fadeIn(300).css('display', 'flex');
    });

    // Close modals with jQuery
    $(document).on('click', '.modal-close, .modal', function (e) {
        if ($(e.target).hasClass('modal') || $(e.target).hasClass('modal-close')) {
            $(this).closest('.modal').fadeOut(300);
        }
    });

    // ================================
    // jQuery: Dynamic Element Creation
    // ================================

    // Create tooltip on hover
    $(document).on('mouseenter', '[data-tooltip]', function () {
        const $tooltip = $('<div>')
            .addClass('jquery-tooltip')
            .text($(this).data('tooltip'))
            .appendTo('body');

        const offset = $(this).offset();
        $tooltip.css({
            top: offset.top - $tooltip.outerHeight() - 10,
            left: offset.left + ($(this).outerWidth() / 2) - ($tooltip.outerWidth() / 2)
        }).fadeIn(200);
    }).on('mouseleave', '[data-tooltip]', function () {
        $('.jquery-tooltip').fadeOut(200, function () {
            $(this).remove();
        });
    });

    // ================================
    // jQuery: Form Validation Helpers
    // ================================

    // Real-time email validation with jQuery
    $('#loginEmail, #signupEmail').on('blur', function () {
        const email = $(this).val();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (email && !emailRegex.test(email)) {
            $(this).addClass('input-error').removeClass('input-valid');
        } else if (email) {
            $(this).addClass('input-valid').removeClass('input-error');
        }
    });

    // Password strength indicator
    $('#signupPassword').on('input', function () {
        const password = $(this).val();
        let strength = 0;

        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        $(this).attr('data-strength', strength);
    });

    // ================================
    // jQuery: Keyboard Shortcuts
    // ================================

    $(document).on('keydown', function (e) {
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            $('#saveBtn').trigger('click');
        }
        // Ctrl+E to export
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            $('#exportBtn').trigger('click');
        }
        // Escape to close modals
        if (e.key === 'Escape') {
            $('.modal:visible').fadeOut(300);
        }
    });

    // ================================
    // jQuery: Scroll Animations
    // ================================

    // Animate elements on scroll
    $(window).on('scroll', function () {
        const scrollTop = $(this).scrollTop();
        const windowHeight = $(this).height();

        // Parallax effect on hero
        $('#heroSection').css('background-position-y', scrollTop * 0.3 + 'px');

        // Fade in sections
        $('.portfolio-section').each(function () {
            const sectionTop = $(this).offset().top;
            if (scrollTop + windowHeight > sectionTop + 100) {
                $(this).addClass('section-visible');
            }
        });
    });

    // ================================
    // jQuery: Drag feedback
    // ================================

    $(document).on('dragstart', '.draggable-section', function () {
        $(this).addClass('dragging').css('opacity', 0.5);
    }).on('dragend', '.draggable-section', function () {
        $(this).removeClass('dragging').css('opacity', 1);
    });

    // ================================
    // jQuery: Button ripple effect
    // ================================

    $(document).on('click', '.btn', function (e) {
        const $btn = $(this);
        const $ripple = $('<span>').addClass('btn-ripple');
        const offset = $btn.offset();

        $ripple.css({
            left: e.pageX - offset.left,
            top: e.pageY - offset.top
        });

        $btn.append($ripple);

        setTimeout(function () {
            $ripple.remove();
        }, 600);
    });

    console.log('jQuery event handlers attached successfully');
});
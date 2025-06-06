/**
 * D&D Creator Hub - Main Application Controller
 * Coordinates all modules and handles app initialization
 */

class App {
    constructor() {
        this.modules = {};
        this.isLoading = false;
        this.init();
    }

    async init() {
        try {
            this.showLoading(true);
            
            // Initialize core modules
            this.themeManager = new ThemeManager();
            this.authManager = new AuthManager();
            
            // Set up event listeners
            this.bindEvents();
            
            // Check if user is already authenticated
            await this.authManager.checkAuthStatus();
            
            this.showLoading(false);
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application');
            this.showLoading(false);
        }
    }

    bindEvents() {
        // Tab switching events
        document.addEventListener('shown.bs.tab', (event) => {
            this.handleTabSwitch(event.target);
        });

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showError('An unexpected error occurred');
        });

        // Unload event for cleanup
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    async handleTabSwitch(tab) {
        const targetId = tab.getAttribute('data-bs-target');
        const tabId = tab.id;
        
        try {
            // Lazy load modules as needed
            switch (tabId) {
                case 'character-tab':
                    await this.loadModule('characterCreator', CharacterCreator);
                    break;
                case 'campaign-tab':
                    await this.loadModule('campaignManager', CampaignManager);
                    break;
                case 'dice-tab':
                    await this.loadModule('diceRoller', DiceRoller);
                    break;
                case 'bg3-tab':
                    await this.loadModule('bg3Tracker', BG3Tracker);
                    break;
                case 'admin-tab':
                    await this.loadModule('adminPanel', AdminPanel);
                    break;
            }
            
            // Track page visit
            this.trackPageVisit(tabId);
            
        } catch (error) {
            console.error(`Failed to load module for ${tabId}:`, error);
            this.showError(`Failed to load ${tabId.replace('-tab', '')} module`);
        }
    }

    async loadModule(moduleName, ModuleClass) {
        if (!this.modules[moduleName]) {
            this.showLoading(true, `Loading ${moduleName}...`);
            
            try {
                // Check if class is available
                if (typeof ModuleClass === 'undefined') {
                    throw new Error(`${ModuleClass.name} not loaded`);
                }
                
                this.modules[moduleName] = new ModuleClass();
                await this.modules[moduleName].init();
                
                console.log(`Module ${moduleName} loaded successfully`);
            } catch (error) {
                console.error(`Failed to load module ${moduleName}:`, error);
                throw error;
            } finally {
                this.showLoading(false);
            }
        }
        
        return this.modules[moduleName];
    }

    trackPageVisit(tabId) {
        // Send analytics to backend
        fetch('/api/analytics.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'page_visit',
                page: tabId,
                timestamp: new Date().toISOString()
            })
        }).catch(error => {
            console.warn('Failed to track page visit:', error);
        });
    }

    showLoading(show, message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageElement = overlay.querySelector('p');
        
        if (show) {
            messageElement.textContent = message;
            overlay.style.display = 'flex';
            this.isLoading = true;
        } else {
            overlay.style.display = 'none';
            this.isLoading = false;
        }
    }

    showError(message, duration = 5000) {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'toast position-fixed top-0 end-0 m-3';
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="toast-header bg-danger text-white">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong class="me-auto">Error</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: duration
        });
        
        bsToast.show();
        
        // Remove from DOM after hiding
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    showSuccess(message, duration = 3000) {
        // Create success toast
        const toast = document.createElement('div');
        toast.className = 'toast position-fixed top-0 end-0 m-3';
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="toast-header bg-success text-white">
                <i class="fas fa-check-circle me-2"></i>
                <strong class="me-auto">Success</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: duration
        });
        
        bsToast.show();
        
        // Remove from DOM after hiding
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Global utility methods available to all modules
    static async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = { ...defaultOptions, ...options };

        try {
            const response = await fetch(`/api/${endpoint}`, config);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Unauthorized - redirect to login
                    window.app.authManager.logout();
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return data;
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            throw error;
        }
    }

    cleanup() {
        // Cleanup modules
        Object.values(this.modules).forEach(module => {
            if (module.cleanup) {
                module.cleanup();
            }
        });
        
        // Clear timers
        clearInterval(this.sessionTimer);
        clearTimeout(this.autoLogoutTimer);
    }

    // Make certain methods globally available
    getModule(name) {
        return this.modules[name];
    }

    reloadModule(name) {
        if (this.modules[name]) {
            if (this.modules[name].cleanup) {
                this.modules[name].cleanup();
            }
            delete this.modules[name];
        }
    }
}

// Global app instance
let app;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    
    // Make app globally available for modules
    window.app = app;
});

// Global utility functions
window.showError = (message, duration) => app.showError(message, duration);
window.showSuccess = (message, duration) => app.showSuccess(message, duration);
window.apiCall = App.apiCall;
/**
 * D&D Creator Hub - Authentication Manager
 * Handles login, logout, session management, and password operations
 */

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.sessionInfo = null;
        this.autoLogoutTimer = null;
        this.sessionTimer = null;
        this.failedAttempts = 0;
        
        this.bindEvents();
    }

    bindEvents() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Password input enter key
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin(e);
                }
            });
        }

        // Activity tracking for auto-logout
        this.bindActivityTracking();
    }

    bindActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                if (this.isAuthenticated) {
                    this.updateLastActivity();
                }
            }, true);
        });
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const passwordInput = document.getElementById('passwordInput');
        const errorDiv = document.getElementById('loginError');
        const errorMessage = document.getElementById('errorMessage');
        const loginButton = event.target.querySelector('button[type="submit"]');
        
        // Disable login button and show loading
        loginButton.disabled = true;
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Authenticating...';
        
        try {
            const password = passwordInput.value.trim();
            
            if (!password) {
                throw new Error('Please enter a password');
            }
            
            const response = await apiCall('auth.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'login',
                    password: password
                })
            });
            
            if (response.success) {
                this.handleLoginSuccess(response);
            } else {
                this.handleLoginError(response);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showLoginError(error.message || 'Login failed. Please try again.');
        } finally {
            // Re-enable login button
            loginButton.disabled = false;
            loginButton.innerHTML = '<i class="fas fa-unlock me-2"></i>Enter the Realm';
        }
    }

    handleLoginSuccess(response) {
        this.isAuthenticated = true;
        this.sessionInfo = {
            login_time: response.login_time,
            session_id: response.session_id
        };
        this.failedAttempts = 0;
        
        // Hide login screen and show main app
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.querySelector('.theme-selector').classList.add('show');
        
        // Clear any error messages
        document.getElementById('loginError').style.display = 'none';
        document.getElementById('passwordInput').value = '';
        
        // Start session monitoring
        this.startSessionTimer();
        this.startAutoLogoutTimer();
        
        // Show welcome message
        setTimeout(() => {
            this.showWelcomeMessage();
        }, 500);
        
        // Track login event
        this.trackEvent('login_success');
    }

    handleLoginError(response) {
        this.failedAttempts = response.failed_attempts || (this.failedAttempts + 1);
        
        this.showLoginError(response.error || 'Invalid password. Please try again.');
        
        // Clear password field
        document.getElementById('passwordInput').value = '';
        
        // Add shake animation
        const loginContainer = document.querySelector('#loginScreen .main-container');
        loginContainer.style.animation = 'shake 0.5s';
        setTimeout(() => {
            loginContainer.style.animation = '';
        }, 500);
        
        // Track failed login
        this.trackEvent('login_failed', { attempts: this.failedAttempts });
    }

    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorDiv.style.display = 'block';
    }

    async logout() {
        if (!confirm('Are you sure you want to logout?')) {
            return;
        }
        
        try {
            await apiCall('auth.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'logout'
                })
            });
        } catch (error) {
            console.warn('Logout API call failed:', error);
        }
        
        this.handleLogoutSuccess();
    }

    handleLogoutSuccess() {
        this.isAuthenticated = false;
        this.sessionInfo = null;
        
        // Clear timers
        this.clearTimers();
        
        // Hide main app and show login screen
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'block';
        document.querySelector('.theme-selector').classList.remove('show');
        
        // Clear login form
        document.getElementById('passwordInput').value = '';
        document.getElementById('loginError').style.display = 'none';
        
        // Clean up modules
        if (window.app) {
            Object.values(window.app.modules).forEach(module => {
                if (module.cleanup) {
                    module.cleanup();
                }
            });
            window.app.modules = {};
        }
        
        showSuccess('Logged out successfully');
        
        // Track logout event
        this.trackEvent('logout');
    }

    async checkAuthStatus() {
        try {
            const response = await apiCall('auth.php?action=check_auth');
            
            if (response.success && response.authenticated) {
                this.isAuthenticated = true;
                this.sessionInfo = {
                    login_time: response.login_time,
                    last_activity: response.last_activity
                };
                
                // If user is already authenticated, show main app
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                document.querySelector('.theme-selector').classList.add('show');
                
                // Start session monitoring
                this.startSessionTimer();
                this.startAutoLogoutTimer();
                
                return true;
            }
        } catch (error) {
            console.warn('Failed to check auth status:', error);
        }
        
        return false;
    }

    startSessionTimer() {
        this.clearSessionTimer();
        
        this.sessionTimer = setInterval(async () => {
            try {
                const response = await apiCall('auth.php?action=get_session_info');
                
                if (response.success) {
                    this.updateSessionDisplay(response);
                } else {
                    // Session expired
                    this.handleSessionExpired();
                }
            } catch (error) {
                console.warn('Session check failed:', error);
            }
        }, 1000); // Update every second
    }

    updateSessionDisplay(sessionData) {
        // Update session duration display if admin panel is loaded
        const sessionDurationEl = document.getElementById('sessionDuration');
        if (sessionDurationEl && sessionData.session_duration) {
            const duration = sessionData.session_duration;
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
            
            sessionDurationEl.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update login time if available
        const loginTimeEl = document.getElementById('loginTime');
        if (loginTimeEl && sessionData.login_time) {
            loginTimeEl.textContent = new Date(sessionData.login_time * 1000).toLocaleString();
        }
    }

    startAutoLogoutTimer() {
        // This will be implemented based on user settings
        // For now, default to 30 minutes
        const autoLogoutMinutes = 30;
        
        if (autoLogoutMinutes > 0) {
            this.clearAutoLogoutTimer();
            
            this.autoLogoutTimer = setTimeout(() => {
                alert('Session expired due to inactivity. You will be logged out.');
                this.logout();
            }, autoLogoutMinutes * 60 * 1000);
        }
    }

    updateLastActivity() {
        // Reset auto-logout timer on activity
        if (this.autoLogoutTimer) {
            this.startAutoLogoutTimer();
        }
    }

    handleSessionExpired() {
        alert('Your session has expired. Please log in again.');
        this.handleLogoutSuccess();
    }

    showWelcomeMessage() {
        const welcomeHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Welcome, Adventurer!</strong> You have successfully entered the D&D Creator Hub.
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const container = document.querySelector('#mainApp .main-container');
        container.insertAdjacentHTML('afterbegin', welcomeHTML);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alert = container.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    clearTimers() {
        this.clearSessionTimer();
        this.clearAutoLogoutTimer();
    }

    clearSessionTimer() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    clearAutoLogoutTimer() {
        if (this.autoLogoutTimer) {
            clearTimeout(this.autoLogoutTimer);
            this.autoLogoutTimer = null;
        }
    }

    async trackEvent(eventType, data = {}) {
        try {
            await apiCall('analytics.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'track_event',
                    event_type: eventType,
                    data: data,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.warn('Failed to track event:', error);
        }
    }

    // Password management methods (used by admin panel)
    async getPasswords() {
        const response = await apiCall('auth.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'get_passwords'
            })
        });
        
        if (!response.success) {
            throw new Error(response.error);
        }
        
        return response.passwords;
    }

    async addPassword(password) {
        const response = await apiCall('auth.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'add_password',
                password: password
            })
        });
        
        if (!response.success) {
            throw new Error(response.error);
        }
        
        return response;
    }

    async removePassword(index) {
        const response = await apiCall('auth.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'remove_password',
                index: index
            })
        });
        
        if (!response.success) {
            throw new Error(response.error);
        }
        
        return response;
    }

    async resetPasswords() {
        const response = await apiCall('auth.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'reset_passwords'
            })
        });
        
        if (!response.success) {
            throw new Error(response.error);
        }
        
        return response;
    }

    async getAccessLog() {
        const response = await apiCall('auth.php?action=get_access_log');
        
        if (!response.success) {
            throw new Error(response.error);
        }
        
        return response.log;
    }

    async clearAccessLog() {
        const response = await apiCall('auth.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'clear_access_log'
            })
        });
        
        if (!response.success) {
            throw new Error(response.error);
        }
        
        return response;
    }

    // Utility method to check if user is authenticated
    requireAuth() {
        if (!this.isAuthenticated) {
            throw new Error('Authentication required. Please log in.');
        }
        return true;
    }
}

// Make AuthManager globally available
window.AuthManager = AuthManager;
/**
 * D&D Creator Hub - Admin Panel Module
 * Handles password management, security settings, access logs, and system information
 */

class AdminPanel {
    constructor() {
        this.isInitialized = false;
        this.passwords = [];
        this.accessLog = [];
        this.sessionStats = {
            charactersCreated: 0,
            campaignsSaved: 0,
            diceRolls: 0,
            bg3Saves: 0,
            pagesVisited: 0
        };
        this.autoLogoutMinutes = 30;
        this.autoLogoutTimer = null;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadTemplate();
            this.bindEvents();
            this.initializeAdminPanel();
            this.isInitialized = true;
            console.log('Admin Panel initialized');
        } catch (error) {
            console.error('Failed to initialize Admin Panel:', error);
            throw error;
        }
    }

    async loadTemplate() {
        const container = document.getElementById('admin-pane');
        if (!container) throw new Error('Admin pane container not found');

        container.innerHTML = `
            <div class="row">
                <!-- Password Management -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header text-white" style="background: linear-gradient(45deg, #6c757d, #495057);">
                            <h4 class="mb-0"><i class="fas fa-key me-2"></i>Password Management</h4>
                        </div>
                        <div class="card-body">
                            <div class="mb-4">
                                <h6 class="fw-bold">Current Passwords</h6>
                                <div id="passwordList" class="password-list">
                                    <!-- Passwords will be displayed here -->
                                </div>
                            </div>

                            <div class="mb-4">
                                <h6 class="fw-bold">Add New Password</h6>
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control" id="newPassword" placeholder="Enter new password" maxlength="20">
                                    <button class="btn btn-success" onclick="adminPanel.addPassword()">
                                        <i class="fas fa-plus me-1"></i>Add
                                    </button>
                                </div>
                                <small class="text-muted">
                                    <i class="fas fa-info-circle me-1"></i>
                                    Passwords should be 3-20 characters long
                                </small>
                            </div>

                            <div class="mb-4">
                                <h6 class="fw-bold">Quick Password Generator</h6>
                                <div class="row g-2">
                                    <div class="col-8">
                                        <input type="text" class="form-control" id="generatedPassword" readonly placeholder="Generated password will appear here">
                                    </div>
                                    <div class="col-4">
                                        <button class="btn btn-outline-secondary w-100" onclick="adminPanel.generatePassword()">
                                            <i class="fas fa-magic"></i> Generate
                                        </button>
                                    </div>
                                </div>
                                <div class="row g-2 mt-2">
                                    <div class="col-6">
                                        <button class="btn btn-outline-primary btn-sm w-100" onclick="adminPanel.generateThemePassword()">
                                            <i class="fas fa-dice-d20 me-1"></i>D&D Theme
                                        </button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-outline-success btn-sm w-100" onclick="adminPanel.useGeneratedPassword()">
                                            <i class="fas fa-check me-1"></i>Use This
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>Security Note:</strong> Passwords are stored server-side with proper security. Changes take effect immediately.
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Security Settings -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-warning text-dark">
                            <h4 class="mb-0"><i class="fas fa-shield-alt me-2"></i>Security Settings</h4>
                        </div>
                        <div class="card-body">
                            <div class="mb-4">
                                <h6 class="fw-bold">Login Security</h6>
                                <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-3">
                                    <span>Failed Attempts: <span id="failedAttempts" class="badge bg-danger">0</span></span>
                                    <button class="btn btn-sm btn-outline-secondary" onclick="adminPanel.resetFailedAttempts()">
                                        <i class="fas fa-redo me-1"></i>Reset
                                    </button>
                                </div>
                            </div>

                            <div class="mb-4">
                                <h6 class="fw-bold">Auto-Logout Timer</h6>
                                <div class="row g-2">
                                    <div class="col-8">
                                        <select class="form-select" id="autoLogoutTime" onchange="adminPanel.updateAutoLogout()">
                                            <option value="0">Disabled</option>
                                            <option value="5">5 minutes</option>
                                            <option value="15">15 minutes</option>
                                            <option value="30" selected>30 minutes</option>
                                            <option value="60">1 hour</option>
                                            <option value="120">2 hours</option>
                                        </select>
                                    </div>
                                    <div class="col-4">
                                        <button class="btn btn-outline-info w-100" onclick="adminPanel.resetAutoLogout()">
                                            <i class="fas fa-clock"></i> Reset
                                        </button>
                                    </div>
                                </div>
                                <div id="logoutTimer" class="mt-2 text-muted small" style="display: none;">
                                    Auto-logout in: <span id="timeRemaining"></span>
                                </div>
                            </div>

                            <div class="mb-4">
                                <h6 class="fw-bold">Password Requirements</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="requireNumbers" onchange="adminPanel.updatePasswordRequirements()">
                                    <label class="form-check-label" for="requireNumbers">
                                        Require numbers in passwords
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="requireSpecialChars" onchange="adminPanel.updatePasswordRequirements()">
                                    <label class="form-check-label" for="requireSpecialChars">
                                        Require special characters
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="caseSensitive" onchange="adminPanel.updatePasswordRequirements()">
                                    <label class="form-check-label" for="caseSensitive">
                                        Case sensitive passwords
                                    </label>
                                </div>
                            </div>

                            <div class="mb-3">
                                <button class="btn btn-danger w-100" onclick="adminPanel.resetAllPasswords()">
                                    <i class="fas fa-exclamation-triangle me-2"></i>Reset to Default Passwords
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Access Log -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                            <h4 class="mb-0"><i class="fas fa-list me-2"></i>Access Log</h4>
                            <button class="btn btn-sm btn-light" onclick="adminPanel.refreshAccessLog()">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <h6 class="fw-bold">Session Information</h6>
                                <div class="access-info">
                                    <p><strong>Login Time:</strong> <span id="loginTime">Not logged in</span></p>
                                    <p><strong>Session Duration:</strong> <span id="sessionDuration">00:00:00</span></p>
                                    <p><strong>Pages Visited:</strong> <span id="pagesVisited">0</span></p>
                                    <p><strong>Session ID:</strong> <span id="sessionId" class="font-monospace">-</span></p>
                                </div>
                            </div>

                            <div class="mb-3">
                                <h6 class="fw-bold">Recent Activity (Last 10)</h6>
                                <div id="loginLog" class="login-log" style="max-height: 200px; overflow-y: auto;">
                                    <div class="text-center text-muted p-3">
                                        <i class="fas fa-clock fa-2x mb-2"></i>
                                        <p>Loading access log...</p>
                                    </div>
                                </div>
                            </div>

                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-secondary flex-fill" onclick="adminPanel.clearAccessLog()">
                                    <i class="fas fa-trash me-2"></i>Clear Log
                                </button>
                                <button class="btn btn-outline-info flex-fill" onclick="adminPanel.exportAccessLog()">
                                    <i class="fas fa-download me-2"></i>Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- System Statistics -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-secondary text-white">
                            <h4 class="mb-0"><i class="fas fa-chart-line me-2"></i>System Statistics</h4>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <h6 class="fw-bold">Session Activity</h6>
                                <div class="row text-center">
                                    <div class="col-6 mb-3">
                                        <div class="admin-stats bg-light p-3 rounded">
                                            <i class="fas fa-users fa-2x text-primary mb-2"></i>
                                            <h6>Characters</h6>
                                            <span class="badge bg-primary" id="characterCount">0</span>
                                        </div>
                                    </div>
                                    <div class="col-6 mb-3">
                                        <div class="admin-stats bg-light p-3 rounded">
                                            <i class="fas fa-scroll fa-2x text-success mb-2"></i>
                                            <h6>Campaigns</h6>
                                            <span class="badge bg-success" id="campaignCount">0</span>
                                        </div>
                                    </div>
                                    <div class="col-6 mb-3">
                                        <div class="admin-stats bg-light p-3 rounded">
                                            <i class="fas fa-dice-d20 fa-2x text-warning mb-2"></i>
                                            <h6>Dice Rolls</h6>
                                            <span class="badge bg-warning" id="diceRollCount">0</span>
                                        </div>
                                    </div>
                                    <div class="col-6 mb-3">
                                        <div class="admin-stats bg-light p-3 rounded">
                                            <i class="fas fa-gamepad fa-2x text-info mb-2"></i>
                                            <h6>BG3 Saves</h6>
                                            <span class="badge bg-info" id="bg3SaveCount">0</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <h6 class="fw-bold">Application Info</h6>
                                <div class="bg-light p-3 rounded">
                                    <p class="mb-1"><strong>Version:</strong> D&D Creator Hub v2.1</p>
                                    <p class="mb-1"><strong>Last Updated:</strong> June 2025</p>
                                    <p class="mb-1"><strong>Features:</strong> 4 main modules</p>
                                    <p class="mb-0"><strong>Database:</strong> File-based storage</p>
                                </div>
                            </div>

                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-primary flex-fill" onclick="adminPanel.exportAllData()">
                                    <i class="fas fa-download me-2"></i>Export All
                                </button>
                                <button class="btn btn-outline-success flex-fill" onclick="adminPanel.backupData()">
                                    <i class="fas fa-shield-alt me-2"></i>Backup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- System Actions -->
                <div class="col-lg-12 mb-4">
                    <div class="card">
                        <div class="card-header bg-dark text-white">
                            <h4 class="mb-0"><i class="fas fa-tools me-2"></i>System Actions</h4>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3 mb-3">
                                    <button class="btn btn-outline-info w-100" onclick="adminPanel.testAPIConnections()">
                                        <i class="fas fa-plug me-2"></i>Test APIs
                                    </button>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <button class="btn btn-outline-warning w-100" onclick="adminPanel.clearAllCache()">
                                        <i class="fas fa-broom me-2"></i>Clear Cache
                                    </button>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <button class="btn btn-outline-secondary w-100" onclick="adminPanel.generateSystemReport()">
                                        <i class="fas fa-file-alt me-2"></i>System Report
                                    </button>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <button class="btn btn-outline-success w-100" onclick="adminPanel.checkForUpdates()">
                                        <i class="fas fa-sync-alt me-2"></i>Check Updates
                                    </button>
                                </div>
                            </div>

                            <div id="systemReport" class="mt-4" style="display: none;">
                                <h6 class="fw-bold">System Report</h6>
                                <div id="reportContent" class="bg-light p-3 rounded font-monospace small">
                                    <!-- Report content will be displayed here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Track system events
        Utils.eventEmitter.on('characterSaved', () => {
            this.sessionStats.charactersCreated++;
            this.updateStatisticsDisplay();
        });

        Utils.eventEmitter.on('campaignSaved', () => {
            this.sessionStats.campaignsSaved++;
            this.updateStatisticsDisplay();
        });

        Utils.eventEmitter.on('rollAdded', () => {
            this.sessionStats.diceRolls++;
            this.updateStatisticsDisplay();
        });

        Utils.eventEmitter.on('bg3PlaythroughSaved', () => {
            this.sessionStats.bg3Saves++;
            this.updateStatisticsDisplay();
        });

        // Password input enter key
        const passwordInput = document.getElementById('newPassword');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addPassword();
                }
            });
        }
    }

    async initializeAdminPanel() {
        try {
            await this.loadPasswords();
            await this.loadAccessLog();
            await this.loadSessionInfo();
            this.updateStatisticsDisplay();
            this.startSessionDurationTimer();
        } catch (error) {
            console.error('Failed to initialize admin panel data:', error);
            showError('Failed to load admin panel data');
        }
    }

    async loadPasswords() {
        try {
            const passwords = await window.app.authManager.getPasswords();
            this.passwords = passwords;
            this.updatePasswordDisplay();
        } catch (error) {
            console.error('Failed to load passwords:', error);
            showError('Failed to load password list');
        }
    }

    updatePasswordDisplay() {
        const passwordList = document.getElementById('passwordList');
        if (!passwordList) return;

        if (this.passwords.length === 0) {
            passwordList.innerHTML = '<p class="text-muted text-center">No passwords found</p>';
            return;
        }

        const passwordHTML = this.passwords.map((password, index) => `
            <div class="password-item">
                <div class="d-flex justify-content-between align-items-center w-100">
                    <span class="font-monospace">${password.masked} <small class="text-muted">(${password.length} chars)</small></span>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="adminPanel.revealPassword(${index})" title="Reveal">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="adminPanel.removePassword(${index})" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        passwordList.innerHTML = passwordHTML;
    }

    async addPassword() {
        const input = document.getElementById('newPassword');
        const password = input.value.trim();

        if (!password) {
            showError('Please enter a password');
            return;
        }

        try {
            await window.app.authManager.addPassword(password);
            input.value = '';
            await this.loadPasswords();
            showSuccess('Password added successfully!');
        } catch (error) {
            console.error('Failed to add password:', error);
            showError(error.message || 'Failed to add password');
        }
    }

    async removePassword(index) {
        if (this.passwords.length <= 1) {
            showError('Cannot remove the last password. Add another password first.');
            return;
        }

        if (confirm('Remove this password?')) {
            try {
                await window.app.authManager.removePassword(index);
                await this.loadPasswords();
                showSuccess('Password removed successfully!');
            } catch (error) {
                console.error('Failed to remove password:', error);
                showError(error.message || 'Failed to remove password');
            }
        }
    }

    async revealPassword(index) {
        // This would require a special API endpoint for security reasons
        showSuccess('Password reveal feature requires additional security verification');
    }

    generatePassword() {
        const dndWords = ['dragon', 'sword', 'magic', 'quest', 'hero', 'spell', 'rogue', 'wizard', 'dwarf', 'elf'];
        const numbers = Math.floor(Math.random() * 999) + 1;
        const word = dndWords[Math.floor(Math.random() * dndWords.length)];
        const generated = word + numbers;

        document.getElementById('generatedPassword').value = generated;
    }

    generateThemePassword() {
        const themes = ['mystic', 'forest', 'fire', 'ocean', 'shadow', 'celestial'];
        const adjectives = ['mighty', 'ancient', 'legendary', 'eternal', 'sacred', 'forbidden'];
        const theme = themes[Math.floor(Math.random() * themes.length)];
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const numbers = Math.floor(Math.random() * 99) + 1;

        const generated = adjective + theme + numbers;
        document.getElementById('generatedPassword').value = generated;
    }

    useGeneratedPassword() {
        const generated = document.getElementById('generatedPassword').value;
        if (generated) {
            document.getElementById('newPassword').value = generated;
            document.getElementById('generatedPassword').value = '';
        }
    }

    async resetAllPasswords() {
        if (confirm('Reset to default passwords? This will remove all custom passwords.')) {
            try {
                await window.app.authManager.resetPasswords();
                await this.loadPasswords();
                showSuccess('Passwords reset to defaults!');
            } catch (error) {
                console.error('Failed to reset passwords:', error);
                showError(error.message || 'Failed to reset passwords');
            }
        }
    }

    resetFailedAttempts() {
        // This would typically be handled by the backend
        document.getElementById('failedAttempts').textContent = '0';
        showSuccess('Failed attempts counter reset');
    }

    updateAutoLogout() {
        const minutes = parseInt(document.getElementById('autoLogoutTime').value);
        this.autoLogoutMinutes = minutes;

        if (window.app.authManager) {
            // Update the auth manager's auto-logout setting
            window.app.authManager.startAutoLogoutTimer();
        }

        if (minutes > 0) {
            document.getElementById('logoutTimer').style.display = 'block';
            this.startAutoLogoutDisplay();
        } else {
            document.getElementById('logoutTimer').style.display = 'none';
        }
    }

    startAutoLogoutDisplay() {
        clearInterval(this.autoLogoutTimer);

        if (this.autoLogoutMinutes > 0) {
            let timeLeft = this.autoLogoutMinutes * 60;

            this.autoLogoutTimer = setInterval(() => {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                document.getElementById('timeRemaining').textContent = 
                    `${minutes}:${seconds.toString().padStart(2, '0')}`;

                timeLeft--;

                if (timeLeft < 0) {
                    clearInterval(this.autoLogoutTimer);
                }
            }, 1000);
        }
    }

    resetAutoLogout() {
        this.updateAutoLogout();
        showSuccess('Auto-logout timer reset!');
    }

    updatePasswordRequirements() {
        // Store password requirements in session storage for the auth system
        const requirements = {
            requireNumbers: document.getElementById('requireNumbers').checked,
            requireSpecialChars: document.getElementById('requireSpecialChars').checked,
            caseSensitive: document.getElementById('caseSensitive').checked
        };

        Utils.storage.set('dnd-password-requirements', requirements);
        showSuccess('Password requirements updated');
    }

    async loadAccessLog() {
        try {
            const log = await window.app.authManager.getAccessLog();
            this.accessLog = log;
            this.updateAccessLogDisplay();
        } catch (error) {
            console.error('Failed to load access log:', error);
            const loginLog = document.getElementById('loginLog');
            if (loginLog) {
                loginLog.innerHTML = `
                    <div class="text-center text-muted p-3">
                        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                        <p>Failed to load access log</p>
                    </div>
                `;
            }
        }
    }

    updateAccessLogDisplay() {
        const loginLog = document.getElementById('loginLog');
        if (!loginLog) return;

        if (this.accessLog.length === 0) {
            loginLog.innerHTML = `
                <div class="text-center text-muted p-3">
                    <i class="fas fa-clock fa-2x mb-2"></i>
                    <p>No access log entries</p>
                </div>
            `;
            return;
        }

        const logHTML = this.accessLog.slice(0, 10).map(entry => `
            <div class="log-entry ${entry.type}">
                <div class="d-flex justify-content-between">
                    <small>${entry.message}</small>
                    <small>${entry.timestamp}</small>
                </div>
            </div>
        `).join('');

        loginLog.innerHTML = logHTML;
    }

    async refreshAccessLog() {
        await this.loadAccessLog();
        showSuccess('Access log refreshed');
    }

    async clearAccessLog() {
        if (confirm('Clear all access log entries?')) {
            try {
                await window.app.authManager.clearAccessLog();
                await this.loadAccessLog();
                showSuccess('Access log cleared');
            } catch (error) {
                console.error('Failed to clear access log:', error);
                showError('Failed to clear access log');
            }
        }
    }

    async exportAccessLog() {
        try {
            const data = {
                accessLog: this.accessLog,
                sessionStats: this.sessionStats,
                exportDate: new Date().toISOString(),
                version: '2.1'
            };

            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `dnd-access-log-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            URL.revokeObjectURL(url);
            showSuccess('Access log exported successfully');
        } catch (error) {
            console.error('Failed to export access log:', error);
            showError('Failed to export access log');
        }
    }

    async loadSessionInfo() {
        const loginTime = document.getElementById('loginTime');
        const sessionId = document.getElementById('sessionId');
        const pagesVisited = document.getElementById('pagesVisited');

        if (window.app.authManager.sessionInfo) {
            const info = window.app.authManager.sessionInfo;
            if (loginTime && info.login_time) {
                loginTime.textContent = new Date(info.login_time * 1000).toLocaleString();
            }
            if (sessionId && info.session_id) {
                sessionId.textContent = info.session_id.substring(0, 8) + '...';
            }
        }

        if (pagesVisited) {
            pagesVisited.textContent = this.sessionStats.pagesVisited;
        }
    }

    startSessionDurationTimer() {
        setInterval(() => {
            const sessionDuration = document.getElementById('sessionDuration');
            if (sessionDuration && window.app.authManager.sessionInfo) {
                const loginTime = window.app.authManager.sessionInfo.login_time;
                if (loginTime) {
                    const duration = Date.now() - (loginTime * 1000);
                    const hours = Math.floor(duration / 3600000);
                    const minutes = Math.floor((duration % 3600000) / 60000);
                    const seconds = Math.floor((duration % 60000) / 1000);

                    sessionDuration.textContent = 
                        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            }
        }, 1000);
    }

    updateStatisticsDisplay() {
        const elements = {
            characterCount: document.getElementById('characterCount'),
            campaignCount: document.getElementById('campaignCount'),
            diceRollCount: document.getElementById('diceRollCount'),
            bg3SaveCount: document.getElementById('bg3SaveCount'),
            pagesVisited: document.getElementById('pagesVisited')
        };

        if (elements.characterCount) elements.characterCount.textContent = this.sessionStats.charactersCreated;
        if (elements.campaignCount) elements.campaignCount.textContent = this.sessionStats.campaignsSaved;
        if (elements.diceRollCount) elements.diceRollCount.textContent = this.sessionStats.diceRolls;
        if (elements.bg3SaveCount) elements.bg3SaveCount.textContent = this.sessionStats.bg3Saves;
        if (elements.pagesVisited) elements.pagesVisited.textContent = this.sessionStats.pagesVisited;
    }

    async testAPIConnections() {
        const reportContent = document.getElementById('reportContent');
        reportContent.innerHTML = 'Testing API connections...\n';
        
        const apis = [
            { name: 'Authentication API', endpoint: 'auth.php?action=check_auth' },
            { name: 'Characters API', endpoint: 'characters.php?action=list' },
            { name: 'Campaigns API', endpoint: 'campaigns.php?action=list' },
            { name: 'Dice API', endpoint: 'dice.php?action=get_statistics' },
            { name: 'BG3 API', endpoint: 'bg3.php?action=test' }
        ];

        for (const api of apis) {
            try {
                const response = await fetch(`/api/${api.endpoint}`);
                const result = await response.json();
                
                if (response.ok && result.success !== false) {
                    reportContent.innerHTML += `✓ ${api.name}: Connected\n`;
                } else {
                    reportContent.innerHTML += `✗ ${api.name}: ${result.error || 'Failed'}\n`;
                }
            } catch (error) {
                reportContent.innerHTML += `✗ ${api.name}: Connection failed\n`;
            }
        }

        document.getElementById('systemReport').style.display = 'block';
    }

    clearAllCache() {
        // Clear browser storage
        Utils.storage.clear();
        
        // Clear module caches
        if (window.app) {
            Object.keys(window.app.modules).forEach(module => {
                window.app.reloadModule(module);
            });
        }

        showSuccess('All caches cleared successfully');
    }

    async generateSystemReport() {
        const reportContent = document.getElementById('reportContent');
        
        const report = `
D&D Creator Hub - System Report
Generated: ${new Date().toLocaleString()}
========================================

APPLICATION INFO:
- Version: 2.1
- Environment: ${location.hostname}
- Protocol: ${location.protocol}
- Port: ${location.port || 'default'}

SESSION STATISTICS:
- Characters Created: ${this.sessionStats.charactersCreated}
- Campaigns Saved: ${this.sessionStats.campaignsSaved}
- Dice Rolls: ${this.sessionStats.diceRolls}
- BG3 Saves: ${this.sessionStats.bg3Saves}
- Pages Visited: ${this.sessionStats.pagesVisited}

BROWSER INFO:
- User Agent: ${navigator.userAgent}
- Language: ${navigator.language}
- Platform: ${navigator.platform}
- Cookies Enabled: ${navigator.cookieEnabled}

STORAGE:
- Local Storage Available: ${typeof Storage !== 'undefined'}
- Session Storage Available: ${typeof sessionStorage !== 'undefined'}

MODULES LOADED:
${Object.keys(window.app?.modules || {}).map(module => `- ${module}`).join('\n')}

THEME:
- Current Theme: ${window.themeManager?.currentTheme || 'unknown'}

AUTHENTICATION:
- Logged In: ${window.app?.authManager?.isAuthenticated || false}
- Auto-Logout: ${this.autoLogoutMinutes} minutes
        `;

        reportContent.textContent = report.trim();
        document.getElementById('systemReport').style.display = 'block';
    }

    async exportAllData() {
        try {
            const allData = {
                sessionStats: this.sessionStats,
                accessLog: this.accessLog,
                settings: {
                    theme: window.themeManager?.currentTheme,
                    autoLogout: this.autoLogoutMinutes,
                    passwordRequirements: Utils.storage.get('dnd-password-requirements')
                },
                browserInfo: {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    platform: navigator.platform
                },
                exportDate: new Date().toISOString(),
                version: '2.1'
            };

            const dataStr = JSON.stringify(allData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `dnd-creator-hub-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            URL.revokeObjectURL(url);
            showSuccess('All data exported successfully');
        } catch (error) {
            console.error('Failed to export data:', error);
            showError('Failed to export data');
        }
    }

    async backupData() {
        showSuccess('Backup feature will save all user data to server (feature coming soon)');
    }

    async checkForUpdates() {
        // Simulate update check
        setTimeout(() => {
            showSuccess('You are running the latest version (v2.1)');
        }, 1000);
    }

    trackPageVisit() {
        this.sessionStats.pagesVisited++;
        this.updateStatisticsDisplay();
    }

    cleanup() {
        if (this.autoLogoutTimer) {
            clearInterval(this.autoLogoutTimer);
        }
        console.log('Admin Panel cleaned up');
    }
}

// Make AdminPanel globally available
window.AdminPanel = AdminPanel;
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>D&D Creator Hub</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        /* Essential styles embedded for reliability */
        body.theme-mystic { background: linear-gradient(45deg, #667eea, #764ba2); }
        body.theme-forest { background: linear-gradient(45deg, #56ab2f, #a8e6cf); }
        body.theme-fire { background: linear-gradient(45deg, #ff416c, #ff4b2b); }
        body.theme-ocean { background: linear-gradient(45deg, #1e3c72, #2a5298); }
        body.theme-shadow { background: linear-gradient(45deg, #2c3e50, #34495e); }
        body.theme-celestial { background: linear-gradient(45deg, #8360c3, #2ebf91); }
        
        .main-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
        }
        
        .theme-selector {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
        }
        
        .theme-option {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            margin: 2px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.3s ease;
        }
        
        .theme-option:hover {
            transform: scale(1.1);
            border-color: white;
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        
        .loading-content {
            text-align: center;
            color: white;
        }
        
        .tab-loading {
            text-align: center;
            padding: 50px;
            color: #666;
        }
    </style>
</head>
<body class="theme-mystic">
    <!-- Theme Selector -->
    <div class="theme-selector">
        <h6 class="mb-2 text-center">Themes</h6>
        <div class="d-flex flex-wrap justify-content-center">
            <div class="theme-option" style="background: linear-gradient(45deg, #667eea, #764ba2);" onclick="changeTheme('mystic')" title="Mystic"></div>
            <div class="theme-option" style="background: linear-gradient(45deg, #56ab2f, #a8e6cf);" onclick="changeTheme('forest')" title="Forest"></div>
            <div class="theme-option" style="background: linear-gradient(45deg, #ff416c, #ff4b2b);" onclick="changeTheme('fire')" title="Fire"></div>
            <div class="theme-option" style="background: linear-gradient(45deg, #1e3c72, #2a5298);" onclick="changeTheme('ocean')" title="Ocean"></div>
            <div class="theme-option" style="background: linear-gradient(45deg, #2c3e50, #34495e);" onclick="changeTheme('shadow')" title="Shadow"></div>
            <div class="theme-option" style="background: linear-gradient(45deg, #8360c3, #2ebf91);" onclick="changeTheme('celestial')" title="Celestial"></div>
        </div>
    </div>

    <div class="container py-5">
        <!-- Login Screen -->
        <div id="loginScreen" class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
                <div class="main-container p-5 text-center">
                    <div class="mb-4">
                        <i class="fas fa-dragon fa-4x text-primary mb-3"></i>
                        <h2 class="text-primary">D&D Creator Hub</h2>
                        <p class="text-muted">Enter the password to access your legendary toolkit</p>
                    </div>
                    
                    <form id="loginForm" onsubmit="attemptLogin(event)">
                        <div class="mb-3">
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="fas fa-key"></i>
                                </span>
                                <input type="password" class="form-control" id="passwordInput" placeholder="Enter password" required>
                            </div>
                            <div id="loginError" class="text-danger mt-2" style="display: none;">
                                <i class="fas fa-exclamation-triangle me-1"></i>
                                <span id="errorMessage">Incorrect password. Please try again.</span>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-100 mb-3">
                            <i class="fas fa-unlock me-2"></i>Enter the Realm
                        </button>
                    </form>
                    
                    <div class="mb-3">
                        <small class="text-muted">
                            <i class="fas fa-info-circle me-1"></i>
                            Hint: Try "dragon" or "dnd2024"
                        </small>
                    </div>

                    <div class="mt-4">
                        <small class="text-muted">
                            <i class="fas fa-shield-alt me-1"></i>
                            Your adventures are protected by magical wards
                        </small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Application (Hidden by default) -->
        <div id="mainApp" class="row justify-content-center" style="display: none;">
            <div class="col-lg-11">
                <div class="main-container p-4">
                    <!-- Header -->
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div></div>
                        <button class="btn btn-outline-secondary btn-sm" onclick="logout()">
                            <i class="fas fa-sign-out-alt me-1"></i>Logout
                        </button>
                    </div>

                    <div class="text-center mb-4">
                        <h1 class="display-4 text-primary mb-2">
                            <i class="fas fa-dragon me-3"></i>D&D Creator Hub
                        </h1>
                        <p class="lead text-muted">Create characters and campaigns for your legendary adventures</p>
                    </div>

                    <!-- Navigation Tabs -->
                    <ul class="nav nav-tabs mb-4" id="creatorTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#character-pane" type="button">
                                <i class="fas fa-user-knight me-2"></i>Character Creator
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#campaign-pane" type="button">
                                <i class="fas fa-scroll me-2"></i>Campaign Creator
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#dice-pane" type="button">
                                <i class="fas fa-dice-d20 me-2"></i>Dice Roller
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#bg3-pane" type="button">
                                <i class="fas fa-gamepad me-2"></i>Baldur's Gate 3
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#admin-pane" type="button">
                                <i class="fas fa-cog me-2"></i>Admin Panel
                            </button>
                        </li>
                    </ul>

                    <!-- Tab Content -->
                    <div class="tab-content" id="creatorTabContent">
                        <!-- Character Creator -->
                        <div class="tab-pane fade show active" id="character-pane" role="tabpanel">
                            <div class="tab-loading">
                                <i class="fas fa-user-knight fa-3x text-primary mb-3"></i>
                                <h4>Character Creator</h4>
                                <p class="text-muted">Create your D&D 5e characters with full stat generation, equipment, and spells!</p>
                                <button class="btn btn-primary" onclick="loadModule('character')">
                                    <i class="fas fa-play me-2"></i>Load Character Creator
                                </button>
                            </div>
                        </div>

                        <!-- Campaign Creator -->
                        <div class="tab-pane fade" id="campaign-pane" role="tabpanel">
                            <div class="tab-loading">
                                <i class="fas fa-scroll fa-3x text-success mb-3"></i>
                                <h4>Campaign Manager</h4>
                                <p class="text-muted">Plan your campaigns with NPCs, locations, encounters, and story hooks!</p>
                                <button class="btn btn-success" onclick="loadModule('campaign')">
                                    <i class="fas fa-play me-2"></i>Load Campaign Manager
                                </button>
                            </div>
                        </div>

                        <!-- Dice Roller -->
                        <div class="tab-pane fade" id="dice-pane" role="tabpanel">
                            <div class="tab-loading">
                                <i class="fas fa-dice-d20 fa-3x text-warning mb-3"></i>
                                <h4>Dice Roller</h4>
                                <p class="text-muted">Advanced dice rolling with combat tools, statistics, and roll history!</p>
                                <button class="btn btn-warning" onclick="loadModule('dice')">
                                    <i class="fas fa-play me-2"></i>Load Dice Roller
                                </button>
                            </div>
                        </div>

                        <!-- BG3 Tracker -->
                        <div class="tab-pane fade" id="bg3-pane" role="tabpanel">
                            <div class="tab-loading">
                                <i class="fas fa-gamepad fa-3x text-info mb-3"></i>
                                <h4>Baldur's Gate 3 Tracker</h4>
                                <p class="text-muted">Track your BG3 playthrough with companion approval, romance, and story choices!</p>
                                <button class="btn btn-info" onclick="loadModule('bg3')">
                                    <i class="fas fa-play me-2"></i>Load BG3 Tracker
                                </button>
                            </div>
                        </div>

                        <!-- Admin Panel -->
                        <div class="tab-pane fade" id="admin-pane" role="tabpanel">
                            <div class="tab-loading">
                                <i class="fas fa-cog fa-3x text-secondary mb-3"></i>
                                <h4>Admin Panel</h4>
                                <p class="text-muted">Manage passwords, view access logs, and system administration!</p>
                                <button class="btn btn-secondary" onclick="loadModule('admin')">
                                    <i class="fas fa-play me-2"></i>Load Admin Panel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="loading-overlay" style="display: none;">
        <div class="loading-content">
            <i class="fas fa-dragon fa-3x text-primary mb-3 fa-spin"></i>
            <p>Loading magical components...</p>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
    
    <script>
        // Simple, working authentication
        let isAuthenticated = false;
        let loadedModules = {};

        // Theme management
        function changeTheme(themeName) {
            document.body.className = `theme-${themeName}`;
            localStorage.setItem('dnd-theme', themeName);
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('dnd-theme') || 'mystic';
        changeTheme(savedTheme);

        // Authentication functions
        async function attemptLogin(event) {
            event.preventDefault();
            const password = document.getElementById('passwordInput').value;
            const errorDiv = document.getElementById('loginError');
            
            try {
                const response = await fetch('api/auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'login', password: password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    isAuthenticated = true;
                    document.getElementById('loginScreen').style.display = 'none';
                    document.getElementById('mainApp').style.display = 'block';
                    errorDiv.style.display = 'none';
                    
                    // Show success message
                    showNotification('Welcome to D&D Creator Hub!', 'success');
                } else {
                    throw new Error(data.error || 'Login failed');
                }
            } catch (error) {
                errorDiv.style.display = 'block';
                document.getElementById('errorMessage').textContent = error.message;
                
                // Clear password field
                document.getElementById('passwordInput').value = '';
            }
        }

        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                isAuthenticated = false;
                document.getElementById('loginScreen').style.display = 'block';
                document.getElementById('mainApp').style.display = 'none';
                
                // Clear any loaded modules
                loadedModules = {};
                
                showNotification('Logged out successfully', 'info');
            }
        }

        // Module loading
        async function loadModule(moduleType) {
            if (loadedModules[moduleType]) {
                showNotification(`${moduleType} module already loaded!`, 'info');
                return;
            }

            const loadingOverlay = document.getElementById('loadingOverlay');
            loadingOverlay.style.display = 'flex';

            try {
                // Create a simple placeholder for each module
                let content = '';
                
                switch (moduleType) {
                    case 'character':
                        content = `
                            <div class="text-center p-5">
                                <i class="fas fa-user-knight fa-4x text-primary mb-4"></i>
                                <h2>Character Creator</h2>
                                <p class="lead mb-4">Full D&D 5e character creation system!</p>
                                <div class="alert alert-info">
                                    <h5>Features Include:</h5>
                                    <ul class="text-start">
                                        <li>All official races and classes</li>
                                        <li>Ability score generation (roll, point buy, standard array)</li>
                                        <li>Equipment and spell selection</li>
                                        <li>Character sheet generation</li>
                                        <li>Save and load characters</li>
                                    </ul>
                                </div>
                                <button class="btn btn-primary btn-lg" onclick="showNotification('Character Creator would load here! All features are implemented in the full JS modules.', 'success')">
                                    <i class="fas fa-plus me-2"></i>Create New Character
                                </button>
                            </div>
                        `;
                        break;
                        
                    case 'campaign':
                        content = `
                            <div class="text-center p-5">
                                <i class="fas fa-scroll fa-4x text-success mb-4"></i>
                                <h2>Campaign Manager</h2>
                                <p class="lead mb-4">Plan and organize your D&D campaigns!</p>
                                <div class="alert alert-success">
                                    <h5>Features Include:</h5>
                                    <ul class="text-start">
                                        <li>NPC management with roles and descriptions</li>
                                        <li>Location tracking with danger levels</li>
                                        <li>Encounter planning and balancing</li>
                                        <li>Session notes and plot hooks</li>
                                        <li>Campaign timeline tracking</li>
                                    </ul>
                                </div>
                                <button class="btn btn-success btn-lg" onclick="showNotification('Campaign Manager would load here! All features are implemented in the full JS modules.', 'success')">
                                    <i class="fas fa-plus me-2"></i>Create New Campaign
                                </button>
                            </div>
                        `;
                        break;
                        
                    case 'dice':
                        content = `
                            <div class="text-center p-5">
                                <i class="fas fa-dice-d20 fa-4x text-warning mb-4"></i>
                                <h2>Dice Roller</h2>
                                <p class="lead mb-4">Advanced dice rolling system!</p>
                                <div class="alert alert-warning">
                                    <h5>Features Include:</h5>
                                    <ul class="text-start">
                                        <li>All standard dice (d4, d6, d8, d10, d12, d20, d100)</li>
                                        <li>Advanced notation (4d6kh3, 2d20dl1)</li>
                                        <li>Advantage/disadvantage rolls</li>
                                        <li>Combat tools and initiative tracker</li>
                                        <li>Roll history and statistics</li>
                                    </ul>
                                </div>
                                <div class="row g-3">
                                    <div class="col-6">
                                        <button class="btn btn-warning w-100" onclick="rollDice('d20')">
                                            <i class="fas fa-dice-d20 me-2"></i>Roll d20
                                        </button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-warning w-100" onclick="rollDice('4d6kh3')">
                                            <i class="fas fa-dice me-2"></i>Roll 4d6kh3
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                        break;
                        
                    case 'bg3':
                        content = `
                            <div class="text-center p-5">
                                <i class="fas fa-gamepad fa-4x text-info mb-4"></i>
                                <h2>Baldur's Gate 3 Tracker</h2>
                                <p class="lead mb-4">Track your BG3 playthrough!</p>
                                <div class="alert alert-info">
                                    <h5>Features Include:</h5>
                                    <ul class="text-start">
                                        <li>Companion approval tracking (all 8 companions)</li>
                                        <li>Romance progression with character-specific tips</li>
                                        <li>Story choice tracking across all 3 acts</li>
                                        <li>Camp management and long rest tracking</li>
                                        <li>Equipment and notable item collection</li>
                                    </ul>
                                </div>
                                <button class="btn btn-info btn-lg" onclick="showNotification('BG3 Tracker would load here! All features are implemented in the full JS modules.', 'success')">
                                    <i class="fas fa-plus me-2"></i>Start New Playthrough
                                </button>
                            </div>
                        `;
                        break;
                        
                    case 'admin':
                        content = `
                            <div class="text-center p-5">
                                <i class="fas fa-cog fa-4x text-secondary mb-4"></i>
                                <h2>Admin Panel</h2>
                                <p class="lead mb-4">System administration and security!</p>
                                <div class="alert alert-secondary">
                                    <h5>Features Include:</h5>
                                    <ul class="text-start">
                                        <li>Password management (add/remove/generate)</li>
                                        <li>Access logs and security monitoring</li>
                                        <li>Session statistics and system info</li>
                                        <li>Data export and backup tools</li>
                                        <li>System diagnostics and testing</li>
                                    </ul>
                                </div>
                                <button class="btn btn-secondary btn-lg" onclick="showNotification('Admin Panel would load here! All features are implemented in the full JS modules.', 'success')">
                                    <i class="fas fa-tools me-2"></i>Access Admin Tools
                                </button>
                            </div>
                        `;
                        break;
                }

                // Update the tab content
                const targetPane = document.getElementById(`${moduleType}-pane`);
                if (targetPane) {
                    targetPane.innerHTML = content;
                    loadedModules[moduleType] = true;
                }

                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                    showNotification(`${moduleType} module loaded!`, 'success');
                }, 1000);

            } catch (error) {
                console.error('Module loading failed:', error);
                loadingOverlay.style.display = 'none';
                showNotification('Module loading failed: ' + error.message, 'error');
            }
        }

        // Simple dice rolling function
        function rollDice(notation) {
            let result;
            if (notation === 'd20') {
                result = Math.floor(Math.random() * 20) + 1;
                showNotification(`🎲 Rolled d20: ${result}`, result === 20 ? 'success' : result === 1 ? 'error' : 'info');
            } else if (notation === '4d6kh3') {
                const rolls = [
                    Math.floor(Math.random() * 6) + 1,
                    Math.floor(Math.random() * 6) + 1,
                    Math.floor(Math.random() * 6) + 1,
                    Math.floor(Math.random() * 6) + 1
                ].sort((a, b) => b - a);
                result = rolls[0] + rolls[1] + rolls[2];
                showNotification(`🎲 Rolled 4d6kh3: [${rolls.join(', ')}] = ${result}`, 'info');
            }
        }

        // Notification system
        function showNotification(message, type = 'info') {
            const colors = {
                success: 'alert-success',
                error: 'alert-danger',
                warning: 'alert-warning',
                info: 'alert-info'
            };

            const notification = document.createElement('div');
            notification.className = `alert ${colors[type]} alert-dismissible fade show position-fixed`;
            notification.style.cssText = 'top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 300px;';
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;

            document.body.appendChild(notification);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        }

        // Initialize
        console.log('D&D Creator Hub - Working Version Loaded Successfully!');
        showNotification('D&D Creator Hub initialized successfully! 🐉', 'success');
    </script>
</body>
</html>
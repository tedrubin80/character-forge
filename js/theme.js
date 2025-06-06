/**
 * D&D Creator Hub - Theme Manager
 * Handles theme switching and persistence
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'mystic';
        this.themes = {
            mystic: {
                name: 'Mystic',
                primary: '#667eea',
                secondary: '#764ba2',
                accent: '#ff6b6b',
                description: 'Mystical purple and blue tones'
            },
            forest: {
                name: 'Forest',
                primary: '#56ab2f',
                secondary: '#a8e6cf',
                accent: '#ff8c42',
                description: 'Natural greens and earth tones'
            },
            fire: {
                name: 'Fire',
                primary: '#ff416c',
                secondary: '#ff4b2b',
                accent: '#ffd700',
                description: 'Fiery reds and golden accents'
            },
            ocean: {
                name: 'Ocean',
                primary: '#1e3c72',
                secondary: '#2a5298',
                accent: '#00d4ff',
                description: 'Deep ocean blues'
            },
            shadow: {
                name: 'Shadow',
                primary: '#2c3e50',
                secondary: '#34495e',
                accent: '#e74c3c',
                description: 'Dark grays with red accents'
            },
            celestial: {
                name: 'Celestial',
                primary: '#8360c3',
                secondary: '#2ebf91',
                accent: '#ffd700',
                description: 'Celestial purples and teals'
            }
        };
        
        this.init();
    }

    init() {
        // Load saved theme from localStorage
        const savedTheme = this.getSavedTheme();
        if (savedTheme && this.themes[savedTheme]) {
            this.currentTheme = savedTheme;
        }
        
        // Apply the current theme
        this.applyTheme(this.currentTheme);
        
        // Bind events
        this.bindEvents();
    }

    bindEvents() {
        // Listen for theme changes from other parts of the app
        document.addEventListener('themeChange', (event) => {
            this.changeTheme(event.detail.theme);
        });
    }

    changeTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Theme '${themeName}' not found`);
            return false;
        }

        this.currentTheme = themeName;
        this.applyTheme(themeName);
        this.saveTheme(themeName);
        
        // Dispatch theme change event
        this.dispatchThemeChangeEvent(themeName);
        
        // Show theme change notification
        this.showThemeChangeNotification(this.themes[themeName].name);
        
        return true;
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        // Update body class
        document.body.className = document.body.className.replace(/theme-\w+/, `theme-${themeName}`);
        
        // Update CSS custom properties
        document.documentElement.style.setProperty('--primary-color', theme.primary);
        document.documentElement.style.setProperty('--secondary-color', theme.secondary);
        document.documentElement.style.setProperty('--accent-color', theme.accent);
        
        // Update theme-specific elements
        this.updateThemeElements(theme);
        
        // Update meta theme color for mobile browsers
        this.updateMetaThemeColor(theme.primary);
    }

    updateThemeElements(theme) {
        // Update any theme-specific elements
        const themeElements = document.querySelectorAll('[data-theme-element]');
        
        themeElements.forEach(element => {
            const themeType = element.getAttribute('data-theme-element');
            
            switch (themeType) {
                case 'background':
                    element.style.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
                    break;
                case 'border':
                    element.style.borderColor = theme.primary;
                    break;
                case 'text':
                    element.style.color = theme.primary;
                    break;
                case 'accent':
                    element.style.color = theme.accent;
                    break;
            }
        });
    }

    updateMetaThemeColor(color) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.getElementsByTagName('head')[0].appendChild(metaThemeColor);
        }
        
        metaThemeColor.content = color;
    }

    showThemeChangeNotification(themeName) {
        // Create a subtle notification
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <i class="fas fa-palette me-2"></i>
            Theme changed to ${themeName}
        `;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '25px',
            fontSize: '14px',
            zIndex: '9999',
            opacity: '0',
            transition: 'opacity 0.3s ease-in-out'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    dispatchThemeChangeEvent(themeName) {
        const event = new CustomEvent('themeChange', {
            detail: {
                theme: themeName,
                themeData: this.themes[themeName]
            }
        });
        
        document.dispatchEvent(event);
    }

    saveTheme(themeName) {
        try {
            localStorage.setItem('dnd-creator-theme', themeName);
        } catch (error) {
            console.warn('Failed to save theme to localStorage:', error);
        }
    }

    getSavedTheme() {
        try {
            return localStorage.getItem('dnd-creator-theme');
        } catch (error) {
            console.warn('Failed to get saved theme from localStorage:', error);
            return null;
        }
    }

    getCurrentTheme() {
        return {
            name: this.currentTheme,
            data: this.themes[this.currentTheme]
        };
    }

    getAllThemes() {
        return this.themes;
    }

    getThemeForClass(className) {
        // Extract theme name from class like 'theme-mystic'
        const match = className.match(/theme-(\w+)/);
        return match ? match[1] : null;
    }

    // Generate a random theme
    getRandomTheme() {
        const themeNames = Object.keys(this.themes);
        const randomIndex = Math.floor(Math.random() * themeNames.length);
        return themeNames[randomIndex];
    }

    // Cycle to next theme
    cycleToNextTheme() {
        const themeNames = Object.keys(this.themes);
        const currentIndex = themeNames.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        
        this.changeTheme(themeNames[nextIndex]);
    }

    // Get theme based on time of day
    getTimeBasedTheme() {
        const hour = new Date().getHours();
        
        if (hour >= 6 && hour < 12) {
            return 'celestial'; // Morning
        } else if (hour >= 12 && hour < 17) {
            return 'forest'; // Afternoon
        } else if (hour >= 17 && hour < 20) {
            return 'fire'; // Evening
        } else {
            return 'shadow'; // Night
        }
    }

    // Apply time-based theme
    applyTimeBasedTheme() {
        const timeTheme = this.getTimeBasedTheme();
        this.changeTheme(timeTheme);
    }

    // Theme compatibility check for custom colors
    isColorCompatible(backgroundColor, textColor) {
        // Simple contrast ratio check
        const bgLuminance = this.getLuminance(backgroundColor);
        const textLuminance = this.getLuminance(textColor);
        
        const contrastRatio = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                            (Math.min(bgLuminance, textLuminance) + 0.05);
        
        return contrastRatio >= 4.5; // WCAG AA standard
    }

    getLuminance(color) {
        // Convert hex to RGB and calculate luminance
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        const getRGB = (c) => {
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };
        
        return 0.2126 * getRGB(r) + 0.7152 * getRGB(g) + 0.0722 * getRGB(b);
    }

    // Export theme settings
    exportThemeSettings() {
        return {
            currentTheme: this.currentTheme,
            themes: this.themes,
            timestamp: new Date().toISOString()
        };
    }

    // Import theme settings
    importThemeSettings(settings) {
        try {
            if (settings.themes) {
                // Merge with existing themes
                this.themes = { ...this.themes, ...settings.themes };
            }
            
            if (settings.currentTheme && this.themes[settings.currentTheme]) {
                this.changeTheme(settings.currentTheme);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import theme settings:', error);
            return false;
        }
    }

    // Cleanup method
    cleanup() {
        // Remove any temporary theme elements
        const themeNotifications = document.querySelectorAll('.theme-notification');
        themeNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
}

// Make ThemeManager globally available
window.ThemeManager = ThemeManager;

// Global theme manager instance
let themeManager;

// Initialize theme manager
document.addEventListener('DOMContentLoaded', () => {
    if (!themeManager) {
        themeManager = new ThemeManager();
        window.themeManager = themeManager;
    }
});

// Global theme change function for backwards compatibility
window.changeTheme = (themeName) => {
    if (window.themeManager) {
        return window.themeManager.changeTheme(themeName);
    }
    return false;
};
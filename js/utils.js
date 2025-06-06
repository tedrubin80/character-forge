/**
 * D&D Creator Hub - Utility Functions
 * Common utility functions used across modules
 */

class Utils {
    /**
     * Generate a unique ID
     * @param {number} length - Length of the ID
     * @returns {string} - Unique ID
     */
    static generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Calculate D&D ability modifier
     * @param {number} score - Ability score
     * @returns {number} - Modifier value
     */
    static calculateModifier(score) {
        return Math.floor((score - 10) / 2);
    }

    /**
     * Format modifier with + or - sign
     * @param {number} modifier - Modifier value
     * @returns {string} - Formatted modifier
     */
    static formatModifier(modifier) {
        return modifier >= 0 ? `+${modifier}` : modifier.toString();
    }

    /**
     * Roll dice using standard notation
     * @param {number} sides - Number of sides on the die
     * @param {number} count - Number of dice to roll
     * @param {number} modifier - Modifier to add
     * @returns {object} - Roll result object
     */
    static rollDice(sides, count = 1, modifier = 0) {
        const rolls = [];
        let total = 0;
        
        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            total += roll;
        }
        
        total += modifier;
        
        return {
            rolls,
            total,
            modifier,
            sides,
            count,
            formula: `${count}d${sides}${modifier ? (modifier >= 0 ? '+' : '') + modifier : ''}`,
            timestamp: new Date()
        };
    }

    /**
     * Parse dice notation (e.g., "3d6+2", "1d20", "2d8-1")
     * @param {string} notation - Dice notation string
     * @returns {object} - Parsed dice parameters
     */
    static parseDiceNotation(notation) {
        const cleanNotation = notation.replace(/\s/g, '').toLowerCase();
        
        // Enhanced regex to handle various dice notations
        const match = cleanNotation.match(/^(\d*)d(\d+)(?:([+-]\d+))?$/);
        
        if (!match) {
            throw new Error('Invalid dice notation. Use format like "3d6", "1d20+5", etc.');
        }
        
        const count = parseInt(match[1]) || 1;
        const sides = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;
        
        return { count, sides, modifier };
    }

    /**
     * Validate form data
     * @param {object} data - Data to validate
     * @param {object} rules - Validation rules
     * @returns {object} - Validation result
     */
    static validateData(data, rules) {
        const errors = [];
        
        for (const field in rules) {
            const rule = rules[field];
            const value = data[field];
            
            // Required check
            if (rule.required && (!value || value.toString().trim() === '')) {
                errors.push(`${field} is required`);
                continue;
            }
            
            // Skip other validations if field is empty and not required
            if (!value && !rule.required) continue;
            
            // Type validation
            if (rule.type) {
                switch (rule.type) {
                    case 'number':
                        if (isNaN(value)) {
                            errors.push(`${field} must be a number`);
                        }
                        break;
                    case 'email':
                        if (!/\S+@\S+\.\S+/.test(value)) {
                            errors.push(`${field} must be a valid email`);
                        }
                        break;
                    case 'string':
                        if (typeof value !== 'string') {
                            errors.push(`${field} must be a string`);
                        }
                        break;
                }
            }
            
            // Length validation
            if (rule.minLength && value.length < rule.minLength) {
                errors.push(`${field} must be at least ${rule.minLength} characters`);
            }
            
            if (rule.maxLength && value.length > rule.maxLength) {
                errors.push(`${field} must be no more than ${rule.maxLength} characters`);
            }
            
            // Range validation for numbers
            if (rule.min !== undefined && parseFloat(value) < rule.min) {
                errors.push(`${field} must be at least ${rule.min}`);
            }
            
            if (rule.max !== undefined && parseFloat(value) > rule.max) {
                errors.push(`${field} must be no more than ${rule.max}`);
            }
            
            // Custom validation
            if (rule.custom && typeof rule.custom === 'function') {
                const customResult = rule.custom(value);
                if (customResult !== true) {
                    errors.push(customResult || `${field} is invalid`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Debounce function execution
     * @param {function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute immediately on first call
     * @returns {function} - Debounced function
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function execution
     * @param {function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {function} - Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Deep clone an object
     * @param {any} obj - Object to clone
     * @returns {any} - Cloned object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    /**
     * Format date for display
     * @param {Date|string} date - Date to format
     * @param {string} format - Format type ('short', 'long', 'time', 'datetime')
     * @returns {string} - Formatted date string
     */
    static formatDate(date, format = 'short') {
        const d = new Date(date);
        
        if (isNaN(d.getTime())) {
            return 'Invalid Date';
        }
        
        const options = {
            short: { month: 'short', day: 'numeric', year: 'numeric' },
            long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            }
        };
        
        return d.toLocaleDateString('en-US', options[format] || options.short);
    }

    /**
     * Capitalize first letter of a string
     * @param {string} str - String to capitalize
     * @returns {string} - Capitalized string
     */
    static capitalize(str) {
        if (!str || typeof str !== 'string') return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Convert camelCase to Title Case
     * @param {string} str - String to convert
     * @returns {string} - Title case string
     */
    static camelToTitle(str) {
        if (!str || typeof str !== 'string') return str;
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} html - HTML string to sanitize
     * @returns {string} - Sanitized HTML
     */
    static sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    /**
     * Generate random name from D&D-themed lists
     * @param {string} type - Type of name ('human', 'elf', 'dwarf', 'place', 'tavern')
     * @returns {string} - Generated name
     */
    static generateRandomName(type = 'human') {
        const names = {
            human: {
                first: ['Aeliana', 'Gareth', 'Lyrina', 'Thorin', 'Celeste', 'Draven', 'Seraphina', 'Kael'],
                last: ['Brightblade', 'Stormwind', 'Goldleaf', 'Ironforge', 'Shadowmere', 'Starweaver']
            },
            elf: {
                first: ['Aelar', 'Aerdrie', 'Aramil', 'Enna', 'Galinndan', 'Hadarai', 'Immeral', 'Ivellios'],
                last: ['Amakir', 'Amador', 'Gemflower', 'Holimion', 'Liadon', 'Meliamne', 'Nailo']
            },
            dwarf: {
                first: ['Adrik', 'Alberich', 'Baern', 'Darrak', 'Eberk', 'Fargrim', 'Gardain', 'Harbek'],
                last: ['Battlehammer', 'Brawnanvil', 'Dankil', 'Fireforge', 'Frostbeard', 'Gorunn']
            },
            place: ['Westfall', 'Goldshire', 'Redridge', 'Darkshire', 'Moonbrook', 'Sentinel Hill', 'Lakeshire'],
            tavern: ['The Prancing Pony', 'Dragon\'s Rest', 'The Rusty Anchor', 'Moonlight Tavern', 'The Golden Griffin']
        };
        
        const nameList = names[type];
        
        if (!nameList) {
            return 'Unknown';
        }
        
        if (typeof nameList === 'object' && nameList.first) {
            const first = nameList.first[Math.floor(Math.random() * nameList.first.length)];
            const last = nameList.last[Math.floor(Math.random() * nameList.last.length)];
            return `${first} ${last}`;
        }
        
        return nameList[Math.floor(Math.random() * nameList.length)];
    }

    /**
     * Calculate proficiency bonus based on character level
     * @param {number} level - Character level
     * @returns {number} - Proficiency bonus
     */
    static calculateProficiencyBonus(level) {
        return Math.ceil(level / 4) + 1;
    }

    /**
     * Get spell slots for a given class and level
     * @param {string} className - Character class
     * @param {number} level - Character level
     * @returns {object} - Spell slots by level
     */
    static getSpellSlots(className, level) {
        const fullCasters = ['Wizard', 'Sorcerer', 'Cleric', 'Druid', 'Bard'];
        const halfCasters = ['Paladin', 'Ranger'];
        const thirdCasters = ['Eldritch Knight Fighter', 'Arcane Trickster Rogue'];
        
        if (fullCasters.includes(className)) {
            return this.getFullCasterSlots(level);
        } else if (halfCasters.includes(className)) {
            return this.getHalfCasterSlots(level);
        } else if (thirdCasters.includes(className)) {
            return this.getThirdCasterSlots(level);
        }
        
        return {};
    }

    /**
     * Get full caster spell slots
     * @param {number} level - Character level
     * @returns {object} - Spell slots
     */
    static getFullCasterSlots(level) {
        const slots = {
            1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
            2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
            3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
            4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
            5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
            // ... continue pattern
        };
        
        return slots[Math.min(level, 20)] || slots[1];
    }

    /**
     * Storage utilities with error handling
     */
    static storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn('Failed to save to localStorage:', error);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn('Failed to read from localStorage:', error);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.warn('Failed to remove from localStorage:', error);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.warn('Failed to clear localStorage:', error);
                return false;
            }
        }
    };

    /**
     * URL utilities
     */
    static url = {
        getParams() {
            return new URLSearchParams(window.location.search);
        },
        
        getParam(name, defaultValue = null) {
            return this.getParams().get(name) || defaultValue;
        },
        
        setParam(name, value) {
            const params = this.getParams();
            params.set(name, value);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.pushState({}, '', newUrl);
        },
        
        removeParam(name) {
            const params = this.getParams();
            params.delete(name);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.pushState({}, '', newUrl);
        }
    };

    /**
     * DOM utilities
     */
    static dom = {
        ready(callback) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', callback);
            } else {
                callback();
            }
        },
        
        create(tag, attributes = {}, textContent = '') {
            const element = document.createElement(tag);
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'dataset') {
                    Object.entries(value).forEach(([dataKey, dataValue]) => {
                        element.dataset[dataKey] = dataValue;
                    });
                } else {
                    element.setAttribute(key, value);
                }
            });
            
            if (textContent) {
                element.textContent = textContent;
            }
            
            return element;
        },
        
        hide(element) {
            if (element) element.style.display = 'none';
        },
        
        show(element, display = 'block') {
            if (element) element.style.display = display;
        },
        
        toggle(element) {
            if (element) {
                element.style.display = element.style.display === 'none' ? 'block' : 'none';
            }
        }
    };

    /**
     * Event emitter for custom events
     */
    static eventEmitter = {
        events: {},
        
        on(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
        },
        
        off(event, callback) {
            if (this.events[event]) {
                this.events[event] = this.events[event].filter(cb => cb !== callback);
            }
        },
        
        emit(event, ...args) {
            if (this.events[event]) {
                this.events[event].forEach(callback => callback(...args));
            }
        }
    };
}

// Make Utils globally available
window.Utils = Utils;
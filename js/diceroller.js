/**
 * D&D Creator Hub - Dice Roller Module
 * Advanced dice rolling system with history, statistics, and D&D-specific features
 */

class DiceRoller {
    constructor() {
        this.rollHistory = [];
        this.isInitialized = false;
        this.maxHistorySize = 100;
        this.statistics = {
            totalRolls: 0,
            criticalHits: 0,
            criticalMisses: 0,
            averageRoll: 0
        };
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadTemplate();
            this.bindEvents();
            this.loadRollHistory();
            this.initializeDisplay();
            this.isInitialized = true;
            console.log('Dice Roller initialized');
        } catch (error) {
            console.error('Failed to initialize Dice Roller:', error);
            throw error;
        }
    }

    async loadTemplate() {
        const container = document.getElementById('dice-pane');
        if (!container) throw new Error('Dice pane container not found');

        container.innerHTML = `
            <div class="row">
                <!-- Basic Dice Roller -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-primary text-white">
                            <h4 class="mb-0"><i class="fas fa-dice me-2"></i>Basic Dice Roller</h4>
                        </div>
                        <div class="card-body">
                            <div class="row g-3 mb-4">
                                <div class="col-6 col-md-4">
                                    <button class="btn btn-outline-primary w-100 dice-button" onclick="diceRoller.rollDice(4, 1)">
                                        <i class="fas fa-dice-four me-2"></i>d4
                                    </button>
                                </div>
                                <div class="col-6 col-md-4">
                                    <button class="btn btn-outline-primary w-100 dice-button" onclick="diceRoller.rollDice(6, 1)">
                                        <i class="fas fa-dice-six me-2"></i>d6
                                    </button>
                                </div>
                                <div class="col-6 col-md-4">
                                    <button class="btn btn-outline-primary w-100 dice-button" onclick="diceRoller.rollDice(8, 1)">
                                        <i class="fas fa-dice me-2"></i>d8
                                    </button>
                                </div>
                                <div class="col-6 col-md-4">
                                    <button class="btn btn-outline-primary w-100 dice-button" onclick="diceRoller.rollDice(10, 1)">
                                        <i class="fas fa-dice me-2"></i>d10
                                    </button>
                                </div>
                                <div class="col-6 col-md-4">
                                    <button class="btn btn-outline-primary w-100 dice-button" onclick="diceRoller.rollDice(12, 1)">
                                        <i class="fas fa-dice me-2"></i>d12
                                    </button>
                                </div>
                                <div class="col-6 col-md-4">
                                    <button class="btn btn-outline-primary w-100 dice-button" onclick="diceRoller.rollDice(20, 1)">
                                        <i class="fas fa-dice-d20 me-2"></i>d20
                                    </button>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold">Custom Roll</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="customDiceInput" 
                                           placeholder="e.g., 3d6+2, 2d10+5" value="1d20">
                                    <button class="btn btn-primary" onclick="diceRoller.rollCustomDice()">
                                        <i class="fas fa-dice-d20 me-2"></i>Roll
                                    </button>
                                </div>
                                <small class="text-muted">Examples: 1d20, 3d6, 2d8+3, 4d6kh3 (keep highest 3)</small>
                            </div>

                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <button class="btn btn-success w-100" onclick="diceRoller.rollWithAdvantage()">
                                        <i class="fas fa-arrow-up me-2"></i>Advantage
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-danger w-100" onclick="diceRoller.rollWithDisadvantage()">
                                        <i class="fas fa-arrow-down me-2"></i>Disadvantage
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-success text-white">
                            <h4 class="mb-0"><i class="fas fa-bolt me-2"></i>Quick Actions</h4>
                        </div>
                        <div class="card-body">
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <button class="btn btn-outline-success w-100" onclick="diceRoller.rollInitiative()">
                                        <i class="fas fa-running me-2"></i>Initiative
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-outline-success w-100" onclick="diceRoller.rollDeathSave()">
                                        <i class="fas fa-heart me-2"></i>Death Save
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-outline-success w-100" onclick="diceRoller.rollPercentile()">
                                        <i class="fas fa-percentage me-2"></i>d100
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-outline-success w-100" onclick="diceRoller.rollHitDie()">
                                        <i class="fas fa-plus me-2"></i>Hit Die
                                    </button>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold">Ability Check</label>
                                <div class="row g-2">
                                    <div class="col-8">
                                        <select class="form-select" id="abilitySelect">
                                            <option value="0">No Modifier</option>
                                            <option value="1">+1 (STR/DEX/etc.)</option>
                                            <option value="2">+2</option>
                                            <option value="3">+3</option>
                                            <option value="4">+4</option>
                                            <option value="5">+5</option>
                                            <option value="-1">-1</option>
                                            <option value="-2">-2</option>
                                        </select>
                                    </div>
                                    <div class="col-4">
                                        <button class="btn btn-primary w-100" onclick="diceRoller.rollAbilityCheck()">
                                            <i class="fas fa-dice-d20"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold">Attack Roll</label>
                                <div class="row g-2">
                                    <div class="col-4">
                                        <input type="number" class="form-control" id="attackBonus" placeholder="+0" value="5">
                                    </div>
                                    <div class="col-4">
                                        <button class="btn btn-warning w-100" onclick="diceRoller.rollAttack()">
                                            <i class="fas fa-sword me-2"></i>Attack
                                        </button>
                                    </div>
                                    <div class="col-4">
                                        <button class="btn btn-danger w-100" onclick="diceRoller.rollDamage()">
                                            <i class="fas fa-burst me-2"></i>Damage
                                        </button>
                                    </div>
                                </div>
                                <div class="row g-2 mt-1">
                                    <div class="col-12">
                                        <input type="text" class="form-control" id="damageInput" 
                                               placeholder="e.g., 1d8+3, 2d6+2" value="1d8+3">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Roll History -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                            <h4 class="mb-0"><i class="fas fa-history me-2"></i>Roll History</h4>
                            <button class="btn btn-sm btn-light" onclick="diceRoller.clearRollHistory()">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="card-body p-2">
                            <div id="rollHistory" class="roll-history" style="max-height: 300px; overflow-y: auto;">
                                <div class="text-center text-muted p-3">
                                    <i class="fas fa-dice-d20 fa-2x mb-2"></i>
                                    <p>Roll some dice to see your history!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- DM Tools -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-dark text-white">
                            <h4 class="mb-0"><i class="fas fa-crown me-2"></i>DM Tools</h4>
                        </div>
                        <div class="card-body">
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <button class="btn btn-outline-dark w-100" onclick="diceRoller.rollRandomEncounter()">
                                        <i class="fas fa-dragon me-2"></i>Encounter
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-outline-dark w-100" onclick="diceRoller.rollWeather()">
                                        <i class="fas fa-cloud me-2"></i>Weather
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-outline-dark w-100" onclick="diceRoller.rollLoot()">
                                        <i class="fas fa-coins me-2"></i>Loot
                                    </button>
                                </div>
                                <div class="col-6">
                                    <button class="btn btn-outline-dark w-100" onclick="diceRoller.rollNPCMood()">
                                        <i class="fas fa-theater-masks me-2"></i>NPC Mood
                                    </button>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold">Random Generator</label>
                                <div class="row g-2">
                                    <div class="col-8">
                                        <select class="form-select" id="randomTable">
                                            <option value="names">Random Names</option>
                                            <option value="taverns">Tavern Names</option>
                                            <option value="rumors">Rumors</option>
                                            <option value="quests">Quest Hooks</option>
                                            <option value="treasures">Magic Items</option>
                                        </select>
                                    </div>
                                    <div class="col-4">
                                        <button class="btn btn-dark w-100" onclick="diceRoller.generateRandom()">
                                            <i class="fas fa-magic"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div id="randomResult" class="alert alert-info" style="display: none;">
                                <strong>Result:</strong> <span id="randomText"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Statistics -->
                <div class="col-lg-12 mb-4">
                    <div class="card">
                        <div class="card-header bg-secondary text-white">
                            <h4 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Rolling Statistics</h4>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-md-3">
                                    <div class="stat-box">
                                        <h5 id="totalRolls">0</h5>
                                        <small>Total Rolls</small>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="stat-box">
                                        <h5 id="criticalHits">0</h5>
                                        <small>Critical Hits</small>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="stat-box">
                                        <h5 id="criticalMisses">0</h5>
                                        <small>Critical Misses</small>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="stat-box">
                                        <h5 id="averageRoll">0.0</h5>
                                        <small>Average d20 Roll</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Large Roll Display -->
            <div class="text-center mb-4">
                <div id="rollDisplay" class="display-1 text-primary fw-bold" 
                     style="min-height: 80px; display: flex; align-items: center; justify-content: center; 
                            background: var(--bg-light); border-radius: 15px; border: 3px dashed var(--primary-color);">
                    <i class="fas fa-dice-d20 fa-2x text-muted"></i>
                </div>
                <div id="rollDetails" class="mt-2 text-muted"></div>
            </div>
        `;
    }

    bindEvents() {
        // Custom dice input enter key
        const customInput = document.getElementById('customDiceInput');
        if (customInput) {
            customInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.rollCustomDice();
                }
            });
        }

        // Auto-save history
        Utils.eventEmitter.on('rollAdded', () => {
            this.saveRollHistory();
        });
    }

    initializeDisplay() {
        this.updateHistoryDisplay();
        this.updateStatisticsDisplay();
    }

    rollDice(sides, count = 1, modifier = 0, options = {}) {
        try {
            window.app.authManager.requireAuth();
        } catch (error) {
            showError('Please log in to use the dice roller');
            return null;
        }

        const rolls = [];
        let total = 0;
        
        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            total += roll;
        }
        
        total += modifier;
        
        const rollText = count > 1 ? `${count}d${sides}` : `d${sides}`;
        const modText = modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : '';
        const formula = `${rollText}${modText}`;
        
        const result = {
            id: Utils.generateId(),
            formula: formula,
            rolls: rolls,
            modifier: modifier,
            total: total,
            sides: sides,
            count: count,
            timestamp: new Date(),
            type: options.type || 'basic',
            ...options
        };
        
        this.displayRoll(result);
        this.addToHistory(result);
        this.updateStatistics(result);
        
        // Send to backend for logging
        this.logRollToBackend(result);
        
        return result;
    }

    rollCustomDice() {
        const input = document.getElementById('customDiceInput');
        const formula = input.value.trim();
        
        if (!formula) {
            showError('Please enter a dice formula');
            return;
        }
        
        try {
            const result = this.parseDiceFormula(formula);
            this.displayRoll(result);
            this.addToHistory(result);
            this.updateStatistics(result);
        } catch (error) {
            showError(error.message);
        }
    }

    parseDiceFormula(formula) {
        const cleanFormula = formula.replace(/\s/g, '').toLowerCase();
        
        // Enhanced regex for complex dice notation
        const keepMatch = cleanFormula.match(/(\d*)d(\d+)(?:k[hl](\d+))?([+-]\d+)?/);
        if (!keepMatch) {
            throw new Error('Invalid dice formula. Use format like "3d6", "2d10+5", "4d6kh3"');
        }
        
        const count = parseInt(keepMatch[1]) || 1;
        const sides = parseInt(keepMatch[2]);
        const keepOperation = cleanFormula.includes('kh') ? 'kh' : 
                           cleanFormula.includes('kl') ? 'kl' : null;
        const keepCount = keepMatch[3] ? parseInt(keepMatch[3]) : null;
        const modifier = keepMatch[4] ? parseInt(keepMatch[4]) : 0;
        
        if (count > 100) {
            throw new Error('Maximum 100 dice per roll');
        }
        
        const rolls = [];
        for (let i = 0; i < count; i++) {
            rolls.push(Math.floor(Math.random() * sides) + 1);
        }
        
        let finalRolls = [...rolls];
        let keepText = '';
        
        if (keepOperation && keepCount) {
            if (keepOperation === 'kh') {
                finalRolls.sort((a, b) => b - a);
                finalRolls = finalRolls.slice(0, keepCount);
                keepText = ` (kept highest ${keepCount})`;
            } else if (keepOperation === 'kl') {
                finalRolls.sort((a, b) => a - b);
                finalRolls = finalRolls.slice(0, keepCount);
                keepText = ` (kept lowest ${keepCount})`;
            }
        }
        
        const total = finalRolls.reduce((sum, roll) => sum + roll, 0) + modifier;
        
        return {
            id: Utils.generateId(),
            formula: formula + keepText,
            rolls: rolls,
            finalRolls: finalRolls,
            modifier: modifier,
            total: total,
            sides: sides,
            count: count,
            timestamp: new Date(),
            type: 'custom'
        };
    }

    rollWithAdvantage() {
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        const total = Math.max(roll1, roll2);
        
        const result = {
            id: Utils.generateId(),
            formula: 'Advantage (2d20, take higher)',
            rolls: [roll1, roll2],
            total: total,
            sides: 20,
            count: 2,
            advantage: true,
            timestamp: new Date(),
            type: 'advantage'
        };
        
        this.displayRoll(result);
        this.addToHistory(result);
        this.updateStatistics(result);
    }

    rollWithDisadvantage() {
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        const total = Math.min(roll1, roll2);
        
        const result = {
            id: Utils.generateId(),
            formula: 'Disadvantage (2d20, take lower)',
            rolls: [roll1, roll2],
            total: total,
            sides: 20,
            count: 2,
            disadvantage: true,
            timestamp: new Date(),
            type: 'disadvantage'
        };
        
        this.displayRoll(result);
        this.addToHistory(result);
        this.updateStatistics(result);
    }

    rollInitiative() {
        const characterCreator = window.app.getModule('characterCreator');
        let dexMod = 0;
        
        if (characterCreator && characterCreator.character) {
            const dexScore = characterCreator.character.abilities?.dexterity || 10;
            dexMod = Utils.calculateModifier(dexScore);
        }
        
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + dexMod;
        
        const result = {
            id: Utils.generateId(),
            formula: `Initiative (d20${Utils.formatModifier(dexMod)})`,
            rolls: [roll],
            modifier: dexMod,
            total: total,
            sides: 20,
            timestamp: new Date(),
            type: 'initiative'
        };
        
        this.displayRoll(result);
        this.addToHistory(result);
        this.updateStatistics(result);
    }

    rollDeathSave() {
        const roll = Math.floor(Math.random() * 20) + 1;
        let status = '';
        
        if (roll === 20) status = ' - NATURAL 20! (Regain 1 HP)';
        else if (roll === 1) status = ' - NATURAL 1! (2 failures)';
        else if (roll >= 10) status = ' - Success';
        else status = ' - Failure';
        
        const result = {
            id: Utils.generateId(),
            formula: `Death Save${status}`,
            rolls: [roll],
            total: roll,
            sides: 20,
            timestamp: new Date(),
            type: 'death_save',
            critical: roll === 20,
            fumble: roll === 1
        };
        
        this.displayRoll(result);
        this.addToHistory(result);
        this.updateStatistics(result);
    }

    rollPercentile() {
        const roll = Math.floor(Math.random() * 100) + 1;
        
        const result = {
            id: Utils.generateId(),
            formula: 'd100 (Percentile)',
            rolls: [roll],
            total: roll,
            sides: 100,
            timestamp: new Date(),
            type: 'percentile'
        };
        
        this.displayRoll(result);
        this.addToHistory(result);
        this.updateStatistics(result);
    }

    rollHitDie() {
        const characterCreator = window.app.getModule('characterCreator');
        let hitDie = 8;
        let conMod = 0;
        
        if (characterCreator && characterCreator.character) {
            const characterClass = characterCreator.character.class;
            const conScore = characterCreator.character.abilities?.constitution || 10;
            conMod = Utils.calculateModifier(conScore);
            
            const hitDice = {
                'Barbarian': 12, 'Fighter': 10, 'Paladin': 10, 'Ranger': 10,
                'Bard': 8, 'Cleric': 8, 'Druid': 8, 'Monk': 8, 'Rogue': 8, 'Warlock': 8,
                'Sorcerer': 6, 'Wizard': 6
            };
            
            hitDie = hitDice[characterClass] || 8;
        }
        
        const roll = Math.floor(Math.random() * hitDie) + 1;
        const total = Math.max(1, roll + conMod);
        
        const result = {
            id: Utils.generateId(),
            formula: `Hit Die (d${hitDie}${Utils.formatModifier(conMod)})`,
            rolls: [roll],
            modifier: conMod,
            total: total,
            sides: hitDie,
            timestamp: new Date(),
            type: 'hit_die'
        };
        
        this.displayRoll(result);
        this.addToHistory(result);
        this.updateStatistics(result);
    }

    rollAbilityCheck() {
        const modifier = parseInt(document.getElementById('abilitySelect').value) || 0;
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + modifier;
        
        const result = {
            id: Utils.generateId(),
            formula: `Ability Check (d20${Utils.formatModifier(modifier)})`,
            rolls: [roll],
            modifier: modifier,
            total: total,
            sides: 20,
            timestamp: new Date(),
            type: 'ability_check'
        };
        
        this.displayRoll(result);
        this.addToHistory(result);
        this.updateStatistics(result);
    }

    rollAttack() {
        const bonus = parseInt(document.getElementById('attackBonus').value) || 0;
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + bonus;
        
        let status = '';
        if (roll === 20) status = ' - CRITICAL HIT!';
        else if (roll === 1) status = ' - Critical Miss';
        
        const result = {
            id: Utils.generateId(),
            formula: `Attack Roll (d20${Utils.formatModifier(bonus)})${status}`,
            rolls: [roll],
            modifier: bonus,
            total: total,
            sides: 20,
            critical: roll === 20,
            fumble: roll === 1,
            timestamp: new Date(),
            type: 'attack'
        };
        
        this.displayRoll(result);
        this.addToHistory(result);
        this.updateStatistics(result);
    }

    rollDamage() {
        const damageFormula = document.getElementById('damageInput').value.trim() || '1d8';
        
        try {
            const result = this.parseDiceFormula(damageFormula);
            result.formula = `Damage: ${result.formula}`;
            result.type = 'damage';
            
            this.displayRoll(result);
            this.addToHistory(result);
            this.updateStatistics(result);
        } catch (error) {
            showError(error.message);
        }
    }

    // DM Tools
    rollRandomEncounter() {
        const encounters = [
            '1d4 Goblins ambush the party',
            'A wandering merchant offers rare goods',
            'Ancient ruins discovered off the path',
            'Wild animal crosses your path',
            'Bandit checkpoint ahead',
            'Friendly travelers share a campfire',
            'Strange weather phenomenon',
            'Abandoned campsite with clues',
            'Mysterious magical portal',
            'Lost traveler needs assistance'
        ];
        
        this.showRandomResult(encounters, 'Random Encounter');
    }

    rollWeather() {
        const weather = [
            'Clear skies, perfect visibility',
            'Light rain, muddy roads',
            'Heavy fog, limited vision',
            'Strong winds, difficult travel',
            'Snow or hail, cold conditions',
            'Thunderstorm approaching',
            'Overcast but mild',
            'Unseasonably hot',
            'Aurora borealis visible',
            'Magical storm with unusual effects'
        ];
        
        this.showRandomResult(weather, 'Weather');
    }

    rollLoot() {
        const loot = [
            '2d6 gold pieces',
            'A mysterious potion',
            'An ornate dagger (+1)',
            'A bag of gemstones',
            'An ancient map fragment',
            'A silver holy symbol',
            'A set of thieves\' tools',
            'A scroll of unknown magic',
            'A rare spellbook',
            'An enchanted trinket'
        ];
        
        this.showRandomResult(loot, 'Loot Found');
    }

    rollNPCMood() {
        const moods = [
            'Friendly and helpful',
            'Suspicious and cautious',
            'Excited and talkative',
            'Depressed and withdrawn',
            'Angry and confrontational',
            'Curious about the party',
            'Nervous and fidgety',
            'Indifferent and bored',
            'Flirtatious and charming',
            'Mysterious and cryptic'
        ];
        
        this.showRandomResult(moods, 'NPC Mood');
    }

    generateRandom() {
        const table = document.getElementById('randomTable').value;
        const tables = {
            names: ['Aeliana Brightblade', 'Thorek Ironforge', 'Zara Shadowmere', 'Gareth Stormwind', 'Lyrina Goldleaf', 'Borin Battlehammer', 'Celeste Starweaver', 'Draven Nightfall'],
            taverns: ['The Prancing Pony', 'Dragon\'s Rest Inn', 'The Rusty Anchor', 'Moonlight Tavern', 'The Golden Griffin', 'Serpent\'s Head', 'The Wanderer\'s Rest', 'The Drunken Dragon'],
            rumors: ['The old mine is haunted by restless spirits', 'Bandits control the north road', 'A dragon was seen near the mountains', 'The mayor is hiding dark secrets', 'Strange lights dance in the forest at night'],
            quests: ['Rescue a kidnapped merchant\'s daughter', 'Clear undead from ancient ruins', 'Deliver a message to a distant town', 'Investigate mysterious disappearances', 'Find a lost magical artifact', 'Stop a cult from summoning demons'],
            treasures: ['Ring of Protection +1', 'Healing Potion (2d4+2)', 'Cloak of Elvenkind', 'Bag of Holding', 'Scroll of Fireball', 'Silver Sword +1', 'Boots of Speed', 'Amulet of Natural Armor +1']
        };
        
        const items = tables[table] || tables.names;
        this.showRandomResult(items, 'Random ' + Utils.capitalize(table.slice(0, -1)));
    }

    showRandomResult(array, title) {
        const randomIndex = Math.floor(Math.random() * array.length);
        const result = array[randomIndex];
        
        document.getElementById('randomText').textContent = result;
        document.getElementById('randomResult').style.display = 'block';
        
        // Add to roll history
        const rollResult = {
            id: Utils.generateId(),
            formula: title,
            total: result,
            timestamp: new Date(),
            type: 'random',
            isRandom: true
        };
        
        this.addToHistory(rollResult);
    }

    displayRoll(result) {
        const display = document.getElementById('rollDisplay');
        const details = document.getElementById('rollDetails');
        
        if (!display || !details) return;
        
        // Add rolling animation
        display.classList.add('rolling');
        display.innerHTML = '<i class="fas fa-dice-d20 fa-spin"></i>';
        
        setTimeout(() => {
            display.classList.remove('rolling');
            
            if (result.isRandom) {
                display.innerHTML = '<i class="fas fa-magic fa-2x"></i>';
                details.innerHTML = `<strong>${result.formula}:</strong> ${result.total}`;
            } else {
                display.textContent = result.total;
                
                let detailText = `<strong>${result.formula}</strong>`;
                if (result.rolls && result.rolls.length > 1) {
                    detailText += `<br>Rolls: [${result.rolls.join(', ')}]`;
                    if (result.finalRolls && result.finalRolls.length !== result.rolls.length) {
                        detailText += ` → [${result.finalRolls.join(', ')}]`;
                    }
                }
                if (result.modifier && result.modifier !== 0) {
                    detailText += ` ${Utils.formatModifier(result.modifier)}`;
                }
                
                details.innerHTML = detailText;
            }
            
            // Add color based on result
            display.className = display.className.replace(/text-\w+/, 'text-primary');
            if (result.critical || (result.sides === 20 && result.total === 20)) {
                display.className = display.className.replace(/text-\w+/, 'text-success');
            } else if (result.fumble || (result.sides === 20 && result.total === 1)) {
                display.className = display.className.replace(/text-\w+/, 'text-danger');
            }
            
        }, 500);
    }

    addToHistory(result) {
        this.rollHistory.unshift(result);
        
        // Limit history size
        if (this.rollHistory.length > this.maxHistorySize) {
            this.rollHistory = this.rollHistory.slice(0, this.maxHistorySize);
        }
        
        this.updateHistoryDisplay();
        
        // Emit event for other modules
        Utils.eventEmitter.emit('rollAdded', result);
    }

    updateHistoryDisplay() {
        const historyDiv = document.getElementById('rollHistory');
        if (!historyDiv) return;
        
        if (this.rollHistory.length === 0) {
            historyDiv.innerHTML = `
                <div class="text-center text-muted p-3">
                    <i class="fas fa-dice-d20 fa-2x mb-2"></i>
                    <p>Roll some dice to see your history!</p>
                </div>
            `;
            return;
        }
        
        const historyHTML = this.rollHistory.slice(0, 20).map(roll => {
            const time = Utils.formatDate(roll.timestamp, 'time');
            let className = 'roll-entry';
            
            if (roll.critical || (roll.sides === 20 && roll.total === 20)) {
                className += ' critical';
            } else if (roll.fumble || (roll.sides === 20 && roll.total === 1)) {
                className += ' fumble';
            }
            
            if (roll.isRandom) {
                return `
                    <div class="${className}">
                        <div class="d-flex justify-content-between">
                            <span><strong>${roll.formula}:</strong> ${roll.total}</span>
                            <small>${time}</small>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="${className}">
                    <div class="d-flex justify-content-between">
                        <span><strong>${roll.total}</strong> (${roll.formula})</span>
                        <small>${time}</small>
                    </div>
                </div>
            `;
        }).join('');
        
        historyDiv.innerHTML = historyHTML;
    }

    updateStatistics(result) {
        this.statistics.totalRolls++;
        
        if (result.sides === 20) {
            if (result.total === 20 || result.critical) {
                this.statistics.criticalHits++;
            } else if (result.total === 1 || result.fumble) {
                this.statistics.criticalMisses++;
            }
            
            // Calculate average for d20 rolls
            const d20Rolls = this.rollHistory.filter(r => r.sides === 20 && !r.isRandom);
            if (d20Rolls.length > 0) {
                const sum = d20Rolls.reduce((total, roll) => total + (roll.rolls?.[0] || roll.total), 0);
                this.statistics.averageRoll = (sum / d20Rolls.length).toFixed(1);
            }
        }
        
        this.updateStatisticsDisplay();
    }

    updateStatisticsDisplay() {
        const elements = {
            totalRolls: document.getElementById('totalRolls'),
            criticalHits: document.getElementById('criticalHits'),
            criticalMisses: document.getElementById('criticalMisses'),
            averageRoll: document.getElementById('averageRoll')
        };
        
        if (elements.totalRolls) elements.totalRolls.textContent = this.statistics.totalRolls;
        if (elements.criticalHits) elements.criticalHits.textContent = this.statistics.criticalHits;
        if (elements.criticalMisses) elements.criticalMisses.textContent = this.statistics.criticalMisses;
        if (elements.averageRoll) elements.averageRoll.textContent = this.statistics.averageRoll;
    }

    async logRollToBackend(result) {
        try {
            await apiCall('dice.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'log_roll',
                    roll: result
                })
            });
        } catch (error) {
            console.warn('Failed to log roll to backend:', error);
        }
    }

    saveRollHistory() {
        Utils.storage.set('dnd-dice-history', {
            history: this.rollHistory.slice(0, 50), // Save last 50 rolls
            statistics: this.statistics
        });
    }

    loadRollHistory() {
        const saved = Utils.storage.get('dnd-dice-history');
        if (saved) {
            this.rollHistory = saved.history || [];
            this.statistics = { ...this.statistics, ...(saved.statistics || {}) };
        }
    }

    clearRollHistory() {
        if (confirm('Clear all roll history?')) {
            this.rollHistory = [];
            this.statistics = {
                totalRolls: 0,
                criticalHits: 0,
                criticalMisses: 0,
                averageRoll: 0
            };
            
            this.updateHistoryDisplay();
            this.updateStatisticsDisplay();
            this.saveRollHistory();
            
            showSuccess('Roll history cleared!');
        }
    }

    cleanup() {
        this.saveRollHistory();
        console.log('Dice Roller cleaned up');
    }
}

// Make DiceRoller globally available
window.DiceRoller = DiceRoller;
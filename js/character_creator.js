/**
 * D&D Creator Hub - Character Creator Module
 * Handles character creation, editing, and management
 */

class CharacterCreator {
    constructor() {
        this.abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        this.character = this.createEmptyCharacter();
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadTemplate();
            this.bindEvents();
            this.initializeForm();
            this.isInitialized = true;
            console.log('Character Creator initialized');
        } catch (error) {
            console.error('Failed to initialize Character Creator:', error);
            throw error;
        }
    }

    async loadTemplate() {
        const container = document.getElementById('character-pane');
        if (!container) throw new Error('Character pane container not found');

        container.innerHTML = `
            <form id="characterForm">
                <!-- Basic Information -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="characterName" class="form-label fw-bold">Character Name</label>
                            <input type="text" class="form-control" id="characterName" placeholder="Enter character name">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="mb-3">
                            <label for="characterLevel" class="form-label fw-bold">Level</label>
                            <input type="number" class="form-control" id="characterLevel" value="1" min="1" max="20">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="mb-3">
                            <label for="proficiencyBonus" class="form-label fw-bold">Proficiency Bonus</label>
                            <input type="number" class="form-control" id="proficiencyBonus" value="2" readonly>
                        </div>
                    </div>
                </div>

                <!-- Race, Class, Background -->
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label for="characterRace" class="form-label fw-bold">Race</label>
                            <select class="form-select" id="characterRace">
                                <option value="">Choose Race</option>
                                <option value="Human">Human</option>
                                <option value="Elf">Elf</option>
                                <option value="Dwarf">Dwarf</option>
                                <option value="Halfling">Halfling</option>
                                <option value="Dragonborn">Dragonborn</option>
                                <option value="Gnome">Gnome</option>
                                <option value="Half-Elf">Half-Elf</option>
                                <option value="Half-Orc">Half-Orc</option>
                                <option value="Tiefling">Tiefling</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label for="characterClass" class="form-label fw-bold">Class</label>
                            <select class="form-select" id="characterClass">
                                <option value="">Choose Class</option>
                                <option value="Barbarian">Barbarian</option>
                                <option value="Bard">Bard</option>
                                <option value="Cleric">Cleric</option>
                                <option value="Druid">Druid</option>
                                <option value="Fighter">Fighter</option>
                                <option value="Monk">Monk</option>
                                <option value="Paladin">Paladin</option>
                                <option value="Ranger">Ranger</option>
                                <option value="Rogue">Rogue</option>
                                <option value="Sorcerer">Sorcerer</option>
                                <option value="Warlock">Warlock</option>
                                <option value="Wizard">Wizard</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label for="characterBackground" class="form-label fw-bold">Background</label>
                            <select class="form-select" id="characterBackground">
                                <option value="">Choose Background</option>
                                <option value="Acolyte">Acolyte</option>
                                <option value="Criminal">Criminal</option>
                                <option value="Folk Hero">Folk Hero</option>
                                <option value="Noble">Noble</option>
                                <option value="Sage">Sage</option>
                                <option value="Soldier">Soldier</option>
                                <option value="Charlatan">Charlatan</option>
                                <option value="Entertainer">Entertainer</option>
                                <option value="Guild Artisan">Guild Artisan</option>
                                <option value="Hermit">Hermit</option>
                                <option value="Outlander">Outlander</option>
                                <option value="Sailor">Sailor</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Ability Scores -->
                <div class="mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="mb-0">Ability Scores</h3>
                        <div class="btn-group">
                            <button type="button" class="btn dice-btn" onclick="characterCreator.rollAllStats()">
                                <i class="fas fa-dice me-2"></i>Roll All (4d6, drop lowest)
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="characterCreator.usePointBuy()">
                                <i class="fas fa-calculator me-2"></i>Point Buy
                            </button>
                            <button type="button" class="btn btn-outline-info" onclick="characterCreator.useStandardArray()">
                                <i class="fas fa-list me-2"></i>Standard Array
                            </button>
                        </div>
                    </div>
                    <div class="row g-3" id="abilityScores">
                        ${this.abilities.map(ability => this.createAbilityScoreHTML(ability)).join('')}
                    </div>
                </div>

                <!-- Combat Stats -->
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label for="armorClass" class="form-label fw-bold">Armor Class</label>
                            <input type="number" class="form-control" id="armorClass" value="10">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label for="hitPoints" class="form-label fw-bold">Hit Points</label>
                            <input type="number" class="form-control" id="hitPoints" value="8">
                            <small class="text-muted">Base HP for level 1</small>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label for="speed" class="form-label fw-bold">Speed</label>
                            <input type="number" class="form-control" id="speed" value="30">
                            <small class="text-muted">feet per round</small>
                        </div>
                    </div>
                </div>

                <!-- Skills Section -->
                <div class="mb-4">
                    <h3 class="mb-3">Skills & Proficiencies</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Skill Proficiencies</label>
                            <div id="skillProficiencies" class="skills-container">
                                <!-- Skills will be populated here -->
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Saving Throw Proficiencies</label>
                            <div id="savingThrows" class="saves-container">
                                <!-- Saving throws will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Character Description -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="personalityTraits" class="form-label fw-bold">Personality Traits</label>
                            <textarea class="form-control" id="personalityTraits" rows="3" placeholder="Describe your character's personality..."></textarea>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="backstory" class="form-label fw-bold">Backstory</label>
                            <textarea class="form-control" id="backstory" rows="3" placeholder="Tell your character's story..."></textarea>
                        </div>
                    </div>
                </div>

                <!-- Equipment -->
                <div class="mb-4">
                    <h3 class="mb-3">Equipment</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="weapons" class="form-label fw-bold">Weapons</label>
                                <textarea class="form-control" id="weapons" rows="3" placeholder="List your weapons..."></textarea>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="equipment" class="form-label fw-bold">Other Equipment</label>
                                <textarea class="form-control" id="equipment" rows="3" placeholder="List your other equipment..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Spells Section (for spellcasters) -->
                <div class="mb-4" id="spellsSection" style="display: none;">
                    <h3 class="mb-3">Spells</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <label for="spellcastingAbility" class="form-label fw-bold">Spellcasting Ability</label>
                            <select class="form-select" id="spellcastingAbility">
                                <option value="">No Spellcasting</option>
                                <option value="intelligence">Intelligence</option>
                                <option value="wisdom">Wisdom</option>
                                <option value="charisma">Charisma</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label for="spellSaveDC" class="form-label fw-bold">Spell Save DC</label>
                            <input type="number" class="form-control" id="spellSaveDC" readonly>
                        </div>
                    </div>
                    <div class="mt-3">
                        <label for="knownSpells" class="form-label fw-bold">Known Spells</label>
                        <textarea class="form-control" id="knownSpells" rows="4" placeholder="List your known spells..."></textarea>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="text-center">
                    <button type="button" class="btn btn-primary me-3" onclick="characterCreator.generateCharacterSheet()">
                        <i class="fas fa-scroll me-2"></i>Generate Character Sheet
                    </button>
                    <button type="button" class="btn btn-outline-secondary me-3" onclick="characterCreator.clearForm()">
                        <i class="fas fa-eraser me-2"></i>Clear All
                    </button>
                    <button type="button" class="btn btn-outline-success me-3" onclick="characterCreator.saveCharacter()">
                        <i class="fas fa-save me-2"></i>Save Character
                    </button>
                    <button type="button" class="btn btn-outline-info" onclick="characterCreator.loadCharacter()">
                        <i class="fas fa-upload me-2"></i>Load Character
                    </button>
                </div>
            </form>

            <!-- Character Sheet Display -->
            <div id="characterSheet" class="mt-5" style="display: none;">
                <hr>
                <h3 class="text-center mb-4">Character Sheet</h3>
                <div id="sheetContent"></div>
            </div>
        `;
    }

    createAbilityScoreHTML(ability) {
        const capitalizedAbility = Utils.capitalize(ability);
        return `
            <div class="col-md-2">
                <div class="stat-box">
                    <label class="form-label fw-bold text-uppercase">${capitalizedAbility}</label>
                    <div class="d-flex align-items-center justify-content-center mb-2">
                        <input type="number" class="form-control text-center me-2" 
                               id="${ability}" value="10" min="3" max="20" 
                               oninput="characterCreator.updateModifier('${ability}')">
                        <button type="button" class="btn btn-sm dice-btn" 
                                onclick="characterCreator.rollStat('${ability}')">
                            <i class="fas fa-dice"></i>
                        </button>
                    </div>
                    <div class="fw-bold text-primary" id="${ability}Mod">+0</div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Level change event
        const levelInput = document.getElementById('characterLevel');
        if (levelInput) {
            levelInput.addEventListener('change', () => this.updateProficiencyBonus());
        }

        // Class change event
        const classSelect = document.getElementById('characterClass');
        if (classSelect) {
            classSelect.addEventListener('change', () => this.updateClassFeatures());
        }

        // Race change event
        const raceSelect = document.getElementById('characterRace');
        if (raceSelect) {
            raceSelect.addEventListener('change', () => this.updateRacialTraits());
        }

        // Auto-save on form changes
        const form = document.getElementById('characterForm');
        if (form) {
            form.addEventListener('input', Utils.debounce(() => this.autoSave(), 2000));
        }
    }

    initializeForm() {
        // Initialize ability modifiers
        this.abilities.forEach(ability => this.updateModifier(ability));
        
        // Initialize skills and saving throws
        this.initializeSkills();
        this.initializeSavingThrows();
        
        // Update proficiency bonus
        this.updateProficiencyBonus();
        
        // Load auto-saved character if exists
        this.loadAutoSave();
    }

    initializeSkills() {
        const skills = {
            'Acrobatics': 'dexterity',
            'Animal Handling': 'wisdom',
            'Arcana': 'intelligence',
            'Athletics': 'strength',
            'Deception': 'charisma',
            'History': 'intelligence',
            'Insight': 'wisdom',
            'Intimidation': 'charisma',
            'Investigation': 'intelligence',
            'Medicine': 'wisdom',
            'Nature': 'intelligence',
            'Perception': 'wisdom',
            'Performance': 'charisma',
            'Persuasion': 'charisma',
            'Religion': 'intelligence',
            'Sleight of Hand': 'dexterity',
            'Stealth': 'dexterity',
            'Survival': 'wisdom'
        };

        const container = document.getElementById('skillProficiencies');
        if (!container) return;

        container.innerHTML = Object.entries(skills).map(([skill, ability]) => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="skill${skill.replace(/\s/g, '')}" 
                       value="${skill}" data-ability="${ability}">
                <label class="form-check-label" for="skill${skill.replace(/\s/g, '')}">
                    ${skill} (${ability.substring(0, 3).toUpperCase()})
                </label>
            </div>
        `).join('');
    }

    initializeSavingThrows() {
        const container = document.getElementById('savingThrows');
        if (!container) return;

        container.innerHTML = this.abilities.map(ability => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="save${Utils.capitalize(ability)}" 
                       value="${ability}">
                <label class="form-check-label" for="save${Utils.capitalize(ability)}">
                    ${Utils.capitalize(ability)}
                </label>
            </div>
        `).join('');
    }

    updateModifier(ability) {
        const scoreInput = document.getElementById(ability);
        const modElement = document.getElementById(ability + 'Mod');
        
        if (!scoreInput || !modElement) return;
        
        const score = parseInt(scoreInput.value) || 10;
        const modifier = Utils.calculateModifier(score);
        modElement.textContent = Utils.formatModifier(modifier);
        
        // Update character object
        this.character.abilities[ability] = score;
        
        // Update related calculations
        this.updateSpellSaveDC();
        this.updateArmorClass();
    }

    rollStat(ability) {
        const rollResult = Utils.rollDice(6, 4);
        // Drop the lowest roll
        const sortedRolls = [...rollResult.rolls].sort((a, b) => b - a);
        const total = sortedRolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
        
        const scoreInput = document.getElementById(ability);
        if (scoreInput) {
            scoreInput.value = total;
            this.updateModifier(ability);
        }
        
        // Show roll details
        showSuccess(`Rolled for ${Utils.capitalize(ability)}: ${rollResult.rolls.join(', ')} → ${total} (dropped ${sortedRolls[3]})`);
    }

    rollAllStats() {
        this.abilities.forEach(ability => this.rollStat(ability));
        showSuccess('Rolled all ability scores!');
    }

    usePointBuy() {
        // Implement point buy system (27 point buy)
        const pointBuyScores = [15, 14, 13, 12, 10, 8];
        
        this.abilities.forEach((ability, index) => {
            const scoreInput = document.getElementById(ability);
            if (scoreInput) {
                scoreInput.value = pointBuyScores[index] || 10;
                this.updateModifier(ability);
            }
        });
        
        showSuccess('Applied Point Buy scores! Adjust as needed (27 points total).');
    }

    useStandardArray() {
        const standardArray = [15, 14, 13, 12, 10, 8];
        
        this.abilities.forEach((ability, index) => {
            const scoreInput = document.getElementById(ability);
            if (scoreInput) {
                scoreInput.value = standardArray[index];
                this.updateModifier(ability);
            }
        });
        
        showSuccess('Applied Standard Array scores!');
    }

    updateProficiencyBonus() {
        const levelInput = document.getElementById('characterLevel');
        const profBonusInput = document.getElementById('proficiencyBonus');
        
        if (!levelInput || !profBonusInput) return;
        
        const level = parseInt(levelInput.value) || 1;
        const profBonus = Utils.calculateProficiencyBonus(level);
        
        profBonusInput.value = profBonus;
        this.character.level = level;
        this.character.proficiencyBonus = profBonus;
        
        // Update hit points based on level
        this.updateHitPoints();
    }

    updateClassFeatures() {
        const classSelect = document.getElementById('characterClass');
        if (!classSelect) return;
        
        const selectedClass = classSelect.value;
        this.character.class = selectedClass;
        
        // Show/hide spells section for spellcasters
        const spellsSection = document.getElementById('spellsSection');
        const spellcasters = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard', 'Paladin', 'Ranger'];
        
        if (spellsSection) {
            spellsSection.style.display = spellcasters.includes(selectedClass) ? 'block' : 'none';
        }
        
        // Set default spellcasting ability
        const spellcastingAbility = document.getElementById('spellcastingAbility');
        if (spellcastingAbility && spellcasters.includes(selectedClass)) {
            const spellcastingAbilities = {
                'Bard': 'charisma',
                'Cleric': 'wisdom',
                'Druid': 'wisdom',
                'Sorcerer': 'charisma',
                'Warlock': 'charisma',
                'Wizard': 'intelligence',
                'Paladin': 'charisma',
                'Ranger': 'wisdom'
            };
            
            spellcastingAbility.value = spellcastingAbilities[selectedClass] || '';
            this.updateSpellSaveDC();
        }
        
        // Update hit points based on class hit die
        this.updateHitPoints();
    }

    updateRacialTraits() {
        const raceSelect = document.getElementById('characterRace');
        if (!raceSelect) return;
        
        const selectedRace = raceSelect.value;
        this.character.race = selectedRace;
        
        // Apply racial bonuses (simplified)
        const racialBonuses = {
            'Human': { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
            'Elf': { dexterity: 2 },
            'Dwarf': { constitution: 2 },
            'Halfling': { dexterity: 2 },
            'Dragonborn': { strength: 2, charisma: 1 },
            'Gnome': { intelligence: 2 },
            'Half-Elf': { charisma: 2 },
            'Half-Orc': { strength: 2, constitution: 1 },
            'Tiefling': { intelligence: 1, charisma: 2 }
        };
        
        showSuccess(`Selected ${selectedRace}. Remember to apply racial bonuses manually!`);
    }

    updateSpellSaveDC() {
        const spellcastingAbilitySelect = document.getElementById('spellcastingAbility');
        const spellSaveDCInput = document.getElementById('spellSaveDC');
        const profBonusInput = document.getElementById('proficiencyBonus');
        
        if (!spellcastingAbilitySelect || !spellSaveDCInput || !profBonusInput) return;
        
        const ability = spellcastingAbilitySelect.value;
        if (!ability) {
            spellSaveDCInput.value = '';
            return;
        }
        
        const abilityScore = parseInt(document.getElementById(ability)?.value) || 10;
        const abilityMod = Utils.calculateModifier(abilityScore);
        const profBonus = parseInt(profBonusInput.value) || 2;
        
        const spellSaveDC = 8 + abilityMod + profBonus;
        spellSaveDCInput.value = spellSaveDC;
    }

    updateArmorClass() {
        // Basic AC calculation (10 + Dex mod)
        const dexScore = parseInt(document.getElementById('dexterity')?.value) || 10;
        const dexMod = Utils.calculateModifier(dexScore);
        const acInput = document.getElementById('armorClass');
        
        if (acInput && acInput.value == 10) { // Only update if still at default
            acInput.value = 10 + dexMod;
        }
    }

    updateHitPoints() {
        const classSelect = document.getElementById('characterClass');
        const levelInput = document.getElementById('characterLevel');
        const constitutionInput = document.getElementById('constitution');
        const hitPointsInput = document.getElementById('hitPoints');
        
        if (!classSelect || !levelInput || !constitutionInput || !hitPointsInput) return;
        
        const selectedClass = classSelect.value;
        const level = parseInt(levelInput.value) || 1;
        const constitution = parseInt(constitutionInput.value) || 10;
        const conMod = Utils.calculateModifier(constitution);
        
        // Hit dice by class
        const hitDice = {
            'Barbarian': 12, 'Fighter': 10, 'Paladin': 10, 'Ranger': 10,
            'Bard': 8, 'Cleric': 8, 'Druid': 8, 'Monk': 8, 'Rogue': 8, 'Warlock': 8,
            'Sorcerer': 6, 'Wizard': 6
        };
        
        const hitDie = hitDice[selectedClass] || 8;
        const baseHP = hitDie + conMod;
        const totalHP = baseHP + ((level - 1) * (Math.floor(hitDie / 2) + 1 + conMod));
        
        hitPointsInput.value = Math.max(1, totalHP);
    }

    gatherCharacterData() {
        const formData = new FormData(document.getElementById('characterForm'));
        const character = {
            id: this.character.id || Utils.generateId(),
            name: document.getElementById('characterName')?.value || 'Unnamed Character',
            level: parseInt(document.getElementById('characterLevel')?.value) || 1,
            race: document.getElementById('characterRace')?.value || '',
            class: document.getElementById('characterClass')?.value || '',
            background: document.getElementById('characterBackground')?.value || '',
            abilities: {},
            proficiencyBonus: parseInt(document.getElementById('proficiencyBonus')?.value) || 2,
            armorClass: parseInt(document.getElementById('armorClass')?.value) || 10,
            hitPoints: parseInt(document.getElementById('hitPoints')?.value) || 8,
            speed: parseInt(document.getElementById('speed')?.value) || 30,
            personalityTraits: document.getElementById('personalityTraits')?.value || '',
            backstory: document.getElementById('backstory')?.value || '',
            weapons: document.getElementById('weapons')?.value || '',
            equipment: document.getElementById('equipment')?.value || '',
            spellcastingAbility: document.getElementById('spellcastingAbility')?.value || '',
            spellSaveDC: parseInt(document.getElementById('spellSaveDC')?.value) || null,
            knownSpells: document.getElementById('knownSpells')?.value || '',
            skills: [],
            savingThrows: [],
            createdAt: this.character.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Gather ability scores
        this.abilities.forEach(ability => {
            character.abilities[ability] = parseInt(document.getElementById(ability)?.value) || 10;
        });
        
        // Gather skill proficiencies
        const skillChecks = document.querySelectorAll('#skillProficiencies input[type="checkbox"]:checked');
        character.skills = Array.from(skillChecks).map(cb => cb.value);
        
        // Gather saving throw proficiencies
        const saveChecks = document.querySelectorAll('#savingThrows input[type="checkbox"]:checked');
        character.savingThrows = Array.from(saveChecks).map(cb => cb.value);
        
        return character;
    }

    async saveCharacter() {
        try {
            window.app.authManager.requireAuth();
            
            const characterData = this.gatherCharacterData();
            
            // Validate character data
            const validation = this.validateCharacterData(characterData);
            if (!validation.isValid) {
                showError('Please fix the following errors:\n' + validation.errors.join('\n'));
                return;
            }
            
            const response = await apiCall('characters.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'save',
                    character: characterData
                })
            });
            
            if (response.success) {
                this.character = characterData;
                this.character.id = response.id;
                showSuccess('Character saved successfully!');
                
                // Track save event
                Utils.eventEmitter.emit('characterSaved', this.character);
            } else {
                throw new Error(response.error || 'Failed to save character');
            }
            
        } catch (error) {
            console.error('Save character error:', error);
            showError(error.message || 'Failed to save character');
        }
    }

    validateCharacterData(character) {
        const rules = {
            name: { required: true, minLength: 1, maxLength: 50 },
            level: { required: true, type: 'number', min: 1, max: 20 },
            race: { required: true },
            class: { required: true }
        };
        
        return Utils.validateData(character, rules);
    }

    async loadCharacter() {
        try {
            window.app.authManager.requireAuth();
            
            // For now, show a simple prompt for character ID
            const characterId = prompt('Enter character ID to load:');
            if (!characterId) return;
            
            const response = await apiCall(`characters.php?action=load&id=${characterId}`);
            
            if (response.success && response.character) {
                this.loadCharacterData(response.character);
                showSuccess('Character loaded successfully!');
            } else {
                throw new Error(response.error || 'Character not found');
            }
            
        } catch (error) {
            console.error('Load character error:', error);
            showError(error.message || 'Failed to load character');
        }
    }

    loadCharacterData(character) {
        this.character = character;
        
        // Populate form fields
        document.getElementById('characterName').value = character.name || '';
        document.getElementById('characterLevel').value = character.level || 1;
        document.getElementById('characterRace').value = character.race || '';
        document.getElementById('characterClass').value = character.class || '';
        document.getElementById('characterBackground').value = character.background || '';
        document.getElementById('armorClass').value = character.armorClass || 10;
        document.getElementById('hitPoints').value = character.hitPoints || 8;
        document.getElementById('speed').value = character.speed || 30;
        document.getElementById('personalityTraits').value = character.personalityTraits || '';
        document.getElementById('backstory').value = character.backstory || '';
        document.getElementById('weapons').value = character.weapons || '';
        document.getElementById('equipment').value = character.equipment || '';
        document.getElementById('knownSpells').value = character.knownSpells || '';
        
        // Populate ability scores
        if (character.abilities) {
            this.abilities.forEach(ability => {
                const input = document.getElementById(ability);
                if (input) {
                    input.value = character.abilities[ability] || 10;
                    this.updateModifier(ability);
                }
            });
        }
        
        // Update calculated fields
        this.updateProficiencyBonus();
        this.updateClassFeatures();
        this.updateRacialTraits();
    }

    generateCharacterSheet() {
        const character = this.gatherCharacterData();
        
        const sheetHTML = `
            <div class="character-summary p-4 bg-light rounded">
                <div class="row">
                    <div class="col-md-8">
                        <h2 class="text-primary">${character.name}</h2>
                        <p class="lead">Level ${character.level} ${character.race} ${character.class}</p>
                        <p><strong>Background:</strong> ${character.background}</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <p><strong>AC:</strong> ${character.armorClass}</p>
                        <p><strong>HP:</strong> ${character.hitPoints}</p>
                        <p><strong>Speed:</strong> ${character.speed} ft</p>
                        <p><strong>Prof. Bonus:</strong> +${character.proficiencyBonus}</p>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-12">
                        <h5>Ability Scores</h5>
                        <div class="row text-center">
                            ${Object.entries(character.abilities).map(([ability, score]) => {
                                const modifier = Utils.calculateModifier(score);
                                const modStr = Utils.formatModifier(modifier);
                                return `
                                    <div class="col-2">
                                        <div class="border rounded p-2">
                                            <strong>${ability.toUpperCase()}</strong><br>
                                            ${score} (${modStr})
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
                
                ${character.skills.length > 0 ? `
                    <div class="mt-3">
                        <h5>Skill Proficiencies</h5>
                        <p>${character.skills.join(', ')}</p>
                    </div>
                ` : ''}
                
                ${character.savingThrows.length > 0 ? `
                    <div class="mt-3">
                        <h5>Saving Throw Proficiencies</h5>
                        <p>${character.savingThrows.map(save => Utils.capitalize(save)).join(', ')}</p>
                    </div>
                ` : ''}
                
                ${character.spellcastingAbility ? `
                    <div class="mt-3">
                        <h5>Spellcasting</h5>
                        <p><strong>Ability:</strong> ${Utils.capitalize(character.spellcastingAbility)}</p>
                        <p><strong>Spell Save DC:</strong> ${character.spellSaveDC}</p>
                        ${character.knownSpells ? `<p><strong>Known Spells:</strong> ${character.knownSpells}</p>` : ''}
                    </div>
                ` : ''}
                
                ${character.personalityTraits ? `
                    <div class="mt-3">
                        <h5>Personality Traits</h5>
                        <p>${character.personalityTraits}</p>
                    </div>
                ` : ''}
                
                ${character.backstory ? `
                    <div class="mt-3">
                        <h5>Backstory</h5>
                        <p>${character.backstory}</p>
                    </div>
                ` : ''}
                
                ${character.weapons ? `
                    <div class="mt-3">
                        <h5>Weapons</h5>
                        <p>${character.weapons}</p>
                    </div>
                ` : ''}
                
                ${character.equipment ? `
                    <div class="mt-3">
                        <h5>Equipment</h5>
                        <p>${character.equipment}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('sheetContent').innerHTML = sheetHTML;
        document.getElementById('characterSheet').style.display = 'block';
        document.getElementById('characterSheet').scrollIntoView({ behavior: 'smooth' });
        
        // Track sheet generation
        Utils.eventEmitter.emit('characterSheetGenerated', character);
    }

    clearForm() {
        if (confirm('Are you sure you want to clear all character data?')) {
            document.getElementById('characterForm').reset();
            
            // Reset ability scores to 10
            this.abilities.forEach(ability => {
                const input = document.getElementById(ability);
                if (input) {
                    input.value = 10;
                    this.updateModifier(ability);
                }
            });
            
            // Reset level and update related fields
            document.getElementById('characterLevel').value = 1;
            this.updateProficiencyBonus();
            
            // Hide character sheet
            document.getElementById('characterSheet').style.display = 'none';
            
            // Reset character object
            this.character = this.createEmptyCharacter();
            
            showSuccess('Character form cleared!');
        }
    }

    autoSave() {
        try {
            const character = this.gatherCharacterData();
            Utils.storage.set('dnd-character-autosave', character);
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }

    loadAutoSave() {
        try {
            const saved = Utils.storage.get('dnd-character-autosave');
            if (saved && saved.name) {
                const shouldLoad = confirm('Found auto-saved character data. Would you like to load it?');
                if (shouldLoad) {
                    this.loadCharacterData(saved);
                    showSuccess('Auto-saved character loaded!');
                }
            }
        } catch (error) {
            console.warn('Failed to load auto-save:', error);
        }
    }

    createEmptyCharacter() {
        return {
            id: null,
            name: '',
            level: 1,
            race: '',
            class: '',
            background: '',
            abilities: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10
            },
            proficiencyBonus: 2,
            armorClass: 10,
            hitPoints: 8,
            speed: 30,
            personalityTraits: '',
            backstory: '',
            weapons: '',
            equipment: '',
            spellcastingAbility: '',
            spellSaveDC: null,
            knownSpells: '',
            skills: [],
            savingThrows: [],
            createdAt: null,
            updatedAt: null
        };
    }

    cleanup() {
        // Clean up event listeners and timers
        console.log('Character Creator cleaned up');
    }
}

// Make CharacterCreator globally available
window.CharacterCreator = CharacterCreator;
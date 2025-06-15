/**
 * D&D Creator Hub - Baldur's Gate 3 Tracker Module
 * Handles BG3-specific character tracking, companion management, romance progression, and campaign elements
 */

class BG3Tracker {
    constructor() {
        this.playthrough = this.createEmptyPlaythrough();
        this.companions = this.initializeCompanions();
        this.isInitialized = false;
        this.longRests = 0;
        this.shortRests = 0;
        this.bg3Equipment = [];
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadTemplate();
            this.bindEvents();
            this.initializeForm();
            this.isInitialized = true;
            console.log('BG3 Tracker initialized');
        } catch (error) {
            console.error('Failed to initialize BG3 Tracker:', error);
            throw error;
        }
    }

    async loadTemplate() {
        const container = document.getElementById('bg3-pane');
        if (!container) throw new Error('BG3 pane container not found');

        container.innerHTML = `
            <div class="row">
                <!-- BG3 Character Builder -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header text-white" style="background: linear-gradient(45deg, #8B4513, #DAA520);">
                            <h4 class="mb-0"><i class="fas fa-user-plus me-2"></i>BG3 Character Builder</h4>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label for="bg3Race" class="form-label fw-bold">Race/Subrace</label>
                                    <select class="form-select" id="bg3Race" onchange="bg3Tracker.updateRacialTraits()">
                                        <option value="">Choose Race</option>
                                        <optgroup label="Human">
                                            <option value="Human">Human</option>
                                            <option value="Human (Variant)">Human (Variant)</option>
                                        </optgroup>
                                        <optgroup label="Elf">
                                            <option value="Elf (High)">High Elf</option>
                                            <option value="Elf (Wood)">Wood Elf</option>
                                            <option value="Elf (Drow)">Drow</option>
                                        </optgroup>
                                        <optgroup label="Dwarf">
                                            <option value="Dwarf (Gold)">Gold Dwarf</option>
                                            <option value="Dwarf (Shield)">Shield Dwarf</option>
                                            <option value="Dwarf (Duergar)">Duergar</option>
                                        </optgroup>
                                        <optgroup label="Halfling">
                                            <option value="Halfling (Lightfoot)">Lightfoot Halfling</option>
                                            <option value="Halfling (Strongheart)">Strongheart Halfling</option>
                                        </optgroup>
                                        <optgroup label="Tiefling">
                                            <option value="Tiefling (Asmodeus)">Asmodeus Tiefling</option>
                                            <option value="Tiefling (Mephistopheles)">Mephistopheles Tiefling</option>
                                            <option value="Tiefling (Zariel)">Zariel Tiefling</option>
                                        </optgroup>
                                        <optgroup label="Other">
                                            <option value="Dragonborn">Dragonborn</option>
                                            <option value="Gnome (Forest)">Forest Gnome</option>
                                            <option value="Gnome (Rock)">Rock Gnome</option>
                                            <option value="Half-Elf">Half-Elf</option>
                                            <option value="Half-Orc">Half-Orc</option>
                                            <option value="Githyanki">Githyanki</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="bg3Class" class="form-label fw-bold">Class</label>
                                    <select class="form-select" id="bg3Class" onchange="bg3Tracker.updateBG3Subclasses()">
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
                                <div class="col-6">
                                    <label for="bg3Subclass" class="form-label fw-bold">Subclass</label>
                                    <select class="form-select" id="bg3Subclass">
                                        <option value="">Choose Class First</option>
                                    </select>
                                </div>
                            </div>

                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="bg3Origin" class="form-label fw-bold">Origin Character</label>
                                    <select class="form-select" id="bg3Origin" onchange="bg3Tracker.updateOriginInfo()">
                                        <option value="Custom">Custom Character</option>
                                        <option value="Astarion">Astarion</option>
                                        <option value="Gale">Gale</option>
                                        <option value="Lae'zel">Lae'zel</option>
                                        <option value="Shadowheart">Shadowheart</option>
                                        <option value="Wyll">Wyll</option>
                                        <option value="Karlach">Karlach</option>
                                        <option value="Halsin">Halsin</option>
                                        <option value="Minthara">Minthara</option>
                                        <option value="Minsc">Minsc</option>
                                        <option value="Jaheira">Jaheira</option>
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label for="bg3Difficulty" class="form-label fw-bold">Difficulty</label>
                                    <select class="form-select" id="bg3Difficulty">
                                        <option value="Explorer">Explorer (Easy)</option>
                                        <option value="Balanced" selected>Balanced (Normal)</option>
                                        <option value="Tactician">Tactician (Hard)</option>
                                        <option value="Honour">Honour Mode</option>
                                    </select>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold">BG3 Game Settings</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="karmicDice" checked>
                                    <label class="form-check-label" for="karmicDice">
                                        Karmic Dice (Balanced luck)
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="hideRolls">
                                    <label class="form-check-label" for="hideRolls">
                                        Hide Failed Persuasion Rolls
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="exportCharacterOnSave">
                                    <label class="form-check-label" for="exportCharacterOnSave">
                                        Export Character on Save
                                    </label>
                                </div>
                            </div>

                            <div id="originInfo" class="alert alert-info" style="display: none;">
                                <strong>Origin Info:</strong> <span id="originDescription"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Companion Tracker -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-success text-white">
                            <h4 class="mb-0"><i class="fas fa-users me-2"></i>Companion Tracker</h4>
                        </div>
                        <div class="card-body">
                            <div id="companionList">
                                <!-- Will be populated by JavaScript -->
                            </div>
                            <div class="mt-3">
                                <button class="btn btn-success w-100 mb-2" onclick="bg3Tracker.updateAllCompanions()">
                                    <i class="fas fa-sync me-2"></i>Update All Approval
                                </button>
                                <button class="btn btn-outline-success w-100" onclick="bg3Tracker.addCustomCompanion()">
                                    <i class="fas fa-plus me-2"></i>Add Custom Companion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Story Progress Tracker -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-info text-white">
                            <h4 class="mb-0"><i class="fas fa-book-open me-2"></i>Story Progress</h4>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label for="currentAct" class="form-label fw-bold">Current Act</label>
                                <select class="form-select" id="currentAct" onchange="bg3Tracker.updateActProgress()">
                                    <option value="1">Act 1 - Nautiloid Crash</option>
                                    <option value="2">Act 2 - Shadow-Cursed Lands</option>
                                    <option value="3">Act 3 - Baldur's Gate</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold">Major Story Choices</label>
                                <div id="majorChoices">
                                    <!-- Will be populated by JavaScript -->
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="questNotes" class="form-label fw-bold">Quest Notes</label>
                                <textarea class="form-control" id="questNotes" rows="4" 
                                          placeholder="Track important quest decisions, outcomes, and ongoing storylines..."></textarea>
                            </div>

                            <div class="mb-3">
                                <label for="currentLocation" class="form-label fw-bold">Current Location</label>
                                <input type="text" class="form-control" id="currentLocation" 
                                       placeholder="e.g., Emerald Grove, Goblin Camp, Last Light Inn">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Romance Tracker -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header text-white" style="background: linear-gradient(45deg, #e91e63, #9c27b0);">
                            <h4 class="mb-0"><i class="fas fa-heart me-2"></i>Romance Tracker</h4>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label for="romanceTarget" class="form-label fw-bold">Romance Interest</label>
                                <select class="form-select" id="romanceTarget" onchange="bg3Tracker.updateRomanceInfo()">
                                    <option value="">No Active Romance</option>
                                    <option value="Astarion">Astarion</option>
                                    <option value="Gale">Gale</option>
                                    <option value="Lae'zel">Lae'zel</option>
                                    <option value="Shadowheart">Shadowheart</option>
                                    <option value="Wyll">Wyll</option>
                                    <option value="Karlach">Karlach</option>
                                    <option value="Halsin">Halsin</option>
                                    <option value="Minthara">Minthara</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold">Romance Progress</label>
                                <div class="progress mb-2">
                                    <div class="progress-bar bg-danger" id="romanceProgress" role="progressbar" style="width: 0%"></div>
                                </div>
                                <input type="range" class="form-range" id="romanceSlider" min="0" max="100" value="0" 
                                       oninput="bg3Tracker.updateRomanceProgress()">
                                <div class="d-flex justify-content-between">
                                    <small>Stranger</small>
                                    <small>Interested</small>
                                    <small>Committed</small>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="romanceNotes" class="form-label fw-bold">Romance Notes</label>
                                <textarea class="form-control" id="romanceNotes" rows="3" 
                                          placeholder="Track romantic scenes, dialogue choices, and relationship milestones..."></textarea>
                            </div>

                            <div id="romanceInfo" class="alert alert-secondary" style="display: none;">
                                <strong>Romance Tips:</strong> <span id="romanceTips"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Camp Management -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-warning text-dark">
                            <h4 class="mb-0"><i class="fas fa-campground me-2"></i>Camp Management</h4>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-6">
                                    <div class="text-center p-3 bg-light rounded">
                                        <i class="fas fa-bed fa-2x text-primary mb-2"></i>
                                        <h6>Long Rests</h6>
                                        <div class="btn-group" role="group">
                                            <button class="btn btn-sm btn-outline-primary" onclick="bg3Tracker.adjustCounter('longRests', -1)">-</button>
                                            <span class="btn btn-sm btn-light" id="longRests">0</span>
                                            <button class="btn btn-sm btn-outline-primary" onclick="bg3Tracker.adjustCounter('longRests', 1)">+</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="text-center p-3 bg-light rounded">
                                        <i class="fas fa-clock fa-2x text-warning mb-2"></i>
                                        <h6>Short Rests</h6>
                                        <div class="btn-group" role="group">
                                            <button class="btn btn-sm btn-outline-warning" onclick="bg3Tracker.adjustCounter('shortRests', -1)">-</button>
                                            <span class="btn btn-sm btn-light" id="shortRests">0</span>
                                            <button class="btn btn-sm btn-outline-warning" onclick="bg3Tracker.adjustCounter('shortRests', 1)">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold">Camp Events Completed</label>
                                <div id="campEvents">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="eventVolo">
                                        <label class="form-check-label" for="eventVolo">Volo's Eye Surgery</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="eventParty">
                                        <label class="form-check-label" for="eventParty">Tiefling/Goblin Party</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="eventAstarion">
                                        <label class="form-check-label" for="eventAstarion">Astarion's Confession</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="eventGale">
                                        <label class="form-check-label" for="eventGale">Gale's Magic Lesson</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="eventKarlach">
                                        <label class="form-check-label" for="eventKarlach">Karlach's Engine Touch</label>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <button class="btn btn-warning w-100" onclick="bg3Tracker.triggerLongRest()">
                                    <i class="fas fa-moon me-2"></i>Take Long Rest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- BG3 Equipment Tracker -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-secondary text-white">
                            <h4 class="mb-0"><i class="fas fa-shield-alt me-2"></i>BG3 Equipment</h4>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Notable Equipment</label>
                                <div class="row g-2">
                                    <div class="col-12">
                                        <div class="input-group">
                                            <input type="text" class="form-control" id="newEquipment" placeholder="Equipment name">
                                            <button class="btn btn-secondary" onclick="bg3Tracker.addBG3Equipment()">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold">Quick Add BG3 Items</label>
                                <div class="row g-1">
                                    <div class="col-6">
                                        <button class="btn btn-outline-secondary btn-sm w-100" onclick="bg3Tracker.addSpecificItem('Githyanki Silver Sword')">Silver Sword</button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-outline-secondary btn-sm w-100" onclick="bg3Tracker.addSpecificItem('Everburn Blade')">Everburn Blade</button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-outline-secondary btn-sm w-100" onclick="bg3Tracker.addSpecificItem('Sussur Dagger')">Sussur Dagger</button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-outline-secondary btn-sm w-100" onclick="bg3Tracker.addSpecificItem('Necklace of Fireballs')">Fireball Necklace</button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-outline-secondary btn-sm w-100" onclick="bg3Tracker.addSpecificItem('Shadowheart\'s Spear')">Shadowheart's Spear</button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-outline-secondary btn-sm w-100" onclick="bg3Tracker.addSpecificItem('The Blood of Lathander')">Blood of Lathander</button>
                                    </div>
                                </div>
                            </div>

                            <div id="bg3EquipmentList" class="equipment-list">
                                <!-- Equipment will be added here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- BG3 Summary -->
            <div class="text-center mb-4">
                <button type="button" class="btn btn-primary me-3" onclick="bg3Tracker.generateBG3Summary()">
                    <i class="fas fa-scroll me-2"></i>Generate BG3 Playthrough Summary
                </button>
                <button type="button" class="btn btn-outline-secondary me-3" onclick="bg3Tracker.clearBG3Data()">
                    <i class="fas fa-eraser me-2"></i>Clear BG3 Data
                </button>
                <button type="button" class="btn btn-outline-success" onclick="bg3Tracker.saveBG3Data()">
                    <i class="fas fa-save me-2"></i>Save Playthrough
                </button>
            </div>

            <!-- BG3 Summary Display -->
            <div id="bg3Summary" class="mt-5" style="display: none;">
                <hr>
                <h3 class="text-center mb-4">BG3 Playthrough Summary</h3>
                <div id="bg3Content"></div>
            </div>
        `;
    }

    bindEvents() {
        // Auto-save on form changes
        const form = document.getElementById('bg3-pane');
        if (form) {
            form.addEventListener('input', Utils.debounce(() => this.autoSave(), 2000));
        }

        // Listen for companion approval changes
        Utils.eventEmitter.on('companionApprovalChanged', (data) => {
            this.saveCompanionData();
        });
    }

    initializeForm() {
        this.initializeCompanions();
        this.updateEquipmentList();
        this.updateActProgress();
        this.updateRomanceProgress();
        this.loadAutoSave();
    }

    initializeCompanions() {
        const companions = [
            { name: 'Shadowheart', approval: 0, max: 100, class: 'Cleric', description: 'Mysterious cleric with hidden memories' },
            { name: 'Astarion', approval: 0, max: 100, class: 'Rogue', description: 'Vampire spawn with a dark past' },
            { name: 'Gale', approval: 0, max: 100, class: 'Wizard', description: 'Ambitious wizard with a magical condition' },
            { name: 'Lae\'zel', approval: 0, max: 100, class: 'Fighter', description: 'Fierce githyanki warrior' },
            { name: 'Wyll', approval: 0, max: 100, class: 'Warlock', description: 'The Blade of Frontiers, monster hunter' },
            { name: 'Karlach', approval: 0, max: 100, class: 'Barbarian', description: 'Tiefling barbarian with an infernal engine heart' },
            { name: 'Halsin', approval: 0, max: 100, class: 'Druid', description: 'Archdruid and protector of nature' },
            { name: 'Minthara', approval: 0, max: 100, class: 'Paladin', description: 'Drow paladin with a commanding presence' }
        ];

        this.companions = companions;
        this.updateCompanionDisplay();
    }

    updateCompanionDisplay() {
        const companionList = document.getElementById('companionList');
        if (!companionList) return;

        companionList.innerHTML = '';
        
        this.companions.forEach((companion, index) => {
            const approval = companion.approval;
            const approvalPercent = (approval / companion.max) * 100;
            
            let approvalClass = 'approval-low';
            let approvalText = 'Hostile';
            
            if (approvalPercent >= 80) {
                approvalClass = 'approval-high';
                approvalText = 'Devoted';
            } else if (approvalPercent >= 60) {
                approvalClass = 'approval-high';
                approvalText = 'High';
            } else if (approvalPercent >= 40) {
                approvalClass = 'approval-medium';
                approvalText = 'Medium';
            } else if (approvalPercent >= 20) {
                approvalClass = 'approval-low';
                approvalText = 'Low';
            }
            
            const companionHTML = `
                <div class="companion-card" data-companion="${index}">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <strong>${companion.name}</strong>
                            <small class="text-muted d-block">${companion.class} • ${companion.description}</small>
                        </div>
                        <span class="badge bg-secondary">${approval}/${companion.max}</span>
                    </div>
                    <div class="approval-bar mb-2">
                        <div class="approval-fill ${approvalClass}" style="width: ${approvalPercent}%"></div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${approvalText}</small>
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-danger" onclick="bg3Tracker.adjustApproval(${index}, -10)">-10</button>
                            <button class="btn btn-outline-warning" onclick="bg3Tracker.adjustApproval(${index}, -5)">-5</button>
                            <button class="btn btn-outline-success" onclick="bg3Tracker.adjustApproval(${index}, 5)">+5</button>
                            <button class="btn btn-outline-success" onclick="bg3Tracker.adjustApproval(${index}, 10)">+10</button>
                        </div>
                    </div>
                </div>
            `;
            
            companionList.insertAdjacentHTML('beforeend', companionHTML);
        });
    }

    adjustApproval(companionIndex, change) {
        if (companionIndex < 0 || companionIndex >= this.companions.length) return;
        
        this.companions[companionIndex].approval = Math.max(0, Math.min(100, this.companions[companionIndex].approval + change));
        this.updateCompanionDisplay();
        
        // Emit event for tracking
        Utils.eventEmitter.emit('companionApprovalChanged', {
            companion: this.companions[companionIndex].name,
            newApproval: this.companions[companionIndex].approval,
            change: change
        });
        
        // Show feedback
        const companion = this.companions[companionIndex];
        showSuccess(`${companion.name} approval: ${companion.approval} (${change >= 0 ? '+' : ''}${change})`);
    }

    updateAllCompanions() {
        const change = prompt('Adjust all companion approval by how much? (e.g., +5, -3)');
        if (change !== null) {
            const numChange = parseInt(change);
            if (!isNaN(numChange)) {
                this.companions.forEach((companion, index) => {
                    this.adjustApproval(index, numChange);
                });
                showSuccess(`All companion approval adjusted by ${numChange >= 0 ? '+' : ''}${numChange}`);
            }
        }
    }

    addCustomCompanion() {
        const name = prompt('Enter companion name:');
        if (!name) return;

        const newCompanion = {
            name: name,
            approval: 0,
            max: 100,
            class: 'Custom',
            description: 'Custom companion'
        };

        this.companions.push(newCompanion);
        this.updateCompanionDisplay();
        showSuccess(`Added custom companion: ${name}`);
    }

    updateBG3Subclasses() {
        const bg3Subclasses = {
            'Barbarian': ['Wild Magic', 'Wildheart', 'Berserker'],
            'Bard': ['College of Lore', 'College of Valour', 'College of Swords'],
            'Cleric': ['Life Domain', 'Light Domain', 'Trickery Domain', 'Knowledge Domain', 'Nature Domain', 'Tempest Domain', 'War Domain'],
            'Druid': ['Circle of the Land', 'Circle of the Moon'],
            'Fighter': ['Battle Master', 'Eldritch Knight', 'Champion'],
            'Monk': ['Way of the Open Hand', 'Way of Shadow', 'Way of the Four Elements'],
            'Paladin': ['Oath of Devotion', 'Oath of the Ancients', 'Oath of Vengeance', 'Oathbreaker'],
            'Ranger': ['Beast Master', 'Hunter', 'Gloom Stalker'],
            'Rogue': ['Thief', 'Arcane Trickster', 'Assassin'],
            'Sorcerer': ['Wild Magic', 'Draconic Bloodline', 'Storm Sorcery'],
            'Warlock': ['The Fiend', 'The Great Old One', 'The Archfey'],
            'Wizard': ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']
        };

        const classSelect = document.getElementById('bg3Class');
        const subclassSelect = document.getElementById('bg3Subclass');
        const selectedClass = classSelect.value;
        
        subclassSelect.innerHTML = '<option value="">Choose Subclass</option>';
        
        if (selectedClass && bg3Subclasses[selectedClass]) {
            bg3Subclasses[selectedClass].forEach(subclass => {
                const option = document.createElement('option');
                option.value = subclass;
                option.textContent = subclass;
                subclassSelect.appendChild(option);
            });
        }
    }

    updateOriginInfo() {
        const originSelect = document.getElementById('bg3Origin');
        const originInfo = document.getElementById('originInfo');
        const originDescription = document.getElementById('originDescription');
        const selectedOrigin = originSelect.value;

        const originDescriptions = {
            'Astarion': 'Vampire spawn rogue with a charming exterior hiding centuries of trauma.',
            'Gale': 'Human wizard consumed by ambition and a dangerous magical condition.',
            'Lae\'zel': 'Githyanki fighter, proud warrior seeking to prove herself to her queen.',
            'Shadowheart': 'Half-elf cleric with mysterious memories and devotion to Shar.',
            'Wyll': 'Human warlock known as the Blade of Frontiers, monster hunter with a dark pact.',
            'Karlach': 'Tiefling barbarian with an infernal engine for a heart, seeking freedom.',
            'Halsin': 'Elf druid and former archdruid, protector of nature and balance.',
            'Minthara': 'Drow paladin, former True Soul seeking redemption or power.',
            'Minsc': 'Human ranger with his hamster companion Boo, legendary hero of Baldur\'s Gate.',
            'Jaheira': 'Half-elf druid and Harper, veteran of many conflicts.'
        };

        if (selectedOrigin && selectedOrigin !== 'Custom') {
            originDescription.textContent = originDescriptions[selectedOrigin] || 'No description available.';
            originInfo.style.display = 'block';
        } else {
            originInfo.style.display = 'none';
        }
    }

    updateRacialTraits() {
        const raceSelect = document.getElementById('bg3Race');
        const selectedRace = raceSelect.value;
        
        if (selectedRace) {
            showSuccess(`Selected ${selectedRace}. Remember BG3 racial traits may differ from tabletop D&D!`);
        }
    }

    updateActProgress() {
        const act = document.getElementById('currentAct').value;
        const choicesDiv = document.getElementById('majorChoices');
        
        const actChoices = {
            '1': [
                'Grove: Save or side with goblins',
                'Kagha: Expose the Shadow Druids',
                'Halsin: Rescue from the goblin camp',
                'Auntie Ethel: Deal with the hag',
                'Zhentarim: Discover the hideout',
                'Creche: Visit the githyanki creche'
            ],
            '2': [
                'Nightsong: Free or give to Balthazar',
                'Ketheric Thorm: Defeat the general',
                'Shadowfell: Navigate the trials',
                'Isobel: Protect at Last Light Inn',
                'Gauntlet of Shar: Complete the trials',
                'Mind Flayer Colony: Investigate the truth'
            ],
            '3': [
                'Elder Brain: Final confrontation',
                'Gortash: Alliance or opposition',
                'Orin: Deal with the shapechanger',
                'Raphael: The House of Hope',
                'Bhaal: Confront the murder god',
                'Orpheus: Free the githyanki prince'
            ]
        };
        
        choicesDiv.innerHTML = '';
        if (actChoices[act]) {
            actChoices[act].forEach((choice, index) => {
                const choiceHTML = `
                    <div class="choice-item">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="choice${act}_${index}">
                            <label class="form-check-label" for="choice${act}_${index}">
                                ${choice}
                            </label>
                        </div>
                    </div>
                `;
                choicesDiv.insertAdjacentHTML('beforeend', choiceHTML);
            });
        }
    }

    updateRomanceProgress() {
        const slider = document.getElementById('romanceSlider');
        const progressBar = document.getElementById('romanceProgress');
        const value = slider.value;
        
        progressBar.style.width = value + '%';
        
        if (value >= 80) {
            progressBar.className = 'progress-bar bg-success';
        } else if (value >= 50) {
            progressBar.className = 'progress-bar bg-warning';
        } else {
            progressBar.className = 'progress-bar bg-danger';
        }
    }

    updateRomanceInfo() {
        const romanceSelect = document.getElementById('romanceTarget');
        const romanceInfo = document.getElementById('romanceInfo');
        const romanceTips = document.getElementById('romanceTips');
        const selectedRomance = romanceSelect.value;

        const romanceTipsData = {
            'Astarion': 'Be supportive of his autonomy. Disapproves of acts of genuine heroism early on.',
            'Gale': 'Show interest in magic and be understanding of his condition. Share magical items.',
            'Lae\'zel': 'Respect githyanki culture and show strength in combat. Be direct.',
            'Shadowheart': 'Respect her privacy and faith. Support her choices about her past.',
            'Wyll': 'Act heroically and help those in need. Support his mission to protect the innocent.',
            'Karlach': 'Be enthusiastic and kind. Help her deal with her engine and Zariel.',
            'Halsin': 'Respect nature and help resolve the Shadow Curse. Support balance.',
            'Minthara': 'Show strength and cunning. Respect drow culture and power.'
        };

        if (selectedRomance && romanceTipsData[selectedRomance]) {
            romanceTips.textContent = romanceTipsData[selectedRomance];
            romanceInfo.style.display = 'block';
        } else {
            romanceInfo.style.display = 'none';
        }
    }

    adjustCounter(counterId, change) {
        const counterElement = document.getElementById(counterId);
        let currentValue = parseInt(counterElement.textContent);
        currentValue = Math.max(0, currentValue + change);
        counterElement.textContent = currentValue;
        
        if (counterId === 'longRests') {
            this.longRests = currentValue;
        } else if (counterId === 'shortRests') {
            this.shortRests = currentValue;
        }
    }

    triggerLongRest() {
        this.adjustCounter('longRests', 1);
        
        // Random camp event
        const events = [
            'Peaceful night - everyone recovers fully',
            'Astarion needs to feed (if vampire)',
            'Gale requires magical artifacts',
            'Shadowheart has nightmares about her past',
            'Lae\'zel practices her combat forms',
            'Someone approaches your camp',
            'A companion wants to talk privately',
            'Strange dreams plague the party',
            'Sceleritas Fel visits (Dark Urge)',
            'Dream Guardian appears with warnings'
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        showSuccess(`Long Rest Complete!\n\nCamp Event: ${randomEvent}`);
        
        // Update companion approval slightly (representing time spent together)
        this.companions.forEach((companion, index) => {
            const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
            if (change !== 0) {
                this.adjustApproval(index, change);
            }
        });
    }

    addBG3Equipment() {
        const input = document.getElementById('newEquipment');
        const equipment = input.value.trim();
        
        if (equipment) {
            this.bg3Equipment.push({
                id: Utils.generateId(),
                name: equipment,
                addedAt: new Date().toISOString()
            });
            input.value = '';
            this.updateEquipmentList();
            showSuccess(`Added equipment: ${equipment}`);
        }
    }

    addSpecificItem(itemName) {
        this.bg3Equipment.push({
            id: Utils.generateId(),
            name: itemName,
            addedAt: new Date().toISOString()
        });
        this.updateEquipmentList();
        showSuccess(`Added ${itemName} to equipment!`);
    }

    updateEquipmentList() {
        const listDiv = document.getElementById('bg3EquipmentList');
        
        if (this.bg3Equipment.length === 0) {
            listDiv.innerHTML = '<p class="text-muted text-center">No equipment tracked</p>';
            return;
        }
        
        const equipmentHTML = this.bg3Equipment.map((item, index) => `
            <div class="equipment-item">
                <div class="d-flex justify-content-between align-items-center">
                    <span>${item.name}</span>
                    <button class="btn btn-sm btn-outline-danger" onclick="bg3Tracker.removeBG3Equipment(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        listDiv.innerHTML = equipmentHTML;
    }

    removeBG3Equipment(index) {
        if (index >= 0 && index < this.bg3Equipment.length) {
            const removed = this.bg3Equipment.splice(index, 1)[0];
            this.updateEquipmentList();
            showSuccess(`Removed ${removed.name} from equipment`);
        }
    }

    gatherBG3Data() {
        const data = {
            id: this.playthrough.id || Utils.generateId(),
            characterBuild: {
                race: document.getElementById('bg3Race')?.value || '',
                class: document.getElementById('bg3Class')?.value || '',
                subclass: document.getElementById('bg3Subclass')?.value || '',
                origin: document.getElementById('bg3Origin')?.value || 'Custom'
            },
            gameSettings: {
                difficulty: document.getElementById('bg3Difficulty')?.value || 'Balanced',
                karmicDice: document.getElementById('karmicDice')?.checked || false,
                hideRolls: document.getElementById('hideRolls')?.checked || false,
                exportOnSave: document.getElementById('exportCharacterOnSave')?.checked || false
            },
            storyProgress: {
                currentAct: parseInt(document.getElementById('currentAct')?.value) || 1,
                currentLocation: document.getElementById('currentLocation')?.value || '',
                questNotes: document.getElementById('questNotes')?.value || '',
                completedChoices: this.getCompletedChoices()
            },
            romance: {
                target: document.getElementById('romanceTarget')?.value || '',
                progress: parseInt(document.getElementById('romanceSlider')?.value) || 0,
                notes: document.getElementById('romanceNotes')?.value || ''
            },
            camp: {
                longRests: this.longRests,
                shortRests: this.shortRests,
                completedEvents: this.getCompletedCampEvents()
            },
            companions: this.companions,
            equipment: this.bg3Equipment,
            createdAt: this.playthrough.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        return data;
    }

    getCompletedChoices() {
        const choices = [];
        const act = document.getElementById('currentAct')?.value || '1';
        const checkboxes = document.querySelectorAll(`#majorChoices input[id^="choice${act}_"]:checked`);
        
        checkboxes.forEach(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`);
            if (label) {
                choices.push(label.textContent.trim());
            }
        });
        
        return choices;
    }

    getCompletedCampEvents() {
        const events = [];
        const eventCheckboxes = document.querySelectorAll('#campEvents input[type="checkbox"]:checked');
        
        eventCheckboxes.forEach(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`);
            if (label) {
                events.push(label.textContent.trim());
            }
        });
        
        return events;
    }

    async saveBG3Data() {
        try {
            window.app.authManager.requireAuth();
            
            const bg3Data = this.gatherBG3Data();
            
            const response = await apiCall('bg3.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'save',
                    playthrough: bg3Data
                })
            });
            
            if (response.success) {
                this.playthrough = bg3Data;
                this.playthrough.id = response.id;
                showSuccess('BG3 playthrough saved successfully!');
                
                // Track save event
                Utils.eventEmitter.emit('bg3PlaythroughSaved', this.playthrough);
            } else {
                throw new Error(response.error || 'Failed to save BG3 playthrough');
            }
            
        } catch (error) {
            console.error('Save BG3 error:', error);
            showError(error.message || 'Failed to save BG3 playthrough');
        }
    }

    generateBG3Summary() {
        const bg3Data = this.gatherBG3Data();
        
        const summaryHTML = `
            <div class="bg3-summary p-4 bg-light rounded">
                <div class="text-center mb-4">
                    <h2 class="text-primary">BG3 Playthrough Summary</h2>
                    <p class="lead">${bg3Data.characterBuild.origin === 'Custom' ? 'Custom Character' : bg3Data.characterBuild.origin} • ${bg3Data.gameSettings.difficulty} Difficulty</p>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h5>Character Build</h5>
                        <p><strong>Race:</strong> ${bg3Data.characterBuild.race || 'Not Selected'}</p>
                        <p><strong>Class:</strong> ${bg3Data.characterBuild.class || 'Not Selected'}</p>
                        <p><strong>Subclass:</strong> ${bg3Data.characterBuild.subclass || 'Not Selected'}</p>
                    </div>
                    <div class="col-md-6">
                        <h5>Progress</h5>
                        <p><strong>Current Act:</strong> ${bg3Data.storyProgress.currentAct}</p>
                        <p><strong>Location:</strong> ${bg3Data.storyProgress.currentLocation || 'Unknown'}</p>
                        <p><strong>Long Rests:</strong> ${bg3Data.camp.longRests}</p>
                        <p><strong>Short Rests:</strong> ${bg3Data.camp.shortRests}</p>
                    </div>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h5>Companion Approval</h5>
                        ${bg3Data.companions.map(comp => {
                            let statusColor = 'bg-danger';
                            if (comp.approval >= 80) statusColor = 'bg-success';
                            else if (comp.approval >= 40) statusColor = 'bg-warning';
                            
                            return `
                                <div class="d-flex justify-content-between mb-1">
                                    <span>${comp.name}</span>
                                    <span class="badge ${statusColor}">${comp.approval}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="col-md-6">
                        ${bg3Data.romance.target ? `
                            <h5>Romance Status</h5>
                            <p><strong>Partner:</strong> ${bg3Data.romance.target}</p>
                            <p><strong>Progress:</strong> ${bg3Data.romance.progress}%</p>
                            ${bg3Data.romance.notes ? `<p><strong>Notes:</strong> ${bg3Data.romance.notes}</p>` : ''}
                        ` : '<h5>No Active Romance</h5>'}
                    </div>
                </div>
                
                ${bg3Data.storyProgress.completedChoices.length > 0 ? `
                    <div class="mb-4">
                        <h5>Completed Story Choices (Act ${bg3Data.storyProgress.currentAct})</h5>
                        <ul class="list-unstyled">
                            ${bg3Data.storyProgress.completedChoices.map(choice => `<li>• ${choice}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${bg3Data.camp.completedEvents.length > 0 ? `
                    <div class="mb-4">
                        <h5>Completed Camp Events</h5>
                        <ul class="list-unstyled">
                            ${bg3Data.camp.completedEvents.map(event => `<li>• ${event}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${bg3Data.equipment.length > 0 ? `
                    <div class="mb-4">
                        <h5>Notable Equipment</h5>
                        <div class="row">
                            ${bg3Data.equipment.map(item => `<div class="col-md-6">• ${item.name}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${bg3Data.storyProgress.questNotes ? `
                    <div class="mb-4">
                        <h5>Quest Notes</h5>
                        <p>${bg3Data.storyProgress.questNotes}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('bg3Content').innerHTML = summaryHTML;
        document.getElementById('bg3Summary').style.display = 'block';
        document.getElementById('bg3Summary').scrollIntoView({ behavior: 'smooth' });
        
        // Track summary generation
        Utils.eventEmitter.emit('bg3SummaryGenerated', bg3Data);
    }

    clearBG3Data() {
        if (confirm('Are you sure you want to clear all BG3 data?')) {
            // Reset all form fields
            document.getElementById('bg3Race').value = '';
            document.getElementById('bg3Class').value = '';
            document.getElementById('bg3Subclass').innerHTML = '<option value="">Choose Class First</option>';
            document.getElementById('bg3Origin').value = 'Custom';
            document.getElementById('bg3Difficulty').value = 'Balanced';
            document.getElementById('currentAct').value = '1';
            document.getElementById('currentLocation').value = '';
            document.getElementById('romanceTarget').value = '';
            document.getElementById('romanceSlider').value = '0';
            document.getElementById('questNotes').value = '';
            document.getElementById('romanceNotes').value = '';
            
            // Reset checkboxes
            document.getElementById('karmicDice').checked = true;
            document.getElementById('hideRolls').checked = false;
            document.getElementById('exportCharacterOnSave').checked = false;
            
            // Reset companions
            this.initializeCompanions();
            
            // Reset counters
            this.longRests = 0;
            this.shortRests = 0;
            document.getElementById('longRests').textContent = '0';
            document.getElementById('shortRests').textContent = '0';
            
            // Reset equipment
            this.bg3Equipment = [];
            this.updateEquipmentList();
            
            // Reset romance progress bar
            this.updateRomanceProgress();
            
            // Reset act choices
            this.updateActProgress();
            
            // Reset info displays
            document.getElementById('originInfo').style.display = 'none';
            document.getElementById('romanceInfo').style.display = 'none';
            
            // Hide summary
            document.getElementById('bg3Summary').style.display = 'none';
            
            // Reset playthrough object
            this.playthrough = this.createEmptyPlaythrough();
            
            showSuccess('BG3 data cleared!');
        }
    }

    autoSave() {
        try {
            const bg3Data = this.gatherBG3Data();
            Utils.storage.set('dnd-bg3-autosave', bg3Data);
        } catch (error) {
            console.warn('BG3 auto-save failed:', error);
        }
    }

    loadAutoSave() {
        try {
            const saved = Utils.storage.get('dnd-bg3-autosave');
            if (saved && (saved.characterBuild?.race || saved.characterBuild?.class)) {
                const shouldLoad = confirm('Found auto-saved BG3 data. Would you like to load it?');
                if (shouldLoad) {
                    this.loadBG3Data(saved);
                    showSuccess('Auto-saved BG3 data loaded!');
                }
            }
        } catch (error) {
            console.warn('Failed to load BG3 auto-save:', error);
        }
    }

    loadBG3Data(data) {
        this.playthrough = data;
        
        // Load character build
        if (data.characterBuild) {
            document.getElementById('bg3Race').value = data.characterBuild.race || '';
            document.getElementById('bg3Class').value = data.characterBuild.class || '';
            this.updateBG3Subclasses();
            document.getElementById('bg3Subclass').value = data.characterBuild.subclass || '';
            document.getElementById('bg3Origin').value = data.characterBuild.origin || 'Custom';
        }
        
        // Load game settings
        if (data.gameSettings) {
            document.getElementById('bg3Difficulty').value = data.gameSettings.difficulty || 'Balanced';
            document.getElementById('karmicDice').checked = data.gameSettings.karmicDice || false;
            document.getElementById('hideRolls').checked = data.gameSettings.hideRolls || false;
            document.getElementById('exportCharacterOnSave').checked = data.gameSettings.exportOnSave || false;
        }
        
        // Load story progress
        if (data.storyProgress) {
            document.getElementById('currentAct').value = data.storyProgress.currentAct || '1';
            document.getElementById('currentLocation').value = data.storyProgress.currentLocation || '';
            document.getElementById('questNotes').value = data.storyProgress.questNotes || '';
        }
        
        // Load romance
        if (data.romance) {
            document.getElementById('romanceTarget').value = data.romance.target || '';
            document.getElementById('romanceSlider').value = data.romance.progress || 0;
            document.getElementById('romanceNotes').value = data.romance.notes || '';
        }
        
        // Load camp data
        if (data.camp) {
            this.longRests = data.camp.longRests || 0;
            this.shortRests = data.camp.shortRests || 0;
            document.getElementById('longRests').textContent = this.longRests;
            document.getElementById('shortRests').textContent = this.shortRests;
        }
        
        // Load companions
        if (data.companions) {
            this.companions = data.companions;
            this.updateCompanionDisplay();
        }
        
        // Load equipment
        if (data.equipment) {
            this.bg3Equipment = data.equipment;
            this.updateEquipmentList();
        }
        
        // Update displays
        this.updateActProgress();
        this.updateRomanceProgress();
        this.updateOriginInfo();
        this.updateRomanceInfo();
    }

    saveCompanionData() {
        // Save companion data separately for frequent updates
        Utils.storage.set('dnd-bg3-companions', this.companions);
    }

    createEmptyPlaythrough() {
        return {
            id: null,
            characterBuild: {
                race: '',
                class: '',
                subclass: '',
                origin: 'Custom'
            },
            gameSettings: {
                difficulty: 'Balanced',
                karmicDice: true,
                hideRolls: false,
                exportOnSave: false
            },
            storyProgress: {
                currentAct: 1,
                currentLocation: '',
                questNotes: '',
                completedChoices: []
            },
            romance: {
                target: '',
                progress: 0,
                notes: ''
            },
            camp: {
                longRests: 0,
                shortRests: 0,
                completedEvents: []
            },
            companions: [],
            equipment: [],
            createdAt: null,
            updatedAt: null
        };
    }

    cleanup() {
        this.autoSave();
        this.saveCompanionData();
        console.log('BG3 Tracker cleaned up');
    }
}

// Make BG3Tracker globally available
window.BG3Tracker = BG3Tracker;
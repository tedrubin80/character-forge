/**
 * D&D Creator Hub - Campaign Manager Module
 * Handles campaign creation, NPC management, encounter planning, and story tracking
 */

class CampaignManager {
    constructor() {
        this.campaign = this.createEmptyCampaign();
        this.npcs = [];
        this.locations = [];
        this.encounters = [];
        this.isInitialized = false;
        this.npcCounter = 0;
        this.locationCounter = 0;
        this.encounterCounter = 0;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadTemplate();
            this.bindEvents();
            this.initializeForm();
            this.isInitialized = true;
            console.log('Campaign Manager initialized');
        } catch (error) {
            console.error('Failed to initialize Campaign Manager:', error);
            throw error;
        }
    }

    async loadTemplate() {
        const container = document.getElementById('campaign-pane');
        if (!container) throw new Error('Campaign pane container not found');

        container.innerHTML = `
            <form id="campaignForm">
                <!-- Campaign Basic Info -->
                <div class="row mb-4">
                    <div class="col-md-8">
                        <div class="mb-3">
                            <label for="campaignName" class="form-label fw-bold">Campaign Name</label>
                            <input type="text" class="form-control" id="campaignName" placeholder="Enter campaign name">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label for="campaignLevel" class="form-label fw-bold">Starting Level</label>
                            <select class="form-select" id="campaignLevel">
                                <option value="1">Level 1 (Beginners)</option>
                                <option value="3">Level 3 (Experienced)</option>
                                <option value="5">Level 5 (Heroes)</option>
                                <option value="10">Level 10 (Champions)</option>
                                <option value="15">Level 15 (Masters)</option>
                                <option value="20">Level 20 (Legends)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Campaign Setting -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="campaignSetting" class="form-label fw-bold">Campaign Setting</label>
                            <select class="form-select" id="campaignSetting">
                                <option value="">Choose Setting</option>
                                <option value="Forgotten Realms">Forgotten Realms</option>
                                <option value="Eberron">Eberron</option>
                                <option value="Ravenloft">Ravenloft</option>
                                <option value="Planescape">Planescape</option>
                                <option value="Dark Sun">Dark Sun</option>
                                <option value="Greyhawk">Greyhawk</option>
                                <option value="Critical Role">Critical Role (Exandria)</option>
                                <option value="Custom World">Custom World</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="campaignTone" class="form-label fw-bold">Campaign Tone</label>
                            <select class="form-select" id="campaignTone">
                                <option value="">Choose Tone</option>
                                <option value="Heroic Fantasy">Heroic Fantasy</option>
                                <option value="Dark & Gritty">Dark & Gritty</option>
                                <option value="Comedy/Lighthearted">Comedy/Lighthearted</option>
                                <option value="Political Intrigue">Political Intrigue</option>
                                <option value="Horror">Horror</option>
                                <option value="Exploration">Exploration</option>
                                <option value="Urban Adventure">Urban Adventure</option>
                                <option value="High Magic">High Magic</option>
                                <option value="Low Magic">Low Magic</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Campaign Overview -->
                <div class="mb-4">
                    <label for="campaignDescription" class="form-label fw-bold">Campaign Description</label>
                    <textarea class="form-control" id="campaignDescription" rows="4" 
                              placeholder="Describe your campaign world, main plot, themes, and initial hook..."></textarea>
                </div>

                <!-- Campaign Statistics -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="campaign-stat">
                            <i class="fas fa-users fa-2x mb-2"></i>
                            <h5>Players</h5>
                            <input type="number" class="form-control text-center bg-transparent border-0 text-white fw-bold" 
                                   id="playerCount" value="4" min="1" max="8">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="campaign-stat">
                            <i class="fas fa-calendar fa-2x mb-2"></i>
                            <h5>Sessions</h5>
                            <input type="number" class="form-control text-center bg-transparent border-0 text-white fw-bold" 
                                   id="sessionCount" value="10" min="1">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="campaign-stat">
                            <i class="fas fa-map fa-2x mb-2"></i>
                            <h5>Locations</h5>
                            <span class="fw-bold" id="locationCountDisplay">0</span>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="campaign-stat">
                            <i class="fas fa-dragon fa-2x mb-2"></i>
                            <h5>NPCs</h5>
                            <span class="fw-bold" id="npcCountDisplay">0</span>
                        </div>
                    </div>
                </div>

                <!-- Major NPCs Section -->
                <div class="mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="mb-0">Major NPCs</h3>
                        <div class="btn-group">
                            <button type="button" class="btn btn-primary" onclick="campaignManager.addNPC()">
                                <i class="fas fa-plus me-2"></i>Add NPC
                            </button>
                            <button type="button" class="btn btn-outline-primary" onclick="campaignManager.generateRandomNPC()">
                                <i class="fas fa-dice me-2"></i>Random NPC
                            </button>
                        </div>
                    </div>
                    <div id="npcList">
                        <!-- NPCs will be dynamically added here -->
                    </div>
                </div>

                <!-- Key Locations Section -->
                <div class="mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="mb-0">Key Locations</h3>
                        <div class="btn-group">
                            <button type="button" class="btn btn-primary" onclick="campaignManager.addLocation()">
                                <i class="fas fa-plus me-2"></i>Add Location
                            </button>
                            <button type="button" class="btn btn-outline-primary" onclick="campaignManager.generateRandomLocation()">
                                <i class="fas fa-dice me-2"></i>Random Location
                            </button>
                        </div>
                    </div>
                    <div id="locationList">
                        <!-- Locations will be dynamically added here -->
                    </div>
                </div>

                <!-- Encounters Section -->
                <div class="mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="mb-0">Planned Encounters</h3>
                        <div class="btn-group">
                            <button type="button" class="btn btn-primary" onclick="campaignManager.addEncounter()">
                                <i class="fas fa-plus me-2"></i>Add Encounter
                            </button>
                            <button type="button" class="btn btn-outline-primary" onclick="campaignManager.generateRandomEncounter()">
                                <i class="fas fa-dice me-2"></i>Random Encounter
                            </button>
                        </div>
                    </div>
                    <div id="encounterList">
                        <!-- Encounters will be dynamically added here -->
                    </div>
                </div>

                <!-- Session Planning -->
                <div class="mb-4">
                    <h3 class="mb-3">Session Planning</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="nextSessionPlans" class="form-label fw-bold">Next Session Plans</label>
                                <textarea class="form-control" id="nextSessionPlans" rows="4" 
                                          placeholder="Plans for the upcoming session..."></textarea>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="plotHooks" class="form-label fw-bold">Active Plot Hooks</label>
                                <textarea class="form-control" id="plotHooks" rows="4" 
                                          placeholder="Current story threads and hooks..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Campaign Notes -->
                <div class="mb-4">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="worldBuilding" class="form-label fw-bold">World Building Notes</label>
                                <textarea class="form-control" id="worldBuilding" rows="3" 
                                          placeholder="Important world details, lore, customs..."></textarea>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="playerNotes" class="form-label fw-bold">Player Notes</label>
                                <textarea class="form-control" id="playerNotes" rows="3" 
                                          placeholder="Player backstories, connections, goals..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Campaign Action Buttons -->
                <div class="text-center">
                    <button type="button" class="btn btn-primary me-3" onclick="campaignManager.generateCampaignSummary()">
                        <i class="fas fa-book me-2"></i>Generate Campaign Summary
                    </button>
                    <button type="button" class="btn btn-outline-secondary me-3" onclick="campaignManager.clearForm()">
                        <i class="fas fa-eraser me-2"></i>Clear All
                    </button>
                    <button type="button" class="btn btn-outline-success me-3" onclick="campaignManager.saveCampaign()">
                        <i class="fas fa-save me-2"></i>Save Campaign
                    </button>
                    <button type="button" class="btn btn-outline-info" onclick="campaignManager.loadCampaign()">
                        <i class="fas fa-upload me-2"></i>Load Campaign
                    </button>
                </div>
            </form>

            <!-- Campaign Summary Display -->
            <div id="campaignSummary" class="mt-5" style="display: none;">
                <hr>
                <h3 class="text-center mb-4">Campaign Summary</h3>
                <div id="campaignContent"></div>
            </div>
        `;
    }

    bindEvents() {
        // Auto-save on form changes
        const form = document.getElementById('campaignForm');
        if (form) {
            form.addEventListener('input', Utils.debounce(() => this.autoSave(), 2000));
        }

        // Update counters when items are added/removed
        Utils.eventEmitter.on('npcAdded', () => this.updateCounters());
        Utils.eventEmitter.on('npcRemoved', () => this.updateCounters());
        Utils.eventEmitter.on('locationAdded', () => this.updateCounters());
        Utils.eventEmitter.on('locationRemoved', () => this.updateCounters());
        Utils.eventEmitter.on('encounterAdded', () => this.updateCounters());
        Utils.eventEmitter.on('encounterRemoved', () => this.updateCounters());
    }

    initializeForm() {
        this.updateCounters();
        this.loadAutoSave();
        
        // Add some default content for demonstration
        this.addNPC();
        this.addLocation();
        this.addEncounter();
    }

    addNPC() {
        try {
            window.app.authManager.requireAuth();
        } catch (error) {
            showError('Please log in to add NPCs');
            return;
        }

        this.npcCounter++;
        const npcId = `npc-${this.npcCounter}`;
        
        const npcHTML = `
            <div class="npc-card" id="${npcId}">
                <div class="row">
                    <div class="col-md-3">
                        <input type="text" class="form-control" placeholder="NPC Name" 
                               id="npcName-${this.npcCounter}" data-field="name">
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="npcRole-${this.npcCounter}" data-field="role">
                            <option value="Ally">Ally</option>
                            <option value="Enemy">Enemy</option>
                            <option value="Neutral">Neutral</option>
                            <option value="Quest Giver">Quest Giver</option>
                            <option value="Merchant">Merchant</option>
                            <option value="Ruler">Ruler</option>
                            <option value="Guild Member">Guild Member</option>
                            <option value="Informant">Informant</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="npcLocation-${this.npcCounter}" data-field="location">
                            <option value="">Select Location</option>
                            <option value="Tavern">Tavern</option>
                            <option value="Palace">Palace</option>
                            <option value="Market">Market</option>
                            <option value="Temple">Temple</option>
                            <option value="Wilderness">Wilderness</option>
                            <option value="Dungeon">Dungeon</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <input type="text" class="form-control" placeholder="Description/Notes" 
                               id="npcDesc-${this.npcCounter}" data-field="description">
                    </div>
                    <div class="col-md-1">
                        <button type="button" class="btn btn-outline-info btn-sm me-1" 
                                onclick="campaignManager.editNPC('${npcId}')" title="Edit Details">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" 
                                onclick="campaignManager.removeElement('${npcId}', 'npc')" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('npcList').insertAdjacentHTML('beforeend', npcHTML);
        
        // Store NPC data
        this.npcs.push({
            id: npcId,
            counter: this.npcCounter,
            name: '',
            role: 'Ally',
            location: '',
            description: ''
        });

        Utils.eventEmitter.emit('npcAdded');
    }

    addLocation() {
        try {
            window.app.authManager.requireAuth();
        } catch (error) {
            showError('Please log in to add locations');
            return;
        }

        this.locationCounter++;
        const locationId = `location-${this.locationCounter}`;
        
        const locationHTML = `
            <div class="campaign-box" id="${locationId}">
                <div class="row">
                    <div class="col-md-3">
                        <input type="text" class="form-control" placeholder="Location Name" 
                               id="locationName-${this.locationCounter}" data-field="name">
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="locationType-${this.locationCounter}" data-field="type">
                            <option value="City">City</option>
                            <option value="Town">Town</option>
                            <option value="Village">Village</option>
                            <option value="Dungeon">Dungeon</option>
                            <option value="Wilderness">Wilderness</option>
                            <option value="Building">Building</option>
                            <option value="Plane">Plane</option>
                            <option value="Landmark">Landmark</option>
                            <option value="Ruin">Ruin</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="locationDanger-${this.locationCounter}" data-field="danger">
                            <option value="Safe">Safe</option>
                            <option value="Low">Low Danger</option>
                            <option value="Medium">Medium Danger</option>
                            <option value="High">High Danger</option>
                            <option value="Deadly">Deadly</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <input type="text" class="form-control" placeholder="Description/Features" 
                               id="locationDesc-${this.locationCounter}" data-field="description">
                    </div>
                    <div class="col-md-1">
                        <button type="button" class="btn btn-outline-info btn-sm me-1" 
                                onclick="campaignManager.editLocation('${locationId}')" title="Edit Details">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" 
                                onclick="campaignManager.removeElement('${locationId}', 'location')" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('locationList').insertAdjacentHTML('beforeend', locationHTML);
        
        // Store location data
        this.locations.push({
            id: locationId,
            counter: this.locationCounter,
            name: '',
            type: 'City',
            danger: 'Safe',
            description: ''
        });

        Utils.eventEmitter.emit('locationAdded');
    }

    addEncounter() {
        try {
            window.app.authManager.requireAuth();
        } catch (error) {
            showError('Please log in to add encounters');
            return;
        }

        this.encounterCounter++;
        const encounterId = `encounter-${this.encounterCounter}`;
        
        const encounterHTML = `
            <div class="encounter-card" id="${encounterId}">
                <div class="row">
                    <div class="col-md-3">
                        <input type="text" class="form-control" placeholder="Encounter Name" 
                               id="encounterName-${this.encounterCounter}" data-field="name">
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="encounterType-${this.encounterCounter}" data-field="type">
                            <option value="Combat">Combat</option>
                            <option value="Social">Social</option>
                            <option value="Puzzle">Puzzle</option>
                            <option value="Exploration">Exploration</option>
                            <option value="Trap">Trap</option>
                            <option value="Chase">Chase</option>
                            <option value="Stealth">Stealth</option>
                            <option value="Investigation">Investigation</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="encounterDifficulty-${this.encounterCounter}" data-field="difficulty">
                            <option value="Trivial">Trivial</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                            <option value="Deadly">Deadly</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <input type="text" class="form-control" placeholder="Description/Notes" 
                               id="encounterDesc-${this.encounterCounter}" data-field="description">
                    </div>
                    <div class="col-md-1">
                        <button type="button" class="btn btn-outline-info btn-sm me-1" 
                                onclick="campaignManager.editEncounter('${encounterId}')" title="Edit Details">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" 
                                onclick="campaignManager.removeElement('${encounterId}', 'encounter')" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('encounterList').insertAdjacentHTML('beforeend', encounterHTML);
        
        // Store encounter data
        this.encounters.push({
            id: encounterId,
            counter: this.encounterCounter,
            name: '',
            type: 'Combat',
            difficulty: 'Medium',
            description: ''
        });

        Utils.eventEmitter.emit('encounterAdded');
    }

    generateRandomNPC() {
        const names = [
            'Aeliana Brightblade', 'Thorek Ironforge', 'Zara Shadowmere', 'Gareth Stormwind',
            'Lyrina Goldleaf', 'Borin Battlehammer', 'Celeste Starweaver', 'Draven Nightfall',
            'Seraphina Moonglow', 'Kael Thornfield', 'Elara Whisperwind', 'Magnus Drakeheart'
        ];
        
        const descriptions = [
            'A mysterious figure with hidden motives',
            'Friendly merchant with valuable information',
            'Gruff veteran with battle scars',
            'Eloquent noble with political connections',
            'Wise sage who speaks in riddles',
            'Cheerful innkeeper who knows everyone',
            'Shadowy figure from the criminal underworld',
            'Devoted cleric spreading their faith'
        ];
        
        this.addNPC();
        
        // Fill with random data
        const currentCounter = this.npcCounter;
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        document.getElementById(`npcName-${currentCounter}`).value = randomName;
        document.getElementById(`npcDesc-${currentCounter}`).value = randomDesc;
        
        showSuccess(`Generated random NPC: ${randomName}`);
    }

    generateRandomLocation() {
        const locations = [
            'The Prancing Pony Tavern', 'Crystal Lake', 'Shadowmere Forest', 'Ironforge Mines',
            'Goldleaf Trading Post', 'Stormwind Keep', 'Whispering Woods', 'Dragon\'s Peak',
            'Moonlight Shrine', 'Blackrock Depths', 'Sunburst Valley', 'Frozen Wasteland'
        ];
        
        const descriptions = [
            'A place of ancient magic and mystery',
            'Bustling with merchants and travelers',
            'Hidden dangers lurk in the shadows',
            'A peaceful haven for weary adventurers',
            'Filled with valuable resources',
            'Heavily guarded and fortified',
            'Natural beauty masks deadly secrets',
            'Legends speak of great treasures here'
        ];
        
        this.addLocation();
        
        // Fill with random data
        const currentCounter = this.locationCounter;
        const randomName = locations[Math.floor(Math.random() * locations.length)];
        const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        document.getElementById(`locationName-${currentCounter}`).value = randomName;
        document.getElementById(`locationDesc-${currentCounter}`).value = randomDesc;
        
        showSuccess(`Generated random location: ${randomName}`);
    }

    generateRandomEncounter() {
        const encounters = [
            'Goblin Ambush', 'Diplomatic Negotiation', 'Ancient Riddle Door', 'Bandit Roadblock',
            'Wild Animal Attack', 'Merchant in Distress', 'Hidden Trap Room', 'Rival Adventurers',
            'Mysterious Portal', 'Lost Traveler', 'Haunted Crossroads', 'Dragon Sighting'
        ];
        
        const descriptions = [
            'A challenging encounter that tests combat skills',
            'Requires careful negotiation and diplomacy',
            'Players must solve puzzles to proceed',
            'Environmental hazards add complexity',
            'Multiple solutions available to players',
            'High stakes with significant consequences',
            'Mysterious elements that advance the plot',
            'Tests specific character abilities'
        ];
        
        this.addEncounter();
        
        // Fill with random data
        const currentCounter = this.encounterCounter;
        const randomName = encounters[Math.floor(Math.random() * encounters.length)];
        const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        document.getElementById(`encounterName-${currentCounter}`).value = randomName;
        document.getElementById(`encounterDesc-${currentCounter}`).value = randomDesc;
        
        showSuccess(`Generated random encounter: ${randomName}`);
    }

    editNPC(npcId) {
        // Future enhancement: Open detailed NPC editor modal
        showSuccess('Detailed NPC editor coming soon!');
    }

    editLocation(locationId) {
        // Future enhancement: Open detailed location editor modal
        showSuccess('Detailed location editor coming soon!');
    }

    editEncounter(encounterId) {
        // Future enhancement: Open detailed encounter editor modal
        showSuccess('Detailed encounter editor coming soon!');
    }

    removeElement(elementId, type) {
        const element = document.getElementById(elementId);
        if (element && confirm(`Remove this ${type}?`)) {
            element.remove();
            
            // Remove from data arrays
            if (type === 'npc') {
                this.npcs = this.npcs.filter(npc => npc.id !== elementId);
                Utils.eventEmitter.emit('npcRemoved');
            } else if (type === 'location') {
                this.locations = this.locations.filter(loc => loc.id !== elementId);
                Utils.eventEmitter.emit('locationRemoved');
            } else if (type === 'encounter') {
                this.encounters = this.encounters.filter(enc => enc.id !== elementId);
                Utils.eventEmitter.emit('encounterRemoved');
            }
        }
    }

    updateCounters() {
        const npcCount = document.querySelectorAll('#npcList .npc-card').length;
        const locationCount = document.querySelectorAll('#locationList .campaign-box').length;
        const encounterCount = document.querySelectorAll('#encounterList .encounter-card').length;
        
        const npcDisplay = document.getElementById('npcCountDisplay');
        const locationDisplay = document.getElementById('locationCountDisplay');
        
        if (npcDisplay) npcDisplay.textContent = npcCount;
        if (locationDisplay) locationDisplay.textContent = locationCount;
    }

    gatherCampaignData() {
        const campaign = {
            id: this.campaign.id || Utils.generateId(),
            name: document.getElementById('campaignName')?.value || 'Unnamed Campaign',
            startingLevel: parseInt(document.getElementById('campaignLevel')?.value) || 1,
            setting: document.getElementById('campaignSetting')?.value || '',
            tone: document.getElementById('campaignTone')?.value || '',
            description: document.getElementById('campaignDescription')?.value || '',
            playerCount: parseInt(document.getElementById('playerCount')?.value) || 4,
            sessionCount: parseInt(document.getElementById('sessionCount')?.value) || 10,
            nextSessionPlans: document.getElementById('nextSessionPlans')?.value || '',
            plotHooks: document.getElementById('plotHooks')?.value || '',
            worldBuilding: document.getElementById('worldBuilding')?.value || '',
            playerNotes: document.getElementById('playerNotes')?.value || '',
            npcs: this.gatherNPCData(),
            locations: this.gatherLocationData(),
            encounters: this.gatherEncounterData(),
            createdAt: this.campaign.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        return campaign;
    }

    gatherNPCData() {
        const npcs = [];
        const npcCards = document.querySelectorAll('#npcList .npc-card');
        
        npcCards.forEach(card => {
            const id = card.id;
            const counter = id.split('-')[1];
            
            const npc = {
                id: id,
                name: document.getElementById(`npcName-${counter}`)?.value || '',
                role: document.getElementById(`npcRole-${counter}`)?.value || '',
                location: document.getElementById(`npcLocation-${counter}`)?.value || '',
                description: document.getElementById(`npcDesc-${counter}`)?.value || ''
            };
            
            if (npc.name) npcs.push(npc);
        });
        
        return npcs;
    }

    gatherLocationData() {
        const locations = [];
        const locationCards = document.querySelectorAll('#locationList .campaign-box');
        
        locationCards.forEach(card => {
            const id = card.id;
            const counter = id.split('-')[1];
            
            const location = {
                id: id,
                name: document.getElementById(`locationName-${counter}`)?.value || '',
                type: document.getElementById(`locationType-${counter}`)?.value || '',
                danger: document.getElementById(`locationDanger-${counter}`)?.value || '',
                description: document.getElementById(`locationDesc-${counter}`)?.value || ''
            };
            
            if (location.name) locations.push(location);
        });
        
        return locations;
    }

    gatherEncounterData() {
        const encounters = [];
        const encounterCards = document.querySelectorAll('#encounterList .encounter-card');
        
        encounterCards.forEach(card => {
            const id = card.id;
            const counter = id.split('-')[1];
            
            const encounter = {
                id: id,
                name: document.getElementById(`encounterName-${counter}`)?.value || '',
                type: document.getElementById(`encounterType-${counter}`)?.value || '',
                difficulty: document.getElementById(`encounterDifficulty-${counter}`)?.value || '',
                description: document.getElementById(`encounterDesc-${counter}`)?.value || ''
            };
            
            if (encounter.name) encounters.push(encounter);
        });
        
        return encounters;
    }

    async saveCampaign() {
        try {
            window.app.authManager.requireAuth();
            
            const campaignData = this.gatherCampaignData();
            
            // Validate campaign data
            const validation = this.validateCampaignData(campaignData);
            if (!validation.isValid) {
                showError('Please fix the following errors:\n' + validation.errors.join('\n'));
                return;
            }
            
            const response = await apiCall('campaigns.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'save',
                    campaign: campaignData
                })
            });
            
            if (response.success) {
                this.campaign = campaignData;
                this.campaign.id = response.id;
                showSuccess('Campaign saved successfully!');
                
                // Track save event
                Utils.eventEmitter.emit('campaignSaved', this.campaign);
            } else {
                throw new Error(response.error || 'Failed to save campaign');
            }
            
        } catch (error) {
            console.error('Save campaign error:', error);
            showError(error.message || 'Failed to save campaign');
        }
    }

    validateCampaignData(campaign) {
        const rules = {
            name: { required: true, minLength: 1, maxLength: 100 },
            startingLevel: { required: true, type: 'number', min: 1, max: 20 },
            playerCount: { required: true, type: 'number', min: 1, max: 8 }
        };
        
        return Utils.validateData(campaign, rules);
    }

    async loadCampaign() {
        try {
            window.app.authManager.requireAuth();
            
            const campaignId = prompt('Enter campaign ID to load:');
            if (!campaignId) return;
            
            const response = await apiCall(`campaigns.php?action=load&id=${campaignId}`);
            
            if (response.success && response.campaign) {
                this.loadCampaignData(response.campaign);
                showSuccess('Campaign loaded successfully!');
            } else {
                throw new Error(response.error || 'Campaign not found');
            }
            
        } catch (error) {
            console.error('Load campaign error:', error);
            showError(error.message || 'Failed to load campaign');
        }
    }

    loadCampaignData(campaign) {
        this.campaign = campaign;
        
        // Clear existing content
        document.getElementById('npcList').innerHTML = '';
        document.getElementById('locationList').innerHTML = '';
        document.getElementById('encounterList').innerHTML = '';
        
        // Reset counters
        this.npcCounter = 0;
        this.locationCounter = 0;
        this.encounterCounter = 0;
        
        // Populate form fields
        document.getElementById('campaignName').value = campaign.name || '';
        document.getElementById('campaignLevel').value = campaign.startingLevel || 1;
        document.getElementById('campaignSetting').value = campaign.setting || '';
        document.getElementById('campaignTone').value = campaign.tone || '';
        document.getElementById('campaignDescription').value = campaign.description || '';
        document.getElementById('playerCount').value = campaign.playerCount || 4;
        document.getElementById('sessionCount').value = campaign.sessionCount || 10;
        document.getElementById('nextSessionPlans').value = campaign.nextSessionPlans || '';
        document.getElementById('plotHooks').value = campaign.plotHooks || '';
        document.getElementById('worldBuilding').value = campaign.worldBuilding || '';
        document.getElementById('playerNotes').value = campaign.playerNotes || '';
        
        // Load NPCs, locations, and encounters
        if (campaign.npcs) {
            campaign.npcs.forEach(npc => this.loadNPC(npc));
        }
        
        if (campaign.locations) {
            campaign.locations.forEach(location => this.loadLocation(location));
        }
        
        if (campaign.encounters) {
            campaign.encounters.forEach(encounter => this.loadEncounter(encounter));
        }
        
        this.updateCounters();
    }

    loadNPC(npc) {
        this.addNPC();
        const counter = this.npcCounter;
        
        document.getElementById(`npcName-${counter}`).value = npc.name || '';
        document.getElementById(`npcRole-${counter}`).value = npc.role || 'Ally';
        document.getElementById(`npcLocation-${counter}`).value = npc.location || '';
        document.getElementById(`npcDesc-${counter}`).value = npc.description || '';
    }

    loadLocation(location) {
        this.addLocation();
        const counter = this.locationCounter;
        
        document.getElementById(`locationName-${counter}`).value = location.name || '';
        document.getElementById(`locationType-${counter}`).value = location.type || 'City';
        document.getElementById(`locationDanger-${counter}`).value = location.danger || 'Safe';
        document.getElementById(`locationDesc-${counter}`).value = location.description || '';
    }

    loadEncounter(encounter) {
        this.addEncounter();
        const counter = this.encounterCounter;
        
        document.getElementById(`encounterName-${counter}`).value = encounter.name || '';
        document.getElementById(`encounterType-${counter}`).value = encounter.type || 'Combat';
        document.getElementById(`encounterDifficulty-${counter}`).value = encounter.difficulty || 'Medium';
        document.getElementById(`encounterDesc-${counter}`).value = encounter.description || '';
    }

    generateCampaignSummary() {
        const campaign = this.gatherCampaignData();
        
        const summaryHTML = `
            <div class="campaign-summary p-4 bg-light rounded">
                <div class="text-center mb-4">
                    <h2 class="text-primary">${campaign.name}</h2>
                    <p class="lead">${campaign.setting} Campaign • ${campaign.tone}</p>
                    <p><strong>Starting Level:</strong> ${campaign.startingLevel} • <strong>Players:</strong> ${campaign.playerCount}</p>
                </div>
                
                ${campaign.description ? `
                    <div class="mb-4">
                        <h5>Campaign Overview</h5>
                        <p>${campaign.description}</p>
                    </div>
                ` : ''}
                
                <div class="row mb-4">
                    <div class="col-md-3 text-center">
                        <div class="campaign-stat">
                            <h3>${campaign.sessionCount}</h3>
                            <small>Planned Sessions</small>
                        </div>
                    </div>
                    <div class="col-md-3 text-center">
                        <div class="campaign-stat">
                            <h3>${campaign.locations.length}</h3>
                            <small>Key Locations</small>
                        </div>
                    </div>
                    <div class="col-md-3 text-center">
                        <div class="campaign-stat">
                            <h3>${campaign.npcs.length}</h3>
                            <small>Major NPCs</small>
                        </div>
                    </div>
                    <div class="col-md-3 text-center">
                        <div class="campaign-stat">
                            <h3>${campaign.encounters.length}</h3>
                            <small>Encounters</small>
                        </div>
                    </div>
                </div>
                
                ${campaign.npcs.length > 0 ? `
                    <div class="mb-4">
                        <h5>Major NPCs</h5>
                        ${campaign.npcs.map(npc => `
                            <div class="npc-card mb-2">
                                <strong>${npc.name}</strong> <span class="badge bg-primary">${npc.role}</span>
                                ${npc.location ? `<span class="badge bg-secondary">${npc.location}</span>` : ''}
                                ${npc.description ? `<br><small>${npc.description}</small>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${campaign.locations.length > 0 ? `
                    <div class="mb-4">
                        <h5>Key Locations</h5>
                        ${campaign.locations.map(location => `
                            <div class="campaign-box mb-2">
                                <strong>${location.name}</strong> 
                                <span class="badge bg-secondary">${location.type}</span>
                                <span class="badge bg-${this.getDangerBadgeColor(location.danger)}">${location.danger}</span>
                                ${location.description ? `<br><small>${location.description}</small>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${campaign.encounters.length > 0 ? `
                    <div class="mb-4">
                        <h5>Planned Encounters</h5>
                        ${campaign.encounters.map(encounter => `
                            <div class="encounter-card mb-2">
                                <strong>${encounter.name}</strong> 
                                <span class="badge bg-warning">${encounter.type}</span>
                                <span class="badge bg-${this.getDifficultyBadgeColor(encounter.difficulty)}">${encounter.difficulty}</span>
                                ${encounter.description ? `<br><small>${encounter.description}</small>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${campaign.nextSessionPlans ? `
                    <div class="mb-4">
                        <h5>Next Session Plans</h5>
                        <p>${campaign.nextSessionPlans}</p>
                    </div>
                ` : ''}
                
                ${campaign.plotHooks ? `
                    <div class="mb-4">
                        <h5>Active Plot Hooks</h5>
                        <p>${campaign.plotHooks}</p>
                    </div>
                ` : ''}
                
                ${campaign.worldBuilding ? `
                    <div class="mb-4">
                        <h5>World Building Notes</h5>
                        <p>${campaign.worldBuilding}</p>
                    </div>
                ` : ''}
                
                ${campaign.playerNotes ? `
                    <div class="mb-4">
                        <h5>Player Notes</h5>
                        <p>${campaign.playerNotes}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('campaignContent').innerHTML = summaryHTML;
        document.getElementById('campaignSummary').style.display = 'block';
        document.getElementById('campaignSummary').scrollIntoView({ behavior: 'smooth' });
        
        // Track summary generation
        Utils.eventEmitter.emit('campaignSummaryGenerated', campaign);
    }

    getDangerBadgeColor(danger) {
        const colors = {
            'Safe': 'success',
            'Low': 'info',
            'Medium': 'warning',
            'High': 'danger',
            'Deadly': 'dark'
        };
        return colors[danger] || 'secondary';
    }

    getDifficultyBadgeColor(difficulty) {
        const colors = {
            'Trivial': 'success',
            'Easy': 'info',
            'Medium': 'warning',
            'Hard': 'danger',
            'Deadly': 'dark'
        };
        return colors[difficulty] || 'secondary';
    }

    clearForm() {
        if (confirm('Are you sure you want to clear all campaign data?')) {
            document.getElementById('campaignForm').reset();
            
            // Clear lists
            document.getElementById('npcList').innerHTML = '';
            document.getElementById('locationList').innerHTML = '';
            document.getElementById('encounterList').innerHTML = '';
            
            // Reset data
            this.npcs = [];
            this.locations = [];
            this.encounters = [];
            this.npcCounter = 0;
            this.locationCounter = 0;
            this.encounterCounter = 0;
            
            // Hide summary
            document.getElementById('campaignSummary').style.display = 'none';
            
            // Reset campaign object
            this.campaign = this.createEmptyCampaign();
            
            this.updateCounters();
            showSuccess('Campaign form cleared!');
        }
    }

    autoSave() {
        try {
            const campaign = this.gatherCampaignData();
            Utils.storage.set('dnd-campaign-autosave', campaign);
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }

    loadAutoSave() {
        try {
            const saved = Utils.storage.get('dnd-campaign-autosave');
            if (saved && saved.name) {
                const shouldLoad = confirm('Found auto-saved campaign data. Would you like to load it?');
                if (shouldLoad) {
                    this.loadCampaignData(saved);
                    showSuccess('Auto-saved campaign loaded!');
                }
            }
        } catch (error) {
            console.warn('Failed to load auto-save:', error);
        }
    }

    createEmptyCampaign() {
        return {
            id: null,
            name: '',
            startingLevel: 1,
            setting: '',
            tone: '',
            description: '',
            playerCount: 4,
            sessionCount: 10,
            nextSessionPlans: '',
            plotHooks: '',
            worldBuilding: '',
            playerNotes: '',
            npcs: [],
            locations: [],
            encounters: [],
            createdAt: null,
            updatedAt: null
        };
    }

    cleanup() {
        this.autoSave();
        console.log('Campaign Manager cleaned up');
    }
}

// Make CampaignManager globally available
window.CampaignManager = CampaignManager;
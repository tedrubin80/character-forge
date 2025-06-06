<?php
/**
 * D&D Creator Hub - Campaign Management API
 * Handles campaign CRUD operations, NPCs, locations, encounters, and session planning
 */

session_start();

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

class CampaignAPI {
    private $dataDir;
    private $logFile;
    
    public function __construct() {
        $this->dataDir = '../data/campaigns/';
        $this->logFile = '../data/campaign_operations.log';
        
        // Create directories if they don't exist
        if (!file_exists($this->dataDir)) {
            mkdir($this->dataDir, 0755, true);
        }
        
        if (!file_exists('../data/')) {
            mkdir('../data/', 0755, true);
        }
    }
    
    public function handleRequest() {
        try {
            // Check authentication
            if (!$this->isAuthenticated()) {
                throw new Exception('Authentication required');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? $_GET['action'] ?? '';
            
            switch ($action) {
                case 'save':
                    return $this->saveCampaign($input['campaign'] ?? []);
                    
                case 'load':
                    return $this->loadCampaign($_GET['id'] ?? '');
                    
                case 'list':
                    return $this->listCampaigns();
                    
                case 'delete':
                    return $this->deleteCampaign($input['id'] ?? '');
                    
                case 'duplicate':
                    return $this->duplicateCampaign($input['id'] ?? '');
                    
                case 'export':
                    return $this->exportCampaign($_GET['id'] ?? '');
                    
                case 'import':
                    return $this->importCampaign($input['campaign'] ?? []);
                    
                case 'search':
                    return $this->searchCampaigns($input['query'] ?? '');
                    
                case 'add_session_note':
                    return $this->addSessionNote($input);
                    
                case 'get_session_notes':
                    return $this->getSessionNotes($_GET['campaign_id'] ?? '');
                    
                case 'generate_summary':
                    return $this->generateCampaignSummary($_GET['id'] ?? '');
                    
                case 'update_npc':
                    return $this->updateNPC($input);
                    
                case 'update_location':
                    return $this->updateLocation($input);
                    
                case 'update_encounter':
                    return $this->updateEncounter($input);
                    
                default:
                    throw new Exception('Invalid action');
            }
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
    
    private function saveCampaign($campaignData) {
        // Validate campaign data
        $validation = $this->validateCampaignData($campaignData);
        if (!$validation['valid']) {
            return $this->errorResponse('Validation failed', $validation['errors']);
        }
        
        // Generate ID if new campaign
        if (empty($campaignData['id'])) {
            $campaignData['id'] = $this->generateId();
            $campaignData['createdAt'] = date('Y-m-d H:i:s');
        }
        
        $campaignData['updatedAt'] = date('Y-m-d H:i:s');
        
        // Sanitize data
        $campaignData = $this->sanitizeCampaignData($campaignData);
        
        // Process NPCs, locations, and encounters
        $campaignData['npcs'] = $this->processNPCs($campaignData['npcs'] ?? []);
        $campaignData['locations'] = $this->processLocations($campaignData['locations'] ?? []);
        $campaignData['encounters'] = $this->processEncounters($campaignData['encounters'] ?? []);
        
        // Save to file
        $filename = $this->dataDir . $campaignData['id'] . '.json';
        $result = file_put_contents($filename, json_encode($campaignData, JSON_PRETTY_PRINT));
        
        if ($result === false) {
            throw new Exception('Failed to save campaign');
        }
        
        // Log the operation
        $this->logOperation('save', $campaignData['id'], $campaignData['name']);
        
        return $this->successResponse([
            'message' => 'Campaign saved successfully',
            'id' => $campaignData['id'],
            'campaign' => $campaignData
        ]);
    }
    
    private function loadCampaign($campaignId) {
        if (empty($campaignId)) {
            throw new Exception('Campaign ID is required');
        }
        
        $filename = $this->dataDir . $campaignId . '.json';
        
        if (!file_exists($filename)) {
            throw new Exception('Campaign not found');
        }
        
        $campaignData = json_decode(file_get_contents($filename), true);
        
        if (!$campaignData) {
            throw new Exception('Failed to load campaign data');
        }
        
        // Log the operation
        $this->logOperation('load', $campaignId, $campaignData['name']);
        
        return $this->successResponse([
            'campaign' => $campaignData
        ]);
    }
    
    private function listCampaigns() {
        $campaigns = [];
        $files = glob($this->dataDir . '*.json');
        
        foreach ($files as $file) {
            $campaignData = json_decode(file_get_contents($file), true);
            if ($campaignData) {
                // Return summary data for listing
                $campaigns[] = [
                    'id' => $campaignData['id'],
                    'name' => $campaignData['name'],
                    'setting' => $campaignData['setting'],
                    'tone' => $campaignData['tone'],
                    'startingLevel' => $campaignData['startingLevel'],
                    'playerCount' => $campaignData['playerCount'],
                    'sessionCount' => $campaignData['sessionCount'],
                    'npcCount' => count($campaignData['npcs'] ?? []),
                    'locationCount' => count($campaignData['locations'] ?? []),
                    'encounterCount' => count($campaignData['encounters'] ?? []),
                    'createdAt' => $campaignData['createdAt'],
                    'updatedAt' => $campaignData['updatedAt']
                ];
            }
        }
        
        // Sort by updated date (most recent first)
        usort($campaigns, function($a, $b) {
            return strtotime($b['updatedAt']) - strtotime($a['updatedAt']);
        });
        
        return $this->successResponse([
            'campaigns' => $campaigns,
            'count' => count($campaigns)
        ]);
    }
    
    private function deleteCampaign($campaignId) {
        if (empty($campaignId)) {
            throw new Exception('Campaign ID is required');
        }
        
        $filename = $this->dataDir . $campaignId . '.json';
        
        if (!file_exists($filename)) {
            throw new Exception('Campaign not found');
        }
        
        // Get campaign name for logging
        $campaignData = json_decode(file_get_contents($filename), true);
        $campaignName = $campaignData['name'] ?? 'Unknown';
        
        if (!unlink($filename)) {
            throw new Exception('Failed to delete campaign');
        }
        
        // Log the operation
        $this->logOperation('delete', $campaignId, $campaignName);
        
        return $this->successResponse([
            'message' => 'Campaign deleted successfully'
        ]);
    }
    
    private function duplicateCampaign($campaignId) {
        if (empty($campaignId)) {
            throw new Exception('Campaign ID is required');
        }
        
        $originalFilename = $this->dataDir . $campaignId . '.json';
        
        if (!file_exists($originalFilename)) {
            throw new Exception('Campaign not found');
        }
        
        $campaignData = json_decode(file_get_contents($originalFilename), true);
        
        // Create duplicate with new ID and modified name
        $campaignData['id'] = $this->generateId();
        $campaignData['name'] = $campaignData['name'] . ' (Copy)';
        $campaignData['createdAt'] = date('Y-m-d H:i:s');
        $campaignData['updatedAt'] = date('Y-m-d H:i:s');
        
        // Generate new IDs for NPCs, locations, and encounters
        if (isset($campaignData['npcs'])) {
            foreach ($campaignData['npcs'] as &$npc) {
                $npc['id'] = $this->generateNPCId();
            }
        }
        
        if (isset($campaignData['locations'])) {
            foreach ($campaignData['locations'] as &$location) {
                $location['id'] = $this->generateLocationId();
            }
        }
        
        if (isset($campaignData['encounters'])) {
            foreach ($campaignData['encounters'] as &$encounter) {
                $encounter['id'] = $this->generateEncounterId();
            }
        }
        
        // Save duplicate
        $newFilename = $this->dataDir . $campaignData['id'] . '.json';
        $result = file_put_contents($newFilename, json_encode($campaignData, JSON_PRETTY_PRINT));
        
        if ($result === false) {
            throw new Exception('Failed to duplicate campaign');
        }
        
        // Log the operation
        $this->logOperation('duplicate', $campaignData['id'], $campaignData['name']);
        
        return $this->successResponse([
            'message' => 'Campaign duplicated successfully',
            'id' => $campaignData['id'],
            'campaign' => $campaignData
        ]);
    }
    
    private function exportCampaign($campaignId) {
        if (empty($campaignId)) {
            throw new Exception('Campaign ID is required');
        }
        
        $filename = $this->dataDir . $campaignId . '.json';
        
        if (!file_exists($filename)) {
            throw new Exception('Campaign not found');
        }
        
        $campaignData = json_decode(file_get_contents($filename), true);
        
        // Add export metadata
        $exportData = [
            'campaign' => $campaignData,
            'exportedAt' => date('Y-m-d H:i:s'),
            'exportedBy' => $_SESSION['user_id'] ?? 'unknown',
            'version' => '1.0',
            'type' => 'campaign_export'
        ];
        
        // Log the operation
        $this->logOperation('export', $campaignId, $campaignData['name']);
        
        return $this->successResponse([
            'export' => $exportData
        ]);
    }
    
    private function importCampaign($campaignData) {
        // If this is an export format, extract the campaign data
        if (isset($campaignData['campaign'])) {
            $campaignData = $campaignData['campaign'];
        }
        
        // Generate new ID for imported campaign
        $campaignData['id'] = $this->generateId();
        $campaignData['name'] = $campaignData['name'] . ' (Imported)';
        $campaignData['createdAt'] = date('Y-m-d H:i:s');
        $campaignData['updatedAt'] = date('Y-m-d H:i:s');
        
        // Validate and save
        return $this->saveCampaign($campaignData);
    }
    
    private function searchCampaigns($query) {
        $results = [];
        $files = glob($this->dataDir . '*.json');
        
        foreach ($files as $file) {
            $campaignData = json_decode(file_get_contents($file), true);
            if ($campaignData) {
                // Search in name, setting, tone, description
                $searchableText = strtolower(
                    $campaignData['name'] . ' ' . 
                    $campaignData['setting'] . ' ' . 
                    $campaignData['tone'] . ' ' . 
                    $campaignData['description']
                );
                
                if (strpos($searchableText, strtolower($query)) !== false) {
                    $results[] = [
                        'id' => $campaignData['id'],
                        'name' => $campaignData['name'],
                        'setting' => $campaignData['setting'],
                        'tone' => $campaignData['tone'],
                        'description' => substr($campaignData['description'], 0, 200) . '...',
                        'createdAt' => $campaignData['createdAt'],
                        'updatedAt' => $campaignData['updatedAt']
                    ];
                }
            }
        }
        
        return $this->successResponse([
            'results' => $results,
            'count' => count($results),
            'query' => $query
        ]);
    }
    
    private function addSessionNote($data) {
        $campaignId = $data['campaign_id'] ?? '';
        $note = $data['note'] ?? '';
        
        if (empty($campaignId) || empty($note)) {
            throw new Exception('Campaign ID and note are required');
        }
        
        $sessionNote = [
            'id' => $this->generateId(),
            'campaign_id' => $campaignId,
            'note' => htmlspecialchars($note, ENT_QUOTES, 'UTF-8'),
            'session_date' => $data['session_date'] ?? date('Y-m-d'),
            'created_at' => date('Y-m-d H:i:s'),
            'created_by' => $_SESSION['user_id'] ?? 'unknown'
        ];
        
        // Save session note to separate file
        $notesDir = $this->dataDir . 'session_notes/';
        if (!file_exists($notesDir)) {
            mkdir($notesDir, 0755, true);
        }
        
        $notesFile = $notesDir . $campaignId . '_notes.json';
        $notes = [];
        
        if (file_exists($notesFile)) {
            $notes = json_decode(file_get_contents($notesFile), true) ?: [];
        }
        
        $notes[] = $sessionNote;
        
        file_put_contents($notesFile, json_encode($notes, JSON_PRETTY_PRINT));
        
        return $this->successResponse([
            'message' => 'Session note added successfully',
            'note' => $sessionNote
        ]);
    }
    
    private function getSessionNotes($campaignId) {
        if (empty($campaignId)) {
            throw new Exception('Campaign ID is required');
        }
        
        $notesFile = $this->dataDir . 'session_notes/' . $campaignId . '_notes.json';
        
        if (!file_exists($notesFile)) {
            return $this->successResponse(['notes' => []]);
        }
        
        $notes = json_decode(file_get_contents($notesFile), true) ?: [];
        
        // Sort by date (newest first)
        usort($notes, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        return $this->successResponse([
            'notes' => $notes,
            'count' => count($notes)
        ]);
    }
    
    private function generateCampaignSummary($campaignId) {
        if (empty($campaignId)) {
            throw new Exception('Campaign ID is required');
        }
        
        $campaignData = $this->loadCampaign($campaignId)['campaign'];
        
        $summary = [
            'campaign_info' => [
                'name' => $campaignData['name'],
                'setting' => $campaignData['setting'],
                'tone' => $campaignData['tone'],
                'starting_level' => $campaignData['startingLevel'],
                'player_count' => $campaignData['playerCount']
            ],
            'statistics' => [
                'npc_count' => count($campaignData['npcs'] ?? []),
                'location_count' => count($campaignData['locations'] ?? []),
                'encounter_count' => count($campaignData['encounters'] ?? []),
                'sessions_planned' => $campaignData['sessionCount']
            ],
            'content_breakdown' => [
                'npc_roles' => $this->analyzeNPCRoles($campaignData['npcs'] ?? []),
                'location_types' => $this->analyzeLocationTypes($campaignData['locations'] ?? []),
                'encounter_types' => $this->analyzeEncounterTypes($campaignData['encounters'] ?? [])
            ],
            'generated_at' => date('Y-m-d H:i:s')
        ];
        
        return $this->successResponse($summary);
    }
    
    private function processNPCs($npcs) {
        $processed = [];
        
        foreach ($npcs as $npc) {
            if (!empty($npc['name'])) {
                $processed[] = [
                    'id' => $npc['id'] ?? $this->generateNPCId(),
                    'name' => htmlspecialchars($npc['name'], ENT_QUOTES, 'UTF-8'),
                    'role' => $npc['role'] ?? 'Neutral',
                    'location' => htmlspecialchars($npc['location'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'description' => htmlspecialchars($npc['description'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'created_at' => $npc['created_at'] ?? date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
            }
        }
        
        return $processed;
    }
    
    private function processLocations($locations) {
        $processed = [];
        
        foreach ($locations as $location) {
            if (!empty($location['name'])) {
                $processed[] = [
                    'id' => $location['id'] ?? $this->generateLocationId(),
                    'name' => htmlspecialchars($location['name'], ENT_QUOTES, 'UTF-8'),
                    'type' => $location['type'] ?? 'City',
                    'danger' => $location['danger'] ?? 'Safe',
                    'description' => htmlspecialchars($location['description'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'created_at' => $location['created_at'] ?? date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
            }
        }
        
        return $processed;
    }
    
    private function processEncounters($encounters) {
        $processed = [];
        
        foreach ($encounters as $encounter) {
            if (!empty($encounter['name'])) {
                $processed[] = [
                    'id' => $encounter['id'] ?? $this->generateEncounterId(),
                    'name' => htmlspecialchars($encounter['name'], ENT_QUOTES, 'UTF-8'),
                    'type' => $encounter['type'] ?? 'Combat',
                    'difficulty' => $encounter['difficulty'] ?? 'Medium',
                    'description' => htmlspecialchars($encounter['description'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'created_at' => $encounter['created_at'] ?? date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
            }
        }
        
        return $processed;
    }
    
    private function analyzeNPCRoles($npcs) {
        $roles = [];
        foreach ($npcs as $npc) {
            $role = $npc['role'] ?? 'Unknown';
            $roles[$role] = ($roles[$role] ?? 0) + 1;
        }
        return $roles;
    }
    
    private function analyzeLocationTypes($locations) {
        $types = [];
        foreach ($locations as $location) {
            $type = $location['type'] ?? 'Unknown';
            $types[$type] = ($types[$type] ?? 0) + 1;
        }
        return $types;
    }
    
    private function analyzeEncounterTypes($encounters) {
        $types = [];
        foreach ($encounters as $encounter) {
            $type = $encounter['type'] ?? 'Unknown';
            $types[$type] = ($types[$type] ?? 0) + 1;
        }
        return $types;
    }
    
    private function validateCampaignData($data) {
        $errors = [];
        
        // Required fields
        $requiredFields = ['name', 'startingLevel', 'playerCount'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                $errors[] = ucfirst($field) . ' is required';
            }
        }
        
        // Name validation
        if (!empty($data['name'])) {
            if (strlen($data['name']) < 1 || strlen($data['name']) > 100) {
                $errors[] = 'Campaign name must be 1-100 characters long';
            }
        }
        
        // Level validation
        if (!empty($data['startingLevel'])) {
            $level = intval($data['startingLevel']);
            if ($level < 1 || $level > 20) {
                $errors[] = 'Starting level must be between 1 and 20';
            }
        }
        
        // Player count validation
        if (!empty($data['playerCount'])) {
            $playerCount = intval($data['playerCount']);
            if ($playerCount < 1 || $playerCount > 8) {
                $errors[] = 'Player count must be between 1 and 8';
            }
        }
        
        // Session count validation
        if (!empty($data['sessionCount'])) {
            $sessionCount = intval($data['sessionCount']);
            if ($sessionCount < 1 || $sessionCount > 1000) {
                $errors[] = 'Session count must be between 1 and 1000';
            }
        }
        
        // Text field length validation
        $textFields = [
            'description' => 2000,
            'nextSessionPlans' => 1000,
            'plotHooks' => 1000,
            'worldBuilding' => 2000,
            'playerNotes' => 1000
        ];
        
        foreach ($textFields as $field => $maxLength) {
            if (!empty($data[$field]) && strlen($data[$field]) > $maxLength) {
                $errors[] = ucfirst($field) . ' must be no more than ' . $maxLength . ' characters';
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
    
    private function sanitizeCampaignData($data) {
        // Sanitize string fields
        $stringFields = [
            'name', 'setting', 'tone', 'description', 'nextSessionPlans', 
            'plotHooks', 'worldBuilding', 'playerNotes'
        ];
        
        foreach ($stringFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = htmlspecialchars(strip_tags($data[$field]), ENT_QUOTES, 'UTF-8');
            }
        }
        
        // Sanitize numeric fields
        $numericFields = ['startingLevel', 'playerCount', 'sessionCount'];
        
        foreach ($numericFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = intval($data[$field]);
            }
        }
        
        return $data;
    }
    
    private function generateId() {
        return 'camp_' . bin2hex(random_bytes(8)) . '_' . time();
    }
    
    private function generateNPCId() {
        return 'npc_' . bin2hex(random_bytes(6)) . '_' . time();
    }
    
    private function generateLocationId() {
        return 'loc_' . bin2hex(random_bytes(6)) . '_' . time();
    }
    
    private function generateEncounterId() {
        return 'enc_' . bin2hex(random_bytes(6)) . '_' . time();
    }
    
    private function logOperation($operation, $campaignId, $campaignName) {
        $timestamp = date('Y-m-d H:i:s');
        $userId = $_SESSION['user_id'] ?? 'unknown';
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        $logEntry = sprintf(
            "[%s] %s - Operation: %s, Campaign: %s (%s), User: %s, IP: %s\n",
            $timestamp,
            strtoupper($operation),
            $operation,
            $campaignName,
            $campaignId,
            $userId,
            $ip
        );
        
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    private function isAuthenticated() {
        return isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
    }
    
    private function successResponse($data = []) {
        return array_merge(['success' => true], $data);
    }
    
    private function errorResponse($message, $data = []) {
        return array_merge(['success' => false, 'error' => $message], $data);
    }
}

// Handle the request
$api = new CampaignAPI();
echo json_encode($api->handleRequest());
?>
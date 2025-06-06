<?php
/**
 * D&D Creator Hub - Character Management API
 * Handles character CRUD operations, validation, and storage
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

class CharacterAPI {
    private $dataDir;
    private $logFile;
    
    public function __construct() {
        $this->dataDir = '../data/characters/';
        $this->logFile = '../data/character_operations.log';
        
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
                    return $this->saveCharacter($input['character'] ?? []);
                    
                case 'load':
                    return $this->loadCharacter($_GET['id'] ?? '');
                    
                case 'list':
                    return $this->listCharacters();
                    
                case 'delete':
                    return $this->deleteCharacter($input['id'] ?? '');
                    
                case 'duplicate':
                    return $this->duplicateCharacter($input['id'] ?? '');
                    
                case 'export':
                    return $this->exportCharacter($_GET['id'] ?? '');
                    
                case 'import':
                    return $this->importCharacter($input['character'] ?? []);
                    
                case 'search':
                    return $this->searchCharacters($input['query'] ?? '');
                    
                case 'validate':
                    return $this->validateCharacter($input['character'] ?? []);
                    
                default:
                    throw new Exception('Invalid action');
            }
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
    
    private function saveCharacter($characterData) {
        // Validate character data
        $validation = $this->validateCharacterData($characterData);
        if (!$validation['valid']) {
            return $this->errorResponse('Validation failed', $validation['errors']);
        }
        
        // Generate ID if new character
        if (empty($characterData['id'])) {
            $characterData['id'] = $this->generateId();
            $characterData['createdAt'] = date('Y-m-d H:i:s');
        }
        
        $characterData['updatedAt'] = date('Y-m-d H:i:s');
        
        // Sanitize data
        $characterData = $this->sanitizeCharacterData($characterData);
        
        // Save to file
        $filename = $this->dataDir . $characterData['id'] . '.json';
        $result = file_put_contents($filename, json_encode($characterData, JSON_PRETTY_PRINT));
        
        if ($result === false) {
            throw new Exception('Failed to save character');
        }
        
        // Log the operation
        $this->logOperation('save', $characterData['id'], $characterData['name']);
        
        return $this->successResponse([
            'message' => 'Character saved successfully',
            'id' => $characterData['id'],
            'character' => $characterData
        ]);
    }
    
    private function loadCharacter($characterId) {
        if (empty($characterId)) {
            throw new Exception('Character ID is required');
        }
        
        $filename = $this->dataDir . $characterId . '.json';
        
        if (!file_exists($filename)) {
            throw new Exception('Character not found');
        }
        
        $characterData = json_decode(file_get_contents($filename), true);
        
        if (!$characterData) {
            throw new Exception('Failed to load character data');
        }
        
        // Log the operation
        $this->logOperation('load', $characterId, $characterData['name']);
        
        return $this->successResponse([
            'character' => $characterData
        ]);
    }
    
    private function listCharacters() {
        $characters = [];
        $files = glob($this->dataDir . '*.json');
        
        foreach ($files as $file) {
            $characterData = json_decode(file_get_contents($file), true);
            if ($characterData) {
                // Return summary data for listing
                $characters[] = [
                    'id' => $characterData['id'],
                    'name' => $characterData['name'],
                    'level' => $characterData['level'],
                    'race' => $characterData['race'],
                    'class' => $characterData['class'],
                    'createdAt' => $characterData['createdAt'],
                    'updatedAt' => $characterData['updatedAt']
                ];
            }
        }
        
        // Sort by updated date (most recent first)
        usort($characters, function($a, $b) {
            return strtotime($b['updatedAt']) - strtotime($a['updatedAt']);
        });
        
        return $this->successResponse([
            'characters' => $characters,
            'count' => count($characters)
        ]);
    }
    
    private function deleteCharacter($characterId) {
        if (empty($characterId)) {
            throw new Exception('Character ID is required');
        }
        
        $filename = $this->dataDir . $characterId . '.json';
        
        if (!file_exists($filename)) {
            throw new Exception('Character not found');
        }
        
        // Get character name for logging
        $characterData = json_decode(file_get_contents($filename), true);
        $characterName = $characterData['name'] ?? 'Unknown';
        
        if (!unlink($filename)) {
            throw new Exception('Failed to delete character');
        }
        
        // Log the operation
        $this->logOperation('delete', $characterId, $characterName);
        
        return $this->successResponse([
            'message' => 'Character deleted successfully'
        ]);
    }
    
    private function duplicateCharacter($characterId) {
        if (empty($characterId)) {
            throw new Exception('Character ID is required');
        }
        
        $originalFilename = $this->dataDir . $characterId . '.json';
        
        if (!file_exists($originalFilename)) {
            throw new Exception('Character not found');
        }
        
        $characterData = json_decode(file_get_contents($originalFilename), true);
        
        // Create duplicate with new ID and modified name
        $characterData['id'] = $this->generateId();
        $characterData['name'] = $characterData['name'] . ' (Copy)';
        $characterData['createdAt'] = date('Y-m-d H:i:s');
        $characterData['updatedAt'] = date('Y-m-d H:i:s');
        
        // Save duplicate
        $newFilename = $this->dataDir . $characterData['id'] . '.json';
        $result = file_put_contents($newFilename, json_encode($characterData, JSON_PRETTY_PRINT));
        
        if ($result === false) {
            throw new Exception('Failed to duplicate character');
        }
        
        // Log the operation
        $this->logOperation('duplicate', $characterData['id'], $characterData['name']);
        
        return $this->successResponse([
            'message' => 'Character duplicated successfully',
            'id' => $characterData['id'],
            'character' => $characterData
        ]);
    }
    
    private function exportCharacter($characterId) {
        if (empty($characterId)) {
            throw new Exception('Character ID is required');
        }
        
        $filename = $this->dataDir . $characterId . '.json';
        
        if (!file_exists($filename)) {
            throw new Exception('Character not found');
        }
        
        $characterData = json_decode(file_get_contents($filename), true);
        
        // Add export metadata
        $exportData = [
            'character' => $characterData,
            'exportedAt' => date('Y-m-d H:i:s'),
            'exportedBy' => $_SESSION['user_id'] ?? 'unknown',
            'version' => '1.0'
        ];
        
        // Log the operation
        $this->logOperation('export', $characterId, $characterData['name']);
        
        return $this->successResponse([
            'export' => $exportData
        ]);
    }
    
    private function importCharacter($characterData) {
        // If this is an export format, extract the character data
        if (isset($characterData['character'])) {
            $characterData = $characterData['character'];
        }
        
        // Generate new ID for imported character
        $characterData['id'] = $this->generateId();
        $characterData['name'] = $characterData['name'] . ' (Imported)';
        $characterData['createdAt'] = date('Y-m-d H:i:s');
        $characterData['updatedAt'] = date('Y-m-d H:i:s');
        
        // Validate and save
        return $this->saveCharacter($characterData);
    }
    
    private function searchCharacters($query) {
        $results = [];
        $files = glob($this->dataDir . '*.json');
        
        foreach ($files as $file) {
            $characterData = json_decode(file_get_contents($file), true);
            if ($characterData) {
                // Search in name, race, class, background
                $searchableText = strtolower(
                    $characterData['name'] . ' ' . 
                    $characterData['race'] . ' ' . 
                    $characterData['class'] . ' ' . 
                    $characterData['background']
                );
                
                if (strpos($searchableText, strtolower($query)) !== false) {
                    $results[] = [
                        'id' => $characterData['id'],
                        'name' => $characterData['name'],
                        'level' => $characterData['level'],
                        'race' => $characterData['race'],
                        'class' => $characterData['class'],
                        'background' => $characterData['background'],
                        'createdAt' => $characterData['createdAt'],
                        'updatedAt' => $characterData['updatedAt']
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
    
    private function validateCharacter($characterData) {
        $validation = $this->validateCharacterData($characterData);
        
        return $this->successResponse([
            'valid' => $validation['valid'],
            'errors' => $validation['errors']
        ]);
    }
    
    private function validateCharacterData($data) {
        $errors = [];
        
        // Required fields
        $requiredFields = ['name', 'level', 'race', 'class'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                $errors[] = ucfirst($field) . ' is required';
            }
        }
        
        // Name validation
        if (!empty($data['name'])) {
            if (strlen($data['name']) < 1 || strlen($data['name']) > 50) {
                $errors[] = 'Name must be 1-50 characters long';
            }
            if (!preg_match('/^[a-zA-Z0-9\s\-\'\.]+$/', $data['name'])) {
                $errors[] = 'Name contains invalid characters';
            }
        }
        
        // Level validation
        if (!empty($data['level'])) {
            $level = intval($data['level']);
            if ($level < 1 || $level > 20) {
                $errors[] = 'Level must be between 1 and 20';
            }
        }
        
        // Ability scores validation
        if (!empty($data['abilities'])) {
            foreach ($data['abilities'] as $ability => $score) {
                $score = intval($score);
                if ($score < 3 || $score > 20) {
                    $errors[] = ucfirst($ability) . ' score must be between 3 and 20';
                }
            }
        }
        
        // Combat stats validation
        if (!empty($data['armorClass'])) {
            $ac = intval($data['armorClass']);
            if ($ac < 5 || $ac > 30) {
                $errors[] = 'Armor Class must be between 5 and 30';
            }
        }
        
        if (!empty($data['hitPoints'])) {
            $hp = intval($data['hitPoints']);
            if ($hp < 1 || $hp > 1000) {
                $errors[] = 'Hit Points must be between 1 and 1000';
            }
        }
        
        if (!empty($data['speed'])) {
            $speed = intval($data['speed']);
            if ($speed < 0 || $speed > 200) {
                $errors[] = 'Speed must be between 0 and 200';
            }
        }
        
        // Text field length validation
        $textFields = [
            'personalityTraits' => 1000,
            'backstory' => 2000,
            'weapons' => 500,
            'equipment' => 1000,
            'knownSpells' => 1000
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
    
    private function sanitizeCharacterData($data) {
        // Sanitize string fields
        $stringFields = [
            'name', 'race', 'class', 'background', 'personalityTraits', 
            'backstory', 'weapons', 'equipment', 'knownSpells', 'spellcastingAbility'
        ];
        
        foreach ($stringFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = htmlspecialchars(strip_tags($data[$field]), ENT_QUOTES, 'UTF-8');
            }
        }
        
        // Sanitize numeric fields
        $numericFields = [
            'level', 'proficiencyBonus', 'armorClass', 'hitPoints', 'speed', 'spellSaveDC'
        ];
        
        foreach ($numericFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = intval($data[$field]);
            }
        }
        
        // Sanitize ability scores
        if (isset($data['abilities']) && is_array($data['abilities'])) {
            foreach ($data['abilities'] as $ability => $score) {
                $data['abilities'][$ability] = intval($score);
            }
        }
        
        // Sanitize arrays
        $arrayFields = ['skills', 'savingThrows'];
        foreach ($arrayFields as $field) {
            if (isset($data[$field]) && is_array($data[$field])) {
                $data[$field] = array_map(function($item) {
                    return htmlspecialchars(strip_tags($item), ENT_QUOTES, 'UTF-8');
                }, $data[$field]);
            }
        }
        
        return $data;
    }
    
    private function generateId() {
        return 'char_' . bin2hex(random_bytes(8)) . '_' . time();
    }
    
    private function logOperation($operation, $characterId, $characterName) {
        $timestamp = date('Y-m-d H:i:s');
        $userId = $_SESSION['user_id'] ?? 'unknown';
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        $logEntry = sprintf(
            "[%s] %s - Operation: %s, Character: %s (%s), User: %s, IP: %s\n",
            $timestamp,
            strtoupper($operation),
            $operation,
            $characterName,
            $characterId,
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
$api = new CharacterAPI();
echo json_encode($api->handleRequest());
?>
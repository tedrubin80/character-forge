<?php
/**
 * D&D Creator Hub - Baldur's Gate 3 Data Management API
 * Handles BG3 playthrough tracking, companion approval, romance progression, and story choices
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

class BG3API {
    private $dataDir;
    private $logFile;
    
    public function __construct() {
        $this->dataDir = '../data/bg3/';
        $this->logFile = '../data/bg3_operations.log';
        
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
                    return $this->savePlaythrough($input['playthrough'] ?? []);
                    
                case 'load':
                    return $this->loadPlaythrough($_GET['id'] ?? '');
                    
                case 'list':
                    return $this->listPlaythroughs();
                    
                case 'delete':
                    return $this->deletePlaythrough($input['id'] ?? '');
                    
                case 'update_companion':
                    return $this->updateCompanionApproval($input);
                    
                case 'get_companions':
                    return $this->getCompanions($_GET['playthrough_id'] ?? '');
                    
                case 'update_romance':
                    return $this->updateRomanceProgress($input);
                    
                case 'get_story_progress':
                    return $this->getStoryProgress($_GET['playthrough_id'] ?? '');
                    
                case 'update_story_choice':
                    return $this->updateStoryChoice($input);
                    
                case 'get_statistics':
                    return $this->getStatistics($_GET['playthrough_id'] ?? '');
                    
                case 'export':
                    return $this->exportPlaythrough($_GET['id'] ?? '');
                    
                case 'import':
                    return $this->importPlaythrough($input['playthrough'] ?? []);
                    
                case 'search':
                    return $this->searchPlaythroughs($input['query'] ?? '');
                    
                case 'test':
                    return $this->testConnection();
                    
                default:
                    throw new Exception('Invalid action');
            }
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
    
    private function savePlaythrough($playthroughData) {
        // Validate playthrough data
        $validation = $this->validatePlaythroughData($playthroughData);
        if (!$validation['valid']) {
            return $this->errorResponse('Validation failed', $validation['errors']);
        }
        
        // Generate ID if new playthrough
        if (empty($playthroughData['id'])) {
            $playthroughData['id'] = $this->generateId();
            $playthroughData['createdAt'] = date('Y-m-d H:i:s');
        }
        
        $playthroughData['updatedAt'] = date('Y-m-d H:i:s');
        
        // Sanitize data
        $playthroughData = $this->sanitizePlaythroughData($playthroughData);
        
        // Process companions
        if (isset($playthroughData['companions'])) {
            $playthroughData['companions'] = $this->processCompanions($playthroughData['companions']);
        }
        
        // Save to file
        $filename = $this->dataDir . $playthroughData['id'] . '.json';
        $result = file_put_contents($filename, json_encode($playthroughData, JSON_PRETTY_PRINT));
        
        if ($result === false) {
            throw new Exception('Failed to save BG3 playthrough');
        }
        
        // Log the operation
        $this->logOperation('save', $playthroughData['id'], $this->getPlaythroughName($playthroughData));
        
        return $this->successResponse([
            'message' => 'BG3 playthrough saved successfully',
            'id' => $playthroughData['id'],
            'playthrough' => $playthroughData
        ]);
    }
    
    private function loadPlaythrough($playthroughId) {
        if (empty($playthroughId)) {
            throw new Exception('Playthrough ID is required');
        }
        
        $filename = $this->dataDir . $playthroughId . '.json';
        
        if (!file_exists($filename)) {
            throw new Exception('BG3 playthrough not found');
        }
        
        $playthroughData = json_decode(file_get_contents($filename), true);
        
        if (!$playthroughData) {
            throw new Exception('Failed to load BG3 playthrough data');
        }
        
        // Log the operation
        $this->logOperation('load', $playthroughId, $this->getPlaythroughName($playthroughData));
        
        return $this->successResponse([
            'playthrough' => $playthroughData
        ]);
    }
    
    private function listPlaythroughs() {
        $playthroughs = [];
        $files = glob($this->dataDir . '*.json');
        
        foreach ($files as $file) {
            $playthroughData = json_decode(file_get_contents($file), true);
            if ($playthroughData) {
                // Return summary data for listing
                $playthroughs[] = [
                    'id' => $playthroughData['id'],
                    'characterBuild' => $playthroughData['characterBuild'] ?? [],
                    'storyProgress' => [
                        'currentAct' => $playthroughData['storyProgress']['currentAct'] ?? 1,
                        'currentLocation' => $playthroughData['storyProgress']['currentLocation'] ?? ''
                    ],
                    'romance' => [
                        'target' => $playthroughData['romance']['target'] ?? '',
                        'progress' => $playthroughData['romance']['progress'] ?? 0
                    ],
                    'gameSettings' => $playthroughData['gameSettings'] ?? [],
                    'companionCount' => count($playthroughData['companions'] ?? []),
                    'equipmentCount' => count($playthroughData['equipment'] ?? []),
                    'createdAt' => $playthroughData['createdAt'],
                    'updatedAt' => $playthroughData['updatedAt']
                ];
            }
        }
        
        // Sort by updated date (most recent first)
        usort($playthroughs, function($a, $b) {
            return strtotime($b['updatedAt']) - strtotime($a['updatedAt']);
        });
        
        return $this->successResponse([
            'playthroughs' => $playthroughs,
            'count' => count($playthroughs)
        ]);
    }
    
    private function deletePlaythrough($playthroughId) {
        if (empty($playthroughId)) {
            throw new Exception('Playthrough ID is required');
        }
        
        $filename = $this->dataDir . $playthroughId . '.json';
        
        if (!file_exists($filename)) {
            throw new Exception('BG3 playthrough not found');
        }
        
        // Get playthrough name for logging
        $playthroughData = json_decode(file_get_contents($filename), true);
        $playthroughName = $this->getPlaythroughName($playthroughData);
        
        if (!unlink($filename)) {
            throw new Exception('Failed to delete BG3 playthrough');
        }
        
        // Log the operation
        $this->logOperation('delete', $playthroughId, $playthroughName);
        
        return $this->successResponse([
            'message' => 'BG3 playthrough deleted successfully'
        ]);
    }
    
    private function updateCompanionApproval($data) {
        $playthroughId = $data['playthrough_id'] ?? '';
        $companionName = $data['companion_name'] ?? '';
        $newApproval = intval($data['approval'] ?? 0);
        
        if (empty($playthroughId) || empty($companionName)) {
            throw new Exception('Playthrough ID and companion name are required');
        }
        
        $playthroughData = $this->loadPlaythrough($playthroughId)['playthrough'];
        
        // Find and update companion
        foreach ($playthroughData['companions'] as &$companion) {
            if ($companion['name'] === $companionName) {
                $companion['approval'] = max(0, min(100, $newApproval));
                $companion['updated_at'] = date('Y-m-d H:i:s');
                break;
            }
        }
        
        // Save updated playthrough
        $this->savePlaythrough($playthroughData);
        
        return $this->successResponse([
            'message' => 'Companion approval updated',
            'companion' => $companionName,
            'approval' => $newApproval
        ]);
    }
    
    private function getCompanions($playthroughId) {
        if (empty($playthroughId)) {
            throw new Exception('Playthrough ID is required');
        }
        
        $playthroughData = $this->loadPlaythrough($playthroughId)['playthrough'];
        
        return $this->successResponse([
            'companions' => $playthroughData['companions'] ?? []
        ]);
    }
    
    private function updateRomanceProgress($data) {
        $playthroughId = $data['playthrough_id'] ?? '';
        $romanceTarget = $data['target'] ?? '';
        $progress = intval($data['progress'] ?? 0);
        $notes = $data['notes'] ?? '';
        
        if (empty($playthroughId)) {
            throw new Exception('Playthrough ID is required');
        }
        
        $playthroughData = $this->loadPlaythrough($playthroughId)['playthrough'];
        
        $playthroughData['romance'] = [
            'target' => $romanceTarget,
            'progress' => max(0, min(100, $progress)),
            'notes' => htmlspecialchars($notes, ENT_QUOTES, 'UTF-8'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $this->savePlaythrough($playthroughData);
        
        return $this->successResponse([
            'message' => 'Romance progress updated',
            'romance' => $playthroughData['romance']
        ]);
    }
    
    private function getStoryProgress($playthroughId) {
        if (empty($playthroughId)) {
            throw new Exception('Playthrough ID is required');
        }
        
        $playthroughData = $this->loadPlaythrough($playthroughId)['playthrough'];
        
        return $this->successResponse([
            'storyProgress' => $playthroughData['storyProgress'] ?? []
        ]);
    }
    
    private function updateStoryChoice($data) {
        $playthroughId = $data['playthrough_id'] ?? '';
        $act = intval($data['act'] ?? 1);
        $choice = $data['choice'] ?? '';
        $completed = $data['completed'] ?? false;
        
        if (empty($playthroughId) || empty($choice)) {
            throw new Exception('Playthrough ID and choice are required');
        }
        
        $playthroughData = $this->loadPlaythrough($playthroughId)['playthrough'];
        
        if (!isset($playthroughData['storyProgress']['choices'])) {
            $playthroughData['storyProgress']['choices'] = [];
        }
        
        $choiceKey = "act{$act}_{$choice}";
        $playthroughData['storyProgress']['choices'][$choiceKey] = [
            'choice' => $choice,
            'act' => $act,
            'completed' => $completed,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        $this->savePlaythrough($playthroughData);
        
        return $this->successResponse([
            'message' => 'Story choice updated',
            'choice' => $playthroughData['storyProgress']['choices'][$choiceKey]
        ]);
    }
    
    private function getStatistics($playthroughId = '') {
        if (!empty($playthroughId)) {
            // Statistics for specific playthrough
            $playthroughData = $this->loadPlaythrough($playthroughId)['playthrough'];
            
            $stats = [
                'playthrough_id' => $playthroughId,
                'current_act' => $playthroughData['storyProgress']['currentAct'] ?? 1,
                'long_rests' => $playthroughData['camp']['longRests'] ?? 0,
                'short_rests' => $playthroughData['camp']['shortRests'] ?? 0,
                'companion_count' => count($playthroughData['companions'] ?? []),
                'equipment_count' => count($playthroughData['equipment'] ?? []),
                'romance_progress' => $playthroughData['romance']['progress'] ?? 0,
                'romance_target' => $playthroughData['romance']['target'] ?? '',
                'completed_choices' => count($playthroughData['storyProgress']['completedChoices'] ?? []),
                'completed_events' => count($playthroughData['camp']['completedEvents'] ?? [])
            ];
        } else {
            // Global statistics
            $files = glob($this->dataDir . '*.json');
            $totalPlaythroughs = count($files);
            $popularRomances = [];
            $popularClasses = [];
            $popularRaces = [];
            
            foreach ($files as $file) {
                $data = json_decode(file_get_contents($file), true);
                if ($data) {
                    // Count romances
                    $romance = $data['romance']['target'] ?? '';
                    if ($romance) {
                        $popularRomances[$romance] = ($popularRomances[$romance] ?? 0) + 1;
                    }
                    
                    // Count classes
                    $class = $data['characterBuild']['class'] ?? '';
                    if ($class) {
                        $popularClasses[$class] = ($popularClasses[$class] ?? 0) + 1;
                    }
                    
                    // Count races
                    $race = $data['characterBuild']['race'] ?? '';
                    if ($race) {
                        $popularRaces[$race] = ($popularRaces[$race] ?? 0) + 1;
                    }
                }
            }
            
            // Sort by popularity
            arsort($popularRomances);
            arsort($popularClasses);
            arsort($popularRaces);
            
            $stats = [
                'total_playthroughs' => $totalPlaythroughs,
                'popular_romances' => array_slice($popularRomances, 0, 5, true),
                'popular_classes' => array_slice($popularClasses, 0, 5, true),
                'popular_races' => array_slice($popularRaces, 0, 5, true)
            ];
        }
        
        return $this->successResponse($stats);
    }
    
    private function exportPlaythrough($playthroughId) {
        if (empty($playthroughId)) {
            throw new Exception('Playthrough ID is required');
        }
        
        $playthroughData = $this->loadPlaythrough($playthroughId)['playthrough'];
        
        // Add export metadata
        $exportData = [
            'playthrough' => $playthroughData,
            'exportedAt' => date('Y-m-d H:i:s'),
            'exportedBy' => $_SESSION['user_id'] ?? 'unknown',
            'version' => '1.0',
            'type' => 'bg3_playthrough_export'
        ];
        
        // Log the operation
        $this->logOperation('export', $playthroughId, $this->getPlaythroughName($playthroughData));
        
        return $this->successResponse([
            'export' => $exportData
        ]);
    }
    
    private function importPlaythrough($playthroughData) {
        // If this is an export format, extract the playthrough data
        if (isset($playthroughData['playthrough'])) {
            $playthroughData = $playthroughData['playthrough'];
        }
        
        // Generate new ID for imported playthrough
        $playthroughData['id'] = $this->generateId();
        $playthroughData['createdAt'] = date('Y-m-d H:i:s');
        $playthroughData['updatedAt'] = date('Y-m-d H:i:s');
        
        // Mark as imported
        if (isset($playthroughData['characterBuild']['origin'])) {
            $playthroughData['characterBuild']['origin'] .= ' (Imported)';
        }
        
        // Validate and save
        return $this->savePlaythrough($playthroughData);
    }
    
    private function searchPlaythroughs($query) {
        $results = [];
        $files = glob($this->dataDir . '*.json');
        
        foreach ($files as $file) {
            $playthroughData = json_decode(file_get_contents($file), true);
            if ($playthroughData) {
                // Search in character build, story notes, and romance
                $searchableText = strtolower(
                    ($playthroughData['characterBuild']['race'] ?? '') . ' ' .
                    ($playthroughData['characterBuild']['class'] ?? '') . ' ' .
                    ($playthroughData['characterBuild']['origin'] ?? '') . ' ' .
                    ($playthroughData['storyProgress']['questNotes'] ?? '') . ' ' .
                    ($playthroughData['romance']['target'] ?? '') . ' ' .
                    ($playthroughData['storyProgress']['currentLocation'] ?? '')
                );
                
                if (strpos($searchableText, strtolower($query)) !== false) {
                    $results[] = [
                        'id' => $playthroughData['id'],
                        'characterBuild' => $playthroughData['characterBuild'] ?? [],
                        'storyProgress' => [
                            'currentAct' => $playthroughData['storyProgress']['currentAct'] ?? 1,
                            'currentLocation' => $playthroughData['storyProgress']['currentLocation'] ?? ''
                        ],
                        'romance' => [
                            'target' => $playthroughData['romance']['target'] ?? ''
                        ],
                        'createdAt' => $playthroughData['createdAt'],
                        'updatedAt' => $playthroughData['updatedAt']
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
    
    private function testConnection() {
        return $this->successResponse([
            'message' => 'BG3 API connection successful',
            'version' => '1.0',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    
    private function validatePlaythroughData($data) {
        $errors = [];
        
        // Character build validation
        if (isset($data['characterBuild'])) {
            $build = $data['characterBuild'];
            
            // Optional validation for character build completeness
            if (!empty($build['class']) && !in_array($build['class'], [
                'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
                'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
            ])) {
                $errors[] = 'Invalid character class';
            }
        }
        
        // Story progress validation
        if (isset($data['storyProgress'])) {
            $progress = $data['storyProgress'];
            
            if (isset($progress['currentAct'])) {
                $act = intval($progress['currentAct']);
                if ($act < 1 || $act > 3) {
                    $errors[] = 'Current act must be between 1 and 3';
                }
            }
        }
        
        // Romance validation
        if (isset($data['romance'])) {
            $romance = $data['romance'];
            
            if (isset($romance['progress'])) {
                $progress = intval($romance['progress']);
                if ($progress < 0 || $progress > 100) {
                    $errors[] = 'Romance progress must be between 0 and 100';
                }
            }
        }
        
        // Companions validation
        if (isset($data['companions']) && is_array($data['companions'])) {
            foreach ($data['companions'] as $companion) {
                if (isset($companion['approval'])) {
                    $approval = intval($companion['approval']);
                    if ($approval < 0 || $approval > 100) {
                        $errors[] = 'Companion approval must be between 0 and 100';
                    }
                }
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
    
    private function sanitizePlaythroughData($data) {
        // Sanitize string fields
        $stringFields = ['characterBuild', 'storyProgress', 'romance'];
        
        foreach ($stringFields as $section) {
            if (isset($data[$section]) && is_array($data[$section])) {
                foreach ($data[$section] as $key => $value) {
                    if (is_string($value)) {
                        $data[$section][$key] = htmlspecialchars(strip_tags($value), ENT_QUOTES, 'UTF-8');
                    }
                }
            }
        }
        
        return $data;
    }
    
    private function processCompanions($companions) {
        $processed = [];
        
        foreach ($companions as $companion) {
            if (!empty($companion['name'])) {
                $processed[] = [
                    'name' => htmlspecialchars($companion['name'], ENT_QUOTES, 'UTF-8'),
                    'approval' => max(0, min(100, intval($companion['approval'] ?? 0))),
                    'max' => intval($companion['max'] ?? 100),
                    'class' => htmlspecialchars($companion['class'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'description' => htmlspecialchars($companion['description'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
            }
        }
        
        return $processed;
    }
    
    private function getPlaythroughName($playthroughData) {
        $build = $playthroughData['characterBuild'] ?? [];
        $origin = $build['origin'] ?? 'Custom';
        $class = $build['class'] ?? 'Unknown';
        $race = $build['race'] ?? 'Unknown';
        
        if ($origin !== 'Custom') {
            return $origin;
        }
        
        return "{$race} {$class}";
    }
    
    private function generateId() {
        return 'bg3_' . bin2hex(random_bytes(8)) . '_' . time();
    }
    
    private function logOperation($operation, $playthroughId, $playthroughName) {
        $timestamp = date('Y-m-d H:i:s');
        $userId = $_SESSION['user_id'] ?? 'unknown';
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        $logEntry = sprintf(
            "[%s] %s - Operation: %s, Playthrough: %s (%s), User: %s, IP: %s\n",
            $timestamp,
            strtoupper($operation),
            $operation,
            $playthroughName,
            $playthroughId,
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
$api = new BG3API();
echo json_encode($api->handleRequest());
?>
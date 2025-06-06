<?php
/**
 * D&D Creator Hub - Dice Rolling API
 * Handles dice roll logging, statistics, and roll history
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

class DiceAPI {
    private $dataDir;
    private $logFile;
    
    public function __construct() {
        $this->dataDir = '../data/dice/';
        $this->logFile = '../data/dice_operations.log';
        
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
            // Check authentication for write operations
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? $_GET['action'] ?? '';
            
            switch ($action) {
                case 'log_roll':
                    $this->requireAuth();
                    return $this->logRoll($input['roll'] ?? []);
                    
                case 'get_statistics':
                    return $this->getStatistics($_GET['user_id'] ?? '');
                    
                case 'get_roll_history':
                    $this->requireAuth();
                    return $this->getRollHistory($_GET['limit'] ?? 50);
                    
                case 'clear_history':
                    $this->requireAuth();
                    return $this->clearRollHistory();
                    
                case 'get_global_stats':
                    return $this->getGlobalStatistics();
                    
                case 'test':
                    return $this->testConnection();
                    
                default:
                    throw new Exception('Invalid action');
            }
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
    
    private function logRoll($rollData) {
        // Validate roll data
        if (empty($rollData)) {
            throw new Exception('Roll data is required');
        }
        
        // Sanitize and structure roll data
        $roll = [
            'id' => $rollData['id'] ?? $this->generateId(),
            'formula' => htmlspecialchars($rollData['formula'] ?? '', ENT_QUOTES, 'UTF-8'),
            'result' => intval($rollData['total'] ?? 0),
            'rolls' => $rollData['rolls'] ?? [],
            'sides' => intval($rollData['sides'] ?? 20),
            'count' => intval($rollData['count'] ?? 1),
            'modifier' => intval($rollData['modifier'] ?? 0),
            'type' => htmlspecialchars($rollData['type'] ?? 'basic', ENT_QUOTES, 'UTF-8'),
            'critical' => $rollData['critical'] ?? false,
            'fumble' => $rollData['fumble'] ?? false,
            'advantage' => $rollData['advantage'] ?? false,
            'disadvantage' => $rollData['disadvantage'] ?? false,
            'user_id' => $_SESSION['user_id'] ?? session_id(),
            'timestamp' => date('Y-m-d H:i:s'),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];
        
        // Save roll to daily log file
        $date = date('Y-m-d');
        $dailyLogFile = $this->dataDir . "rolls_{$date}.json";
        
        $dailyRolls = [];
        if (file_exists($dailyLogFile)) {
            $content = file_get_contents($dailyLogFile);
            $dailyRolls = json_decode($content, true) ?: [];
        }
        
        $dailyRolls[] = $roll;
        
        // Keep only last 1000 rolls per day to prevent huge files
        if (count($dailyRolls) > 1000) {
            $dailyRolls = array_slice($dailyRolls, -1000);
        }
        
        file_put_contents($dailyLogFile, json_encode($dailyRolls, JSON_PRETTY_PRINT));
        
        // Update user statistics
        $this->updateUserStatistics($roll);
        
        // Log the operation
        $this->logOperation('roll_logged', $roll['formula'], $roll['result']);
        
        return $this->successResponse([
            'message' => 'Roll logged successfully',
            'roll_id' => $roll['id']
        ]);
    }
    
    private function getStatistics($userId = '') {
        $stats = [
            'total_rolls' => 0,
            'critical_hits' => 0,
            'critical_misses' => 0,
            'average_d20' => 0,
            'highest_roll' => 0,
            'most_common_die' => 'd20',
            'roll_types' => [],
            'daily_breakdown' => []
        ];
        
        // Get all roll files
        $rollFiles = glob($this->dataDir . 'rolls_*.json');
        $d20Rolls = [];
        $rollTypeCounts = [];
        $sideCounts = [];
        
        foreach ($rollFiles as $file) {
            $dailyRolls = json_decode(file_get_contents($file), true) ?: [];
            
            foreach ($dailyRolls as $roll) {
                // Filter by user if specified
                if ($userId && $roll['user_id'] !== $userId) {
                    continue;
                }
                
                $stats['total_rolls']++;
                
                if ($roll['critical']) {
                    $stats['critical_hits']++;
                }
                
                if ($roll['fumble']) {
                    $stats['critical_misses']++;
                }
                
                if ($roll['result'] > $stats['highest_roll']) {
                    $stats['highest_roll'] = $roll['result'];
                }
                
                // Track d20 rolls for average
                if ($roll['sides'] == 20 && !empty($roll['rolls'][0])) {
                    $d20Rolls[] = $roll['rolls'][0];
                }
                
                // Count roll types
                $type = $roll['type'] ?? 'basic';
                $rollTypeCounts[$type] = ($rollTypeCounts[$type] ?? 0) + 1;
                
                // Count die sides
                $dieNotation = 'd' . $roll['sides'];
                $sideCounts[$dieNotation] = ($sideCounts[$dieNotation] ?? 0) + 1;
            }
        }
        
        // Calculate average d20 roll
        if (!empty($d20Rolls)) {
            $stats['average_d20'] = round(array_sum($d20Rolls) / count($d20Rolls), 2);
        }
        
        // Find most common die
        if (!empty($sideCounts)) {
            arsort($sideCounts);
            $stats['most_common_die'] = array_keys($sideCounts)[0];
        }
        
        $stats['roll_types'] = $rollTypeCounts;
        
        return $this->successResponse($stats);
    }
    
    private function getRollHistory($limit = 50) {
        $allRolls = [];
        $rollFiles = glob($this->dataDir . 'rolls_*.json');
        
        // Sort files by date (newest first)
        rsort($rollFiles);
        
        foreach ($rollFiles as $file) {
            $dailyRolls = json_decode(file_get_contents($file), true) ?: [];
            
            // Filter to current user
            $userRolls = array_filter($dailyRolls, function($roll) {
                return ($roll['user_id'] ?? '') === ($_SESSION['user_id'] ?? session_id());
            });
            
            $allRolls = array_merge($allRolls, $userRolls);
            
            // Stop if we have enough rolls
            if (count($allRolls) >= $limit) {
                break;
            }
        }
        
        // Sort by timestamp (newest first) and limit
        usort($allRolls, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        
        $allRolls = array_slice($allRolls, 0, $limit);
        
        return $this->successResponse([
            'rolls' => $allRolls,
            'count' => count($allRolls)
        ]);
    }
    
    private function clearRollHistory() {
        $userId = $_SESSION['user_id'] ?? session_id();
        $rollFiles = glob($this->dataDir . 'rolls_*.json');
        $clearedCount = 0;
        
        foreach ($rollFiles as $file) {
            $dailyRolls = json_decode(file_get_contents($file), true) ?: [];
            
            // Remove rolls for current user
            $filteredRolls = array_filter($dailyRolls, function($roll) use ($userId) {
                return ($roll['user_id'] ?? '') !== $userId;
            });
            
            $clearedCount += count($dailyRolls) - count($filteredRolls);
            
            if (empty($filteredRolls)) {
                unlink($file);
            } else {
                file_put_contents($file, json_encode($filteredRolls, JSON_PRETTY_PRINT));
            }
        }
        
        $this->logOperation('history_cleared', 'user_' . $userId, $clearedCount);
        
        return $this->successResponse([
            'message' => 'Roll history cleared',
            'cleared_count' => $clearedCount
        ]);
    }
    
    private function getGlobalStatistics() {
        $stats = [
            'total_users' => 0,
            'total_rolls_today' => 0,
            'total_rolls_all_time' => 0,
            'most_active_user' => '',
            'popular_dice' => [],
            'hourly_activity' => array_fill(0, 24, 0)
        ];
        
        $rollFiles = glob($this->dataDir . 'rolls_*.json');
        $userCounts = [];
        $diceCounts = [];
        $today = date('Y-m-d');
        
        foreach ($rollFiles as $file) {
            $dailyRolls = json_decode(file_get_contents($file), true) ?: [];
            
            $isToday = strpos($file, $today) !== false;
            
            foreach ($dailyRolls as $roll) {
                $stats['total_rolls_all_time']++;
                
                if ($isToday) {
                    $stats['total_rolls_today']++;
                }
                
                // Count users
                $userId = $roll['user_id'] ?? 'unknown';
                $userCounts[$userId] = ($userCounts[$userId] ?? 0) + 1;
                
                // Count dice types
                $dieNotation = 'd' . $roll['sides'];
                $diceCounts[$dieNotation] = ($diceCounts[$dieNotation] ?? 0) + 1;
                
                // Hourly activity
                if ($isToday) {
                    $hour = intval(date('H', strtotime($roll['timestamp'])));
                    $stats['hourly_activity'][$hour]++;
                }
            }
        }
        
        $stats['total_users'] = count($userCounts);
        
        if (!empty($userCounts)) {
            arsort($userCounts);
            $stats['most_active_user'] = array_keys($userCounts)[0];
        }
        
        if (!empty($diceCounts)) {
            arsort($diceCounts);
            $stats['popular_dice'] = array_slice($diceCounts, 0, 5, true);
        }
        
        return $this->successResponse($stats);
    }
    
    private function testConnection() {
        return $this->successResponse([
            'message' => 'Dice API connection successful',
            'version' => '1.0',
            'timestamp' => date('Y-m-d H:i:s'),
            'features' => [
                'roll_logging',
                'statistics',
                'history_tracking',
                'global_stats'
            ]
        ]);
    }
    
    private function updateUserStatistics($roll) {
        $userId = $roll['user_id'];
        $statsFile = $this->dataDir . "user_stats_{$userId}.json";
        
        $userStats = [
            'total_rolls' => 0,
            'critical_hits' => 0,
            'critical_misses' => 0,
            'highest_roll' => 0,
            'favorite_die' => 'd20',
            'last_updated' => date('Y-m-d H:i:s')
        ];
        
        if (file_exists($statsFile)) {
            $existing = json_decode(file_get_contents($statsFile), true);
            if ($existing) {
                $userStats = array_merge($userStats, $existing);
            }
        }
        
        $userStats['total_rolls']++;
        
        if ($roll['critical']) {
            $userStats['critical_hits']++;
        }
        
        if ($roll['fumble']) {
            $userStats['critical_misses']++;
        }
        
        if ($roll['result'] > $userStats['highest_roll']) {
            $userStats['highest_roll'] = $roll['result'];
        }
        
        $userStats['last_updated'] = date('Y-m-d H:i:s');
        
        file_put_contents($statsFile, json_encode($userStats, JSON_PRETTY_PRINT));
    }
    
    private function generateId() {
        return 'roll_' . bin2hex(random_bytes(8)) . '_' . time();
    }
    
    private function logOperation($operation, $formula, $result) {
        $timestamp = date('Y-m-d H:i:s');
        $userId = $_SESSION['user_id'] ?? 'unknown';
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        $logEntry = sprintf(
            "[%s] %s - Operation: %s, Formula: %s, Result: %s, User: %s, IP: %s\n",
            $timestamp,
            strtoupper($operation),
            $operation,
            $formula,
            $result,
            $userId,
            $ip
        );
        
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    private function requireAuth() {
        if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
            throw new Exception('Authentication required');
        }
    }
    
    private function successResponse($data = []) {
        return array_merge(['success' => true], $data);
    }
    
    private function errorResponse($message, $data = []) {
        return array_merge(['success' => false, 'error' => $message], $data);
    }
}

// Handle the request
$api = new DiceAPI();
echo json_encode($api->handleRequest());
?>
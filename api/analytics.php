<?php
/**
 * D&D Creator Hub - Analytics API
 * Handles event tracking, page visits, and usage analytics
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

class AnalyticsAPI {
    private $dataDir;
    private $logFile;
    
    public function __construct() {
        $this->dataDir = '../data/analytics/';
        $this->logFile = '../data/analytics.log';
        
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
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? $_GET['action'] ?? '';
            
            switch ($action) {
                case 'track_event':
                    return $this->trackEvent($input);
                    
                case 'page_visit':
                    return $this->trackPageVisit($input);
                    
                case 'get_analytics':
                    return $this->getAnalytics($_GET['period'] ?? 'today');
                    
                case 'get_page_stats':
                    return $this->getPageStatistics();
                    
                case 'get_user_activity':
                    return $this->getUserActivity($_GET['user_id'] ?? '');
                    
                case 'clear_analytics':
                    return $this->clearAnalytics($_GET['period'] ?? '');
                    
                default:
                    throw new Exception('Invalid action');
            }
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
    
    private function trackEvent($eventData) {
        $event = [
            'id' => $this->generateId(),
            'event_type' => htmlspecialchars($eventData['event_type'] ?? '', ENT_QUOTES, 'UTF-8'),
            'data' => $eventData['data'] ?? [],
            'user_id' => $_SESSION['user_id'] ?? session_id(),
            'session_id' => session_id(),
            'timestamp' => $eventData['timestamp'] ?? date('Y-m-d H:i:s'),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'referer' => $_SERVER['HTTP_REFERER'] ?? ''
        ];
        
        // Save to daily events file
        $date = date('Y-m-d');
        $eventsFile = $this->dataDir . "events_{$date}.json";
        
        $events = [];
        if (file_exists($eventsFile)) {
            $content = file_get_contents($eventsFile);
            $events = json_decode($content, true) ?: [];
        }
        
        $events[] = $event;
        
        // Keep only last 10000 events per day
        if (count($events) > 10000) {
            $events = array_slice($events, -10000);
        }
        
        file_put_contents($eventsFile, json_encode($events, JSON_PRETTY_PRINT));
        
        // Log to main analytics log
        $this->logAnalytics('event', $event['event_type'], json_encode($event['data']));
        
        return $this->successResponse([
            'message' => 'Event tracked successfully',
            'event_id' => $event['id']
        ]);
    }
    
    private function trackPageVisit($visitData) {
        $visit = [
            'id' => $this->generateId(),
            'page' => htmlspecialchars($visitData['page'] ?? '', ENT_QUOTES, 'UTF-8'),
            'user_id' => $_SESSION['user_id'] ?? session_id(),
            'session_id' => session_id(),
            'timestamp' => $visitData['timestamp'] ?? date('Y-m-d H:i:s'),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'referer' => $_SERVER['HTTP_REFERER'] ?? ''
        ];
        
        // Save to daily visits file
        $date = date('Y-m-d');
        $visitsFile = $this->dataDir . "visits_{$date}.json";
        
        $visits = [];
        if (file_exists($visitsFile)) {
            $content = file_get_contents($visitsFile);
            $visits = json_decode($content, true) ?: [];
        }
        
        $visits[] = $visit;
        
        // Keep only last 5000 visits per day
        if (count($visits) > 5000) {
            $visits = array_slice($visits, -5000);
        }
        
        file_put_contents($visitsFile, json_encode($visits, JSON_PRETTY_PRINT));
        
        // Log to main analytics log
        $this->logAnalytics('page_visit', $visit['page'], $visit['user_id']);
        
        return $this->successResponse([
            'message' => 'Page visit tracked successfully',
            'visit_id' => $visit['id']
        ]);
    }
    
    private function getAnalytics($period = 'today') {
        $analytics = [
            'period' => $period,
            'total_events' => 0,
            'total_visits' => 0,
            'unique_users' => 0,
            'popular_pages' => [],
            'event_breakdown' => [],
            'hourly_activity' => array_fill(0, 24, 0),
            'user_activity' => []
        ];
        
        $files = [];
        switch ($period) {
            case 'today':
                $date = date('Y-m-d');
                $files = [
                    'events' => $this->dataDir . "events_{$date}.json",
                    'visits' => $this->dataDir . "visits_{$date}.json"
                ];
                break;
                
            case 'week':
                for ($i = 0; $i < 7; $i++) {
                    $date = date('Y-m-d', strtotime("-{$i} days"));
                    $files['events'][] = $this->dataDir . "events_{$date}.json";
                    $files['visits'][] = $this->dataDir . "visits_{$date}.json";
                }
                break;
                
            case 'month':
                for ($i = 0; $i < 30; $i++) {
                    $date = date('Y-m-d', strtotime("-{$i} days"));
                    $files['events'][] = $this->dataDir . "events_{$date}.json";
                    $files['visits'][] = $this->dataDir . "visits_{$date}.json";
                }
                break;
        }
        
        $uniqueUsers = [];
        $pageStats = [];
        $eventStats = [];
        
        // Process events
        $eventFiles = is_array($files['events']) ? $files['events'] : [$files['events']];
        foreach ($eventFiles as $file) {
            if (file_exists($file)) {
                $events = json_decode(file_get_contents($file), true) ?: [];
                
                foreach ($events as $event) {
                    $analytics['total_events']++;
                    $uniqueUsers[$event['user_id']] = true;
                    
                    // Event type breakdown
                    $type = $event['event_type'];
                    $eventStats[$type] = ($eventStats[$type] ?? 0) + 1;
                    
                    // Hourly activity
                    $hour = intval(date('H', strtotime($event['timestamp'])));
                    $analytics['hourly_activity'][$hour]++;
                }
            }
        }
        
        // Process visits
        $visitFiles = is_array($files['visits']) ? $files['visits'] : [$files['visits']];
        foreach ($visitFiles as $file) {
            if (file_exists($file)) {
                $visits = json_decode(file_get_contents($file), true) ?: [];
                
                foreach ($visits as $visit) {
                    $analytics['total_visits']++;
                    $uniqueUsers[$visit['user_id']] = true;
                    
                    // Page stats
                    $page = $visit['page'];
                    $pageStats[$page] = ($pageStats[$page] ?? 0) + 1;
                    
                    // Hourly activity
                    $hour = intval(date('H', strtotime($visit['timestamp'])));
                    $analytics['hourly_activity'][$hour]++;
                }
            }
        }
        
        $analytics['unique_users'] = count($uniqueUsers);
        
        // Sort and limit popular pages
        arsort($pageStats);
        $analytics['popular_pages'] = array_slice($pageStats, 0, 10, true);
        
        // Sort and limit event breakdown
        arsort($eventStats);
        $analytics['event_breakdown'] = $eventStats;
        
        return $this->successResponse($analytics);
    }
    
    private function getPageStatistics() {
        $pageStats = [];
        $visitFiles = glob($this->dataDir . 'visits_*.json');
        
        foreach ($visitFiles as $file) {
            $visits = json_decode(file_get_contents($file), true) ?: [];
            
            foreach ($visits as $visit) {
                $page = $visit['page'];
                
                if (!isset($pageStats[$page])) {
                    $pageStats[$page] = [
                        'visits' => 0,
                        'unique_users' => [],
                        'last_visit' => $visit['timestamp']
                    ];
                }
                
                $pageStats[$page]['visits']++;
                $pageStats[$page]['unique_users'][$visit['user_id']] = true;
                
                if (strtotime($visit['timestamp']) > strtotime($pageStats[$page]['last_visit'])) {
                    $pageStats[$page]['last_visit'] = $visit['timestamp'];
                }
            }
        }
        
        // Convert unique users to count
        foreach ($pageStats as $page => &$stats) {
            $stats['unique_users'] = count($stats['unique_users']);
        }
        
        return $this->successResponse([
            'page_statistics' => $pageStats
        ]);
    }
    
    private function getUserActivity($userId = '') {
        if (empty($userId)) {
            $userId = $_SESSION['user_id'] ?? session_id();
        }
        
        $userActivity = [
            'user_id' => $userId,
            'total_events' => 0,
            'total_visits' => 0,
            'pages_visited' => [],
            'events_triggered' => [],
            'session_duration' => 0,
            'last_activity' => null,
            'daily_activity' => []
        ];
        
        // Process all files
        $allFiles = array_merge(
            glob($this->dataDir . 'events_*.json'),
            glob($this->dataDir . 'visits_*.json')
        );
        
        $firstActivity = null;
        $lastActivity = null;
        
        foreach ($allFiles as $file) {
            $data = json_decode(file_get_contents($file), true) ?: [];
            
            foreach ($data as $item) {
                if ($item['user_id'] === $userId) {
                    $timestamp = strtotime($item['timestamp']);
                    $date = date('Y-m-d', $timestamp);
                    
                    if (!$firstActivity || $timestamp < $firstActivity) {
                        $firstActivity = $timestamp;
                    }
                    
                    if (!$lastActivity || $timestamp > $lastActivity) {
                        $lastActivity = $timestamp;
                        $userActivity['last_activity'] = $item['timestamp'];
                    }
                    
                    // Track daily activity
                    if (!isset($userActivity['daily_activity'][$date])) {
                        $userActivity['daily_activity'][$date] = 0;
                    }
                    $userActivity['daily_activity'][$date]++;
                    
                    // Differentiate between events and visits
                    if (isset($item['event_type'])) {
                        // Event
                        $userActivity['total_events']++;
                        $type = $item['event_type'];
                        $userActivity['events_triggered'][$type] = ($userActivity['events_triggered'][$type] ?? 0) + 1;
                    } else {
                        // Visit
                        $userActivity['total_visits']++;
                        $page = $item['page'];
                        $userActivity['pages_visited'][$page] = ($userActivity['pages_visited'][$page] ?? 0) + 1;
                    }
                }
            }
        }
        
        if ($firstActivity && $lastActivity) {
            $userActivity['session_duration'] = $lastActivity - $firstActivity;
        }
        
        return $this->successResponse($userActivity);
    }
    
    private function clearAnalytics($period = '') {
        $clearedFiles = 0;
        
        if ($period === 'all') {
            // Clear all analytics files
            $files = glob($this->dataDir . '*.json');
            foreach ($files as $file) {
                unlink($file);
                $clearedFiles++;
            }
            
            // Clear log file
            if (file_exists($this->logFile)) {
                unlink($this->logFile);
            }
        } else {
            // Clear today's data only
            $date = date('Y-m-d');
            $filesToClear = [
                $this->dataDir . "events_{$date}.json",
                $this->dataDir . "visits_{$date}.json"
            ];
            
            foreach ($filesToClear as $file) {
                if (file_exists($file)) {
                    unlink($file);
                    $clearedFiles++;
                }
            }
        }
        
        $this->logAnalytics('analytics_cleared', $period ?: 'today', $clearedFiles);
        
        return $this->successResponse([
            'message' => 'Analytics data cleared',
            'cleared_files' => $clearedFiles
        ]);
    }
    
    private function generateId() {
        return 'analytics_' . bin2hex(random_bytes(6)) . '_' . time();
    }
    
    private function logAnalytics($type, $action, $details) {
        $timestamp = date('Y-m-d H:i:s');
        $userId = $_SESSION['user_id'] ?? 'unknown';
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        $logEntry = sprintf(
            "[%s] %s - Action: %s, Details: %s, User: %s, IP: %s\n",
            $timestamp,
            strtoupper($type),
            $action,
            $details,
            $userId,
            $ip
        );
        
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    private function successResponse($data = []) {
        return array_merge(['success' => true], $data);
    }
    
    private function errorResponse($message, $data = []) {
        return array_merge(['success' => false, 'error' => $message], $data);
    }
}

// Handle the request
$api = new AnalyticsAPI();
echo json_encode($api->handleRequest());
?>
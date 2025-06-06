<?php
/**
 * D&D Creator Hub - Authentication API
 * Handles login, logout, password management, and session security
 */

session_start();

// Enable error reporting for development (disable in production)
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

class AuthAPI {
    private $dataDir;
    private $logFile;
    
    public function __construct() {
        $this->dataDir = '../data/';
        $this->logFile = $this->dataDir . 'access.log';
        
        // Create data directory if it doesn't exist
        if (!file_exists($this->dataDir)) {
            mkdir($this->dataDir, 0755, true);
        }
    }
    
    public function handleRequest() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? $_GET['action'] ?? '';
            
            switch ($action) {
                case 'login':
                    return $this->login($input['password'] ?? '');
                    
                case 'logout':
                    return $this->logout();
                    
                case 'check_auth':
                    return $this->checkAuth();
                    
                case 'get_passwords':
                    return $this->getPasswords();
                    
                case 'add_password':
                    return $this->addPassword($input['password'] ?? '');
                    
                case 'remove_password':
                    return $this->removePassword($input['index'] ?? -1);
                    
                case 'reset_passwords':
                    return $this->resetPasswords();
                    
                case 'get_session_info':
                    return $this->getSessionInfo();
                    
                case 'get_access_log':
                    return $this->getAccessLog();
                    
                case 'clear_access_log':
                    return $this->clearAccessLog();
                    
                default:
                    throw new Exception('Invalid action');
            }
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
    
    private function login($password) {
        if (empty($password)) {
            $this->logAccess('error', 'Empty password attempt', $_SERVER['REMOTE_ADDR']);
            return $this->errorResponse('Password is required');
        }
        
        $validPasswords = $this->getValidPasswords();
        $caseSensitive = $_SESSION['password_settings']['case_sensitive'] ?? false;
        
        $checkPassword = $caseSensitive ? $password : strtolower($password);
        $passwordList = $caseSensitive ? $validPasswords : array_map('strtolower', $validPasswords);
        
        if (in_array($checkPassword, $passwordList)) {
            $_SESSION['authenticated'] = true;
            $_SESSION['login_time'] = time();
            $_SESSION['last_activity'] = time();
            $_SESSION['failed_attempts'] = 0;
            
            $this->logAccess('success', "Successful login with password: {$password}", $_SERVER['REMOTE_ADDR']);
            
            return $this->successResponse([
                'message' => 'Login successful',
                'session_id' => session_id(),
                'login_time' => $_SESSION['login_time']
            ]);
        } else {
            $_SESSION['failed_attempts'] = ($_SESSION['failed_attempts'] ?? 0) + 1;
            $this->logAccess('error', "Failed login attempt with: {$password}", $_SERVER['REMOTE_ADDR']);
            
            return $this->errorResponse('Invalid password', [
                'failed_attempts' => $_SESSION['failed_attempts']
            ]);
        }
    }
    
    private function logout() {
        if (isset($_SESSION['authenticated'])) {
            $this->logAccess('success', 'User logged out', $_SERVER['REMOTE_ADDR']);
        }
        
        session_destroy();
        
        return $this->successResponse(['message' => 'Logged out successfully']);
    }
    
    private function checkAuth() {
        $isAuthenticated = $_SESSION['authenticated'] ?? false;
        
        if ($isAuthenticated) {
            // Update last activity
            $_SESSION['last_activity'] = time();
            
            // Check for auto-logout
            $autoLogoutMinutes = $_SESSION['auto_logout_minutes'] ?? 30;
            if ($autoLogoutMinutes > 0) {
                $inactiveTime = time() - $_SESSION['last_activity'];
                if ($inactiveTime > ($autoLogoutMinutes * 60)) {
                    $this->logout();
                    return $this->errorResponse('Session expired due to inactivity');
                }
            }
        }
        
        return $this->successResponse([
            'authenticated' => $isAuthenticated,
            'login_time' => $_SESSION['login_time'] ?? null,
            'last_activity' => $_SESSION['last_activity'] ?? null
        ]);
    }
    
    private function getPasswords() {
        $this->requireAuth();
        
        $passwords = $this->getValidPasswords();
        
        // Return masked passwords for security
        $maskedPasswords = array_map(function($password) {
            return [
                'length' => strlen($password),
                'masked' => str_repeat('*', strlen($password))
            ];
        }, $passwords);
        
        return $this->successResponse(['passwords' => $maskedPasswords]);
    }
    
    private function addPassword($password) {
        $this->requireAuth();
        
        if (empty($password)) {
            return $this->errorResponse('Password cannot be empty');
        }
        
        if (strlen($password) < 3 || strlen($password) > 20) {
            return $this->errorResponse('Password must be 3-20 characters long');
        }
        
        $passwords = $this->getValidPasswords();
        
        if (in_array($password, $passwords)) {
            return $this->errorResponse('Password already exists');
        }
        
        // Check password requirements
        $settings = $_SESSION['password_settings'] ?? [];
        
        if ($settings['require_numbers'] ?? false) {
            if (!preg_match('/\d/', $password)) {
                return $this->errorResponse('Password must contain at least one number');
            }
        }
        
        if ($settings['require_special'] ?? false) {
            if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
                return $this->errorResponse('Password must contain at least one special character');
            }
        }
        
        $passwords[] = $password;
        $this->savePasswords($passwords);
        
        $this->logAccess('success', "Password added: {$password}", $_SERVER['REMOTE_ADDR']);
        
        return $this->successResponse(['message' => 'Password added successfully']);
    }
    
    private function removePassword($index) {
        $this->requireAuth();
        
        $passwords = $this->getValidPasswords();
        
        if (count($passwords) <= 1) {
            return $this->errorResponse('Cannot remove the last password');
        }
        
        if ($index < 0 || $index >= count($passwords)) {
            return $this->errorResponse('Invalid password index');
        }
        
        $removedPassword = $passwords[$index];
        array_splice($passwords, $index, 1);
        $this->savePasswords($passwords);
        
        $this->logAccess('success', "Password removed: {$removedPassword}", $_SERVER['REMOTE_ADDR']);
        
        return $this->successResponse(['message' => 'Password removed successfully']);
    }
    
    private function resetPasswords() {
        $this->requireAuth();
        
        $defaultPasswords = ['dragon', 'dnd2024', 'admin', 'dungeon', 'master'];
        $this->savePasswords($defaultPasswords);
        
        $this->logAccess('success', 'Passwords reset to defaults', $_SERVER['REMOTE_ADDR']);
        
        return $this->successResponse(['message' => 'Passwords reset to defaults']);
    }
    
    private function getSessionInfo() {
        $this->requireAuth();
        
        return $this->successResponse([
            'login_time' => $_SESSION['login_time'] ?? null,
            'session_duration' => time() - ($_SESSION['login_time'] ?? time()),
            'failed_attempts' => $_SESSION['failed_attempts'] ?? 0,
            'last_activity' => $_SESSION['last_activity'] ?? null,
            'session_id' => session_id()
        ]);
    }
    
    private function getAccessLog() {
        $this->requireAuth();
        
        if (!file_exists($this->logFile)) {
            return $this->successResponse(['log' => []]);
        }
        
        $logContent = file_get_contents($this->logFile);
        $logLines = array_filter(explode("\n", $logContent));
        
        // Parse log lines and return last 50 entries
        $log = array_map(function($line) {
            $parts = explode(' | ', $line);
            return [
                'timestamp' => $parts[0] ?? '',
                'type' => $parts[1] ?? '',
                'message' => $parts[2] ?? '',
                'ip' => $parts[3] ?? ''
            ];
        }, array_slice($logLines, -50));
        
        return $this->successResponse(['log' => array_reverse($log)]);
    }
    
    private function clearAccessLog() {
        $this->requireAuth();
        
        if (file_exists($this->logFile)) {
            unlink($this->logFile);
        }
        
        return $this->successResponse(['message' => 'Access log cleared']);
    }
    
    private function getValidPasswords() {
        $passwordFile = $this->dataDir . 'passwords.json';
        
        if (!file_exists($passwordFile)) {
            $defaultPasswords = ['dragon', 'dnd2024', 'admin', 'dungeon', 'master'];
            $this->savePasswords($defaultPasswords);
            return $defaultPasswords;
        }
        
        $content = file_get_contents($passwordFile);
        $data = json_decode($content, true);
        
        return $data['passwords'] ?? ['dragon', 'dnd2024', 'admin', 'dungeon', 'master'];
    }
    
    private function savePasswords($passwords) {
        $passwordFile = $this->dataDir . 'passwords.json';
        $data = [
            'passwords' => $passwords,
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        file_put_contents($passwordFile, json_encode($data, JSON_PRETTY_PRINT));
    }
    
    private function logAccess($type, $message, $ip = '') {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "{$timestamp} | {$type} | {$message} | {$ip}\n";
        
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    private function requireAuth() {
        if (!($_SESSION['authenticated'] ?? false)) {
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
$api = new AuthAPI();
echo json_encode($api->handleRequest());
?>
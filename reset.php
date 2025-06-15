<?php
/**
 * D&D Creator Hub - Emergency Password Reset
 * Direct password reset that bypasses all security measures
 */

// Start output buffering to catch any errors
ob_start();

// Set headers
header('Content-Type: text/html; charset=UTF-8');

// Create directories if they don't exist
$dataDir = 'data/';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Default passwords
$defaultPasswords = ['dragon', 'dnd2024', 'admin', 'dungeon', 'master'];

// Password file path
$passwordFile = $dataDir . 'passwords.json';

// Function to create password data
function createPasswordData($passwords) {
    return [
        'passwords' => $passwords,
        'created_at' => date('Y-m-d H:i:s'),
        'reset_by' => 'emergency_reset',
        'version' => '1.0'
    ];
}

// Initialize variables
$success = false;
$error = '';
$action = $_GET['action'] ?? '';

// Handle actions
if ($action === 'reset') {
    try {
        $passwordData = createPasswordData($defaultPasswords);
        $result = file_put_contents($passwordFile, json_encode($passwordData, JSON_PRETTY_PRINT));
        
        if ($result !== false) {
            $success = true;
        } else {
            $error = 'Failed to write password file';
        }
    } catch (Exception $e) {
        $error = 'Error: ' . $e->getMessage();
    }
} elseif ($action === 'delete') {
    // Delete this script for security
    if (file_exists(__FILE__)) {
        unlink(__FILE__);
        echo "<div style='background: #d4edda; color: #155724; padding: 20px; border-radius: 5px; margin: 20px; border: 1px solid #c3e6cb;'>";
        echo "<h2>✅ Reset Complete</h2>";
        echo "<p>Password reset script has been deleted for security.</p>";
        echo "<p><a href='test.html'>← Go to Test Page</a> | <a href='index.html'>← Go to Main App</a></p>";
        echo "</div>";
        exit;
    }
}

// Check current password file status
$currentPasswords = [];
$fileExists = file_exists($passwordFile);
if ($fileExists) {
    $data = json_decode(file_get_contents($passwordFile), true);
    $currentPasswords = $data['passwords'] ?? [];
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>D&D Creator Hub - Emergency Password Reset</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(45deg, #667eea, #764ba2);
            min-height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .reset-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            margin-top: 50px;
        }
        .status-box {
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
        }
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="reset-container p-5">
                    <div class="text-center mb-4">
                        <i class="fas fa-shield-alt fa-4x text-warning mb-3"></i>
                        <h1>Emergency Password Reset</h1>
                        <p class="text-muted">D&D Creator Hub Recovery Tool</p>
                    </div>

                    <?php if ($success): ?>
                        <div class="status-box success">
                            <h4><i class="fas fa-check-circle me-2"></i>Reset Successful!</h4>
                            <p>Passwords have been reset to defaults:</p>
                            <ul>
                                <?php foreach ($defaultPasswords as $pwd): ?>
                                    <li><code><?php echo htmlspecialchars($pwd); ?></code></li>
                                <?php endforeach; ?>
                            </ul>
                            <p class="mb-3"><strong>You can now log in with any of these passwords.</strong></p>
                            <div class="d-grid gap-2">
                                <a href="test.html" class="btn btn-primary">
                                    <i class="fas fa-flask me-2"></i>Test Login
                                </a>
                                <a href="index.html" class="btn btn-success">
                                    <i class="fas fa-dragon me-2"></i>Go to Main App
                                </a>
                                <a href="?action=delete" class="btn btn-outline-danger">
                                    <i class="fas fa-trash me-2"></i>Delete This Reset Script
                                </a>
                            </div>
                        </div>
                    <?php elseif ($error): ?>
                        <div class="status-box error">
                            <h4><i class="fas fa-exclamation-triangle me-2"></i>Reset Failed</h4>
                            <p><?php echo htmlspecialchars($error); ?></p>
                        </div>
                    <?php endif; ?>

                    <div class="status-box info">
                        <h5><i class="fas fa-info-circle me-2"></i>Current Status</h5>
                        <p><strong>Password File:</strong> 
                            <?php if ($fileExists): ?>
                                <span class="text-success">Found</span>
                            <?php else: ?>
                                <span class="text-warning">Not Found</span>
                            <?php endif; ?>
                        </p>
                        
                        <?php if (!empty($currentPasswords)): ?>
                            <p><strong>Current Passwords:</strong> <?php echo count($currentPasswords); ?> configured</p>
                        <?php endif; ?>
                        
                        <p><strong>Data Directory:</strong> 
                            <?php if (is_writable($dataDir)): ?>
                                <span class="text-success">Writable</span>
                            <?php else: ?>
                                <span class="text-danger">Not Writable</span>
                            <?php endif; ?>
                        </p>
                    </div>

                    <?php if (!$success): ?>
                        <div class="status-box warning">
                            <h5><i class="fas fa-exclamation-triangle me-2"></i>Before You Reset</h5>
                            <ul>
                                <li>This will replace all existing passwords</li>
                                <li>Default passwords will be restored</li>
                                <li>Any custom passwords will be lost</li>
                                <li>You should delete this script after use</li>
                            </ul>
                        </div>

                        <div class="d-grid gap-2">
                            <a href="?action=reset" class="btn btn-danger btn-lg">
                                <i class="fas fa-key me-2"></i>Reset Passwords Now
                            </a>
                            <a href="index.html" class="btn btn-outline-secondary">
                                <i class="fas fa-arrow-left me-2"></i>Cancel
                            </a>
                        </div>
                    <?php endif; ?>

                    <div class="mt-4 text-center">
                        <small class="text-muted">
                            <i class="fas fa-lock me-1"></i>
                            This tool should only be used in emergencies
                        </small>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        console.log('Emergency reset tool loaded');
        
        // Auto-focus on reset button if not already successful
        <?php if (!$success && !$error): ?>
            setTimeout(() => {
                const resetBtn = document.querySelector('.btn-danger');
                if (resetBtn) resetBtn.focus();
            }, 100);
        <?php endif; ?>
    </script>
</body>
</html>
<?php
/**
 * Authentication Helper Functions
 * Relational Inventory Control & Stock Tracking System
 */

// Session configuration (must be before session_start)
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Set to 1 when using HTTPS

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Check if user is logged in
 * @return bool
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Check if user has specific role
 * @param string $role
 * @return bool
 */
function hasRole($role) {
    return isset($_SESSION['role']) && $_SESSION['role'] === $role;
}

/**
 * Require user to be logged in, redirect to login if not
 */
function requireLogin() {
    if (!isLoggedIn()) {
        $_SESSION['redirect_url'] = $_SERVER['REQUEST_URI'];
        header('Location: modules/auth/login.php');
        exit();
    }
}

/**
 * Require specific role to access page
 * @param string $requiredRole
 */
function requireRole($requiredRole) {
    requireLogin();
    
    if (!hasRole($requiredRole)) {
        $_SESSION['error'] = 'You do not have permission to access this page';
        header('Location: ../dashboard/index.php');
        exit();
    }
}

/**
 * Get current user information
 * @return array|null
 */
function getCurrentUser() {
    if (isLoggedIn()) {
        return [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'full_name' => $_SESSION['full_name'],
            'email' => $_SESSION['email'],
            'role' => $_SESSION['role']
        ];
    }
    return null;
}

/**
 * Check if session has expired (optional timeout feature)
 * @param int $timeoutMinutes
 * @return bool
 */
function isSessionExpired($timeoutMinutes = 120) {
    if (!isset($_SESSION['login_time'])) {
        return true;
    }
    
    $inactiveTime = time() - $_SESSION['login_time'];
    return $inactiveTime > ($timeoutMinutes * 60);
}

/**
 * Refresh session timeout
 */
function refreshSession() {
    $_SESSION['login_time'] = time();
}

/**
 * Sanitize input data
 * @param string $data
 * @return string
 */
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

/**
 * Validate email format
 * @param string $email
 * @return bool
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Generate CSRF token
 * @return string
 */
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verify CSRF token
 * @param string $token
 * @return bool
 */
function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Hash password securely
 * @param string $password
 * @return string
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

/**
 * Verify password
 * @param string $password
 * @param string $hash
 * @return bool
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Set flash message
 * @param string $type (success, error, warning, info)
 * @param string $message
 */
function setFlashMessage($type, $message) {
    $_SESSION['flash_message'] = [
        'type' => $type,
        'message' => $message,
        'time' => time()
    ];
}

/**
 * Get and clear flash message
 * @return array|null
 */
function getFlashMessage() {
    if (isset($_SESSION['flash_message'])) {
        $message = $_SESSION['flash_message'];
        unset($_SESSION['flash_message']);
        return $message;
    }
    return null;
}

/**
 * Display flash message as HTML
 */
function displayFlashMessage() {
    $message = getFlashMessage();
    if ($message) {
        $alertClass = '';
        switch ($message['type']) {
            case 'success':
                $alertClass = 'alert-success';
                break;
            case 'error':
                $alertClass = 'alert-danger';
                break;
            case 'warning':
                $alertClass = 'alert-warning';
                break;
            case 'info':
                $alertClass = 'alert-info';
                break;
            default:
                $alertClass = 'alert-info';
        }
        
        echo '<div class="alert ' . $alertClass . ' alert-dismissible fade show" role="alert">';
        echo htmlspecialchars($message['message']);
        echo '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>';
        echo '</div>';
    }
}

/**
 * Log user activity
 * @param string $activity
 * @param string $description
 */
function logActivity($activity, $description = '') {
    if (isLoggedIn()) {
        try {
            // Check if database connection is already available globally
            if (!isset($GLOBALS['db']) || !$GLOBALS['db']) {
                // Use absolute path to avoid path issues
                $configPath = __DIR__ . '/../config/database.php';
                if (file_exists($configPath)) {
                    require_once $configPath;
                }
                $database = new Database();
                $GLOBALS['db'] = $database->connect();
            }
            
            // This would require creating an activity_logs table
            // For now, we'll use error_log for basic logging
            $logMessage = sprintf(
                "[%s] User %s (%s): %s - %s",
                date('Y-m-d H:i:s'),
                $_SESSION['username'],
                $_SESSION['user_id'],
                $activity,
                $description
            );
            error_log($logMessage);
            
        } catch (PDOException $e) {
            error_log("Activity logging error: " . $e->getMessage());
        }
    }
}

/**
 * Check if user can perform action based on role
 * @param string $action
 * @return bool
 */
function canPerformAction($action) {
    $userRole = $_SESSION['role'] ?? '';
    
    // Define role permissions
    $permissions = [
        'admin' => ['create', 'read', 'update', 'delete', 'manage_users', 'view_reports'],
        'manager' => ['create', 'read', 'update', 'delete', 'view_reports'],
        'employee' => ['create', 'read', 'update', 'delete', 'create_sales', 'create_purchases']
    ];
    
    return in_array($action, $permissions[$userRole] ?? []);
}

/**
 * Redirect with message
 * @param string $url
 * @param string $type
 * @param string $message
 */
function redirectWithMessage($url, $type, $message) {
    setFlashMessage($type, $message);
    header("Location: $url");
    exit();
}
?>

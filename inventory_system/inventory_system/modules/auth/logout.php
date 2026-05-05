<?php
/**
 * Logout Script
 * Relational Inventory Control & Stock Tracking System
 */

// Session configuration (must be before session_start)
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Set to 1 when using HTTPS

// Start session
session_start();

// Include database configuration
require_once '../../config/database.php';

// Log the logout activity if user was logged in
if (isset($_SESSION['user_id'])) {
    try {
        $database = new Database();
        $db = $database->connect();
        
        // You could add a login_logs table to track user sessions
        // For now, we'll just destroy the session
        
        // Optional: Log logout activity
        $query = "INSERT INTO activity_logs (user_id, activity, activity_date) VALUES (?, 'logout', NOW())";
        // This would require creating an activity_logs table
        
    } catch (PDOException $e) {
        // Log error but don't prevent logout
        error_log("Logout logging error: " . $e->getMessage());
    }
}

// Destroy all session data
$_SESSION = array();

// Delete session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destroy session
session_destroy();

// Redirect to login page
header('Location: login.php');
exit();
?>

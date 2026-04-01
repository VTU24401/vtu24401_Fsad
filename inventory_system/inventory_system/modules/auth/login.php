<?php
/**
 * Login Page
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

// Check if user is already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: ../dashboard/index.php');
    exit();
}

// Initialize variables
$username = '';
$password = '';
$email = '';
$full_name = '';
$error = '';
$success = '';
$active_tab = 'login'; // Default tab

// Process login form
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);
    
    // Validate input
    if (empty($username) || empty($password)) {
        $error = 'Please enter both username and password';
    } else {
        try {
            // Database connection
            $database = new Database();
            $db = $database->connect();
            
            // Prepare statement to prevent SQL injection
            $query = "SELECT id, username, password, full_name, email, role FROM users WHERE username = ? AND is_active = 1 LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->execute([$username]);
            
            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch();
                
                // Verify password
                if (password_verify($password, $user['password'])) {
                    // Regenerate session ID to prevent session fixation
                    session_regenerate_id(true);
                    
                    // Set session variables
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['full_name'] = $user['full_name'];
                    $_SESSION['email'] = $user['email'];
                    $_SESSION['role'] = $user['role'];
                    $_SESSION['login_time'] = time();
                    
                    // Redirect to dashboard
                    header('Location: ../dashboard/index.php');
                    exit();
                } else {
                    $error = 'Invalid username or password';
                }
            } else {
                $error = 'Invalid username or password';
            }
        } catch (PDOException $e) {
            $error = 'Database error. Please try again later.';
            // Log error for debugging
            error_log("Login error: " . $e->getMessage());
        }
    }
}

// Process signup form
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'signup') {
    $username = trim($_POST['signup_username']);
    $password = trim($_POST['signup_password']);
    $email = trim($_POST['signup_email']);
    $full_name = trim($_POST['signup_full_name']);
    
    // Validate input
    if (empty($username) || empty($password) || empty($email) || empty($full_name)) {
        $error = 'Please fill in all fields';
    } elseif (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters long';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address';
    } else {
        try {
            // Database connection
            $database = new Database();
            $db = $database->connect();
            
            // Check if username already exists
            $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->rowCount() > 0) {
                $error = 'Username already exists';
            } else {
                // Check if email already exists
                $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$email]);
                if ($stmt->rowCount() > 0) {
                    $error = 'Email already exists';
                } else {
                    // Insert new user
                    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
                    $stmt = $db->prepare("INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, 'employee')");
                    if ($stmt->execute([$username, $hashed_password, $email, $full_name])) {
                        $success = 'Account created successfully! You can now login.';
                        $active_tab = 'login';
                        // Clear signup form
                        $username = '';
                        $password = '';
                        $email = '';
                        $full_name = '';
                    } else {
                        $error = 'Failed to create account. Please try again.';
                    }
                }
            }
        } catch (PDOException $e) {
            $error = 'Database error. Please try again later.';
            error_log("Signup error: " . $e->getMessage());
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Inventory Management System</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <style>
        .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .login-form {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 450px;
        }
        
        .tabs {
            display: flex;
            margin-bottom: 2rem;
            border-bottom: 2px solid #eee;
        }
        
        .tab {
            flex: 1;
            padding: 1rem;
            text-align: center;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 1rem;
            color: #666;
            transition: all 0.3s;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
        }
        
        .tab.active {
            color: #667eea;
            border-bottom-color: #667eea;
            font-weight: 600;
        }
        
        .tab:hover {
            color: #667eea;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .login-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .login-header h1 {
            color: #333;
            margin-bottom: 0.5rem;
        }
        
        .login-header p {
            color: #666;
            font-size: 0.9rem;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            width: 100%;
            padding: 0.75rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .btn:hover {
            background: #5a67d8;
        }
        
        .alert {
            padding: 0.75rem;
            border-radius: 5px;
            margin-bottom: 1rem;
        }
        
        .alert-error {
            background: #fee;
            border: 1px solid #fcc;
            color: #c33;
        }
        
        .alert-success {
            background: #efe;
            border: 1px solid #cfc;
            color: #3c3;
        }
        
        .demo-info {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 5px;
            font-size: 0.85rem;
        }
        
        .demo-info h4 {
            margin-bottom: 0.5rem;
            color: #333;
        }
        
        .demo-info p {
            margin: 0.25rem 0;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-form">
            <div class="login-header">
                <h1>Inventory System</h1>
                <p>Login or create an account</p>
            </div>
            
            <!-- Tabs -->
            <div class="tabs">
                <button class="tab <?php echo $active_tab === 'login' ? 'active' : ''; ?>" onclick="showTab('login')">Login</button>
                <button class="tab <?php echo $active_tab === 'signup' ? 'active' : ''; ?>" onclick="showTab('signup')">Sign Up</button>
            </div>
            
            <?php if (!empty($error)): ?>
                <div class="alert alert-error">
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>
            
            <?php if (!empty($success)): ?>
                <div class="alert alert-success">
                    <?php echo htmlspecialchars($success); ?>
                </div>
            <?php endif; ?>
            
            <!-- Login Tab -->
            <div id="login-tab" class="tab-content <?php echo $active_tab === 'login' ? 'active' : ''; ?>">
                <form method="POST" action="">
                    <input type="hidden" name="action" value="login">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input 
                            type="text" 
                            id="username" 
                            name="username" 
                            value="<?php echo htmlspecialchars($username); ?>"
                            required
                            autocomplete="username"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            required
                            autocomplete="current-password"
                        >
                    </div>
                    
                    <button type="submit" class="btn">Login</button>
                </form>
                
                <div class="demo-info">
                    <h4>Demo Credentials:</h4>
                    <p><strong>Username:</strong> admin</p>
                    <p><strong>Password:</strong> admin123</p>
                </div>
            </div>
            
            <!-- Signup Tab -->
            <div id="signup-tab" class="tab-content <?php echo $active_tab === 'signup' ? 'active' : ''; ?>">
                <form method="POST" action="">
                    <input type="hidden" name="action" value="signup">
                    <div class="form-group">
                        <label for="signup_full_name">Full Name</label>
                        <input 
                            type="text" 
                            id="signup_full_name" 
                            name="signup_full_name" 
                            value="<?php echo htmlspecialchars($full_name); ?>"
                            required
                            autocomplete="name"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="signup_email">Email</label>
                        <input 
                            type="email" 
                            id="signup_email" 
                            name="signup_email" 
                            value="<?php echo htmlspecialchars($email); ?>"
                            required
                            autocomplete="email"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="signup_username">Username</label>
                        <input 
                            type="text" 
                            id="signup_username" 
                            name="signup_username" 
                            value="<?php echo htmlspecialchars($username); ?>"
                            required
                            autocomplete="username"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="signup_password">Password</label>
                        <input 
                            type="password" 
                            id="signup_password" 
                            name="signup_password" 
                            required
                            minlength="6"
                            autocomplete="new-password"
                        >
                        <small style="color: #666; font-size: 0.85rem;">Minimum 6 characters</small>
                    </div>
                    
                    <button type="submit" class="btn">Create Account</button>
                </form>
            </div>
        </div>
    </div>
    
    <script>
        function showTab(tabName) {
            // Hide all tabs
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Remove active class from all tab buttons
            const tabButtons = document.querySelectorAll('.tab');
            tabButtons.forEach(button => button.classList.remove('active'));
            
            // Show selected tab
            document.getElementById(tabName + '-tab').classList.add('active');
            
            // Add active class to clicked button
            event.target.classList.add('active');
        }
    </script>
    <script src="../../assets/js/validation.js"></script>
</body>
</html>

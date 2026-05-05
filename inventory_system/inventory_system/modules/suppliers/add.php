<?php
/**
 * Add Supplier Page
 * Relational Inventory Control & Stock Tracking System
 */

// Include authentication helper
require_once '../../includes/auth_helper.php';

// Require login to access this page
requireLogin();

// Check if user can create suppliers
if (!canPerformAction('create')) {
    setFlashMessage('error', 'You do not have permission to add suppliers');
    header('Location: index.php');
    exit();
}

// Include database configuration
require_once '../../config/database.php';

// Initialize database connection
$database = new Database();
$db = $database->connect();

// Initialize variables
$supplier = [
    'name' => '',
    'contact_person' => '',
    'email' => '',
    'phone' => '',
    'address' => '',
    'city' => '',
    'country' => ''
];

$errors = [];

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Sanitize and validate input
    $supplier['name'] = trim($_POST['name'] ?? '');
    $supplier['contact_person'] = trim($_POST['contact_person'] ?? '');
    $supplier['email'] = trim($_POST['email'] ?? '');
    $supplier['phone'] = trim($_POST['phone'] ?? '');
    $supplier['address'] = trim($_POST['address'] ?? '');
    $supplier['city'] = trim($_POST['city'] ?? '');
    $supplier['country'] = trim($_POST['country'] ?? '');

    // Validation
    if (empty($supplier['name'])) {
        $errors['name'] = 'Supplier name is required';
    }

    if (!empty($supplier['email']) && !filter_var($supplier['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Valid email address is required';
    }

    if (!empty($supplier['phone'])) {
        // Basic phone validation (digits, spaces, +, -, parentheses)
        if (!preg_match('/^[\d\s\-\+\(\)]+$/', $supplier['phone'])) {
            $errors['phone'] = 'Invalid phone number format';
        }
    }

    // Check email uniqueness if provided
    if (!empty($supplier['email'])) {
        try {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM suppliers WHERE email = ?");
            $stmt->execute([$supplier['email']]);
            if ($stmt->fetch()['count'] > 0) {
                $errors['email'] = 'Email already exists';
            }
        } catch (PDOException $e) {
            error_log("Email check error: " . $e->getMessage());
        }
    }

    // Check phone uniqueness if provided
    if (!empty($supplier['phone'])) {
        try {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM suppliers WHERE phone = ?");
            $stmt->execute([$supplier['phone']]);
            if ($stmt->fetch()['count'] > 0) {
                $errors['phone'] = 'Phone number already exists';
            }
        } catch (PDOException $e) {
            error_log("Phone check error: " . $e->getMessage());
        }
    }

    // If no errors, insert supplier
    if (empty($errors)) {
        try {
            $stmt = $db->prepare("
                INSERT INTO suppliers (
                    name, contact_person, email, phone, address, city, country
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $supplier['name'],
                $supplier['contact_person'] ?: null,
                $supplier['email'] ?: null,
                $supplier['phone'] ?: null,
                $supplier['address'] ?: null,
                $supplier['city'] ?: null,
                $supplier['country'] ?: null
            ]);

            $supplierId = $db->lastInsertId();

            logActivity('add_supplier', "Supplier: {$supplier['name']} (ID: $supplierId)");
            setFlashMessage('success', 'Supplier added successfully');

            header('Location: index.php');
            exit();

        } catch (PDOException $e) {
            error_log("Add supplier error: " . $e->getMessage());
            $errors['database'] = 'Error saving supplier. Please try again.';
        }
    }
}

// Get current user info
$currentUser = getCurrentUser();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Supplier - Inventory Management System</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header class="header">
            <div class="header-content">
                <h1>Inventory Management System</h1>
                <div class="user-info">
                    <span>Welcome, <?php echo htmlspecialchars($currentUser['full_name']); ?></span>
                    <a href="../auth/logout.php" class="btn btn-logout">Logout</a>
                </div>
            </div>
        </header>

        <!-- Navigation -->
        <nav class="sidebar">
            <ul class="nav-menu">
                <li><a href="../dashboard/index.php">Dashboard</a></li>
                <li><a href="../products/index.php">Products</a></li>
                <li><a href="index.php" class="active">Suppliers</a></li>
                <li><a href="../purchases/index.php">Purchases</a></li>
                <li><a href="../sales/index.php">Sales</a></li>
                <li><a href="../reports/index.php">Reports</a></li>
            </ul>
        </nav>

        <!-- Main Content -->
        <main class="main-content">
            <?php displayFlashMessage(); ?>
            
            <div class="page-header">
                <h2>Add New Supplier</h2>
                <a href="index.php" class="btn btn-outline">Back to Suppliers</a>
            </div>

            <?php if (!empty($errors['database'])): ?>
                <div class="alert alert-danger">
                    <?php echo htmlspecialchars($errors['database']); ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="add.php" class="supplier-form">
                <div class="form-grid">
                    <!-- Basic Information -->
                    <div class="form-section">
                        <h3>Basic Information</h3>
                        
                        <div class="form-group">
                            <label for="name">Supplier Name *</label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name" 
                                value="<?php echo htmlspecialchars($supplier['name']); ?>"
                                required
                                maxlength="100"
                            >
                            <?php if (isset($errors['name'])): ?>
                                <span class="error"><?php echo htmlspecialchars($errors['name']); ?></span>
                            <?php endif; ?>
                        </div>

                        <div class="form-group">
                            <label for="contact_person">Contact Person</label>
                            <input 
                                type="text" 
                                id="contact_person" 
                                name="contact_person" 
                                value="<?php echo htmlspecialchars($supplier['contact_person']); ?>"
                                maxlength="100"
                                placeholder="Optional"
                            >
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    value="<?php echo htmlspecialchars($supplier['email']); ?>"
                                    maxlength="100"
                                    placeholder="supplier@example.com"
                                >
                                <?php if (isset($errors['email'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['email']); ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="form-group">
                                <label for="phone">Phone</label>
                                <input 
                                    type="tel" 
                                    id="phone" 
                                    name="phone" 
                                    value="<?php echo htmlspecialchars($supplier['phone']); ?>"
                                    maxlength="20"
                                    placeholder="+1 234 567 8900"
                                >
                                <?php if (isset($errors['phone'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['phone']); ?></span>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>

                    <!-- Address Information -->
                    <div class="form-section">
                        <h3>Address Information</h3>
                        
                        <div class="form-group">
                            <label for="address">Street Address</label>
                            <textarea 
                                id="address" 
                                name="address" 
                                rows="3"
                                maxlength="255"
                                placeholder="123 Business Street, Suite 100"
                            ><?php echo htmlspecialchars($supplier['address']); ?></textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="city">City</label>
                                <input 
                                    type="text" 
                                    id="city" 
                                    name="city" 
                                    value="<?php echo htmlspecialchars($supplier['city']); ?>"
                                    maxlength="50"
                                    placeholder="New York"
                                >
                            </div>

                            <div class="form-group">
                                <label for="country">Country</label>
                                <input 
                                    type="text" 
                                    id="country" 
                                    name="country" 
                                    value="<?php echo htmlspecialchars($supplier['country']); ?>"
                                    maxlength="50"
                                    placeholder="United States"
                                >
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Supplier</button>
                    <a href="index.php" class="btn btn-outline">Cancel</a>
                </div>
            </form>
        </main>
    </div>

    <script src="../../assets/js/supplier_form.js"></script>
</body>
</html>

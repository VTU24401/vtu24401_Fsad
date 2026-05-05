<?php
/**
 * Add Product Page
 * Relational Inventory Control & Stock Tracking System
 */

// Include authentication helper
require_once '../../includes/auth_helper.php';

// Require login to access this page
requireLogin();

// Check if user can create products
if (!canPerformAction('create')) {
    setFlashMessage('error', 'You do not have permission to add products');
    header('Location: index.php');
    exit();
}

// Include database configuration
require_once '../../config/database.php';

// Initialize database connection
$database = new Database();
$db = $database->connect();

// Set global database connection for logging
$GLOBALS['db'] = $db;

// Initialize variables
$product = [
    'name' => '',
    'description' => '',
    'category_id' => '',
    'supplier_id' => '',
    'sku' => '',
    'barcode' => '',
    'purchase_price' => '',
    'selling_price' => '',
    'quantity' => '0',
    'min_stock_level' => '10',
    'max_stock_level' => '100',
    'unit' => 'pieces'
];

$errors = [];

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Sanitize and validate input
    $product['name'] = trim($_POST['name'] ?? '');
    $product['description'] = trim($_POST['description'] ?? '');
    $product['category_id'] = $_POST['category_id'] ?? '';
    $product['supplier_id'] = $_POST['supplier_id'] ?? '';
    $product['sku'] = trim($_POST['sku'] ?? '');
    $product['barcode'] = trim($_POST['barcode'] ?? '');
    $product['purchase_price'] = trim($_POST['purchase_price'] ?? '');
    $product['selling_price'] = trim($_POST['selling_price'] ?? '');
    $product['quantity'] = trim($_POST['quantity'] ?? '0');
    $product['min_stock_level'] = trim($_POST['min_stock_level'] ?? '10');
    $product['max_stock_level'] = trim($_POST['max_stock_level'] ?? '100');
    $product['unit'] = trim($_POST['unit'] ?? 'pieces');

    // Validation
    if (empty($product['name'])) {
        $errors['name'] = 'Product name is required';
    }

    if (empty($product['purchase_price']) || !is_numeric($product['purchase_price']) || $product['purchase_price'] < 0) {
        $errors['purchase_price'] = 'Valid purchase price is required';
    }

    if (empty($product['selling_price']) || !is_numeric($product['selling_price']) || $product['selling_price'] < 0) {
        $errors['selling_price'] = 'Valid selling price is required';
    }

    if (!is_numeric($product['quantity']) || $product['quantity'] < 0) {
        $errors['quantity'] = 'Valid quantity is required';
    }

    if (!is_numeric($product['min_stock_level']) || $product['min_stock_level'] < 0) {
        $errors['min_stock_level'] = 'Valid minimum stock level is required';
    }

    if (!is_numeric($product['max_stock_level']) || $product['max_stock_level'] < 0) {
        $errors['max_stock_level'] = 'Valid maximum stock level is required';
    }

    if ($product['min_stock_level'] >= $product['max_stock_level']) {
        $errors['max_stock_level'] = 'Maximum stock level must be greater than minimum stock level';
    }

    // Check SKU uniqueness if provided
    if (!empty($product['sku'])) {
        try {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM products WHERE sku = ?");
            $stmt->execute([$product['sku']]);
            if ($stmt->fetch()['count'] > 0) {
                $errors['sku'] = 'SKU already exists';
            }
        } catch (PDOException $e) {
            error_log("SKU check error: " . $e->getMessage());
        }
    }

    // Check barcode uniqueness if provided
    if (!empty($product['barcode'])) {
        try {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM products WHERE barcode = ?");
            $stmt->execute([$product['barcode']]);
            if ($stmt->fetch()['count'] > 0) {
                $errors['barcode'] = 'Barcode already exists';
            }
        } catch (PDOException $e) {
            error_log("Barcode check error: " . $e->getMessage());
        }
    }

    // If no errors, insert product
    if (empty($errors)) {
        try {
            // Generate SKU if not provided
            if (empty($product['sku'])) {
                $product['sku'] = 'PRD' . date('Ymd') . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
            }

            $stmt = $db->prepare("
                INSERT INTO products (
                    name, description, category_id, supplier_id, sku, barcode,
                    purchase_price, selling_price, quantity, min_stock_level,
                    max_stock_level, unit
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $product['name'],
                $product['description'],
                $product['category_id'] ?: null,
                $product['supplier_id'] ?: null,
                $product['sku'],
                $product['barcode'] ?: null,
                $product['purchase_price'],
                $product['selling_price'],
                $product['quantity'],
                $product['min_stock_level'],
                $product['max_stock_level'],
                $product['unit']
            ]);

            $productId = $db->lastInsertId();

            // Log stock movement if initial quantity > 0
            if ($product['quantity'] > 0) {
                $stmt = $db->prepare("
                    INSERT INTO stock_movements (product_id, movement_type, quantity, notes)
                    VALUES (?, 'adjustment', ?, 'Initial stock')
                ");
                $stmt->execute([$productId, $product['quantity']]);
            }

            logActivity('add_product', "Product: {$product['name']} (ID: $productId)");
            setFlashMessage('success', 'Product added successfully');

            header('Location: index.php');
            exit();

        } catch (PDOException $e) {
            error_log("Add product error: " . $e->getMessage());
            error_log("SQL State: " . $e->getCode());
            $errors['database'] = 'Error saving product: ' . $e->getMessage();
        }
    }
}

// Get categories and suppliers
try {
    $categories = $db->query("SELECT id, name FROM categories ORDER BY name ASC")->fetchAll();
    $suppliers = $db->query("SELECT id, name FROM suppliers WHERE is_active = 1 ORDER BY name ASC")->fetchAll();
} catch (PDOException $e) {
    $categories = [];
    $suppliers = [];
}

// Get current user info
$currentUser = getCurrentUser();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Product - Inventory Management System</title>
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
                <li><a href="index.php" class="active">Products</a></li>
                <li><a href="../suppliers/index.php">Suppliers</a></li>
                <li><a href="../purchases/index.php">Purchases</a></li>
                <li><a href="../sales/index.php">Sales</a></li>
                <li><a href="../reports/index.php">Reports</a></li>
            </ul>
        </nav>

        <!-- Main Content -->
        <main class="main-content">
            <?php displayFlashMessage(); ?>
            
            <div class="page-header">
                <h2>Add New Product</h2>
                <a href="index.php" class="btn btn-outline">Back to Products</a>
            </div>

            <?php if (!empty($errors['database'])): ?>
                <div class="alert alert-danger">
                    <?php echo htmlspecialchars($errors['database']); ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="add.php" class="product-form">
                <div class="form-grid">
                    <!-- Basic Information -->
                    <div class="form-section">
                        <h3>Basic Information</h3>
                        
                        <div class="form-group">
                            <label for="name">Product Name *</label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name" 
                                value="<?php echo htmlspecialchars($product['name']); ?>"
                                required
                                maxlength="200"
                            >
                            <?php if (isset($errors['name'])): ?>
                                <span class="error"><?php echo htmlspecialchars($errors['name']); ?></span>
                            <?php endif; ?>
                        </div>

                        <div class="form-group">
                            <label for="description">Description</label>
                            <textarea 
                                id="description" 
                                name="description" 
                                rows="3"
                                maxlength="1000"
                            ><?php echo htmlspecialchars($product['description']); ?></textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="sku">SKU</label>
                                <input 
                                    type="text" 
                                    id="sku" 
                                    name="sku" 
                                    value="<?php echo htmlspecialchars($product['sku']); ?>"
                                    placeholder="Auto-generated if empty"
                                    maxlength="50"
                                >
                                <?php if (isset($errors['sku'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['sku']); ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="form-group">
                                <label for="barcode">Barcode</label>
                                <input 
                                    type="text" 
                                    id="barcode" 
                                    name="barcode" 
                                    value="<?php echo htmlspecialchars($product['barcode']); ?>"
                                    placeholder="Optional"
                                    maxlength="50"
                                >
                                <?php if (isset($errors['barcode'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['barcode']); ?></span>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>

                    <!-- Category and Supplier -->
                    <div class="form-section">
                        <h3>Classification</h3>
                        
                        <div class="form-group">
                            <label for="category_id">Category</label>
                            <select id="category_id" name="category_id">
                                <option value="">Select Category</option>
                                <?php foreach ($categories as $category): ?>
                                    <option value="<?php echo $category['id']; ?>" <?php echo $product['category_id'] == $category['id'] ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($category['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="supplier_id">Supplier</label>
                            <select id="supplier_id" name="supplier_id">
                                <option value="">Select Supplier</option>
                                <?php foreach ($suppliers as $supplier): ?>
                                    <option value="<?php echo $supplier['id']; ?>" <?php echo $product['supplier_id'] == $supplier['id'] ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($supplier['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="unit">Unit</label>
                            <select id="unit" name="unit">
                                <option value="pieces" <?php echo $product['unit'] == 'pieces' ? 'selected' : ''; ?>>Pieces</option>
                                <option value="kg" <?php echo $product['unit'] == 'kg' ? 'selected' : ''; ?>>Kilograms</option>
                                <option value="liters" <?php echo $product['unit'] == 'liters' ? 'selected' : ''; ?>>Liters</option>
                                <option value="meters" <?php echo $product['unit'] == 'meters' ? 'selected' : ''; ?>>Meters</option>
                                <option value="boxes" <?php echo $product['unit'] == 'boxes' ? 'selected' : ''; ?>>Boxes</option>
                                <option value="dozens" <?php echo $product['unit'] == 'dozens' ? 'selected' : ''; ?>>Dozens</option>
                            </select>
                        </div>
                    </div>

                    <!-- Pricing -->
                    <div class="form-section">
                        <h3>Pricing</h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="purchase_price">Purchase Price *</label>
                                <input 
                                    type="number" 
                                    id="purchase_price" 
                                    name="purchase_price" 
                                    value="<?php echo htmlspecialchars($product['purchase_price']); ?>"
                                    step="0.01"
                                    min="0"
                                    required
                                >
                                <?php if (isset($errors['purchase_price'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['purchase_price']); ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="form-group">
                                <label for="selling_price">Selling Price *</label>
                                <input 
                                    type="number" 
                                    id="selling_price" 
                                    name="selling_price" 
                                    value="<?php echo htmlspecialchars($product['selling_price']); ?>"
                                    step="0.01"
                                    min="0"
                                    required
                                >
                                <?php if (isset($errors['selling_price'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['selling_price']); ?></span>
                                <?php endif; ?>
                            </div>
                        </div>

                        <div class="profit-display">
                            <label>Estimated Profit per Unit:</label>
                            <span id="profit_display">$0.00</span>
                        </div>
                    </div>

                    <!-- Stock Management -->
                    <div class="form-section">
                        <h3>Stock Management</h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="quantity">Initial Quantity</label>
                                <input 
                                    type="number" 
                                    id="quantity" 
                                    name="quantity" 
                                    value="<?php echo htmlspecialchars($product['quantity']); ?>"
                                    min="0"
                                >
                                <?php if (isset($errors['quantity'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['quantity']); ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="form-group">
                                <label for="min_stock_level">Min Stock Level *</label>
                                <input 
                                    type="number" 
                                    id="min_stock_level" 
                                    name="min_stock_level" 
                                    value="<?php echo htmlspecialchars($product['min_stock_level']); ?>"
                                    min="0"
                                    required
                                >
                                <?php if (isset($errors['min_stock_level'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['min_stock_level']); ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="form-group">
                                <label for="max_stock_level">Max Stock Level *</label>
                                <input 
                                    type="number" 
                                    id="max_stock_level" 
                                    name="max_stock_level" 
                                    value="<?php echo htmlspecialchars($product['max_stock_level']); ?>"
                                    min="0"
                                    required
                                >
                                <?php if (isset($errors['max_stock_level'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['max_stock_level']); ?></span>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Product</button>
                    <a href="index.php" class="btn btn-outline">Cancel</a>
                </div>
            </form>
        </main>
    </div>

    <script src="../../assets/js/product_form.js"></script>
</body>
</html>

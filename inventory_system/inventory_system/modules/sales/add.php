<?php
/**
 * Add Sale Page
 * Relational Inventory Control & Stock Tracking System
 */

// Include authentication helper
require_once '../../includes/auth_helper.php';

// Require login to access this page
requireLogin();

// Check if user can create sales
if (!canPerformAction('create_sales')) {
    setFlashMessage('error', 'You do not have permission to add sales');
    header('Location: index.php');
    exit();
}

// Include database configuration
require_once '../../config/database.php';

// Initialize database connection
$database = new Database();
$db = $database->connect();

// Initialize variables
$sale = [
    'product_id' => '',
    'quantity' => '1',
    'unit_price' => '',
    'sale_date' => date('Y-m-d'),
    'invoice_number' => '',
    'customer_name' => '',
    'customer_email' => '',
    'customer_phone' => '',
    'payment_status' => 'pending',
    'payment_method' => '',
    'notes' => ''
];

$errors = [];

// Get products for dropdown
try {
    $products = $db->query("SELECT id, name, selling_price, quantity, unit FROM products WHERE is_active = 1 ORDER BY name ASC")->fetchAll();
} catch (PDOException $e) {
    $products = [];
    error_log("Error loading products: " . $e->getMessage());
}

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Sanitize and validate input
    $sale['product_id'] = $_POST['product_id'] ?? '';
    $sale['quantity'] = trim($_POST['quantity'] ?? '');
    $sale['unit_price'] = trim($_POST['unit_price'] ?? '');
    $sale['sale_date'] = trim($_POST['sale_date'] ?? '');
    $sale['invoice_number'] = trim($_POST['invoice_number'] ?? '');
    $sale['customer_name'] = trim($_POST['customer_name'] ?? '');
    $sale['customer_email'] = trim($_POST['customer_email'] ?? '');
    $sale['customer_phone'] = trim($_POST['customer_phone'] ?? '');
    $sale['payment_status'] = $_POST['payment_status'] ?? 'pending';
    $sale['payment_method'] = trim($_POST['payment_method'] ?? '');
    $sale['notes'] = trim($_POST['notes'] ?? '');

    // Validation
    if (empty($sale['product_id'])) {
        $errors['product_id'] = 'Product is required';
    }

    if (empty($sale['quantity']) || !is_numeric($sale['quantity']) || $sale['quantity'] <= 0) {
        $errors['quantity'] = 'Valid quantity is required';
    }

    if (empty($sale['unit_price']) || !is_numeric($sale['unit_price']) || $sale['unit_price'] <= 0) {
        $errors['unit_price'] = 'Valid unit price is required';
    }

    if (empty($sale['sale_date'])) {
        $errors['sale_date'] = 'Sale date is required';
    } elseif (!DateTime::createFromFormat('Y-m-d', $sale['sale_date'])) {
        $errors['sale_date'] = 'Invalid date format';
    }

    if (!empty($sale['customer_email']) && !filter_var($sale['customer_email'], FILTER_VALIDATE_EMAIL)) {
        $errors['customer_email'] = 'Valid email address is required';
    }

    // Check stock availability
    if (empty($errors['product_id']) && empty($errors['quantity'])) {
        try {
            $stmt = $db->prepare("SELECT quantity, name FROM products WHERE id = ?");
            $stmt->execute([$sale['product_id']]);
            $product = $stmt->fetch();

            if (!$product) {
                $errors['product_id'] = 'Product not found';
            } elseif ($product['quantity'] < $sale['quantity']) {
                $errors['quantity'] = "Insufficient stock. Available: {$product['quantity']}";
            }
        } catch (PDOException $e) {
            error_log("Stock check error: " . $e->getMessage());
            $errors['database'] = 'Error checking stock availability';
        }
    }

    // If no errors, process sale
    if (empty($errors)) {
        try {
            $db->beginTransaction();

            // Calculate total price
            $totalPrice = $sale['quantity'] * $sale['unit_price'];

            // Generate invoice number if not provided
            if (empty($sale['invoice_number'])) {
                $sale['invoice_number'] = 'SAL' . date('Ymd') . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
            }

            // Insert sale record
            $stmt = $db->prepare("
                INSERT INTO sales (
                    product_id, quantity, unit_price, total_price, sale_date,
                    invoice_number, customer_name, customer_email, customer_phone,
                    payment_status, payment_method, notes, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $sale['product_id'],
                $sale['quantity'],
                $sale['unit_price'],
                $totalPrice,
                $sale['sale_date'],
                $sale['invoice_number'],
                $sale['customer_name'] ?: null,
                $sale['customer_email'] ?: null,
                $sale['customer_phone'] ?: null,
                $sale['payment_status'],
                $sale['payment_method'] ?: null,
                $sale['notes'] ?: null,
                $_SESSION['user_id']
            ]);

            $saleId = $db->lastInsertId();

            // Update product quantity
            $stmt = $db->prepare("
                UPDATE products 
                SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ");
            $stmt->execute([$sale['quantity'], $sale['product_id']]);

            // Record stock movement
            $stmt = $db->prepare("
                INSERT INTO stock_movements (
                    product_id, movement_type, quantity, reference_id, 
                    reference_type, notes, created_by
                ) VALUES (?, 'sale', ?, ?, 'sale', ?, ?)
            ");
            $stmt->execute([
                $sale['product_id'],
                $sale['quantity'],
                $saleId,
                "Sale to customer: " . ($sale['customer_name'] ?: 'Walk-in customer'),
                $_SESSION['user_id']
            ]);

            // Get product name for logging
            $stmt = $db->prepare("SELECT name FROM products WHERE id = ?");
            $stmt->execute([$sale['product_id']]);
            $productName = $stmt->fetch()['name'];

            $db->commit();

            logActivity('add_sale', "Sale: $productName (ID: $saleId)");
            setFlashMessage('success', 'Sale recorded successfully. Stock quantity updated.');

            header('Location: index.php');
            exit();

        } catch (PDOException $e) {
            $db->rollBack();
            error_log("Add sale error: " . $e->getMessage());
            $errors['database'] = 'Error processing sale. Please try again.';
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
    <title>Add Sale - Inventory Management System</title>
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
                <li><a href="../suppliers/index.php">Suppliers</a></li>
                <li><a href="../purchases/index.php">Purchases</a></li>
                <li><a href="index.php" class="active">Sales</a></li>
                <li><a href="../reports/index.php">Reports</a></li>
            </ul>
        </nav>

        <!-- Main Content -->
        <main class="main-content">
            <?php displayFlashMessage(); ?>
            
            <div class="page-header">
                <h2>Add New Sale</h2>
                <a href="index.php" class="btn btn-outline">Back to Sales</a>
            </div>

            <?php if (!empty($errors['database'])): ?>
                <div class="alert alert-danger">
                    <?php echo htmlspecialchars($errors['database']); ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="add.php" class="sale-form">
                <div class="form-grid">
                    <!-- Sale Information -->
                    <div class="form-section">
                        <h3>Sale Information</h3>
                        
                        <div class="form-group">
                            <label for="product_id">Product *</label>
                            <select id="product_id" name="product_id" required onchange="updateProductInfo()">
                                <option value="">Select Product</option>
                                <?php foreach ($products as $product): ?>
                                    <option value="<?php echo $product['id']; ?>" 
                                            data-price="<?php echo $product['selling_price']; ?>"
                                            data-stock="<?php echo $product['quantity']; ?>"
                                            data-unit="<?php echo htmlspecialchars($product['unit']); ?>"
                                            <?php echo $sale['product_id'] == $product['id'] ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($product['name']); ?>
                                        (Stock: <?php echo $product['quantity']; ?> <?php echo htmlspecialchars($product['unit']); ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <?php if (isset($errors['product_id'])): ?>
                                <span class="error"><?php echo htmlspecialchars($errors['product_id']); ?></span>
                            <?php endif; ?>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="quantity">Quantity *</label>
                                <input 
                                    type="number" 
                                    id="quantity" 
                                    name="quantity" 
                                    value="<?php echo htmlspecialchars($sale['quantity']); ?>"
                                    min="1"
                                    step="1"
                                    required
                                    onchange="calculateTotal()"
                                >
                                <span id="unit_display" class="unit-info"></span>
                                <div id="stock_warning" class="stock-warning"></div>
                                <?php if (isset($errors['quantity'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['quantity']); ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="form-group">
                                <label for="unit_price">Unit Price ($) *</label>
                                <input 
                                    type="number" 
                                    id="unit_price" 
                                    name="unit_price" 
                                    value="<?php echo htmlspecialchars($sale['unit_price']); ?>"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    onchange="calculateTotal()"
                                >
                                <?php if (isset($errors['unit_price'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['unit_price']); ?></span>
                                <?php endif; ?>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="sale_date">Sale Date *</label>
                                <input 
                                    type="date" 
                                    id="sale_date" 
                                    name="sale_date" 
                                    value="<?php echo htmlspecialchars($sale['sale_date']); ?>"
                                    required
                                    max="<?php echo date('Y-m-d'); ?>"
                                >
                                <?php if (isset($errors['sale_date'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['sale_date']); ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="form-group">
                                <label for="invoice_number">Invoice Number</label>
                                <input 
                                    type="text" 
                                    id="invoice_number" 
                                    name="invoice_number" 
                                    value="<?php echo htmlspecialchars($sale['invoice_number']); ?>"
                                    placeholder="Auto-generated if empty"
                                    maxlength="50"
                                >
                            </div>
                        </div>

                        <div class="total-display">
                            <label>Total Amount:</label>
                            <span id="total_display">$0.00</span>
                        </div>
                    </div>

                    <!-- Customer Information -->
                    <div class="form-section">
                        <h3>Customer Information</h3>
                        
                        <div class="form-group">
                            <label for="customer_name">Customer Name</label>
                            <input 
                                type="text" 
                                id="customer_name" 
                                name="customer_name" 
                                value="<?php echo htmlspecialchars($sale['customer_name']); ?>"
                                placeholder="Walk-in customer"
                                maxlength="100"
                            >
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="customer_email">Email</label>
                                <input 
                                    type="email" 
                                    id="customer_email" 
                                    name="customer_email" 
                                    value="<?php echo htmlspecialchars($sale['customer_email']); ?>"
                                    placeholder="customer@example.com"
                                    maxlength="100"
                                >
                                <?php if (isset($errors['customer_email'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['customer_email']); ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="form-group">
                                <label for="customer_phone">Phone</label>
                                <input 
                                    type="tel" 
                                    id="customer_phone" 
                                    name="customer_phone" 
                                    value="<?php echo htmlspecialchars($sale['customer_phone']); ?>"
                                    placeholder="+1 234 567 8900"
                                    maxlength="20"
                                >
                            </div>
                        </div>
                    </div>

                    <!-- Payment Information -->
                    <div class="form-section">
                        <h3>Payment Information</h3>
                        
                        <div class="form-group">
                            <label for="payment_status">Payment Status</label>
                            <select id="payment_status" name="payment_status">
                                <option value="pending" <?php echo $sale['payment_status'] == 'pending' ? 'selected' : ''; ?>>Pending</option>
                                <option value="paid" <?php echo $sale['payment_status'] == 'paid' ? 'selected' : ''; ?>>Paid</option>
                                <option value="partial" <?php echo $sale['payment_status'] == 'partial' ? 'selected' : ''; ?>>Partial</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="payment_method">Payment Method</label>
                            <select id="payment_method" name="payment_method">
                                <option value="">Select Payment Method</option>
                                <option value="cash" <?php echo $sale['payment_method'] == 'cash' ? 'selected' : ''; ?>>Cash</option>
                                <option value="credit_card" <?php echo $sale['payment_method'] == 'credit_card' ? 'selected' : ''; ?>>Credit Card</option>
                                <option value="debit_card" <?php echo $sale['payment_method'] == 'debit_card' ? 'selected' : ''; ?>>Debit Card</option>
                                <option value="bank_transfer" <?php echo $sale['payment_method'] == 'bank_transfer' ? 'selected' : ''; ?>>Bank Transfer</option>
                                <option value="check" <?php echo $sale['payment_method'] == 'check' ? 'selected' : ''; ?>>Check</option>
                                <option value="other" <?php echo $sale['payment_method'] == 'other' ? 'selected' : ''; ?>>Other</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="notes">Notes</label>
                            <textarea 
                                id="notes" 
                                name="notes" 
                                rows="4"
                                maxlength="1000"
                                placeholder="Additional notes about this sale..."
                            ><?php echo htmlspecialchars($sale['notes']); ?></textarea>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Record Sale</button>
                    <a href="index.php" class="btn btn-outline">Cancel</a>
                </div>
            </form>
        </main>
    </div>

    <style>
        .unit-info {
            color: #666;
            font-size: 0.9rem;
            margin-left: 0.5rem;
        }
        
        .stock-warning {
            color: #dc3545;
            font-size: 0.8rem;
            margin-top: 0.25rem;
            display: none;
        }
        
        .stock-warning.show {
            display: block;
        }
    </style>

    <script>
        function calculateTotal() {
            const quantity = parseFloat(document.getElementById('quantity').value) || 0;
            const unitPrice = parseFloat(document.getElementById('unit_price').value) || 0;
            const total = quantity * unitPrice;
            document.getElementById('total_display').textContent = '$' + total.toFixed(2);
        }

        function updateProductInfo() {
            const productSelect = document.getElementById('product_id');
            const selectedOption = productSelect.options[productSelect.selectedIndex];
            const unitPriceInput = document.getElementById('unit_price');
            const unitDisplay = document.getElementById('unit_display');
            const stockWarning = document.getElementById('stock_warning');
            const quantityInput = document.getElementById('quantity');
            
            if (selectedOption.dataset.price) {
                unitPriceInput.value = selectedOption.dataset.price;
                unitDisplay.textContent = selectedOption.dataset.unit;
                
                const availableStock = parseInt(selectedOption.dataset.stock);
                const requestedQuantity = parseInt(quantityInput.value) || 1;
                
                if (requestedQuantity > availableStock) {
                    stockWarning.textContent = `Warning: Only ${availableStock} ${selectedOption.dataset.unit} available in stock`;
                    stockWarning.classList.add('show');
                    quantityInput.max = availableStock;
                } else {
                    stockWarning.classList.remove('show');
                    quantityInput.max = '';
                }
            } else {
                unitDisplay.textContent = '';
                stockWarning.classList.remove('show');
                quantityInput.max = '';
            }
            
            calculateTotal();
        }

        function checkStockAvailability() {
            const productSelect = document.getElementById('product_id');
            const selectedOption = productSelect.options[productSelect.selectedIndex];
            const stockWarning = document.getElementById('stock_warning');
            const quantityInput = document.getElementById('quantity');
            
            if (selectedOption.dataset.stock) {
                const availableStock = parseInt(selectedOption.dataset.stock);
                const requestedQuantity = parseInt(quantityInput.value) || 1;
                
                if (requestedQuantity > availableStock) {
                    stockWarning.textContent = `Warning: Only ${availableStock} ${selectedOption.dataset.unit} available in stock`;
                    stockWarning.classList.add('show');
                } else {
                    stockWarning.classList.remove('show');
                }
            }
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            updateProductInfo();
            
            // Add event listener for quantity changes
            document.getElementById('quantity').addEventListener('input', checkStockAvailability);
        });
    </script>
</body>
</html>

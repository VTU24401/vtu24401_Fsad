<?php
/**
 * Add Purchase Page
 * Relational Inventory Control & Stock Tracking System
 */

// Include authentication helper
require_once '../../includes/auth_helper.php';

// Require login to access this page
requireLogin();

// Check if user can create purchases
if (!canPerformAction('create_purchases')) {
    setFlashMessage('error', 'You do not have permission to add purchases');
    header('Location: index.php');
    exit();
}

// Include database configuration
require_once '../../config/database.php';

// Initialize database connection
$database = new Database();
$db = $database->connect();

// Initialize variables
$purchase = [
    'supplier_id' => $_GET['supplier_id'] ?? '',
    'product_id' => $_GET['product_id'] ?? '',
    'quantity' => '1',
    'unit_price' => '',
    'purchase_date' => date('Y-m-d'),
    'invoice_number' => '',
    'payment_status' => 'pending',
    'payment_method' => '',
    'notes' => ''
];

$errors = [];

// Get suppliers and products for dropdowns
try {
    $suppliers = $db->query("SELECT id, name FROM suppliers WHERE is_active = 1 ORDER BY name ASC")->fetchAll();
    $products = $db->query("SELECT id, name, purchase_price, unit FROM products WHERE is_active = 1 ORDER BY name ASC")->fetchAll();
} catch (PDOException $e) {
    $suppliers = [];
    $products = [];
    error_log("Error loading suppliers/products: " . $e->getMessage());
}

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Sanitize and validate input
    $purchase['supplier_id'] = $_POST['supplier_id'] ?? '';
    $purchase['product_id'] = $_POST['product_id'] ?? '';
    $purchase['quantity'] = trim($_POST['quantity'] ?? '');
    $purchase['unit_price'] = trim($_POST['unit_price'] ?? '');
    $purchase['purchase_date'] = trim($_POST['purchase_date'] ?? '');
    $purchase['invoice_number'] = trim($_POST['invoice_number'] ?? '');
    $purchase['payment_status'] = $_POST['payment_status'] ?? 'pending';
    $purchase['payment_method'] = trim($_POST['payment_method'] ?? '');
    $purchase['notes'] = trim($_POST['notes'] ?? '');

    // Validation
    if (empty($purchase['supplier_id'])) {
        $errors['supplier_id'] = 'Supplier is required';
    }

    if (empty($purchase['product_id'])) {
        $errors['product_id'] = 'Product is required';
    }

    if (empty($purchase['quantity']) || !is_numeric($purchase['quantity']) || $purchase['quantity'] <= 0) {
        $errors['quantity'] = 'Valid quantity is required';
    }

    if (empty($purchase['unit_price']) || !is_numeric($purchase['unit_price']) || $purchase['unit_price'] <= 0) {
        $errors['unit_price'] = 'Valid unit price is required';
    }

    if (empty($purchase['purchase_date'])) {
        $errors['purchase_date'] = 'Purchase date is required';
    } elseif (!DateTime::createFromFormat('Y-m-d', $purchase['purchase_date'])) {
        $errors['purchase_date'] = 'Invalid date format';
    }

    // If no errors, process purchase
    if (empty($errors)) {
        try {
            $db->beginTransaction();

            // Calculate total price
            $totalPrice = $purchase['quantity'] * $purchase['unit_price'];

            // Generate invoice number if not provided
            if (empty($purchase['invoice_number'])) {
                $purchase['invoice_number'] = 'PUR' . date('Ymd') . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
            }

            // Insert purchase record
            $stmt = $db->prepare("
                INSERT INTO purchases (
                    supplier_id, product_id, quantity, unit_price, total_price,
                    purchase_date, invoice_number, payment_status, payment_method,
                    notes, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $purchase['supplier_id'],
                $purchase['product_id'],
                $purchase['quantity'],
                $purchase['unit_price'],
                $totalPrice,
                $purchase['purchase_date'],
                $purchase['invoice_number'],
                $purchase['payment_status'],
                $purchase['payment_method'] ?: null,
                $purchase['notes'] ?: null,
                $_SESSION['user_id']
            ]);

            $purchaseId = $db->lastInsertId();

            // Update product quantity
            $stmt = $db->prepare("
                UPDATE products 
                SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ");
            $stmt->execute([$purchase['quantity'], $purchase['product_id']]);

            // Record stock movement
            $stmt = $db->prepare("
                INSERT INTO stock_movements (
                    product_id, movement_type, quantity, reference_id, 
                    reference_type, notes, created_by
                ) VALUES (?, 'purchase', ?, ?, 'purchase', ?, ?)
            ");
            $stmt->execute([
                $purchase['product_id'],
                $purchase['quantity'],
                $purchaseId,
                "Purchase from supplier ID: {$purchase['supplier_id']}",
                $_SESSION['user_id']
            ]);

            // Get product and supplier names for logging
            $stmt = $db->prepare("SELECT name FROM products WHERE id = ?");
            $stmt->execute([$purchase['product_id']]);
            $productName = $stmt->fetch()['name'];

            $stmt = $db->prepare("SELECT name FROM suppliers WHERE id = ?");
            $stmt->execute([$purchase['supplier_id']]);
            $supplierName = $stmt->fetch()['name'];

            $db->commit();

            logActivity('add_purchase', "Purchase: $productName from $supplierName (ID: $purchaseId)");
            setFlashMessage('success', 'Purchase recorded successfully. Stock quantity updated.');

            header('Location: index.php');
            exit();

        } catch (PDOException $e) {
            $db->rollBack();
            error_log("Add purchase error: " . $e->getMessage());
            $errors['database'] = 'Error processing purchase. Please try again.';
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
    <title>Add Purchase - Inventory Management System</title>
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
                <li><a href="index.php" class="active">Purchases</a></li>
                <li><a href="../sales/index.php">Sales</a></li>
                <li><a href="../reports/index.php">Reports</a></li>
            </ul>
        </nav>

        <!-- Main Content -->
        <main class="main-content">
            <?php displayFlashMessage(); ?>
            
            <div class="page-header">
                <h2>Add New Purchase</h2>
                <a href="index.php" class="btn btn-outline">Back to Purchases</a>
            </div>

            <?php if (!empty($errors['database'])): ?>
                <div class="alert alert-danger">
                    <?php echo htmlspecialchars($errors['database']); ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="add.php" class="purchase-form">
                <div class="form-grid">
                    <!-- Purchase Information -->
                    <div class="form-section">
                        <h3>Purchase Information</h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="supplier_id">Supplier *</label>
                                <select id="supplier_id" name="supplier_id" required onchange="updateProducts()">
                                    <option value="">Select Supplier</option>
                                    <?php foreach ($suppliers as $supplier): ?>
                                        <option value="<?php echo $supplier['id']; ?>" <?php echo $purchase['supplier_id'] == $supplier['id'] ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($supplier['name']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <?php if (isset($errors['supplier_id'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['supplier_id']); ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="form-group">
                                <label for="product_id">Product *</label>
                                <select id="product_id" name="product_id" required onchange="updateUnitPrice()">
                                    <option value="">Select Product</option>
                                    <?php foreach ($products as $product): ?>
                                        <option value="<?php echo $product['id']; ?>" 
                                                data-price="<?php echo $product['purchase_price']; ?>"
                                                data-unit="<?php echo htmlspecialchars($product['unit']); ?>"
                                                <?php echo $purchase['product_id'] == $product['id'] ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($product['name']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <?php if (isset($errors['product_id'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['product_id']); ?></span>
                                <?php endif; ?>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="quantity">Quantity *</label>
                                <input 
                                    type="number" 
                                    id="quantity" 
                                    name="quantity" 
                                    value="<?php echo htmlspecialchars($purchase['quantity']); ?>"
                                    min="1"
                                    step="1"
                                    required
                                    onchange="calculateTotal()"
                                >
                                <span id="unit_display" class="unit-info"></span>
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
                                    value="<?php echo htmlspecialchars($purchase['unit_price']); ?>"
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
                                <label for="purchase_date">Purchase Date *</label>
                                <input 
                                    type="date" 
                                    id="purchase_date" 
                                    name="purchase_date" 
                                    value="<?php echo htmlspecialchars($purchase['purchase_date']); ?>"
                                    required
                                    max="<?php echo date('Y-m-d'); ?>"
                                >
                                <?php if (isset($errors['purchase_date'])): ?>
                                    <span class="error"><?php echo htmlspecialchars($errors['purchase_date']); ?></span>
                                <?php endif; ?>
                            </div>

                            <div class="form-group">
                                <label for="invoice_number">Invoice Number</label>
                                <input 
                                    type="text" 
                                    id="invoice_number" 
                                    name="invoice_number" 
                                    value="<?php echo htmlspecialchars($purchase['invoice_number']); ?>"
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

                    <!-- Payment Information -->
                    <div class="form-section">
                        <h3>Payment Information</h3>
                        
                        <div class="form-group">
                            <label for="payment_status">Payment Status</label>
                            <select id="payment_status" name="payment_status">
                                <option value="pending" <?php echo $purchase['payment_status'] == 'pending' ? 'selected' : ''; ?>>Pending</option>
                                <option value="paid" <?php echo $purchase['payment_status'] == 'paid' ? 'selected' : ''; ?>>Paid</option>
                                <option value="partial" <?php echo $purchase['payment_status'] == 'partial' ? 'selected' : ''; ?>>Partial</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="payment_method">Payment Method</label>
                            <select id="payment_method" name="payment_method">
                                <option value="">Select Payment Method</option>
                                <option value="cash" <?php echo $purchase['payment_method'] == 'cash' ? 'selected' : ''; ?>>Cash</option>
                                <option value="bank_transfer" <?php echo $purchase['payment_method'] == 'bank_transfer' ? 'selected' : ''; ?>>Bank Transfer</option>
                                <option value="credit_card" <?php echo $purchase['payment_method'] == 'credit_card' ? 'selected' : ''; ?>>Credit Card</option>
                                <option value="check" <?php echo $purchase['payment_method'] == 'check' ? 'selected' : ''; ?>>Check</option>
                                <option value="other" <?php echo $purchase['payment_method'] == 'other' ? 'selected' : ''; ?>>Other</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="notes">Notes</label>
                            <textarea 
                                id="notes" 
                                name="notes" 
                                rows="4"
                                maxlength="1000"
                                placeholder="Additional notes about this purchase..."
                            ><?php echo htmlspecialchars($purchase['notes']); ?></textarea>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Record Purchase</button>
                    <a href="index.php" class="btn btn-outline">Cancel</a>
                </div>
            </form>
        </main>
    </div>

    <script>
        function calculateTotal() {
            const quantity = parseFloat(document.getElementById('quantity').value) || 0;
            const unitPrice = parseFloat(document.getElementById('unit_price').value) || 0;
            const total = quantity * unitPrice;
            document.getElementById('total_display').textContent = '$' + total.toFixed(2);
        }

        function updateUnitPrice() {
            const productSelect = document.getElementById('product_id');
            const selectedOption = productSelect.options[productSelect.selectedIndex];
            const unitPriceInput = document.getElementById('unit_price');
            const unitDisplay = document.getElementById('unit_display');
            
            if (selectedOption.dataset.price) {
                unitPriceInput.value = selectedOption.dataset.price;
                unitDisplay.textContent = selectedOption.dataset.unit;
            } else {
                unitDisplay.textContent = '';
            }
            
            calculateTotal();
        }

        function updateProducts() {
            // This function could be used to filter products by supplier
            // For now, we'll just recalculate
            calculateTotal();
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            updateUnitPrice();
            calculateTotal();
        });
    </script>
</body>
</html>

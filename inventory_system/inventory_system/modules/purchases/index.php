<?php
/**
 * Purchases Management Page
 * Relational Inventory Control & Stock Tracking System
 */

// Include authentication helper
require_once '../../includes/auth_helper.php';

// Require login to access this page
requireLogin();

// Include database configuration
require_once '../../config/database.php';

// Initialize database connection
$database = new Database();
$db = $database->connect();

// Handle delete action
if (isset($_GET['delete']) && is_numeric($_GET['delete'])) {
    $purchaseId = $_GET['delete'];
    
    try {
        // Get purchase details before deletion for stock adjustment
        $stmt = $db->prepare("SELECT product_id, quantity FROM purchases WHERE id = ?");
        $stmt->execute([$purchaseId]);
        $purchase = $stmt->fetch();
        
        if ($purchase) {
            // Start transaction
            $db->beginTransaction();
            
            try {
                // Delete the purchase
                $stmt = $db->prepare("DELETE FROM purchases WHERE id = ?");
                $stmt->execute([$purchaseId]);
                
                // Adjust stock quantity (remove the purchased quantity)
                $stmt = $db->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?");
                $stmt->execute([$purchase['quantity'], $purchase['product_id']]);
                
                // Commit transaction
                $db->commit();
                
                setFlashMessage('success', 'Purchase deleted successfully and stock adjusted');
                logActivity('delete_purchase', "Purchase ID: $purchaseId, Product ID: {$purchase['product_id']}, Quantity: {$purchase['quantity']}");
                
            } catch (Exception $e) {
                // Rollback transaction on error
                $db->rollBack();
                throw $e;
            }
        } else {
            setFlashMessage('error', 'Purchase not found');
        }
        
    } catch (PDOException $e) {
        setFlashMessage('error', 'Error deleting purchase');
        error_log("Delete purchase error: " . $e->getMessage());
    }
    
    // Redirect to prevent refresh
    header('Location: index.php');
    exit;
}

// Get search and filter parameters
$search = $_GET['search'] ?? '';
$supplier = $_GET['supplier'] ?? '';
$product = $_GET['product'] ?? '';
$payment_status = $_GET['payment_status'] ?? '';
$date_from = $_GET['date_from'] ?? '';
$date_to = $_GET['date_to'] ?? '';

// Build base query
$query = "
    SELECT p.*, 
           s.name as supplier_name,
           pr.name as product_name,
           pr.unit as product_unit,
           u.username as created_by_username
    FROM purchases p
    JOIN suppliers s ON p.supplier_id = s.id
    JOIN products pr ON p.product_id = pr.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE 1=1
";

$params = [];

// Add search conditions
if (!empty($search)) {
    $query .= " AND (p.invoice_number LIKE ? OR p.notes LIKE ? OR s.name LIKE ? OR pr.name LIKE ?)";
    $searchParam = "%$search%";
    $params = array_merge($params, [$searchParam, $searchParam, $searchParam, $searchParam]);
}

if (!empty($supplier)) {
    $query .= " AND p.supplier_id = ?";
    $params[] = $supplier;
}

if (!empty($product)) {
    $query .= " AND p.product_id = ?";
    $params[] = $product;
}

if (!empty($payment_status)) {
    $query .= " AND p.payment_status = ?";
    $params[] = $payment_status;
}

if (!empty($date_from)) {
    $query .= " AND p.purchase_date >= ?";
    $params[] = $date_from;
}

if (!empty($date_to)) {
    $query .= " AND p.purchase_date <= ?";
    $params[] = $date_to;
}

$query .= " ORDER BY p.purchase_date DESC, p.created_at DESC";

// Execute query
try {
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $purchases = $stmt->fetchAll();
} catch (PDOException $e) {
    error_log("Purchases query error: " . $e->getMessage());
    $purchases = [];
}

// Get suppliers and products for filters
try {
    $suppliers = $db->query("SELECT id, name FROM suppliers WHERE is_active = 1 ORDER BY name ASC")->fetchAll();
    $products = $db->query("SELECT id, name FROM products WHERE is_active = 1 ORDER BY name ASC")->fetchAll();
} catch (PDOException $e) {
    $suppliers = [];
    $products = [];
}

// Calculate summary statistics
$totalPurchases = count($purchases);
$totalAmount = array_sum(array_column($purchases, 'total_price'));
$totalQuantity = array_sum(array_column($purchases, 'quantity'));

// Get current user info
$currentUser = getCurrentUser();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchases - Inventory Management System</title>
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
                <h2>Purchases Management</h2>
                <a href="add.php" class="btn btn-primary">Add New Purchase</a>
            </div>

            <!-- Summary Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon purchases-icon">
                        <i>📦</i>
                    </div>
                    <div class="stat-info">
                        <h3><?php echo number_format($totalPurchases); ?></h3>
                        <p>Total Purchases</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon revenue-icon">
                        <i>💰</i>
                    </div>
                    <div class="stat-info">
                        <h3>₹<?php echo number_format($totalAmount, 2); ?></h3>
                        <p>Total Amount</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon quantity-icon">
                        <i>📊</i>
                    </div>
                    <div class="stat-info">
                        <h3><?php echo number_format($totalQuantity); ?></h3>
                        <p>Total Quantity</p>
                    </div>
                </div>
            </div>

            <!-- Search and Filters -->
            <div class="search-filters">
                <form method="GET" action="index.php" class="filter-form">
                    <div class="filter-row">
                        <input 
                            type="text" 
                            name="search" 
                            placeholder="Search purchases..." 
                            value="<?php echo htmlspecialchars($search); ?>"
                            class="search-input"
                        >
                        
                        <select name="supplier" class="filter-select">
                            <option value="">All Suppliers</option>
                            <?php foreach ($suppliers as $sup): ?>
                                <option value="<?php echo $sup['id']; ?>" <?php echo $supplier == $sup['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($sup['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        
                        <select name="product" class="filter-select">
                            <option value="">All Products</option>
                            <?php foreach ($products as $prod): ?>
                                <option value="<?php echo $prod['id']; ?>" <?php echo $product == $prod['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($prod['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        
                        <select name="payment_status" class="filter-select">
                            <option value="">All Payment Status</option>
                            <option value="pending" <?php echo $payment_status == 'pending' ? 'selected' : ''; ?>>Pending</option>
                            <option value="paid" <?php echo $payment_status == 'paid' ? 'selected' : ''; ?>>Paid</option>
                            <option value="partial" <?php echo $payment_status == 'partial' ? 'selected' : ''; ?>>Partial</option>
                        </select>
                    </div>
                    
                    <div class="filter-row">
                        <input 
                            type="date" 
                            name="date_from" 
                            placeholder="From Date"
                            value="<?php echo htmlspecialchars($date_from); ?>"
                            class="filter-select"
                        >
                        
                        <input 
                            type="date" 
                            name="date_to" 
                            placeholder="To Date"
                            value="<?php echo htmlspecialchars($date_to); ?>"
                            class="filter-select"
                        >
                        
                        <button type="submit" class="btn btn-secondary">Filter</button>
                        <a href="index.php" class="btn btn-outline">Clear</a>
                    </div>
                </form>
            </div>

            <!-- Purchases Table -->
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Invoice #</th>
                            <th>Supplier</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                            <th>Payment</th>
                            <th>Created By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($purchases)): ?>
                            <tr>
                                <td colspan="10" class="text-center">No purchases found</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($purchases as $purchase): ?>
                                <tr>
                                    <td><?php echo date('M d, Y', strtotime($purchase['purchase_date'])); ?></td>
                                    <td>
                                        <strong><?php echo htmlspecialchars($purchase['invoice_number']); ?></strong>
                                    </td>
                                    <td><?php echo htmlspecialchars($purchase['supplier_name']); ?></td>
                                    <td><?php echo htmlspecialchars($purchase['product_name']); ?></td>
                                    <td><?php echo $purchase['quantity']; ?> <?php echo htmlspecialchars($purchase['product_unit']); ?></td>
                                    <td>₹<?php echo number_format($purchase['unit_price'], 2); ?></td>
                                    <td><strong>₹<?php echo number_format($purchase['total_price'], 2); ?></strong></td>
                                    <td>
                                        <span class="payment-badge payment-<?php echo $purchase['payment_status']; ?>">
                                            <?php echo ucfirst($purchase['payment_status']); ?>
                                        </span>
                                    </td>
                                    <td><?php echo htmlspecialchars($purchase['created_by_username'] ?? 'System'); ?></td>
                                    <td>
                                        <div class="action-buttons">
                                            <a href="view.php?id=<?php echo $purchase['id']; ?>" class="btn btn-sm btn-info" title="View">👁️</a>
                                            <?php if (canPerformAction('update')): ?>
                                                <a href="edit.php?id=<?php echo $purchase['id']; ?>" class="btn btn-sm btn-warning" title="Edit">✏️</a>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </main>
    </div>

    <style>
        .payment-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .payment-pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .payment-paid {
            background: #d4edda;
            color: #155724;
        }
        
        .payment-partial {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .purchases-icon {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }
        
        .revenue-icon {
            background: linear-gradient(135deg, #f093fb, #f5576c);
            color: white;
        }
        
        .quantity-icon {
            background: linear-gradient(135deg, #4facfe, #00f2fe);
            color: white;
        }
    </style>

    <script src="../../assets/js/purchases.js"></script>
</body>
</html>

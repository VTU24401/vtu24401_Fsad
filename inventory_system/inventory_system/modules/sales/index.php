<?php
/**
 * Sales Management Page
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
    $saleId = $_GET['delete'];
    
    try {
        // Get sale details before deletion for stock adjustment
        $stmt = $db->prepare("SELECT product_id, quantity FROM sales WHERE id = ?");
        $stmt->execute([$saleId]);
        $sale = $stmt->fetch();
        
        if ($sale) {
            // Start transaction
            $db->beginTransaction();
            
            try {
                // Delete the sale
                $stmt = $db->prepare("DELETE FROM sales WHERE id = ?");
                $stmt->execute([$saleId]);
                
                // Adjust stock quantity (add back the sold quantity)
                $stmt = $db->prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?");
                $stmt->execute([$sale['quantity'], $sale['product_id']]);
                
                // Commit transaction
                $db->commit();
                
                setFlashMessage('success', 'Sale deleted successfully and stock restored');
                logActivity('delete_sale', "Sale ID: $saleId, Product ID: {$sale['product_id']}, Quantity: {$sale['quantity']}");
                
            } catch (Exception $e) {
                // Rollback transaction on error
                $db->rollBack();
                throw $e;
            }
        } else {
            setFlashMessage('error', 'Sale not found');
        }
        
    } catch (PDOException $e) {
        setFlashMessage('error', 'Error deleting sale');
        error_log("Delete sale error: " . $e->getMessage());
    }
    
    // Redirect to prevent refresh
    header('Location: index.php');
    exit;
}

// Get search and filter parameters
$search = $_GET['search'] ?? '';
$product = $_GET['product'] ?? '';
$payment_status = $_GET['payment_status'] ?? '';
$date_from = $_GET['date_from'] ?? '';
$date_to = $_GET['date_to'] ?? '';

// Build base query
$query = "
    SELECT s.*, 
           p.name as product_name,
           p.unit as product_unit,
           u.username as created_by_username
    FROM sales s
    JOIN products p ON s.product_id = p.id
    LEFT JOIN users u ON s.created_by = u.id
    WHERE 1=1
";

$params = [];

// Add search conditions
if (!empty($search)) {
    $query .= " AND (s.invoice_number LIKE ? OR s.notes LIKE ? OR s.customer_name LIKE ? OR s.customer_email LIKE ? OR p.name LIKE ?)";
    $searchParam = "%$search%";
    $params = array_merge($params, [$searchParam, $searchParam, $searchParam, $searchParam, $searchParam]);
}

if (!empty($product)) {
    $query .= " AND s.product_id = ?";
    $params[] = $product;
}

if (!empty($payment_status)) {
    $query .= " AND s.payment_status = ?";
    $params[] = $payment_status;
}

if (!empty($date_from)) {
    $query .= " AND s.sale_date >= ?";
    $params[] = $date_from;
}

if (!empty($date_to)) {
    $query .= " AND s.sale_date <= ?";
    $params[] = $date_to;
}

$query .= " ORDER BY s.sale_date DESC, s.created_at DESC";

// Execute query
try {
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $sales = $stmt->fetchAll();
} catch (PDOException $e) {
    error_log("Sales query error: " . $e->getMessage());
    $sales = [];
}

// Get products for filters
try {
    $products = $db->query("SELECT id, name FROM products WHERE is_active = 1 ORDER BY name ASC")->fetchAll();
} catch (PDOException $e) {
    $products = [];
}

// Calculate summary statistics
$totalSales = count($sales);
$totalRevenue = array_sum(array_column($sales, 'total_price'));
$totalQuantity = array_sum(array_column($sales, 'quantity'));

// Calculate profit
$totalProfit = 0;
foreach ($sales as $sale) {
    $stmt = $db->prepare("SELECT purchase_price FROM products WHERE id = ?");
    $stmt->execute([$sale['product_id']]);
    $product = $stmt->fetch();
    if ($product) {
        $totalProfit += ($sale['unit_price'] - $product['purchase_price']) * $sale['quantity'];
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
    <title>Sales - Inventory Management System</title>
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
                <h2>Sales Management</h2>
                <a href="add.php" class="btn btn-primary">Add New Sale</a>
            </div>

            <!-- Summary Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon sales-icon">
                        <i>💰</i>
                    </div>
                    <div class="stat-info">
                        <h3><?php echo number_format($totalSales); ?></h3>
                        <p>Total Sales</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon revenue-icon">
                        <i>💵</i>
                    </div>
                    <div class="stat-info">
                        <h3>₹<?php echo number_format($totalRevenue, 2); ?></h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon profit-icon">
                        <i>📈</i>
                    </div>
                    <div class="stat-info">
                        <h3>₹<?php echo number_format($totalProfit, 2); ?></h3>
                        <p>Total Profit</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon quantity-icon">
                        <i>📦</i>
                    </div>
                    <div class="stat-info">
                        <h3><?php echo number_format($totalQuantity); ?></h3>
                        <p>Items Sold</p>
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
                            placeholder="Search sales..." 
                            value="<?php echo htmlspecialchars($search); ?>"
                            class="search-input"
                        >
                        
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

            <!-- Sales Table -->
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Invoice #</th>
                            <th>Product</th>
                            <th>Customer</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                            <th>Payment</th>
                            <th>Created By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($sales)): ?>
                            <tr>
                                <td colspan="10" class="text-center">No sales found</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($sales as $sale): ?>
                                <tr>
                                    <td><?php echo date('M d, Y', strtotime($sale['sale_date'])); ?></td>
                                    <td>
                                        <strong><?php echo htmlspecialchars($sale['invoice_number']); ?></strong>
                                    </td>
                                    <td><?php echo htmlspecialchars($sale['product_name']); ?></td>
                                    <td>
                                        <?php if (!empty($sale['customer_name'])): ?>
                                            <div>
                                                <strong><?php echo htmlspecialchars($sale['customer_name']); ?></strong>
                                                <?php if (!empty($sale['customer_email'])): ?>
                                                    <br><small><?php echo htmlspecialchars($sale['customer_email']); ?></small>
                                                <?php endif; ?>
                                            </div>
                                        <?php else: ?>
                                            <em>Walk-in customer</em>
                                        <?php endif; ?>
                                    </td>
                                    <td><?php echo $sale['quantity']; ?> <?php echo htmlspecialchars($sale['product_unit']); ?></td>
                                    <td>₹<?php echo number_format($sale['unit_price'], 2); ?></td>
                                    <td><strong>₹<?php echo number_format($sale['total_price'], 2); ?></strong></td>
                                    <td>
                                        <span class="payment-badge payment-<?php echo $sale['payment_status']; ?>">
                                            <?php echo ucfirst($sale['payment_status']); ?>
                                        </span>
                                    </td>
                                    <td><?php echo htmlspecialchars($sale['created_by_username'] ?? 'System'); ?></td>
                                    <td>
                                        <div class="action-buttons">
                                            <a href="view.php?id=<?php echo $sale['id']; ?>" class="btn btn-sm btn-info" title="View">👁️</a>
                                            <?php if (canPerformAction('update')): ?>
                                                <a href="edit.php?id=<?php echo $sale['id']; ?>" class="btn btn-sm btn-warning" title="Edit">✏️</a>
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
        
        .sales-icon {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }
        
        .revenue-icon {
            background: linear-gradient(135deg, #f093fb, #f5576c);
            color: white;
        }
        
        .profit-icon {
            background: linear-gradient(135deg, #4facfe, #00f2fe);
            color: white;
        }
        
        .quantity-icon {
            background: linear-gradient(135deg, #43e97b, #38f9d7);
            color: white;
        }
    </style>

    <script src="../../assets/js/sales.js"></script>
</body>
</html>

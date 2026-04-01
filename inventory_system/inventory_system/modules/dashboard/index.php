<?php
/**
 * Dashboard Page
 * Relational Inventory Control & Stock Tracking System
 */

// Include authentication helper
require_once '../../includes/auth_helper.php';

// Require login to access dashboard
requireLogin();

// Include database configuration
require_once '../../config/database.php';

// Initialize database connection
$database = new Database();
$db = $database->connect();

// Get dashboard statistics
try {
    // Total products
    $stmt = $db->query("SELECT COUNT(*) as total FROM products WHERE is_active = 1");
    $totalProducts = $stmt->fetch()['total'];
    
    // Total suppliers
    $stmt = $db->query("SELECT COUNT(*) as total FROM suppliers WHERE is_active = 1");
    $totalSuppliers = $stmt->fetch()['total'];
    
    // Total sales (today)
    $stmt = $db->query("SELECT COUNT(*) as total, SUM(total_price) as revenue FROM sales WHERE DATE(sale_date) = CURDATE()");
    $todaySales = $stmt->fetch();
    $totalSalesToday = $todaySales['total'];
    $todayRevenue = $todaySales['revenue'] ?? 0;
    
    // Total sales (this month)
    $stmt = $db->query("SELECT COUNT(*) as total, SUM(total_price) as revenue FROM sales WHERE MONTH(sale_date) = MONTH(CURDATE()) AND YEAR(sale_date) = YEAR(CURDATE())");
    $monthSales = $stmt->fetch();
    $totalSalesMonth = $monthSales['total'];
    $monthRevenue = $monthSales['revenue'] ?? 0;
    
    // Low stock items
    $stmt = $db->query("SELECT COUNT(*) as total FROM products WHERE quantity <= min_stock_level AND is_active = 1");
    $lowStockItems = $stmt->fetch()['total'];
    
    // Out of stock items
    $stmt = $db->query("SELECT COUNT(*) as total FROM products WHERE quantity = 0 AND is_active = 1");
    $outOfStockItems = $stmt->fetch()['total'];
    
    // Recent sales (last 5)
    $stmt = $db->query("
        SELECT s.*, p.name as product_name, u.username as created_by_username 
        FROM sales s 
        JOIN products p ON s.product_id = p.id 
        LEFT JOIN users u ON s.created_by = u.id 
        ORDER BY s.created_at DESC 
        LIMIT 5
    ");
    $recentSales = $stmt->fetchAll();
    
    // Recent purchases (last 5)
    $stmt = $db->query("
        SELECT p.*, pr.name as product_name, s.name as supplier_name, u.username as created_by_username 
        FROM purchases p 
        JOIN products pr ON p.product_id = pr.id 
        JOIN suppliers s ON p.supplier_id = s.id 
        LEFT JOIN users u ON p.created_by = u.id 
        ORDER BY p.created_at DESC 
        LIMIT 5
    ");
    $recentPurchases = $stmt->fetchAll();
    
    // Low stock products (last 10)
    $stmt = $db->query("
        SELECT id, name, quantity, min_stock_level, unit 
        FROM products 
        WHERE quantity <= min_stock_level AND is_active = 1 
        ORDER BY quantity ASC 
        LIMIT 10
    ");
    $lowStockProducts = $stmt->fetchAll();
    
    // Top selling products (this month)
    $stmt = $db->query("
        SELECT p.name, SUM(s.quantity) as total_sold, SUM(s.total_price) as total_revenue
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE MONTH(s.sale_date) = MONTH(CURDATE()) AND YEAR(s.sale_date) = YEAR(CURDATE())
        GROUP BY p.id, p.name
        ORDER BY total_sold DESC
        LIMIT 5
    ");
    $topProducts = $stmt->fetchAll();
    
} catch (PDOException $e) {
    error_log("Dashboard error: " . $e->getMessage());
    $error = "Error loading dashboard data";
}

// Get current user info
$currentUser = getCurrentUser();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Inventory Management System</title>
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
                <li><a href="index.php" class="active">Dashboard</a></li>
                <li><a href="../products/index.php">Products</a></li>
                <li><a href="../suppliers/index.php">Suppliers</a></li>
                <li><a href="../purchases/index.php">Purchases</a></li>
                <li><a href="../sales/index.php">Sales</a></li>
                <li><a href="../reports/index.php">Reports</a></li>
            </ul>
        </nav>

        <!-- Main Content -->
        <main class="main-content">
            <?php displayFlashMessage(); ?>
            
            <h2>Dashboard Overview</h2>
            
            <!-- Statistics Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon products-icon">
                        <i>📦</i>
                    </div>
                    <div class="stat-info">
                        <h3><?php echo number_format($totalProducts); ?></h3>
                        <p>Total Products</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon suppliers-icon">
                        <i>🏢</i>
                    </div>
                    <div class="stat-info">
                        <h3><?php echo number_format($totalSuppliers); ?></h3>
                        <p>Total Suppliers</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon sales-icon">
                        <i>💰</i>
                    </div>
                    <div class="stat-info">
                        <h3><?php echo number_format($totalSalesToday); ?></h3>
                        <p>Today's Sales</p>
                        <small>Revenue: ₹<?php echo number_format($todayRevenue, 2); ?></small>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon warning-icon">
                        <i>⚠️</i>
                    </div>
                    <div class="stat-info">
                        <h3><?php echo number_format($lowStockItems); ?></h3>
                        <p>Low Stock Items</p>
                        <small><?php echo $outOfStockItems; ?> out of stock</small>
                    </div>
                </div>
            </div>

            <!-- Charts and Tables Row -->
            <div class="dashboard-row">
                <!-- Monthly Revenue Chart -->
                <div class="dashboard-card">
                    <h3>Monthly Overview</h3>
                    <div class="monthly-stats">
                        <div class="monthly-stat">
                            <span class="label">Sales This Month:</span>
                            <span class="value"><?php echo number_format($totalSalesMonth); ?></span>
                        </div>
                        <div class="monthly-stat">
                            <span class="label">Revenue This Month:</span>
                            <span class="value">₹<?php echo number_format($monthRevenue, 2); ?></span>
                        </div>
                    </div>
                </div>

                <!-- Top Products -->
                <div class="dashboard-card">
                    <h3>Top Selling Products (This Month)</h3>
                    <?php if (empty($topProducts)): ?>
                        <p>No sales data available for this month.</p>
                    <?php else: ?>
                        <table class="mini-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Units Sold</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($topProducts as $product): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($product['name']); ?></td>
                                        <td><?php echo number_format($product['total_sold']); ?></td>
                                        <td>₹<?php echo number_format($product['total_revenue'], 2); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Low Stock Alert -->
            <?php if ($lowStockItems > 0): ?>
                <div class="dashboard-card alert-card">
                    <h3>⚠️ Low Stock Alert</h3>
                    <table class="mini-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Current Stock</th>
                                <th>Min Level</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($lowStockProducts as $product): ?>
                                <tr class="<?php echo $product['quantity'] == 0 ? 'out-of-stock' : 'low-stock'; ?>">
                                    <td><?php echo htmlspecialchars($product['name']); ?></td>
                                    <td><?php echo $product['quantity']; ?> <?php echo htmlspecialchars($product['unit']); ?></td>
                                    <td><?php echo $product['min_stock_level']; ?> <?php echo htmlspecialchars($product['unit']); ?></td>
                                    <td>
                                        <a href="../purchases/add.php?product_id=<?php echo $product['id']; ?>" class="btn btn-sm btn-primary">Order Stock</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>

            <!-- Recent Activities -->
            <div class="dashboard-row">
                <!-- Recent Sales -->
                <div class="dashboard-card">
                    <h3>Recent Sales</h3>
                    <?php if (empty($recentSales)): ?>
                        <p>No recent sales.</p>
                    <?php else: ?>
                        <table class="mini-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                    <th>By</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recentSales as $sale): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($sale['product_name']); ?></td>
                                        <td><?php echo $sale['quantity']; ?></td>
                                        <td>₹<?php echo number_format($sale['total_price'], 2); ?></td>
                                        <td><?php echo htmlspecialchars($sale['created_by_username'] ?? 'System'); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                </div>

                <!-- Recent Purchases -->
                <div class="dashboard-card">
                    <h3>Recent Purchases</h3>
                    <?php if (empty($recentPurchases)): ?>
                        <p>No recent purchases.</p>
                    <?php else: ?>
                        <table class="mini-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Supplier</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recentPurchases as $purchase): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($purchase['product_name']); ?></td>
                                        <td><?php echo htmlspecialchars($purchase['supplier_name']); ?></td>
                                        <td><?php echo $purchase['quantity']; ?></td>
                                        <td>₹<?php echo number_format($purchase['total_price'], 2); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                </div>
            </div>
        </main>
    </div>

    <script src="../../assets/js/dashboard.js"></script>
</body>
</html>

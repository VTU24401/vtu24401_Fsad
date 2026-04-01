<?php
/**
 * Products Management Page
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

// Set global database connection for logging
$GLOBALS['db'] = $db;

// Handle delete action
if (isset($_GET['delete']) && is_numeric($_GET['delete'])) {
    $productId = $_GET['delete'];
    
    try {
        // Check if product has sales or purchases
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM sales WHERE product_id = ?");
        $stmt->execute([$productId]);
        $salesCount = $stmt->fetch()['count'];
        
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM purchases WHERE product_id = ?");
        $stmt->execute([$productId]);
        $purchasesCount = $stmt->fetch()['count'];
        
        // Check if product has stock movements
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM stock_movements WHERE product_id = ?");
        $stmt->execute([$productId]);
        $stockMovementsCount = $stmt->fetch()['count'];
        
        if ($salesCount > 0 || $purchasesCount > 0 || $stockMovementsCount > 0) {
            // Deactivate instead of delete if there are transactions or stock movements
            $stmt = $db->prepare("UPDATE products SET is_active = 0 WHERE id = ?");
            $stmt->execute([$productId]);
            setFlashMessage('success', 'Product deactivated successfully (cannot be deleted due to existing transactions or stock movements)');
        } else {
            // Delete if no transactions exist
            $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            setFlashMessage('success', 'Product deleted successfully');
        }
        
        logActivity('delete_product', "Product ID: $productId");
        
    } catch (PDOException $e) {
        setFlashMessage('error', 'Error deleting product');
        error_log("Delete product error: " . $e->getMessage());
    }
    
    header('Location: index.php');
    exit();
}

// Get search and filter parameters
$search = $_GET['search'] ?? '';
$category = $_GET['category'] ?? '';
$supplier = $_GET['supplier'] ?? '';
$stockStatus = $_GET['stock_status'] ?? '';

// Build base query
$query = "
    SELECT p.*, c.name as category_name, s.name as supplier_name,
           CASE 
               WHEN p.quantity = 0 THEN 'Out of Stock'
               WHEN p.quantity <= p.min_stock_level THEN 'Low Stock'
               WHEN p.quantity >= p.max_stock_level THEN 'Overstock'
               ELSE 'In Stock'
           END as stock_status
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.is_active = 1
";

$params = [];

// Add search conditions
if (!empty($search)) {
    $query .= " AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)";
    $searchParam = "%$search%";
    $params[] = $searchParam;
    $params[] = $searchParam;
    $params[] = $searchParam;
}

if (!empty($category)) {
    $query .= " AND p.category_id = ?";
    $params[] = $category;
}

if (!empty($supplier)) {
    $query .= " AND p.supplier_id = ?";
    $params[] = $supplier;
}

if (!empty($stockStatus)) {
    switch ($stockStatus) {
        case 'out_of_stock':
            $query .= " AND p.quantity = 0";
            break;
        case 'low_stock':
            $query .= " AND p.quantity > 0 AND p.quantity <= p.min_stock_level";
            break;
        case 'normal':
            $query .= " AND p.quantity > p.min_stock_level AND p.quantity < p.max_stock_level";
            break;
        case 'overstock':
            $query .= " AND p.quantity >= p.max_stock_level";
            break;
    }
}

$query .= " ORDER BY p.name ASC";

// Execute query
try {
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $products = $stmt->fetchAll();
} catch (PDOException $e) {
    error_log("Products query error: " . $e->getMessage());
    $products = [];
}

// Get categories and suppliers for filters
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
    <title>Products - Inventory Management System</title>
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
                <h2>Products Management</h2>
                <a href="add.php" class="btn btn-primary">Add New Product</a>
            </div>

            <!-- Search and Filters -->
            <div class="search-filters">
                <form method="GET" action="index.php" class="filter-form">
                    <div class="filter-row">
                        <input 
                            type="text" 
                            name="search" 
                            placeholder="Search products..." 
                            value="<?php echo htmlspecialchars($search); ?>"
                            class="search-input"
                        >
                        
                        <select name="category" class="filter-select">
                            <option value="">All Categories</option>
                            <?php foreach ($categories as $cat): ?>
                                <option value="<?php echo $cat['id']; ?>" <?php echo $category == $cat['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($cat['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        
                        <select name="supplier" class="filter-select">
                            <option value="">All Suppliers</option>
                            <?php foreach ($suppliers as $sup): ?>
                                <option value="<?php echo $sup['id']; ?>" <?php echo $supplier == $sup['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($sup['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        
                        <select name="stock_status" class="filter-select">
                            <option value="">All Stock Status</option>
                            <option value="out_of_stock" <?php echo $stockStatus == 'out_of_stock' ? 'selected' : ''; ?>>Out of Stock</option>
                            <option value="low_stock" <?php echo $stockStatus == 'low_stock' ? 'selected' : ''; ?>>Low Stock</option>
                            <option value="normal" <?php echo $stockStatus == 'normal' ? 'selected' : ''; ?>>Normal Stock</option>
                            <option value="overstock" <?php echo $stockStatus == 'overstock' ? 'selected' : ''; ?>>Overstock</option>
                        </select>
                        
                        <button type="submit" class="btn btn-secondary">Filter</button>
                        <a href="index.php" class="btn btn-outline">Clear</a>
                    </div>
                </form>
            </div>

            <!-- Products Table -->
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Supplier</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Purchase Price</th>
                            <th>Selling Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($products)): ?>
                            <tr>
                                <td colspan="9" class="text-center">No products found</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($products as $product): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($product['sku'] ?? 'N/A'); ?></td>
                                    <td>
                                        <strong><?php echo htmlspecialchars($product['name']); ?></strong>
                                        <?php if (!empty($product['description'])): ?>
                                            <br><small><?php echo htmlspecialchars(substr($product['description'], 0, 50)) . '...'; ?></small>
                                        <?php endif; ?>
                                    </td>
                                    <td><?php echo htmlspecialchars($product['category_name'] ?? 'N/A'); ?></td>
                                    <td><?php echo htmlspecialchars($product['supplier_name'] ?? 'N/A'); ?></td>
                                    <td>
                                        <?php echo $product['quantity']; ?> <?php echo htmlspecialchars($product['unit']); ?>
                                        <br><small>Min: <?php echo $product['min_stock_level']; ?></small>
                                    </td>
                                    <td>
                                        <span class="stock-badge <?php echo strtolower(str_replace(' ', '-', $product['stock_status'])); ?>">
                                            <?php echo htmlspecialchars($product['stock_status']); ?>
                                        </span>
                                    </td>
                                    <td>₹<?php echo number_format($product['purchase_price'], 2); ?></td>
                                    <td>₹<?php echo number_format($product['selling_price'], 2); ?></td>
                                    <td>
                                        <div class="action-buttons">
                                            <a href="view.php?id=<?php echo $product['id']; ?>" class="btn btn-sm btn-info" title="View">👁️</a>
                                            <a href="edit.php?id=<?php echo $product['id']; ?>" class="btn btn-sm btn-warning" title="Edit">✏️</a>
                                            <a href="add_stock.php?id=<?php echo $product['id']; ?>" class="btn btn-sm btn-success" title="Add Stock">📦</a>
                                            <?php if (canPerformAction('delete')): ?>
                                                <a href="index.php?delete=<?php echo $product['id']; ?>" 
                                                   class="btn btn-sm btn-danger" 
                                                   title="Delete"
                                                   onclick="return confirm('Are you sure you want to delete this product?')">🗑️</a>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>

            <!-- Summary Statistics -->
            <div class="summary-stats">
                <div class="stat-item">
                    <strong>Total Products:</strong> <?php echo count($products); ?>
                </div>
                <div class="stat-item">
                    <strong>Low Stock:</strong> 
                    <span class="text-warning">
                        <?php echo count(array_filter($products, fn($p) => $p['quantity'] <= $p['min_stock_level'])); ?>
                    </span>
                </div>
                <div class="stat-item">
                    <strong>Out of Stock:</strong> 
                    <span class="text-danger">
                        <?php echo count(array_filter($products, fn($p) => $p['quantity'] == 0)); ?>
                    </span>
                </div>
            </div>
        </main>
    </div>

    <script src="../../assets/js/products.js"></script>
</body>
</html>

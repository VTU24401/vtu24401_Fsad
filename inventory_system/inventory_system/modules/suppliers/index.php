<?php
/**
 * Suppliers Management Page
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
    $supplierId = $_GET['delete'];
    
    try {
        // Check if supplier has products
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM products WHERE supplier_id = ?");
        $stmt->execute([$supplierId]);
        $productsCount = $stmt->fetch()['count'];
        
        // Check if supplier has purchases
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM purchases WHERE supplier_id = ?");
        $stmt->execute([$supplierId]);
        $purchasesCount = $stmt->fetch()['count'];
        
        if ($productsCount > 0 || $purchasesCount > 0) {
            // Deactivate instead of delete if there are relationships
            $stmt = $db->prepare("UPDATE suppliers SET is_active = 0 WHERE id = ?");
            $stmt->execute([$supplierId]);
            setFlashMessage('success', 'Supplier deactivated successfully (cannot be deleted due to existing relationships)');
        } else {
            // Delete if no relationships exist
            $stmt = $db->prepare("DELETE FROM suppliers WHERE id = ?");
            $stmt->execute([$supplierId]);
            setFlashMessage('success', 'Supplier deleted successfully');
        }
        
        logActivity('delete_supplier', "Supplier ID: $supplierId");
        
    } catch (PDOException $e) {
        setFlashMessage('error', 'Error deleting supplier');
        error_log("Delete supplier error: " . $e->getMessage());
    }
    
    header('Location: index.php');
    exit();
}

// Get search parameter
$search = $_GET['search'] ?? '';

// Build base query
$query = "
    SELECT s.*, 
           COUNT(DISTINCT p.id) as product_count,
           COALESCE(SUM(pu.total_price), 0) as total_purchases
    FROM suppliers s
    LEFT JOIN products p ON s.id = p.supplier_id AND p.is_active = 1
    LEFT JOIN purchases pu ON s.id = pu.supplier_id
    WHERE s.is_active = 1
";

$params = [];

// Add search condition
if (!empty($search)) {
    $query .= " AND (s.name LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)";
    $searchParam = "%$search%";
    $params = array_fill(0, 4, $searchParam);
}

$query .= " GROUP BY s.id ORDER BY s.name ASC";

// Execute query
try {
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $suppliers = $stmt->fetchAll();
} catch (PDOException $e) {
    error_log("Suppliers query error: " . $e->getMessage());
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
    <title>Suppliers - Inventory Management System</title>
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
                <h2>Suppliers Management</h2>
                <a href="add.php" class="btn btn-primary">Add New Supplier</a>
            </div>

            <!-- Search -->
            <div class="search-filters">
                <form method="GET" action="index.php" class="filter-form">
                    <div class="filter-row">
                        <input 
                            type="text" 
                            name="search" 
                            placeholder="Search suppliers..." 
                            value="<?php echo htmlspecialchars($search); ?>"
                            class="search-input"
                        >
                        
                        <button type="submit" class="btn btn-secondary">Search</button>
                        <a href="index.php" class="btn btn-outline">Clear</a>
                    </div>
                </form>
            </div>

            <!-- Suppliers Table -->
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Supplier Name</th>
                            <th>Contact Person</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Location</th>
                            <th>Products</th>
                            <th>Total Purchases</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($suppliers)): ?>
                            <tr>
                                <td colspan="8" class="text-center">No suppliers found</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($suppliers as $supplier): ?>
                                <tr>
                                    <td>
                                        <strong><?php echo htmlspecialchars($supplier['name']); ?></strong>
                                        <?php if (!empty($supplier['address'])): ?>
                                            <br><small><?php echo htmlspecialchars(substr($supplier['address'], 0, 30)) . '...'; ?></small>
                                        <?php endif; ?>
                                    </td>
                                    <td><?php echo htmlspecialchars($supplier['contact_person'] ?? 'N/A'); ?></td>
                                    <td>
                                        <?php if (!empty($supplier['email'])): ?>
                                            <a href="mailto:<?php echo htmlspecialchars($supplier['email']); ?>" class="text-info">
                                                <?php echo htmlspecialchars($supplier['email']); ?>
                                            </a>
                                        <?php else: ?>
                                            N/A
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php if (!empty($supplier['phone'])): ?>
                                            <a href="tel:<?php echo htmlspecialchars($supplier['phone']); ?>" class="text-info">
                                                <?php echo htmlspecialchars($supplier['phone']); ?>
                                            </a>
                                        <?php else: ?>
                                            N/A
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php 
                                        $location = [];
                                        if (!empty($supplier['city'])) $location[] = htmlspecialchars($supplier['city']);
                                        if (!empty($supplier['country'])) $location[] = htmlspecialchars($supplier['country']);
                                        echo !empty($location) ? implode(', ', $location) : 'N/A';
                                        ?>
                                    </td>
                                    <td>
                                        <span class="badge badge-info"><?php echo $supplier['product_count']; ?></span>
                                    </td>
                                    <td>
                                        <strong>₹<?php echo number_format($supplier['total_purchases'], 2); ?></strong>
                                    </td>
                                    <td>
                                        <div class="action-buttons">
                                            <a href="view.php?id=<?php echo $supplier['id']; ?>" class="btn btn-sm btn-info" title="View">👁️</a>
                                            <a href="edit.php?id=<?php echo $supplier['id']; ?>" class="btn btn-sm btn-warning" title="Edit">✏️</a>
                                            <a href="../purchases/add.php?supplier_id=<?php echo $supplier['id']; ?>" class="btn btn-sm btn-success" title="New Purchase">📦</a>
                                            <?php if (canPerformAction('delete')): ?>
                                                <a href="index.php?delete=<?php echo $supplier['id']; ?>" 
                                                   class="btn btn-sm btn-danger" 
                                                   title="Delete"
                                                   onclick="return confirm('Are you sure you want to delete this supplier?')">🗑️</a>
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
                    <strong>Total Suppliers:</strong> <?php echo count($suppliers); ?>
                </div>
                <div class="stat-item">
                    <strong>Total Purchases:</strong> 
                    ₹<?php echo number_format(array_sum(array_column($suppliers, 'total_purchases')), 2); ?>
                </div>
                <div class="stat-item">
                    <strong>Avg Purchases/Supplier:</strong> 
                    ₹<?php echo count($suppliers) > 0 ? number_format(array_sum(array_column($suppliers, 'total_purchases')) / count($suppliers), 2) : '0.00'; ?>
                </div>
            </div>
        </main>
    </div>

    <script src="../../assets/js/suppliers.js"></script>
</body>
</html>

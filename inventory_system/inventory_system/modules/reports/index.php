<?php
/**
 * Reports Page
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

// Get report type and date parameters
$report_type = $_GET['report_type'] ?? 'daily';
$date_from = $_GET['date_from'] ?? date('Y-m-01');
$date_to = $_GET['date_to'] ?? date('Y-m-d');

// Initialize report data
$reportData = [];
$chartData = [];

// Generate reports based on type
switch ($report_type) {
    case 'daily':
        // Daily sales report
        $query = "
            SELECT 
                DATE(s.sale_date) as date,
                COUNT(*) as total_sales,
                SUM(s.quantity) as total_quantity,
                SUM(s.total_price) as total_revenue,
                COUNT(DISTINCT s.customer_name) as unique_customers
            FROM sales s
            WHERE s.sale_date BETWEEN ? AND ?
            GROUP BY DATE(s.sale_date)
            ORDER BY date DESC
        ";
        
        try {
            $stmt = $db->prepare($query);
            $stmt->execute([$date_from, $date_to]);
            $reportData = $stmt->fetchAll();
            
            // Prepare chart data
            foreach ($reportData as $row) {
                $chartData['labels'][] = date('M d', strtotime($row['date']));
                $chartData['revenue'][] = $row['total_revenue'];
                $chartData['sales'][] = $row['total_sales'];
            }
        } catch (PDOException $e) {
            error_log("Daily report error: " . $e->getMessage());
        }
        break;
        
    case 'monthly':
        // Monthly sales report
        $query = "
            SELECT 
                DATE_FORMAT(s.sale_date, '%Y-%m') as month,
                YEAR(s.sale_date) as year,
                MONTH(s.sale_date) as month_num,
                COUNT(*) as total_sales,
                SUM(s.quantity) as total_quantity,
                SUM(s.total_price) as total_revenue,
                COUNT(DISTINCT s.customer_name) as unique_customers
            FROM sales s
            WHERE s.sale_date BETWEEN ? AND ?
            GROUP BY YEAR(s.sale_date), MONTH(s.sale_date)
            ORDER BY year DESC, month_num DESC
        ";
        
        try {
            $stmt = $db->prepare($query);
            $stmt->execute([$date_from, $date_to]);
            $reportData = $stmt->fetchAll();
            
            // Prepare chart data
            foreach ($reportData as $row) {
                $chartData['labels'][] = date('M Y', strtotime($row['month'] . '-01'));
                $chartData['revenue'][] = $row['total_revenue'];
                $chartData['sales'][] = $row['total_sales'];
            }
        } catch (PDOException $e) {
            error_log("Monthly report error: " . $e->getMessage());
        }
        break;
        
    case 'low_stock':
        // Low stock report
        $query = "
            SELECT 
                p.id,
                p.name,
                p.quantity,
                p.min_stock_level,
                p.max_stock_level,
                p.unit,
                p.selling_price,
                c.name as category_name,
                s.name as supplier_name,
                CASE 
                    WHEN p.quantity = 0 THEN 'Out of Stock'
                    WHEN p.quantity <= p.min_stock_level THEN 'Low Stock'
                    ELSE 'Normal'
                END as stock_status
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.is_active = 1 AND p.quantity <= p.min_stock_level
            ORDER BY p.quantity ASC
        ";
        
        try {
            $stmt = $db->prepare($query);
            $stmt->execute();
            $reportData = $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Low stock report error: " . $e->getMessage());
        }
        break;
        
    case 'profit':
        // Profit analysis report
        $query = "
            SELECT 
                DATE(s.sale_date) as date,
                SUM(s.total_price) as revenue,
                SUM(s.quantity * p.purchase_price) as cost,
                SUM(s.total_price - (s.quantity * p.purchase_price)) as profit,
                COUNT(*) as total_sales
            FROM sales s
            JOIN products p ON s.product_id = p.id
            WHERE s.sale_date BETWEEN ? AND ?
            GROUP BY DATE(s.sale_date)
            ORDER BY date DESC
        ";
        
        try {
            $stmt = $db->prepare($query);
            $stmt->execute([$date_from, $date_to]);
            $reportData = $stmt->fetchAll();
            
            // Prepare chart data
            foreach ($reportData as $row) {
                $chartData['labels'][] = date('M d', strtotime($row['date']));
                $chartData['profit'][] = $row['profit'];
                $chartData['revenue'][] = $row['revenue'];
                $chartData['cost'][] = $row['cost'];
            }
        } catch (PDOException $e) {
            error_log("Profit report error: " . $e->getMessage());
        }
        break;
        
    case 'top_products':
        // Top selling products
        $query = "
            SELECT 
                p.name,
                p.selling_price,
                p.purchase_price,
                SUM(s.quantity) as total_sold,
                SUM(s.total_price) as total_revenue,
                SUM(s.quantity * p.purchase_price) as total_cost,
                SUM(s.total_price - (s.quantity * p.purchase_price)) as total_profit,
                COUNT(*) as sales_count
            FROM sales s
            JOIN products p ON s.product_id = p.id
            WHERE s.sale_date BETWEEN ? AND ?
            GROUP BY p.id, p.name, p.selling_price, p.purchase_price
            ORDER BY total_sold DESC
            LIMIT 20
        ";
        
        try {
            $stmt = $db->prepare($query);
            $stmt->execute([$date_from, $date_to]);
            $reportData = $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Top products report error: " . $e->getMessage());
        }
        break;
}

// Calculate summary statistics
$summary = [];
if ($report_type === 'daily' || $report_type === 'monthly' || $report_type === 'profit') {
    $summary['total_revenue'] = array_sum(array_column($reportData, 'total_revenue') ?? []);
    $summary['total_sales'] = array_sum(array_column($reportData, 'total_sales') ?? []);
    $summary['total_quantity'] = array_sum(array_column($reportData, 'total_quantity') ?? []);
    if ($report_type === 'profit') {
        $summary['total_cost'] = array_sum(array_column($reportData, 'cost') ?? []);
        $summary['total_profit'] = array_sum(array_column($reportData, 'profit') ?? []);
        $summary['profit_margin'] = $summary['total_revenue'] > 0 ? ($summary['total_profit'] / $summary['total_revenue']) * 100 : 0;
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
    <title>Reports - Inventory Management System</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
                <li><a href="../sales/index.php">Sales</a></li>
                <li><a href="index.php" class="active">Reports</a></li>
            </ul>
        </nav>

        <!-- Main Content -->
        <main class="main-content">
            <?php displayFlashMessage(); ?>
            
            <div class="page-header">
                <h2>Reports & Analytics</h2>
                <div class="report-actions">
                    <button onclick="window.print()" class="btn btn-outline">🖨️ Print Report</button>
                    <button onclick="exportReport()" class="btn btn-secondary">📥 Export CSV</button>
                </div>
            </div>

            <!-- Report Controls -->
            <div class="search-filters">
                <form method="GET" action="index.php" class="filter-form">
                    <div class="filter-row">
                        <select name="report_type" class="filter-select" onchange="this.form.submit()">
                            <option value="daily" <?php echo $report_type == 'daily' ? 'selected' : ''; ?>>Daily Sales Report</option>
                            <option value="monthly" <?php echo $report_type == 'monthly' ? 'selected' : ''; ?>>Monthly Sales Report</option>
                            <option value="low_stock" <?php echo $report_type == 'low_stock' ? 'selected' : ''; ?>>Low Stock Report</option>
                            <option value="profit" <?php echo $report_type == 'profit' ? 'selected' : ''; ?>>Profit Analysis</option>
                            <option value="top_products" <?php echo $report_type == 'top_products' ? 'selected' : ''; ?>>Top Selling Products</option>
                        </select>
                        
                        <?php if ($report_type !== 'low_stock'): ?>
                            <input 
                                type="date" 
                                name="date_from" 
                                value="<?php echo htmlspecialchars($date_from); ?>"
                                class="filter-select"
                            >
                            
                            <input 
                                type="date" 
                                name="date_to" 
                                value="<?php echo htmlspecialchars($date_to); ?>"
                                class="filter-select"
                            >
                        <?php endif; ?>
                        
                        <button type="submit" class="btn btn-primary">Generate Report</button>
                    </div>
                </form>
            </div>

            <!-- Summary Statistics -->
            <?php if (!empty($summary)): ?>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon revenue-icon">
                            <i>💰</i>
                        </div>
                        <div class="stat-info">
                            <h3>₹<?php echo number_format($summary['total_revenue'], 2); ?></h3>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon sales-icon">
                            <i>📊</i>
                        </div>
                        <div class="stat-info">
                            <h3><?php echo number_format($summary['total_sales']); ?></h3>
                            <p>Total Sales</p>
                        </div>
                    </div>
                    
                    <?php if ($report_type === 'profit'): ?>
                        <div class="stat-card">
                            <div class="stat-icon profit-icon">
                                <i>📈</i>
                            </div>
                            <div class="stat-info">
                                <h3>₹<?php echo number_format($summary['total_profit'], 2); ?></h3>
                                <p>Total Profit</p>
                                <small>Margin: <?php echo number_format($summary['profit_margin'], 1); ?>%</small>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

            <!-- Chart Section -->
            <?php if (!empty($chartData) && $report_type !== 'low_stock' && $report_type !== 'top_products'): ?>
                <div class="dashboard-card">
                    <h3>
                        <?php 
                        switch ($report_type) {
                            case 'daily': echo 'Daily Sales Trend'; break;
                            case 'monthly': echo 'Monthly Sales Trend'; break;
                            case 'profit': echo 'Profit Analysis'; break;
                        }
                        ?>
                    </h3>
                    <div style="height: 400px; position: relative;">
                        <canvas id="reportChart"></canvas>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Report Table -->
            <div class="table-container">
                <table class="data-table" id="reportTable">
                    <thead>
                        <tr>
                            <?php
                            switch ($report_type) {
                                case 'daily':
                                    echo '<th>Date</th><th>Sales</th><th>Quantity</th><th>Revenue</th><th>Customers</th>';
                                    break;
                                case 'monthly':
                                    echo '<th>Month</th><th>Sales</th><th>Quantity</th><th>Revenue</th><th>Customers</th>';
                                    break;
                                case 'low_stock':
                                    echo '<th>Product</th><th>Category</th><th>Current Stock</th><th>Min Level</th><th>Status</th><th>Supplier</th>';
                                    break;
                                case 'profit':
                                    echo '<th>Date</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Sales</th>';
                                    break;
                                case 'top_products':
                                    echo '<th>Product</th><th>Units Sold</th><th>Revenue</th><th>Profit</th><th>Sales Count</th>';
                                    break;
                            }
                            ?>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($reportData)): ?>
                            <tr>
                                <td colspan="10" class="text-center">No data available for the selected period</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($reportData as $row): ?>
                                <tr>
                                    <?php
                                    switch ($report_type) {
                                        case 'daily':
                                            echo '<td>' . date('M d, Y', strtotime($row['date'])) . '</td>';
                                            echo '<td>' . $row['total_sales'] . '</td>';
                                            echo '<td>' . $row['total_quantity'] . '</td>';
                                            echo '<td>₹' . number_format($row['total_revenue'], 2) . '</td>';
                                            echo '<td>' . $row['unique_customers'] . '</td>';
                                            break;
                                            
                                        case 'monthly':
                                            echo '<td>' . date('F Y', mktime(0, 0, 0, $row['month_num'], 1, $row['year'])) . '</td>';
                                            echo '<td>' . $row['total_sales'] . '</td>';
                                            echo '<td>' . $row['total_quantity'] . '</td>';
                                            echo '<td>₹' . number_format($row['total_revenue'], 2) . '</td>';
                                            echo '<td>' . $row['unique_customers'] . '</td>';
                                            break;
                                            
                                        case 'low_stock':
                                            echo '<td><strong>' . htmlspecialchars($row['name']) . '</strong></td>';
                                            echo '<td>' . htmlspecialchars($row['category_name'] ?? 'N/A') . '</td>';
                                            echo '<td>' . $row['quantity'] . ' ' . htmlspecialchars($row['unit']) . '</td>';
                                            echo '<td>' . $row['min_stock_level'] . ' ' . htmlspecialchars($row['unit']) . '</td>';
                                            echo '<td><span class="stock-badge ' . strtolower(str_replace(' ', '-', $row['stock_status'])) . '">' . $row['stock_status'] . '</span></td>';
                                            echo '<td>' . htmlspecialchars($row['supplier_name'] ?? 'N/A') . '</td>';
                                            break;
                                            
                                        case 'profit':
                                            echo '<td>' . date('M d, Y', strtotime($row['date'])) . '</td>';
                                            echo '<td>₹' . number_format($row['revenue'], 2) . '</td>';
                                            echo '<td>₹' . number_format($row['cost'], 2) . '</td>';
                                            echo '<td><strong>₹' . number_format($row['profit'], 2) . '</strong></td>';
                                            echo '<td>' . $row['total_sales'] . '</td>';
                                            break;
                                            
                                        case 'top_products':
                                            echo '<td><strong>' . htmlspecialchars($row['name']) . '</strong></td>';
                                            echo '<td>' . $row['total_sold'] . '</td>';
                                            echo '<td>₹' . number_format($row['total_revenue'], 2) . '</td>';
                                            echo '<td><strong>₹' . number_format($row['total_profit'], 2) . '</strong></td>';
                                            echo '<td>' . $row['sales_count'] . '</td>';
                                            break;
                                    }
                                    ?>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </main>
    </div>

    <script>
        // Chart initialization
        <?php if (!empty($chartData) && $report_type !== 'low_stock' && $report_type !== 'top_products'): ?>
            const ctx = document.getElementById('reportChart').getContext('2d');
            
            <?php if ($report_type === 'profit'): ?>
                const chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: <?php echo json_encode($chartData['labels']); ?>,
                        datasets: [
                            {
                                label: 'Revenue',
                                data: <?php echo json_encode($chartData['revenue']); ?>,
                                borderColor: '#667eea',
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                tension: 0.1
                            },
                            {
                                label: 'Cost',
                                data: <?php echo json_encode($chartData['cost']); ?>,
                                borderColor: '#dc3545',
                                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                tension: 0.1
                            },
                            {
                                label: 'Profit',
                                data: <?php echo json_encode($chartData['profit']); ?>,
                                borderColor: '#28a745',
                                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                                tension: 0.1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value.toLocaleString();
                                    }
                                }
                            }
                        }
                    }
                });
            <?php else: ?>
                const chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: <?php echo json_encode($chartData['labels']); ?>,
                        datasets: [
                            {
                                label: 'Revenue',
                                data: <?php echo json_encode($chartData['revenue']); ?>,
                                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                                borderColor: '#667eea',
                                borderWidth: 1
                            },
                            {
                                label: 'Sales Count',
                                data: <?php echo json_encode($chartData['sales']); ?>,
                                backgroundColor: 'rgba(40, 167, 69, 0.8)',
                                borderColor: '#28a745',
                                borderWidth: 1,
                                yAxisID: 'y1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                position: 'left',
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value.toLocaleString();
                                    }
                                }
                            },
                            y1: {
                                beginAtZero: true,
                                position: 'right',
                                grid: {
                                    drawOnChartArea: false,
                                }
                            }
                        }
                    }
                });
            <?php endif; ?>
        <?php endif; ?>

        // Export to CSV function
        function exportReport() {
            const table = document.getElementById('reportTable');
            let csv = [];
            
            // Get headers
            const headers = [];
            table.querySelectorAll('thead th').forEach(th => {
                headers.push(th.textContent.trim());
            });
            csv.push(headers.join(','));
            
            // Get data rows
            table.querySelectorAll('tbody tr').forEach(tr => {
                const row = [];
                tr.querySelectorAll('td').forEach(td => {
                    // Clean up the text content for CSV
                    let text = td.textContent.trim();
                    text = text.replace(/\$/g, ''); // Remove dollar signs
                    text = text.replace(/,/g, ''); // Remove commas
                    row.push('"' + text + '"');
                });
                csv.push(row.join(','));
            });
            
            // Create and download CSV file
            const csvContent = csv.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', '<?php echo $report_type; ?>_report_<?php echo date('Y-m-d'); ?>.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    </script>
</body>
</html>

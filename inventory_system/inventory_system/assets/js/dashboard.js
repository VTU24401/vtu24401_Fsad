/**
 * Dashboard JavaScript
 * Relational Inventory Control & Stock Tracking System
 */

document.addEventListener('DOMContentLoaded', function() {
    // Auto-refresh dashboard data
    let refreshInterval;
    
    function startAutoRefresh() {
        refreshInterval = setInterval(() => {
            refreshDashboardData();
        }, 30000); // Refresh every 30 seconds
    }

    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
    }

    // Refresh dashboard data via AJAX
    async function refreshDashboardData() {
        try {
            const response = await fetch('api/dashboard_stats.php');
            const data = await response.json();
            
            if (data.success) {
                updateDashboardStats(data.stats);
                showNotification('Dashboard updated', 'success');
            }
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
        }
    }

    // Update dashboard statistics
    function updateDashboardStats(stats) {
        // Update stat cards
        updateStatCard('totalProducts', stats.totalProducts);
        updateStatCard('totalSuppliers', stats.totalSuppliers);
        updateStatCard('todaySales', stats.todaySales);
        updateStatCard('lowStockItems', stats.lowStockItems);

        // Update recent activities tables
        if (stats.recentSales) {
            updateRecentTable('recentSales', stats.recentSales);
        }
        if (stats.recentPurchases) {
            updateRecentTable('recentPurchases', stats.recentPurchases);
        }
    }

    // Update individual stat card
    function updateStatCard(statId, value) {
        const element = document.querySelector(`[data-stat="${statId}"]`);
        if (element) {
            const currentValue = parseInt(element.textContent.replace(/[^0-9]/g, ''));
            const newValue = parseInt(value);
            
            // Add animation if value changed
            if (currentValue !== newValue) {
                element.style.transition = 'all 0.5s ease';
                element.style.transform = 'scale(1.1)';
                element.textContent = value;
                
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 300);
            }
        }
    }

    // Update recent activities table
    function updateRecentTable(tableId, data) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (!tbody) return;

        tbody.innerHTML = '';
        
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = generateTableRowHTML(tableId, item);
            tbody.appendChild(row);
        });
    }

    // Generate table row HTML based on table type
    function generateTableRowHTML(tableId, item) {
        switch (tableId) {
            case 'recentSales':
                return `
                    <td>${item.product_name}</td>
                    <td>${item.quantity}</td>
                    <td>$${parseFloat(item.total_price).toFixed(2)}</td>
                    <td>${item.created_by_username || 'System'}</td>
                `;
            case 'recentPurchases':
                return `
                    <td>${item.product_name}</td>
                    <td>${item.supplier_name}</td>
                    <td>${item.quantity}</td>
                    <td>$${parseFloat(item.total_price).toFixed(2)}</td>
                `;
            default:
                return '';
        }
    }

    // Initialize charts
    function initCharts() {
        // Sales chart (if Chart.js is available)
        if (typeof Chart !== 'undefined') {
            const salesChartCtx = document.getElementById('salesChart');
            if (salesChartCtx) {
                new Chart(salesChartCtx, {
                    type: 'line',
                    data: {
                        labels: getLast7Days(),
                        datasets: [{
                            label: 'Daily Sales',
                            data: getSalesData(),
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        }
    }

    // Get last 7 days for chart labels
    function getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        return days;
    }

    // Get mock sales data (replace with real data from API)
    function getSalesData() {
        return [1200, 1900, 1500, 2100, 1800, 2300, 2000];
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Quick search functionality
    function initQuickSearch() {
        const searchInput = document.getElementById('quickSearch');
        if (!searchInput) return;

        searchInput.addEventListener('input', debounce(function(e) {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.data-table tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        }, 300));
    }

    // Export dashboard data
    function exportDashboardData() {
        const stats = {
            totalProducts: document.querySelector('[data-stat="totalProducts"]')?.textContent,
            totalSuppliers: document.querySelector('[data-stat="totalSuppliers"]')?.textContent,
            todaySales: document.querySelector('[data-stat="todaySales"]')?.textContent,
            lowStockItems: document.querySelector('[data-stat="lowStockItems"]')?.textContent,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(stats, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `dashboard_export_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Initialize dashboard
    function initDashboard() {
        startAutoRefresh();
        initCharts();
        initQuickSearch();

        // Add export button functionality
        const exportBtn = document.getElementById('exportDashboard');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportDashboardData);
        }

        // Stop auto-refresh when page is not visible
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                stopAutoRefresh();
            } else {
                startAutoRefresh();
            }
        });
    }

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialize if we're on the dashboard page
    if (document.querySelector('.main-content h2')?.textContent.includes('Dashboard')) {
        initDashboard();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+R for manual refresh
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        location.reload();
    }
    
    // Ctrl+E for export
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        const exportBtn = document.getElementById('exportDashboard');
        if (exportBtn) {
            exportBtn.click();
        }
    }
});

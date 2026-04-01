<?php
/**
 * Quick Setup Script for Inventory System
 * Run this once to set up the database
 */

echo "<h1>Inventory System Quick Setup</h1>";

// Check if database exists and create if needed
try {
    $pdo = new PDO('mysql:host=localhost', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create database if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS inventory_system");
    echo "<p style='color: green;'>✓ Database 'inventory_system' created/verified</p>";
    
    // Use the database
    $pdo->exec("USE inventory_system");
    
    // Read and execute schema
    $schema = file_get_contents('database/database_schema.sql');
    $statements = array_filter(array_map('trim', explode(';', $schema)));
    
    foreach ($statements as $statement) {
        if (!empty($statement) && !preg_match('/^--/', $statement)) {
            $pdo->exec($statement);
        }
    }
    
    echo "<p style='color: green;'>✓ Database schema imported successfully</p>";
    
    // Verify admin user exists
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE username = 'admin'");
    $result = $stmt->fetch();
    
    if ($result['count'] > 0) {
        echo "<p style='color: green;'>✓ Admin user created</p>";
        echo "<p><strong>Default Login:</strong></p>";
        echo "<ul>";
        echo "<li>Username: <code>admin</code></li>";
        echo "<li>Password: <code>admin123</code></li>";
        echo "</ul>";
    }
    
    echo "<p style='color: green; font-weight: bold;'>✓ Setup completed successfully!</p>";
    echo "<p><a href='index.php'>Go to Application</a></p>";
    
    // Delete this file for security
    if (file_exists(__FILE__)) {
        echo "<p style='color: orange;'><strong>Security Note:</strong> Delete this file after setup is complete.</p>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>✗ Database Error: " . $e->getMessage() . "</p>";
    echo "<p>Please ensure MySQL is running and you have proper permissions.</p>";
}
?>

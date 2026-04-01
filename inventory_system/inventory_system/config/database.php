<?php
/**
 * Database Configuration File
 * Relational Inventory Control & Stock Tracking System
 */

// Database configuration settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'inventory_system');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Create database connection
class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $charset = DB_CHARSET;
    private $pdo;
    private $stmt;
    
    // Get database connection
    public function connect() {
        $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
        
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        
        try {
            $this->pdo = new PDO($dsn, $this->username, $this->password, $options);
            return $this->pdo;
        } catch (PDOException $e) {
            throw new PDOException($e->getMessage(), (int)$e->getCode());
        }
    }
    
    // Prepare statement
    public function query($sql) {
        $this->stmt = $this->pdo->prepare($sql);
    }
    
    // Bind values
    public function bind($param, $value, $type = null) {
        if (is_null($type)) {
            switch (true) {
                case is_int($value):
                    $type = PDO::PARAM_INT;
                    break;
                case is_bool($value):
                    $type = PDO::PARAM_BOOL;
                    break;
                case is_null($value):
                    $type = PDO::PARAM_NULL;
                    break;
                default:
                    $type = PDO::PARAM_STR;
            }
        }
        
        $this->stmt->bindValue($param, $value, $type);
    }
    
    // Execute statement
    public function execute() {
        return $this->stmt->execute();
    }
    
    // Get result set
    public function resultSet() {
        $this->execute();
        return $this->stmt->fetchAll();
    }
    
    // Get single result
    public function single() {
        $this->execute();
        return $this->stmt->fetch();
    }
    
    // Get row count
    public function rowCount() {
        return $this->stmt->rowCount();
    }
    
    // Get last insert ID
    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }
    
    // Begin transaction
    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }
    
    // Commit transaction
    public function commit() {
        return $this->pdo->commit();
    }
    
    // Rollback transaction
    public function rollBack() {
        return $this->pdo->rollBack();
    }
    
    // Debug dump parameters
    public function debugDumpParams() {
        return $this->stmt->debugDumpParams();
    }
}

// Helper functions for common database operations
class DBHelper {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
        $this->db->connect();
    }
    
    // Insert record
    public function insert($table, $data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        
        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        $this->db->query($sql);
        
        foreach ($data as $key => $value) {
            $this->db->bind(":{$key}", $value);
        }
        
        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }
    
    // Update record
    public function update($table, $data, $where) {
        $setClause = [];
        foreach ($data as $key => $value) {
            $setClause[] = "{$key} = :{$key}";
        }
        $setClause = implode(', ', $setClause);
        
        $whereClause = [];
        foreach ($where as $key => $value) {
            $whereClause[] = "{$key} = :where_{$key}";
        }
        $whereClause = implode(' AND ', $whereClause);
        
        $sql = "UPDATE {$table} SET {$setClause} WHERE {$whereClause}";
        $this->db->query($sql);
        
        // Bind set values
        foreach ($data as $key => $value) {
            $this->db->bind(":{$key}", $value);
        }
        
        // Bind where values
        foreach ($where as $key => $value) {
            $this->db->bind(":where_{$key}", $value);
        }
        
        return $this->db->execute();
    }
    
    // Delete record
    public function delete($table, $where) {
        $whereClause = [];
        foreach ($where as $key => $value) {
            $whereClause[] = "{$key} = :{$key}";
        }
        $whereClause = implode(' AND ', $whereClause);
        
        $sql = "DELETE FROM {$table} WHERE {$whereClause}";
        $this->db->query($sql);
        
        foreach ($where as $key => $value) {
            $this->db->bind(":{$key}", $value);
        }
        
        return $this->db->execute();
    }
    
    // Select records
    public function select($table, $columns = '*', $where = '', $orderBy = '', $limit = '') {
        $sql = "SELECT {$columns} FROM {$table}";
        
        if (!empty($where)) {
            $sql .= " WHERE {$where}";
        }
        
        if (!empty($orderBy)) {
            $sql .= " ORDER BY {$orderBy}";
        }
        
        if (!empty($limit)) {
            $sql .= " LIMIT {$limit}";
        }
        
        $this->db->query($sql);
        return $this->db->resultSet();
    }
    
    // Get single record
    public function selectOne($table, $columns = '*', $where = '') {
        $sql = "SELECT {$columns} FROM {$table}";
        
        if (!empty($where)) {
            $sql .= " WHERE {$where}";
        }
        
        $sql .= " LIMIT 1";
        
        $this->db->query($sql);
        return $this->db->single();
    }
    
    // Count records
    public function count($table, $where = '') {
        $sql = "SELECT COUNT(*) as count FROM {$table}";
        
        if (!empty($where)) {
            $sql .= " WHERE {$where}";
        }
        
        $this->db->query($sql);
        $result = $this->db->single();
        return $result['count'];
    }
    
    // Check if record exists
    public function exists($table, $where) {
        $count = $this->count($table, $where);
        return $count > 0;
    }
}

// Initialize database helper
$db = new DBHelper();

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set timezone
date_default_timezone_set('UTC');

// Session configuration (moved to top of files before session_start())
// ini_set('session.cookie_httponly', 1);
// ini_set('session.use_only_cookies', 1);
// ini_set('session.cookie_secure', 0); // Set to 1 when using HTTPS
?>

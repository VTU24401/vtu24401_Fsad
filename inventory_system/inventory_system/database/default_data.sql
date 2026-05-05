-- Default Data for Inventory System
-- Insert sample suppliers, products, purchases, and sales

-- Insert default suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address, city, country) VALUES
('Tech Supplies Inc.', 'John Smith', 'john@techsupplies.com', '+1-555-0101', '123 Tech Street', 'New York', 'USA'),
('Office Depot', 'Sarah Johnson', 'sarah@officedepot.com', '+1-555-0102', '456 Office Ave', 'Los Angeles', 'USA'),
('Global Hardware', 'Mike Wilson', 'mike@globalhardware.com', '+1-555-0103', '789 Hardware Blvd', 'Chicago', 'USA'),
('Electronics Plus', 'Lisa Chen', 'lisa@electronicsplus.com', '+1-555-0104', '321 Electronics Way', 'San Francisco', 'USA'),
('Stationery World', 'David Brown', 'david@stationeryworld.com', '+1-555-0105', '654 Paper Street', 'Boston', 'USA');

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Office Supplies', 'Office stationery and supplies'),
('Hardware', 'Computer hardware and components'),
('Furniture', 'Office furniture and equipment'),
('Software', 'Software licenses and digital products');

-- Insert default products
INSERT INTO products (name, description, category_id, supplier_id, sku, price, stock_quantity, min_stock_level, unit) VALUES
('Laptop Dell XPS 15', 'High-performance laptop with 16GB RAM and 512GB SSD', 1, 1, 'LAP-001', 1299.99, 25, 5, 'units'),
('Wireless Mouse Logitech', 'Ergonomic wireless mouse with USB receiver', 1, 1, 'MOU-001', 29.99, 150, 20, 'units'),
('Office Chair Ergonomic', 'Comfortable ergonomic office chair with lumbar support', 4, 2, 'CHA-001', 199.99, 15, 3, 'units'),
('A4 Paper Pack', '500 sheets of premium A4 printing paper', 2, 5, 'PAP-001', 12.99, 200, 50, 'packs'),
('USB-C Cable 2m', 'High-speed USB-C charging cable, 2 meters', 1, 1, 'CAB-001', 9.99, 300, 100, 'units'),
('Desk Lamp LED', 'Adjustable LED desk lamp with touch control', 4, 2, 'LAM-001', 34.99, 45, 10, 'units'),
('Keyboard Mechanical', 'RGB mechanical gaming keyboard', 1, 4, 'KEY-001', 79.99, 60, 15, 'units'),
('Monitor 27" 4K', '27-inch 4K UHD monitor with HDR', 1, 4, 'MON-001', 399.99, 20, 5, 'units'),
('Pen Set Premium', 'Set of 12 premium ballpoint pens', 2, 5, 'PEN-001', 15.99, 100, 25, 'sets'),
('External SSD 1TB', 'Portable external SSD 1TB USB 3.0', 3, 3, 'SSD-001', 149.99, 35, 8, 'units');

-- Note: Purchases and Sales tables would need to be created first
-- For now, let's create basic purchase and sales records assuming table structure

-- Create purchases table if not exists
CREATE TABLE IF NOT EXISTS purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    purchase_date DATE NOT NULL,
    invoice_number VARCHAR(50) UNIQUE,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create sales table if not exists
CREATE TABLE IF NOT EXISTS sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    sale_date DATE NOT NULL,
    invoice_number VARCHAR(50) UNIQUE,
    customer_name VARCHAR(100),
    customer_email VARCHAR(100),
    payment_method ENUM('cash', 'credit_card', 'bank_transfer', 'other') DEFAULT 'cash',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Insert default purchases
INSERT INTO purchases (supplier_id, product_id, quantity, unit_price, total_amount, purchase_date, invoice_number, notes) VALUES
(1, 1, 10, 1100.00, 11000.00, '2024-01-15', 'PUR-2024-001', 'Bulk purchase for office upgrade'),
(1, 2, 50, 20.00, 1000.00, '2024-01-16', 'PUR-2024-002', 'Wireless mice for new employees'),
(2, 3, 5, 150.00, 750.00, '2024-01-17', 'PUR-2024-003', 'Ergonomic chairs for management'),
(5, 4, 20, 8.00, 160.00, '2024-01-18', 'PUR-2024-004', 'Office supplies restock'),
(4, 7, 30, 60.00, 1800.00, '2024-01-19', 'PUR-2024-005', 'Mechanical keyboards for developers'),
(3, 10, 25, 120.00, 3000.00, '2024-01-20', 'PUR-2024-006', 'External SSDs for backup systems');

-- Insert default sales
INSERT INTO sales (product_id, quantity, unit_price, total_amount, sale_date, invoice_number, customer_name, customer_email, payment_method, created_by, notes) VALUES
(1, 2, 1299.99, 2599.98, '2024-01-25', 'SAL-2024-001', 'ABC Corporation', 'billing@abc.com', 'credit_card', 1, 'Laptops for new hires'),
(2, 10, 29.99, 299.90, '2024-01-26', 'SAL-2024-002', 'John Doe', 'john.doe@email.com', 'cash', 1, 'Wireless mice purchase'),
(3, 1, 199.99, 199.99, '2024-01-27', 'SAL-2024-003', 'Sarah Smith', 'sarah@company.com', 'bank_transfer', 1, 'Office chair for home office'),
(4, 5, 12.99, 64.95, '2024-01-28', 'SAL-2024-004', 'Local School', 'admin@school.edu', 'cash', 1, 'Paper supplies for classroom'),
(7, 3, 79.99, 239.97, '2024-01-29', 'SAL-2024-005', 'Tech Startup', 'contact@startup.com', 'credit_card', 1, 'Keyboards for development team');

-- Update product stock quantities based on purchases and sales
UPDATE products SET stock_quantity = stock_quantity + 10 WHERE id = 1; -- +10 from purchase
UPDATE products SET stock_quantity = stock_quantity + 50 WHERE id = 2; -- +50 from purchase
UPDATE products SET stock_quantity = stock_quantity + 5 WHERE id = 3; -- +5 from purchase
UPDATE products SET stock_quantity = stock_quantity + 20 WHERE id = 4; -- +20 from purchase
UPDATE products SET stock_quantity = stock_quantity + 30 WHERE id = 7; -- +30 from purchase
UPDATE products SET stock_quantity = stock_quantity + 25 WHERE id = 10; -- +25 from purchase

UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = 1; -- -2 from sale
UPDATE products SET stock_quantity = stock_quantity - 10 WHERE id = 2; -- -10 from sale
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 3; -- -1 from sale
UPDATE products SET stock_quantity = stock_quantity - 5 WHERE id = 4; -- -5 from sale
UPDATE products SET stock_quantity = stock_quantity - 3 WHERE id = 7; -- -3 from sale

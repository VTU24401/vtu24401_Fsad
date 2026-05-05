# Relational Inventory Control & Stock Tracking System

A comprehensive web-based inventory management system built with PHP, MySQL, and modern web technologies. This system provides complete control over product inventory, supplier management, purchase tracking, sales management, and detailed reporting.

## 🚀 Features

### Core Modules
- **Authentication System**: Secure login with session management and role-based access control
- **Dashboard**: Real-time statistics and overview of inventory status
- **Product Management**: Complete CRUD operations with stock tracking
- **Supplier Management**: Supplier information and relationship tracking
- **Purchase Management**: Stock purchase recording with automatic inventory updates
- **Sales Management**: Sales recording with stock validation and customer tracking
- **Reports & Analytics**: Comprehensive reporting with charts and export functionality

### Key Features
- Real-time stock tracking with low-stock alerts
- Automatic stock quantity updates on purchases and sales
- Profit calculation and analysis
- Data export capabilities (CSV, JSON)
- Responsive design for mobile and desktop
- Search and filtering capabilities
- Role-based permissions (Admin, Manager, Employee)
- Session management and security features

## 🛠️ Technology Stack

### Backend
- **PHP 7.4+**: Server-side logic and API
- **MySQL 5.7+**: Relational database
- **PDO**: Database abstraction layer with prepared statements

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with responsive design
- **ES6 JavaScript**: Client-side validation and interactivity
- **Chart.js**: Data visualization

### Security Features
- SQL injection prevention with prepared statements
- XSS protection with input sanitization
- Secure password hashing (bcrypt)
- Session management with regeneration
- CSRF protection ready

## 📋 System Requirements

### Server Requirements
- PHP 7.4 or higher
- MySQL 5.7 or higher (or MariaDB 10.2+)
- Apache 2.4 or Nginx 1.18+
- PHP Extensions:
  - PDO MySQL
  - JSON
  - mbstring
  - curl (for API calls)

### Client Requirements
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- JavaScript enabled
- Minimum screen resolution: 1024x768

## 📦 Installation Guide

### Step 1: XAMPP Setup
1. Download and install XAMPP from [https://www.apachefriends.org](https://www.apachefriends.org)
2. Start Apache and MySQL services from XAMPP Control Panel
3. Verify installation by visiting http://localhost/dashboard

### Step 2: Database Setup
1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Create a new database named `inventory_system`
3. Import the database schema:
   - Navigate to the `database/` folder
   - Import `database_schema.sql` file in phpMyAdmin
4. Verify all tables are created successfully

### Step 3: Project Setup
1. Copy the entire `inventory_system` folder to:
   - Windows: `C:/xampp/htdocs/inventory_system`
   - Linux/Mac: `/opt/lampp/htdocs/inventory_system`
2. Ensure proper file permissions (Linux/Mac):
   ```bash
   chmod -R 755 /opt/lampp/htdocs/inventory_system
   chmod -R 777 /opt/lampp/htdocs/inventory_system/database
   ```

### Step 4: Configuration
1. Open `config/database.php`
2. Verify database connection settings:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'inventory_system');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   ```
3. Adjust settings if your MySQL credentials differ

### Step 5: Access the System
1. Open your web browser
2. Navigate to: http://localhost/inventory_system/modules/auth/login.php
3. Login with default credentials:
   - **Username**: admin
   - **Password**: admin123

## 📁 Project Structure

```
inventory_system/
├── assets/
│   ├── css/
│   │   └── style.css              # Main stylesheet
│   ├── js/
│   │   ├── validation.js          # Form validation
│   │   ├── dashboard.js           # Dashboard functionality
│   │   └── product_form.js        # Product form helpers
│   └── images/                    # Static images
├── config/
│   └── database.php               # Database configuration
├── database/
│   └── database_schema.sql        # Complete database schema
├── includes/
│   └── auth_helper.php            # Authentication helper functions
└── modules/
    ├── auth/
    │   ├── login.php               # Login page
    │   └── logout.php              # Logout handler
    ├── dashboard/
    │   └── index.php               # Main dashboard
    ├── products/
    │   ├── index.php               # Products list
    │   ├── add.php                 # Add product
    │   ├── edit.php                # Edit product
    │   └── view.php                # View product details
    ├── suppliers/
    │   ├── index.php               # Suppliers list
    │   ├── add.php                 # Add supplier
    │   └── edit.php                # Edit supplier
    ├── purchases/
    │   ├── index.php               # Purchases list
    │   └── add.php                 # Add purchase
    ├── sales/
    │   ├── index.php               # Sales list
    │   └── add.php                 # Add sale
    └── reports/
        └── index.php               # Reports and analytics
```

## 🔧 Configuration Options

### Database Configuration
Edit `config/database.php` to modify:
- Database host
- Database name
- Database credentials
- Character set settings

### Session Configuration
Session settings in `config/database.php`:
- Session cookie security
- Session timeout
- HTTPS-only cookies (set to 1 when using SSL)

### User Roles and Permissions
The system supports three user roles:
- **Admin**: Full access to all features
- **Manager**: Can manage products, suppliers, purchases, sales, and view reports
- **Employee**: Can create sales and purchases, view limited information

## 📊 Database Schema

### Core Tables
- **users**: System users and authentication
- **categories**: Product categorization
- **suppliers**: Supplier information
- **products**: Product catalog with stock levels
- **purchases**: Purchase records and stock increases
- **sales**: Sales records and stock decreases
- **stock_movements**: Complete stock movement history
- **settings**: System configuration

### Key Relationships
- Products → Categories (Many-to-One)
- Products → Suppliers (Many-to-One)
- Purchases → Products & Suppliers (Foreign Keys)
- Sales → Products (Foreign Key)
- All transactions → Users (Audit Trail)

## 🚀 Getting Started

### First Time Setup
1. Login as admin (admin/admin123)
2. Change the default password immediately
3. Add product categories
4. Add suppliers
5. Add products with initial stock levels
6. Start recording purchases and sales

### Daily Operations
1. **Receiving Stock**: Use Purchases module to record new inventory
2. **Making Sales**: Use Sales module to record customer transactions
3. **Monitoring**: Check Dashboard for real-time stock levels
4. **Reporting**: Generate daily, monthly, and custom reports
5. **Low Stock Alerts**: System automatically warns when stock is low

## 🔒 Security Considerations

### Production Deployment
1. Change default admin password
2. Enable HTTPS/SSL certificate
3. Set appropriate file permissions
4. Enable PHP error logging
5. Regular database backups
6. Monitor access logs

### Recommended Security Settings
```php
// In config/database.php
ini_set('session.cookie_secure', 1);  // Enable with HTTPS
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_httponly', 1);
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify MySQL service is running
- Check database credentials in config/database.php
- Ensure database exists and schema is imported

#### Login Issues
- Verify admin user exists in users table
- Check password hashing (uses bcrypt)
- Clear browser cookies and session

#### Permission Errors
- Check file permissions on Linux/Mac
- Verify Apache/Nginx user has read access
- Ensure .htaccess rules are correct

#### Stock Not Updating
- Verify foreign key relationships
- Check stock_movements table for errors
- Review transaction logs

### Error Logging
Enable PHP error reporting in development:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

Check Apache/Nginx error logs for detailed information.

## 📈 Performance Optimization

### Database Optimization
- Add indexes on frequently queried columns
- Regular database maintenance
- Optimize slow queries
- Consider database caching

### Application Optimization
- Enable PHP OPcache
- Use browser caching for static assets
- Compress CSS and JavaScript files
- Implement pagination for large datasets

## 🔄 Backup and Recovery

### Database Backup
```bash
# Command line backup
mysqldump -u root -p inventory_system > backup.sql

# Restore database
mysql -u root -p inventory_system < backup.sql
```

### File Backup
Regular backup of:
- Database schema and data
- Configuration files
- Uploaded images and documents
- Custom code modifications

## 📞 Support and Maintenance

### Regular Maintenance Tasks
1. Weekly database backups
2. Monthly security updates
3. Quarterly performance reviews
4. Annual security audits

### Getting Help
- Review this documentation
- Check error logs
- Test with sample data
- Verify system requirements

## 🚀 Future Enhancements

### Planned Features
- Barcode scanning integration
- Email notifications for low stock
- Multi-warehouse support
- Advanced reporting with custom date ranges
- API integration for third-party systems
- Mobile application
- Advanced user permissions
- Audit trail viewer

### Scalability Considerations
- Database clustering for high availability
- Load balancing for web servers
- Content delivery network (CDN)
- Caching layer implementation

## 📄 License

This project is provided as-is for educational and development purposes. Please modify and adapt according to your specific requirements.

## 🤝 Contributing

When contributing to this project:
1. Follow existing code style
2. Add appropriate comments
3. Test thoroughly
4. Update documentation
5. Consider security implications

---

**System Version**: 1.0.0  
**Last Updated**: 2026-03-01  
**Compatible with**: PHP 7.4+, MySQL 5.7+

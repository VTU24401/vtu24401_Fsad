# Inventory System Setup Guide

## Prerequisites
- XAMPP installed on Windows
- Apache and MySQL services running
- Web browser (Chrome, Firefox, etc.)

## Step 1: Start XAMPP Services
1. Open XAMPP Control Panel
2. Start Apache service
3. Start MySQL service
4. Ensure both services show "Running" in green

## Step 2: Database Setup

### Option A: Quick Setup (Recommended)
1. Open browser and go to: `http://localhost/inventory_system/quick_setup.php`
2. Click "Setup" button to automatically create database and import schema
3. Delete `quick_setup.php` after completion for security

### Option B: Manual Setup

#### 2.1 Access phpMyAdmin
- Open browser and go to: `http://localhost/phpmyadmin`
- Login with username: `root`, password: (empty)

#### 2.2 Create Database
- Click "New" in the left sidebar
- Enter database name: `inventory_system`
- Click "Create"

#### 2.3 Import Database Schema
- Select the `inventory_system` database
- Click "Import" tab
- Choose the SQL file from: `database/database_schema.sql`
- Click "Go" to import

## Step 3: Configure Application

### 3.1 Verify Database Configuration
Check `config/database.php` contains:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'inventory_system');
define('DB_USER', 'root');
define('DB_PASS', '');
```

### 3.2 File Permissions
Ensure the following folders are writable:
- `logs/` (create if doesn't exist)
- `uploads/` (create if doesn't exist)

## Step 4: Access the Application

### 4.1 Main URL
Open browser and go to:
```
http://localhost/inventory_system/
```

This should redirect to the login page.

### 4.2 Default Login
- Username: `admin`
- Password: `admin123`

## Step 5: Troubleshooting

### Common Issues:

#### 1. Internal Server Error
- Check Apache error logs: `c:\xampp\apache\logs\error.log`
- Verify .htaccess file is correct
- Ensure PHP modules are enabled

#### 2. Database Connection Error
- Verify MySQL service is running
- Check database credentials in `config/database.php`
- Ensure database `inventory_system` exists

#### 3. Permission Denied
- Right-click project folder → Properties → Security
- Add full permissions for your user account

#### 4. Blank White Page
- Enable PHP error display temporarily:
  - Edit `config/database.php`
  - Set `ini_set('display_errors', 1);`
  - Check for syntax errors

## Step 6: Security Configuration (Production)

### 6.1 Change Default Credentials
- Change admin password after first login
- Update database credentials

### 6.2 Secure .htaccess
- Uncomment HTTPS redirect in .htaccess
- Set `session.cookie_secure` to `1` when using HTTPS

### 6.3 File Permissions
- Remove write permissions from config files
- Secure uploads directory

## Directory Structure
```
inventory_system/
├── assets/           # CSS, JS, images
├── config/           # Configuration files
│   └── database.php  # Database settings
├── database/         # SQL schema files
├── includes/         # Common functions
├── modules/          # Application modules
│   ├── auth/         # Authentication
│   ├── dashboard/    # Main dashboard
│   └── ...           # Other modules
├── uploads/          # File uploads (create)
├── logs/             # Application logs (create)
├── .htaccess         # Apache configuration
├── index.php         # Entry point
└── README.md         # Documentation
```

## Development Tips

### Enable Error Reporting
For development, edit `config/database.php`:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### Database Backup
Regularly backup your database:
```sql
mysqldump -u root inventory_system > backup.sql
```

### Log Files
Monitor application logs:
- Apache logs: `c:\xampp\apache\logs\`
- PHP errors: `php_errors.log` (in project root)

## Support

If you encounter issues:
1. Check Apache and MySQL services are running
2. Verify file permissions
3. Check error logs
4. Ensure all PHP files have correct syntax
5. Test database connection separately

## URL Structure

- Main application: `http://localhost/inventory_system/`
- Login: `http://localhost/inventory_system/modules/auth/login.php`
- Dashboard: `http://localhost/inventory_system/modules/dashboard/index.php`

## Next Steps

After successful setup:
1. Change default admin password
2. Configure company settings
3. Add users and roles
4. Set up inventory categories
5. Import existing data if needed

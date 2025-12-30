<?php
/**
 * ================================================================
 * PortiFlex - Database Initialization Script
 * ================================================================
 * Run this script to set up the database tables.
 * Access via: http://localhost/portiflex/api/init_db.php
 * ================================================================
 */

header('Content-Type: text/html; charset=utf-8');

// Database credentials
$host = '127.0.0.1';
$user = 'root';
$pass = '';

echo "<!DOCTYPE html><html><head><title>PortiFlex Database Setup</title>";
echo "<style>body{font-family:Arial,sans-serif;padding:2rem;background:#1e293b;color:#f8f9fa}";
echo ".success{color:#10b981}.error{color:#ef4444}.info{color:#3b82f6}";
echo "pre{background:#0f172a;padding:1rem;border-radius:8px;overflow-x:auto}</style></head><body>";
echo "<h1>🗄️ PortiFlex Database Setup</h1>";

try {
    // Connect without database first
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "<p class='success'>✅ Connected to MySQL server</p>";

    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS portfolio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<p class='success'>✅ Database 'portfolio_db' created/verified</p>";

    // Select database
    $pdo->exec("USE portfolio_db");
    echo "<p class='info'>📁 Using database: portfolio_db</p>";

    // Create Users table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            portfolio JSON DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            last_login TIMESTAMP NULL,
            is_active BOOLEAN DEFAULT TRUE,
            INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p class='success'>✅ Table 'users' created</p>";

    // Create Projects table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            tags JSON DEFAULT NULL,
            link VARCHAR(500),
            image_url VARCHAR(500),
            display_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p class='success'>✅ Table 'projects' created</p>";

    // Create Skills table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS skills (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            level TINYINT NOT NULL,
            category VARCHAR(50) DEFAULT 'General',
            display_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p class='success'>✅ Table 'skills' created</p>";

    // Create Portfolio Settings table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS portfolio_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            heading_font VARCHAR(100) DEFAULT 'Poppins',
            body_font VARCHAR(100) DEFAULT 'Roboto',
            font_size VARCHAR(10) DEFAULT '16px',
            hero_bg_color VARCHAR(20) DEFAULT '#2A2D43',
            hero_text_color VARCHAR(20) DEFAULT '#ffffff',
            box_shadow BOOLEAN DEFAULT TRUE,
            border_radius VARCHAR(10) DEFAULT '8px',
            hover_effects BOOLEAN DEFAULT TRUE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p class='success'>✅ Table 'portfolio_settings' created</p>";

    // Create Activity Log table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS activity_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            action VARCHAR(50) NOT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_action (user_id, action)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p class='success'>✅ Table 'activity_log' created</p>";

    // Show tables summary
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "<h2>📊 Database Tables</h2><pre>";
    foreach ($tables as $table) {
        $count = $pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
        echo "• $table ($count rows)\n";
    }
    echo "</pre>";

    echo "<h2 class='success'>🎉 Database setup complete!</h2>";
    echo "<p>You can now use the PortiFlex application.</p>";
    echo "<p><a href='../app.html' style='color:#4361ee'>→ Go to PortiFlex App</a></p>";

} catch (PDOException $e) {
    echo "<p class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p class='info'>Make sure XAMPP MySQL is running.</p>";
}

echo "</body></html>";
?>
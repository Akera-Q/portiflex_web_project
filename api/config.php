<?php
/**
 * ================================================================
 * PortiFlex - Database Configuration
 * ================================================================
 * This file contains the database connection settings.
 * Requirement: Database (Weight: 4)
 * ================================================================
 */

// Database Configuration
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'portfolio_db');
define('DB_USER', 'root');
define('DB_PASS', '');         // Default XAMPP MySQL has no password
define('DB_CHARSET', 'utf8mb4');

/**
 * Get PDO Database Connection
 * Uses prepared statements for SQL injection prevention
 * 
 * @return PDO Database connection object
 * @throws PDOException on connection failure
 */
function getDbConnection()
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }

    return $pdo;
}

/**
 * Log user activity to the database
 * 
 * @param int $userId User ID
 * @param string $action Action performed
 * @param string $details Additional details (optional)
 */
function logActivity($userId, $action, $details = null)
{
    try {
        $pdo = getDbConnection();
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $stmt = $pdo->prepare('INSERT INTO activity_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)');
        $stmt->execute([$userId, $action, $details, $ip]);
    } catch (PDOException $e) {
        // Log error silently - don't break the app for logging failures
        error_log("Activity log error: " . $e->getMessage());
    }
}

/**
 * Validate email format using regex
 * Requirement: Validation with Regular Expressions (Weight: 3)
 * 
 * @param string $email Email to validate
 * @return bool True if valid
 */
function validateEmail($email)
{
    $pattern = '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/';
    return preg_match($pattern, $email) === 1;
}

/**
 * Validate password strength
 * 
 * @param string $password Password to validate
 * @return array ['valid' => bool, 'message' => string]
 */
function validatePassword($password)
{
    if (strlen($password) < 6) {
        return ['valid' => false, 'message' => 'Password must be at least 6 characters'];
    }
    return ['valid' => true, 'message' => 'Password is valid'];
}

/**
 * Sanitize user input
 * 
 * @param string $input Input to sanitize
 * @return string Sanitized input
 */
function sanitizeInput($input)
{
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}
?>
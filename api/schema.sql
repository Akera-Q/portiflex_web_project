-- =====================================================
-- PortiFlex Database Schema
-- MySQL Database for Portfolio Builder Application
-- Requirement: Database (Weight: 4)
-- =====================================================

-- Create database with proper charset
CREATE DATABASE IF NOT EXISTS portfolio_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE portfolio_db;

-- =====================================================
-- Users Table
-- Stores user authentication and account information
-- =====================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    portfolio JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Projects Table (Normalized)
-- Stores individual projects with foreign key to users
-- =====================================================
DROP TABLE IF EXISTS projects;
CREATE TABLE projects (
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
    INDEX idx_user (user_id),
    INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Skills Table (Normalized)
-- Stores user skills with proficiency levels
-- =====================================================
DROP TABLE IF EXISTS skills;
CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    level TINYINT NOT NULL CHECK (level >= 1 AND level <= 10),
    category VARCHAR(50) DEFAULT 'General',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Portfolio Settings Table
-- Stores styling and layout preferences
-- =====================================================
DROP TABLE IF EXISTS portfolio_settings;
CREATE TABLE portfolio_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    heading_font VARCHAR(100) DEFAULT 'Poppins',
    body_font VARCHAR(100) DEFAULT 'Roboto',
    font_size VARCHAR(10) DEFAULT '16px',
    hero_bg_color VARCHAR(20) DEFAULT '#2A2D43',
    hero_text_color VARCHAR(20) DEFAULT '#ffffff',
    about_bg_color VARCHAR(20) DEFAULT '#f8f9fa',
    about_text_color VARCHAR(20) DEFAULT '#333333',
    projects_bg_color VARCHAR(20) DEFAULT '#ffffff',
    projects_text_color VARCHAR(20) DEFAULT '#333333',
    skills_bg_color VARCHAR(20) DEFAULT '#3a0ca3',
    skills_text_color VARCHAR(20) DEFAULT '#ffffff',
    contact_bg_color VARCHAR(20) DEFAULT '#7209b7',
    contact_text_color VARCHAR(20) DEFAULT '#ffffff',
    box_shadow BOOLEAN DEFAULT TRUE,
    border_radius VARCHAR(10) DEFAULT '8px',
    hover_effects BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Activity Log Table
-- Tracks user actions for analytics
-- =====================================================
DROP TABLE IF EXISTS activity_log;
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_action (user_id, action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================
-- INSERT INTO users (name, email, password, portfolio) VALUES 
-- ('Test User', 'test@example.com', '$2y$10$...', '{"projects":[],"skills":[]}');

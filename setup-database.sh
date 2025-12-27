#!/bin/bash

echo "🗄️ Setting up Homelab Dashboard Database..."

# MariaDB setup commands
sudo mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS homelab_dashboard;
CREATE USER IF NOT EXISTS 'homelab'@'localhost' IDENTIFIED BY 'homelab123';
GRANT ALL PRIVILEGES ON homelab_dashboard.* TO 'homelab'@'localhost';
FLUSH PRIVILEGES;

USE homelab_dashboard;

-- Create servers table
CREATE TABLE IF NOT EXISTS servers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    status ENUM('pending', 'online', 'offline') DEFAULT 'pending',
    icon VARCHAR(255),
    isFavorite BOOLEAN DEFAULT FALSE,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create layouts table
CREATE TABLE IF NOT EXISTS layouts (
    id VARCHAR(255) PRIMARY KEY,
    breakpoint VARCHAR(50) NOT NULL,
    layout JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    key_name VARCHAR(255) PRIMARY KEY,
    value JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    server_id VARCHAR(255),
    response_time INT,
    status ENUM('online', 'offline') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_server_timestamp (server_id, timestamp),
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    server_id VARCHAR(255),
    alert_type ENUM('down', 'slow', 'recovered') NOT NULL,
    message TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_server_created (server_id, created_at),
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

SHOW TABLES;
EOF

echo "✅ Database setup completed!"

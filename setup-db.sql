-- Database kurulum script
CREATE DATABASE IF NOT EXISTS homelab;
CREATE USER IF NOT EXISTS 'homelab'@'localhost' IDENTIFIED BY 'homelabpass';
GRANT ALL PRIVILEGES ON homelab.* TO 'homelab'@'localhost';
FLUSH PRIVILEGES;

USE homelab;
SHOW TABLES;

-- SQL script to initialize the database
CREATE DATABASE IF NOT EXISTS fundwise;
USE fundwise;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create an admin user
-- INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@fundwise.com', 'Admin@123', 'admin');

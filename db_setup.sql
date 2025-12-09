-- Create database
CREATE DATABASE IF NOT EXISTS codexreg;
USE codexreg;

-- pending_registration table (for student signups)
CREATE TABLE IF NOT EXISTS pending_registration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    studentNumber VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    program VARCHAR(255) NOT NULL,
    year VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    confirmPassword VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_student_number (studentNumber),
    UNIQUE KEY uniq_email (email)
);

-- members table (approved students managed by superadmin/admin)
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    studentNumber VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    program VARCHAR(255) NOT NULL,
    status ENUM('active','suspended','inactive') NOT NULL DEFAULT 'active',
    participation DECIMAL(5,2) DEFAULT 0.00, -- percentage (0-100)
    points INT DEFAULT 0,
    last_seen TIMESTAMP NULL DEFAULT NULL,
    password VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_member_student_number (studentNumber),
    UNIQUE KEY uniq_member_email (email)
);

-- Seed sample member (participation in percentage)
INSERT INTO members (name, studentNumber, email, program, status, participation, points, password)
VALUES ('Jane Doe', '2024-0001', 'jane.doe@example.com', 'BS Computer Science', 'active', 75.00, 120, 'student123')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    program = VALUES(program),
    status = VALUES(status),
    participation = VALUES(participation),
    points = VALUES(points),
    password = VALUES(password);

-- superadmins table
CREATE TABLE IF NOT EXISTS superadmins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_superadmin_email (email),
    UNIQUE KEY uniq_superadmin_username (username)
);

-- admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_admin_email (email),
    UNIQUE KEY uniq_admin_username (username)
);

-- announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT NOT NULL,
    type ENUM('general','urgent','event') NOT NULL DEFAULT 'general',
    created_by INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    published_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE
);

-- sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE
);

-- session_attendance table
CREATE TABLE IF NOT EXISTS session_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    member_id INT NOT NULL,
    is_present BOOLEAN DEFAULT FALSE,
    points_awarded INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_member (session_id, member_id)
);

-- Seed a default superadmin (username/email: superadmin, password: admin123)
INSERT INTO superadmins (name, email, username, password)
VALUES ('Super Admin', 'superadmin@codex.sig', 'superadmin', 'admin123')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password = VALUES(password);

-- Seed a sample admin (username/email: admin, password: admin123)
INSERT INTO admins (name, email, username, password)
VALUES ('Admin User', 'admin@codex.sig', 'admin', 'admin123')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password = VALUES(password);


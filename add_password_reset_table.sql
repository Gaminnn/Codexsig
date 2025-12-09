-- Add pending password reset table
CREATE TABLE IF NOT EXISTS pending_password_reset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('student', 'admin', 'superadmin') NOT NULL,
    email VARCHAR(255) NOT NULL,
    studentNumber VARCHAR(100),
    reset_token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_token ON pending_password_reset(reset_token);
CREATE INDEX idx_user ON pending_password_reset(user_id);

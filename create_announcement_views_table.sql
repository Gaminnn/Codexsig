-- Create announcement_views table for tracking announcement read/unseen status per student
CREATE TABLE IF NOT EXISTS announcement_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT NOT NULL,
  student_email VARCHAR(255) NOT NULL,
  is_seen BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_view (announcement_id, student_email),
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
);

-- Add index on student_email for faster queries
CREATE INDEX idx_student_email ON announcement_views(student_email);
CREATE INDEX idx_announcement_id ON announcement_views(announcement_id);

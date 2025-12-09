-- Add year column to members table
ALTER TABLE members ADD COLUMN year VARCHAR(50) DEFAULT NULL AFTER program;

<?php
session_start();
header('Content-Type: application/json');

// Allow access for testing
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin','superadmin','student'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}

// Get an admin ID to use (superadmin is usually id 1)
$adminRes = $conn->query("SELECT id FROM admins LIMIT 1");
$adminRow = $adminRes->fetch_assoc();
$adminId = $adminRow ? $adminRow['id'] : 1;

// Insert sample announcements if they don't exist
$checkSql = "SELECT COUNT(*) as count FROM announcements WHERE title LIKE '%Welcome%'";
$checkRes = $conn->query($checkSql);
$checkRow = $checkRes->fetch_assoc();

if ($checkRow['count'] == 0) {
    $announcements = [
        [
            'title' => 'Welcome to CODEX SIG',
            'description' => 'Welcome to our organization! We are excited to have you here. This is the official announcements section where all important updates and events will be shared.',
            'type' => 'general'
        ],
        [
            'title' => 'Upcoming Workshop',
            'description' => 'Join us for an exciting workshop on advanced web development techniques. Learn from industry experts and network with fellow members.',
            'type' => 'event'
        ],
        [
            'title' => 'Important: System Maintenance',
            'description' => 'Our system will be undergoing maintenance on Friday. Please save your work before 5 PM.',
            'type' => 'urgent'
        ]
    ];

    foreach ($announcements as $ann) {
        $title = $conn->real_escape_string($ann['title']);
        $desc = $conn->real_escape_string($ann['description']);
        $type = $ann['type'];
        $sql = "INSERT INTO announcements (title, description, type, created_by, is_active, published_date) 
                VALUES ('$title', '$desc', '$type', $adminId, 1, NOW())";
        $conn->query($sql);
    }
    echo json_encode(['success' => true, 'message' => 'Sample announcements created']);
} else {
    echo json_encode(['success' => true, 'message' => 'Sample announcements already exist']);
}

$conn->close();
?>

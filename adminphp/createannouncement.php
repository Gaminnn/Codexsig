<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin','superadmin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Admin only.']);
    exit;
}

$title = trim($_POST['title'] ?? '');
$description = trim($_POST['description'] ?? '');
$type = trim($_POST['type'] ?? 'general');
$published_date = trim($_POST['published_date'] ?? '');
$is_active = isset($_POST['is_active']) ? intval($_POST['is_active']) : 1;

if (!$title || !$description || !$published_date) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All required fields must be provided.']);
    exit;
}

// Convert datetime-local format (YYYY-MM-DDTHH:mm) to MySQL DATETIME format (YYYY-MM-DD HH:mm:ss)
$published_date = str_replace('T', ' ', $published_date) . ':00';

$type = in_array($type, ['general','urgent','event']) ? $type : 'general';

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

// Get admin ID from session - must exist in admins table
if (!isset($_SESSION['user']) || !isset($_SESSION['user']['id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin ID not found in session.']);
    $conn->close();
    exit;
}
$created_by = intval($_SESSION['user']['id']);

$stmt = $conn->prepare("INSERT INTO announcements (title, description, type, created_by, is_active, published_date) VALUES (?, ?, ?, ?, ?, ?)");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param("sssiis", $title, $description, $type, $created_by, $is_active, $published_date);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Announcement created', 'id' => $stmt->insert_id]);
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Execute failed: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>

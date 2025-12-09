<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin','superadmin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Admin only.']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
$title = trim($_POST['title'] ?? '');
$description = trim($_POST['description'] ?? '');
$type = trim($_POST['type'] ?? 'general');
$published_date = trim($_POST['published_date'] ?? '');
$is_active = isset($_POST['is_active']) ? intval($_POST['is_active']) : 1;

if ($id <= 0 || !$title || !$description || !$published_date) {
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

$stmt = $conn->prepare("UPDATE announcements SET title = ?, description = ?, type = ?, is_active = ?, published_date = ? WHERE id = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param("sssisi", $title, $description, $type, $is_active, $published_date, $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Announcement updated']);
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Execute failed: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>

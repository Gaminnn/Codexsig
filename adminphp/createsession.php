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
$session_date = trim($_POST['session_date'] ?? '');
$start_time = trim($_POST['start_time'] ?? '');
$end_time = trim($_POST['end_time'] ?? '');
$location = trim($_POST['location'] ?? '');
$is_active = isset($_POST['is_active']) ? intval($_POST['is_active']) : 1;

if (!$title || !$description || !$session_date || !$start_time || !$end_time || !$location) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All required fields must be provided.']);
    exit;
}

if ($end_time <= $start_time) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'End time must be after start time.']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

if (!isset($_SESSION['user']) || !isset($_SESSION['user']['id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin ID not found in session.']);
    $conn->close();
    exit;
}
$created_by = intval($_SESSION['user']['id']);

$stmt = $conn->prepare("INSERT INTO sessions (title, description, session_date, start_time, end_time, location, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param("ssssssii", $title, $description, $session_date, $start_time, $end_time, $location, $is_active, $created_by);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Session created', 'id' => $stmt->insert_id]);
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Execute failed: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>

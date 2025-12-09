<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin','superadmin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Admin only.']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
$is_present = intval($_POST['is_present'] ?? 0);

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Attendance ID required']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

$stmt = $conn->prepare("UPDATE session_attendance SET is_present = ? WHERE id = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param("ii", $is_present, $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Attendance updated']);
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Execute failed: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>

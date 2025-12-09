<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Superadmin only.']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid pending id.']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

$del = $conn->prepare("DELETE FROM pending_registration WHERE id = ?");
if (!$del) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}
$del->bind_param("i", $id);
if ($del->execute()) {
    echo json_encode(['success' => true, 'message' => 'Pending registration rejected.']);
} else {
    $msg = !empty($conn->error) ? $conn->error : 'Reject failed';
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $msg]);
}
$del->close();
$conn->close();


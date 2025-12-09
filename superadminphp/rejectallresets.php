<?php
session_start();
header('Content-Type: application/json');

// Check if user is superadmin
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Superadmin only.']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

// Delete all pending password reset requests
$deleteStmt = $conn->prepare("DELETE FROM pending_password_reset WHERE status = 'pending'");
if (!$deleteStmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Delete prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$deleteStmt->execute();
$affectedRows = $conn->affected_rows;
$deleteStmt->close();
$conn->close();

echo json_encode([
    'success' => true,
    'message' => $affectedRows . ' reset request(s) deleted successfully!'
]);
?>

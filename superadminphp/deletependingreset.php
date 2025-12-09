<?php
session_start();
header('Content-Type: application/json');

// Check if user is superadmin
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Superadmin only.']);
    exit;
}

$resetRequestId = intval($_POST['resetRequestId'] ?? 0);

if (!$resetRequestId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request. Missing reset request ID.']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

// Delete the reset request
$deleteStmt = $conn->prepare("DELETE FROM pending_password_reset WHERE id = ? LIMIT 1");
if (!$deleteStmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Delete prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$deleteStmt->bind_param("i", $resetRequestId);
$deleteStmt->execute();
$affectedRows = $conn->affected_rows;
$deleteStmt->close();
$conn->close();

if ($affectedRows > 0) {
    echo json_encode(['success' => true, 'message' => 'Reset request deleted successfully!']);
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Reset request not found.']);
}
?>

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
$newPassword = $_POST['newPassword'] ?? '';

if (!$resetRequestId || !$newPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request. Missing required fields.']);
    exit;
}

if (strlen($newPassword) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters long.']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

// Get the reset request details
$stmt = $conn->prepare("SELECT id, user_id, user_type FROM pending_password_reset WHERE id = ? AND status = 'pending' LIMIT 1");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param("i", $resetRequestId);
$stmt->execute();
$res = $stmt->get_result();
$resetRequest = $res->fetch_assoc();
$stmt->close();

if (!$resetRequest) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Reset request not found or already processed.']);
    $conn->close();
    exit;
}

// Hash the password
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

// Update password based on user type
$updateSuccess = false;
$table = '';

if ($resetRequest['user_type'] === 'student') {
    $table = 'members';
} else if ($resetRequest['user_type'] === 'admin') {
    $table = 'admins';
} else if ($resetRequest['user_type'] === 'superadmin') {
    $table = 'superadmins';
}

if (!$table) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid user type.']);
    $conn->close();
    exit;
}

// Update the password in the appropriate table
$updateStmt = $conn->prepare("UPDATE $table SET password = ? WHERE id = ? LIMIT 1");
if (!$updateStmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Update prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$updateStmt->bind_param("si", $hashedPassword, $resetRequest['user_id']);
$updateSuccess = $updateStmt->execute() && $conn->affected_rows > 0;
$updateStmt->close();

if (!$updateSuccess) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Failed to update password.']);
    $conn->close();
    exit;
}

// Mark the reset request as completed (delete from pending table)
$deleteStmt = $conn->prepare("DELETE FROM pending_password_reset WHERE id = ? LIMIT 1");
if (!$deleteStmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Delete prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$deleteStmt->bind_param("i", $resetRequestId);
$deleteStmt->execute();
$deleteStmt->close();

$conn->close();

echo json_encode(['success' => true, 'message' => 'Password has been reset successfully!']);
?>

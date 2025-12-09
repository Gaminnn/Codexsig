<?php
header('Content-Type: application/json');

$userId = intval($_POST['userId'] ?? 0);
$token = trim($_POST['token'] ?? '');
$newPassword = $_POST['newPassword'] ?? '';

if (!$userId || !$token || !$newPassword) {
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

// Verify token exists and is not expired
$stmt = $conn->prepare("SELECT id, user_id, user_type FROM pending_password_reset WHERE reset_token = ? AND expires_at > NOW() LIMIT 1");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param("s", $token);
$stmt->execute();
$res = $stmt->get_result();
$resetRecord = $res->fetch_assoc();
$stmt->close();

if (!$resetRecord) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid or expired reset token.']);
    $conn->close();
    exit;
}

// Verify user ID matches
if ($resetRecord['user_id'] != $userId) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid user ID.']);
    $conn->close();
    exit;
}

// Hash the password
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

// Update password based on user type
$updateSuccess = false;

if ($resetRecord['user_type'] === 'student') {
    // Update members table for students
    $stmt = $conn->prepare("UPDATE members SET password = ? WHERE id = ? LIMIT 1");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        $conn->close();
        exit;
    }
    $stmt->bind_param("si", $hashedPassword, $userId);
    $updateSuccess = $stmt->execute() && $conn->affected_rows > 0;
    $stmt->close();
} else if ($resetRecord['user_type'] === 'admin' || $resetRecord['user_type'] === 'superadmin') {
    // Update admins or superadmins table
    $table = ($resetRecord['user_type'] === 'superadmin') ? 'superadmins' : 'admins';
    $stmt = $conn->prepare("UPDATE $table SET password = ? WHERE id = ? LIMIT 1");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        $conn->close();
        exit;
    }
    $stmt->bind_param("si", $hashedPassword, $userId);
    $updateSuccess = $stmt->execute() && $conn->affected_rows > 0;
    $stmt->close();
}

if (!$updateSuccess) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Failed to update password.']);
    $conn->close();
    exit;
}

// Delete the reset record from pending_password_reset table
$del = $conn->prepare("DELETE FROM pending_password_reset WHERE reset_token = ? LIMIT 1");
if (!$del) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Cleanup failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$del->bind_param("s", $token);
$del->execute();
$del->close();

$conn->close();

echo json_encode(['success' => true, 'message' => 'Password reset successfully!']);
?>


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

// Get all pending password reset requests
$stmt = $conn->prepare("SELECT id, user_id, user_type, email, studentNumber, created_at FROM pending_password_reset WHERE status = 'pending' ORDER BY created_at DESC");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->execute();
$res = $stmt->get_result();
$pendingRequests = $res->fetch_all(MYSQLI_ASSOC);
$stmt->close();
$conn->close();

echo json_encode([
    'success' => true,
    'pendingRequests' => $pendingRequests
]);
?>

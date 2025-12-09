<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin' || !isset($_SESSION['user']['id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Superadmin only.']);
    exit;
}

$id = intval($_SESSION['user']['id']);
$currentPassword = $_POST['currentPassword'] ?? '';
$newPassword = $_POST['newPassword'] ?? '';
$confirmPassword = $_POST['confirmPassword'] ?? '';

if (!$currentPassword || !$newPassword || !$confirmPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

if ($newPassword !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'New passwords do not match.']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}

$stmt = $conn->prepare("SELECT password FROM superadmins WHERE id = ? LIMIT 1");
$stmt->bind_param('i', $id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$stmt->close();

if (!$row || $row['password'] !== $currentPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Current password is incorrect.']);
    $conn->close();
    exit;
}

$upd = $conn->prepare("UPDATE superadmins SET password = ? WHERE id = ?");
if (!$upd) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}
$upd->bind_param('si', $newPassword, $id);

if ($upd->execute()) {
    echo json_encode(['success' => true, 'message' => 'Password changed']);
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $conn->error ?: 'Update failed']);
}

$upd->close();
$conn->close();


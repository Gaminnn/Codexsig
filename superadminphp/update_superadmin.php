<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin' || !isset($_SESSION['user']['id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Superadmin only.']);
    exit;
}

$id = intval($_SESSION['user']['id']);
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$username = trim($_POST['username'] ?? '');

if (!$name || !$email || !$username) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}

// Dup check
$dup = $conn->prepare("SELECT id FROM superadmins WHERE (email = ? OR username = ?) AND id <> ? LIMIT 1");
$dup->bind_param('ssi', $email, $username, $id);
$dup->execute();
$dupRes = $dup->get_result();
if ($dupRes && $dupRes->num_rows > 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email or username already exists.']);
    $dup->close();
    $conn->close();
    exit;
}
$dup->close();

$stmt = $conn->prepare("UPDATE superadmins SET name = ?, email = ?, username = ? WHERE id = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}
$stmt->bind_param('sssi', $name, $email, $username, $id);

if ($stmt->execute()) {
    $_SESSION['user']['name'] = $name;
    $_SESSION['user']['email'] = $email;
    $_SESSION['user']['username'] = $username;
    echo json_encode(['success' => true, 'message' => 'Account updated']);
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $conn->error ?: 'Update failed']);
}

$stmt->close();
$conn->close();


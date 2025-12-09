<?php
session_start();
header('Content-Type: application/json');

// Only superadmin
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Superadmin only.']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirmPassword'] ?? '';

if ($id <= 0 || !$name || !$email || !$username) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All required fields must be provided.']);
    exit;
}

if ($password !== '' && $password !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

// Check duplicates
$dupStmt = $conn->prepare("SELECT id FROM admins WHERE (email = ? OR username = ?) AND id <> ? LIMIT 1");
$dupStmt->bind_param('ssi', $email, $username, $id);
$dupStmt->execute();
$dupRes = $dupStmt->get_result();
if ($dupRes && $dupRes->num_rows > 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email or username already exists.']);
    $dupStmt->close();
    $conn->close();
    exit;
}
$dupStmt->close();

if ($password !== '') {
    $stmt = $conn->prepare("UPDATE admins SET name = ?, email = ?, username = ?, password = ? WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        $conn->close();
        exit;
    }
    $stmt->bind_param("ssssi", $name, $email, $username, $password, $id);
} else {
    $stmt = $conn->prepare("UPDATE admins SET name = ?, email = ?, username = ? WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        $conn->close();
        exit;
    }
    $stmt->bind_param("sssi", $name, $email, $username, $id);
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Admin updated']);
} else {
    $msg = !empty($conn->error) ? $conn->error : 'Update failed';
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $msg]);
}

$stmt->close();
$conn->close();


<?php
session_start();
header('Content-Type: application/json');

// Require logged-in superadmin
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Superadmin only.']);
    exit;
}

// Gather input
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirmPassword'] ?? '';

// Basic validation
if (!$name || !$email || !$username || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

if ($password !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
    exit;
}

// DB connection
$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

// Insert admin
$stmt = $conn->prepare("INSERT INTO admins (name, email, username, password) VALUES (?, ?, ?, ?)");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param("ssss", $name, $email, $username, $password);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Admin account created',
        'id' => $stmt->insert_id
    ]);
} else {
    $msg = 'Admin creation failed';
    if ($conn->errno === 1062) {
        $msg = 'Email or username already exists.';
    } elseif (!empty($conn->error)) {
        $msg = $conn->error;
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $msg]);
}

$stmt->close();
$conn->close();


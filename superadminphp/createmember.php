<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Superadmin only.']);
    exit;
}

$name = trim($_POST['name'] ?? '');
$studentNumber = trim($_POST['studentNumber'] ?? '');
$email = trim($_POST['email'] ?? '');
$program = trim($_POST['program'] ?? '');
$status = $_POST['status'] ?? 'pending';
$participation = $_POST['participation'] ?? '0';
$points = $_POST['points'] ?? '0';
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirmPassword'] ?? '';

if (!$name || !$studentNumber || !$email || !$program) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All required fields must be provided.']);
    exit;
}

if ($password !== '' && $password !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
    exit;
}

$status = in_array($status, ['active','pending','suspended','inactive']) ? $status : 'pending';
$participationVal = is_numeric($participation) ? floatval($participation) : 0;
$pointsVal = is_numeric($points) ? intval($points) : 0;

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO members (name, studentNumber, email, program, status, participation, points, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param("sssssdis", $name, $studentNumber, $email, $program, $status, $participationVal, $pointsVal, $password);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Member created', 'id' => $stmt->insert_id]);
} else {
    $msg = 'Create member failed';
    if ($conn->errno === 1062) {
        $msg = 'Email or student number already exists.';
    } elseif (!empty($conn->error)) {
        $msg = $conn->error;
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $msg]);
}

$stmt->close();
$conn->close();


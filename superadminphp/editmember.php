<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Superadmin only.']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
$name = trim($_POST['name'] ?? '');
$studentNumber = trim($_POST['studentNumber'] ?? '');
$email = trim($_POST['email'] ?? '');
$program = trim($_POST['program'] ?? '');
$status = $_POST['status'] ?? 'pending';
$participation = $_POST['participation'] ?? '0';
$points = $_POST['points'] ?? '0';
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirmPassword'] ?? '';

if ($id <= 0 || !$name || !$studentNumber || !$email || !$program) {
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

// Check duplicates
$dupStmt = $conn->prepare("SELECT id FROM members WHERE (email = ? OR studentNumber = ?) AND id <> ? LIMIT 1");
$dupStmt->bind_param('ssi', $email, $studentNumber, $id);
$dupStmt->execute();
$dupRes = $dupStmt->get_result();
if ($dupRes && $dupRes->num_rows > 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email or student number already exists.']);
    $dupStmt->close();
    $conn->close();
    exit;
}
$dupStmt->close();

$stmt = $conn->prepare("UPDATE members SET name = ?, studentNumber = ?, email = ?, program = ?, status = ?, participation = ?, points = ?" . ($password !== '' ? ", password = ?" : "") . " WHERE id = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

if ($password !== '') {
    $stmt->bind_param("sssssdissi", $name, $studentNumber, $email, $program, $status, $participationVal, $pointsVal, $password, $id);
} else {
    $stmt->bind_param("sssssdii", $name, $studentNumber, $email, $program, $status, $participationVal, $pointsVal, $id);
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Member updated']);
} else {
    $msg = !empty($conn->error) ? $conn->error : 'Update failed';
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $msg]);
}

$stmt->close();
$conn->close();


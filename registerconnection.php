<?php
header('Content-Type: application/json');

$name = trim($_POST['name'] ?? '');
$studentNumber = trim($_POST['studentNumber'] ?? '');
$email = trim($_POST['email'] ?? '');
$program = trim($_POST['program'] ?? '');
$year = trim($_POST['year'] ?? '');
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirmPassword'] ?? '';

if ($password !== $confirmPassword) {
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

$stmt = $conn->prepare("INSERT INTO pending_registration (name, studentNumber, email, program, year, password, confirmPassword) VALUES (?, ?, ?, ?, ?, ?, ?)");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param("sssssss", $name, $studentNumber, $email, $program, $year, $password, $confirmPassword);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Registration successful']);
} else {
    $msg = 'Registration failed';
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


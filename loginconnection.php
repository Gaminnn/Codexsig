<?php
session_start();
header('Content-Type: application/json');

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

function setSessionAndRespond($role, $data) {
    $_SESSION['role'] = $role;
    $_SESSION['user'] = $data;
    echo json_encode(array_merge(['success' => true, 'role' => $role], $data));
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}

// Superadmin lookup
$superExists = $conn->query("SHOW TABLES LIKE 'superadmins'");
if ($superExists && $superExists->num_rows > 0) {
    $stmtS = $conn->prepare("SELECT id, name, email, username, password FROM superadmins WHERE (email = ? OR username = ?) LIMIT 1");
    $stmtS->bind_param('ss', $username, $username);
    $stmtS->execute();
    $resS = $stmtS->get_result();
    $super = $resS->fetch_assoc();
    $stmtS->close();

    if ($super && (password_verify($password, $super['password']) || $super['password'] === $password)) {
        setSessionAndRespond('superadmin', [
            'id' => $super['id'],
            'name' => $super['name'] ?? 'Super Admin',
            'email' => $super['email'] ?? $super['username'],
            'username' => $super['username']
        ]);
        $conn->close();
        exit;
    }
}

// Admin lookup
$adminExists = $conn->query("SHOW TABLES LIKE 'admins'");
if ($adminExists && $adminExists->num_rows > 0) {
    $stmtA = $conn->prepare("SELECT id, name, email, username, password FROM admins WHERE (email = ? OR username = ?) LIMIT 1");
    $stmtA->bind_param('ss', $username, $username);
    $stmtA->execute();
    $resA = $stmtA->get_result();
    $admin = $resA->fetch_assoc();
    $stmtA->close();

    if ($admin && (password_verify($password, $admin['password']) || $admin['password'] === $password)) {
        setSessionAndRespond('admin', [
            'id' => $admin['id'],
            'name' => $admin['name'] ?? 'Admin',
            'email' => $admin['email'] ?? $admin['username'],
            'username' => $admin['username']
        ]);
        $conn->close();
        exit;
    }
}

// Student lookup in members (approved)
$stmt = $conn->prepare("SELECT id, name, studentNumber, email, program, status, participation, points, password FROM members WHERE (email = ? OR studentNumber = ?) LIMIT 1");
$stmt->bind_param('ss', $username, $username);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$stmt->close();

if ($row) {
    if ($row['status'] === 'suspended') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Account suspended.']);
        $conn->close();
        exit;
    }
    if (password_verify($password, $row['password']) || $row['password'] === $password) {
        setSessionAndRespond('student', [
            'id' => $row['id'] ?? $row['email'] ?? $username,
            'name' => $row['name'],
            'studentNumber' => $row['studentNumber'],
            'email' => $row['email'],
            'program' => $row['program'],
            'status' => $row['status'],
            'participation' => $row['participation'],
            'points' => $row['points'],
            'createdDate' => null
        ]);
        $conn->close();
        exit;
    }
}

// Check if user is in pending registration
$stmtP = $conn->prepare("SELECT id, email, studentNumber FROM pending_registration WHERE email = ? OR studentNumber = ? LIMIT 1");
$stmtP->bind_param('ss', $username, $username);
$stmtP->execute();
$resP = $stmtP->get_result();
$pending = $resP->fetch_assoc();
$stmtP->close();

if ($pending) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Your account is currently under review. Please wait for approval.']);
    $conn->close();
    exit;
}

http_response_code(401);
echo json_encode(['success' => false, 'message' => 'Invalid credentials.']);
$conn->close();


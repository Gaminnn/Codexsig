<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Superadmin only.']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid pending id.']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

$stmt = $conn->prepare("SELECT name, studentNumber, email, program, year AS yearLevel, password FROM pending_registration WHERE id = ? LIMIT 1");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$stmt->close();

if (!$row) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Pending registration not found.']);
    $conn->close();
    exit;
}

// Check if member already exists in members table
$checkStmt = $conn->prepare("SELECT id FROM members WHERE studentNumber = ? OR email = ? LIMIT 1");
$checkStmt->bind_param("ss", $row['studentNumber'], $row['email']);
$checkStmt->execute();
$checkRes = $checkStmt->get_result();
if ($checkRes && $checkRes->num_rows > 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A member with this student number or email already exists. Please check and try again.']);
    $checkStmt->close();
    $conn->close();
    exit;
}
$checkStmt->close();

// Insert into members (carry password and year)
$ins = $conn->prepare("INSERT INTO members (name, studentNumber, email, program, year, status, participation, points, password) VALUES (?, ?, ?, ?, ?, 'active', 0.00, 0, ?)");
if (!$ins) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}
$ins->bind_param("ssssss", $row['name'], $row['studentNumber'], $row['email'], $row['program'], $row['yearLevel'], $row['password']);
if (!$ins->execute()) {
    $msg = 'Approve failed';
    if ($conn->errno === 1062) {
        $msg = 'Error: A member with this student number, email, or name already exists in the system. Please check your entries.';
    } elseif (!empty($conn->error)) {
        $msg = $conn->error;
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $msg]);
    $ins->close();
    $conn->close();
    exit;
}
$ins->close();

// Delete from pending
$del = $conn->prepare("DELETE FROM pending_registration WHERE id = ?");
$del->bind_param("i", $id);
$del->execute();
$del->close();

echo json_encode(['success' => true, 'message' => 'Member approved and added.']);
$conn->close();


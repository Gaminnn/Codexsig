<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'superadmin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Admin only.']);
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
if (!$del) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}
$del->bind_param("i", $id);
if (!$del->execute()) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Failed to remove from pending.']);
    $del->close();
    $conn->close();
    exit;
}
$del->close();
$conn->close();

echo json_encode(['success' => true, 'message' => 'Member approved and added to the system.']);
?>

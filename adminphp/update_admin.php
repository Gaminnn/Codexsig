<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'superadmin']) || !isset($_SESSION['user']['id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Admin only.']);
    exit;
}

$id = intval($_SESSION['user']['id']);
$name = $_POST['name'] ?? '';
$email = $_POST['email'] ?? '';
$username = $_POST['username'] ?? '';

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

$upd = $conn->prepare("UPDATE admins SET name = ?, email = ?, username = ? WHERE id = ?");
if (!$upd) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$upd->bind_param('sssi', $name, $email, $username, $id);
if (!$upd->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Update failed: ' . $upd->error]);
    $upd->close();
    $conn->close();
    exit;
}

$upd->close();

// Update session
$_SESSION['user']['name'] = $name;
$_SESSION['user']['email'] = $email;
$_SESSION['user']['username'] = $username;

$conn->close();

http_response_code(200);
echo json_encode(['success' => true, 'message' => 'Admin account updated successfully.']);
?>

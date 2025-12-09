<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Superadmin only.']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

$result = $conn->query("SELECT id, name, studentNumber, email, program, year AS yearLevel, created_at FROM pending_registration ORDER BY created_at DESC");
if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$pending = [];
while ($row = $result->fetch_assoc()) {
    $pending[] = $row;
}

echo json_encode(['success' => true, 'pending' => $pending]);
$conn->close();


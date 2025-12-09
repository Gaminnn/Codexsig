<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin','superadmin','student'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}

$result = $conn->query("
    SELECT s.id, s.title, s.description, s.session_date, s.start_time, s.end_time, s.location, s.is_active, ad.name as created_by_name
    FROM sessions s
    LEFT JOIN admins ad ON s.created_by = ad.id
    ORDER BY s.session_date DESC, s.start_time DESC
");
if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$sessions = [];
while ($row = $result->fetch_assoc()) {
    $sessions[] = $row;
}

echo json_encode(['success' => true, 'sessions' => $sessions]);
$conn->close();
?>

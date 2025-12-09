<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin','superadmin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

$session_id = intval($_GET['session_id'] ?? 0);

if (!$session_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Session ID required']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}

$result = $conn->query("
    SELECT 
        sa.id, 
        sa.session_id, 
        sa.member_id, 
        sa.is_present, 
        sa.points_awarded,
        m.name as member_name,
        m.studentNumber,
        m.program
    FROM session_attendance sa
    LEFT JOIN members m ON sa.member_id = m.id
    WHERE sa.session_id = $session_id
    ORDER BY m.name ASC
");

if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$attendance = [];
while ($row = $result->fetch_assoc()) {
    $attendance[] = $row;
}

echo json_encode(['success' => true, 'attendance' => $attendance]);
$conn->close();
?>

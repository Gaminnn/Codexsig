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

// Get current user's email for tracking seen status
$studentEmail = isset($_SESSION['user']['email']) ? $_SESSION['user']['email'] : null;

$query = "
    SELECT 
        a.id, 
        a.title, 
        a.description, 
        a.type, 
        a.is_active, 
        a.published_date, 
        a.created_at, 
        ad.name as created_by_name,
        COALESCE(av.is_seen, 0) as is_seen
    FROM announcements a
    LEFT JOIN admins ad ON a.created_by = ad.id
    LEFT JOIN announcement_views av ON a.id = av.announcement_id AND av.student_email = ?
    WHERE a.is_active = 1
    ORDER BY a.created_at DESC
";

$stmt = $conn->prepare($query);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param('s', $studentEmail);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Execute failed: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

$result = $stmt->get_result();
$announcements = [];
while ($row = $result->fetch_assoc()) {
    $announcements[] = $row;
}

$stmt->close();
echo json_encode(['success' => true, 'announcements' => $announcements]);
$conn->close();
?>

<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin','superadmin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Admin only.']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
$points = intval($_POST['points'] ?? 0);

if (!$id || $points < 0 || $points > 100) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Valid attendance ID and points (0-100) required']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

// Get member ID from attendance record
$result = $conn->query("SELECT member_id FROM session_attendance WHERE id = $id");
if (!$result || $result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Attendance record not found']);
    $conn->close();
    exit;
}

$row = $result->fetch_assoc();
$member_id = intval($row['member_id']);

// Update points in attendance
$stmt = $conn->prepare("UPDATE session_attendance SET points_awarded = ? WHERE id = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param("ii", $points, $id);

if ($stmt->execute()) {
    // Also add points to member's total points
    $addStmt = $conn->prepare("UPDATE members SET points = points + ? WHERE id = ?");
    if (!$addStmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        $stmt->close();
        $conn->close();
        exit;
    }
    
    $addStmt->bind_param("ii", $points, $member_id);
    
    if ($addStmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Points awarded successfully']);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Execute failed: ' . $conn->error]);
    }
    
    $addStmt->close();
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Execute failed: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>

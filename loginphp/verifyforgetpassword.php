<?php
header('Content-Type: application/json');

$email = trim($_POST['email'] ?? '');
$studentNumber = trim($_POST['studentNumber'] ?? '');

if (!$email || !$studentNumber) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please provide both email and student number.']);
    exit;
}

$conn = new mysqli('localhost', 'root', '', 'codexreg');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Connection Failed: ' . $conn->connect_error]);
    exit;
}

$user = null;
$userType = null;
$userId = null;

// Check if user exists in members table (for students)
$stmt = $conn->prepare("SELECT id, name, email, studentNumber FROM members WHERE (email = ? OR studentNumber = ?) AND studentNumber = ? LIMIT 1");
$stmt->bind_param("sss", $email, $studentNumber, $studentNumber);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if ($user) {
    $userType = 'student';
    $userId = $user['id'];
} else {
    // Check if user exists in admins table
    $stmt = $conn->prepare("SELECT id, name, email, username FROM admins WHERE email = ? OR username = ? LIMIT 1");
    $stmt->bind_param("ss", $email, $studentNumber);
    $stmt->execute();
    $res = $stmt->get_result();
    $user = $res->fetch_assoc();
    $stmt->close();
    
    if ($user) {
        $userType = 'admin';
        $userId = $user['id'];
    }
}

if (!$user || !$userType || !$userId) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'User not found. Please check your information.']);
    $conn->close();
    exit;
}

// Check if there's already a pending request for this user
$checkStmt = $conn->prepare("SELECT id FROM pending_password_reset WHERE user_id = ? AND user_type = ? AND status = 'pending' LIMIT 1");
$checkStmt->bind_param("is", $userId, $userType);
$checkStmt->execute();
$checkRes = $checkStmt->get_result();
if ($checkRes->num_rows > 0) {
    $checkStmt->close();
    $conn->close();
    echo json_encode(['success' => true, 'message' => 'Your password reset request has been submitted to the administrator. Please wait for confirmation.']);
    exit;
}
$checkStmt->close();

// Insert into pending_password_reset table (status = pending, no token needed)
$insert = $conn->prepare("INSERT INTO pending_password_reset (user_id, user_type, email, studentNumber, status) VALUES (?, ?, ?, ?, 'pending')");
if (!$insert) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
    $conn->close();
    exit;
}

$userEmail = $user['email'] ?? $email;
$insert->bind_param("isss", $userId, $userType, $userEmail, $studentNumber);

if (!$insert->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to create password reset request.']);
    $insert->close();
    $conn->close();
    exit;
}

$insert->close();
$conn->close();

// Return success - request submitted to superadmin
echo json_encode([
    'success' => true,
    'message' => 'Your password reset request has been submitted to the administrator. You will be notified once your password is reset.',
    'id' => $userId,
    'type' => $userType
]);
?>


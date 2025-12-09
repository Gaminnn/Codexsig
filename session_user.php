<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role'], $_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

echo json_encode([
    'success' => true,
    'role' => $_SESSION['role'],
    'user' => $_SESSION['user']
]);


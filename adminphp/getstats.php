<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin','superadmin'])) {
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

$stats = [
    'totalMembers' => 0,
    'pendingApprovals' => 0,
    'activeMembers' => 0,
];

$resMembers = $conn->query("SELECT COUNT(*) AS cnt FROM members");
if ($resMembers) {
    $row = $resMembers->fetch_assoc();
    $stats['totalMembers'] = (int)($row['cnt'] ?? 0);
}

$resPending = $conn->query("SELECT COUNT(*) AS cnt FROM pending_registration");
if ($resPending) {
    $row = $resPending->fetch_assoc();
    $stats['pendingApprovals'] = (int)($row['cnt'] ?? 0);
}

$resActive = $conn->query("SELECT COUNT(*) AS cnt FROM members WHERE status <> 'suspended' AND participation > 50");
if ($resActive) {
    $row = $resActive->fetch_assoc();
    $stats['activeMembers'] = (int)($row['cnt'] ?? 0);
}

$conn->close();
echo json_encode(['success' => true, 'stats' => $stats]);


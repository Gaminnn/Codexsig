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
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}

$totals = [
    'admins' => 0,
    'members' => 0,
    'pending' => 0,
    'activeMembers' => 0
];

$res = $conn->query("SELECT COUNT(*) AS c FROM admins");
if ($res) { $row = $res->fetch_assoc(); $totals['admins'] = intval($row['c']); }

$res = $conn->query("SELECT COUNT(*) AS c FROM members");
if ($res) { $row = $res->fetch_assoc(); $totals['members'] = intval($row['c']); }

$res = $conn->query("SELECT COUNT(*) AS c FROM pending_registration");
if ($res) { $row = $res->fetch_assoc(); $totals['pending'] = intval($row['c']); }

$res = $conn->query("SELECT COUNT(*) AS c FROM members WHERE status <> 'suspended' AND participation > 50");
if ($res) { $row = $res->fetch_assoc(); $totals['activeMembers'] = intval($row['c']); }

echo json_encode(['success' => true, 'totals' => $totals]);
$conn->close();


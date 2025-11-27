<?php
// Run once after uploading to GoDaddy to populate the chapters table from data/chapters.json
$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    die('Missing backend/config.php. Copy config.sample.php first.');
}
$config = require $configPath;
require __DIR__ . '/db.php';

$jsonPath = __DIR__ . '/data/chapters.json';
if (!file_exists($jsonPath)) {
    die('Missing backend/data/chapters.json');
}

$chapters = json_decode(file_get_contents($jsonPath), true) ?: [];
foreach ($chapters as $slug => $payload) {
    $stmt = $pdo->prepare('REPLACE INTO chapters (slug, title, payload) VALUES (?,?,?)');
    $stmt->execute([$slug, $payload['title'] ?? $slug, json_encode($payload)]);
}

echo "Seeded " . count($chapters) . " chapters.";

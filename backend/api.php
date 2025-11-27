<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Missing backend/config.php. Copy config.sample.php first.']);
    exit;
}

$config = require $configPath;
require __DIR__ . '/db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? null;
$body = json_decode(file_get_contents('php://input'), true) ?: [];

function api_response($payload, $code = 200)
{
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

function require_api_key($config)
{
    $provided = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (!isset($config['api_key']) || $provided !== $config['api_key']) {
        api_response(['error' => 'Unauthorized'], 401);
    }
}

function fallback_chapters()
{
    $path = __DIR__ . '/data/chapters.json';
    if (!file_exists($path)) return [];
    $json = file_get_contents($path);
    return json_decode($json, true) ?: [];
}

try {
    switch ($action) {
        case 'chapters':
            $stmt = $pdo->query('SELECT slug, payload FROM chapters ORDER BY sort_order, id');
            $chapters = [];
            foreach ($stmt as $row) {
                $payload = json_decode($row['payload'], true) ?: [];
                $chapters[$row['slug']] = $payload;
            }
            if (!$chapters) {
                $chapters = fallback_chapters();
            }
            api_response(['chapters' => $chapters]);
            break;

        case 'signup':
            $client = $body['client'] ?? null;
            if (!$client || empty($client['email'])) {
                api_response(['error' => 'Missing client data'], 422);
            }
            $stmt = $pdo->prepare('INSERT INTO clients (external_id, name, email, ndis, plan_manager, unlocked_all) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), ndis=VALUES(ndis), plan_manager=VALUES(plan_manager)');
            $stmt->execute([
                $client['id'],
                $client['name'] ?? '',
                strtolower($client['email']),
                $client['ndis'] ?? null,
                $client['planManager'] ?? null,
                !empty($client['unlockedAll']) ? 1 : 0,
            ]);
            api_response(['status' => 'ok']);
            break;

        case 'login':
            $email = strtolower($body['email'] ?? '');
            if (!$email) api_response(['error' => 'Missing email'], 422);
            $stmt = $pdo->prepare('SELECT * FROM clients WHERE email = ?');
            $stmt->execute([$email]);
            $client = $stmt->fetch();
            if (!$client) api_response(['error' => 'Not found'], 404);
            api_response(['client' => [
                'id' => $client['external_id'],
                'name' => $client['name'],
                'email' => $client['email'],
                'ndis' => $client['ndis'],
                'planManager' => $client['plan_manager'],
                'unlockedAll' => (bool) $client['unlocked_all'],
            ]]);
            break;

        case 'progress_get':
            $clientId = $body['clientId'] ?? null;
            if (!$clientId) api_response(['error' => 'Missing client'], 422);
            $stmt = $pdo->prepare('SELECT id FROM clients WHERE external_id = ?');
            $stmt->execute([$clientId]);
            $clientRow = $stmt->fetch();
            if (!$clientRow) api_response(['progress' => []]);

            $stmt = $pdo->prepare('SELECT chapter_slug, level_id, lessons_completed FROM progress WHERE client_id = ?');
            $stmt->execute([$clientRow['id']]);
            $progress = [];
            foreach ($stmt as $row) {
                $progress[$row['chapter_slug']][$row['level_id']] = [
                    'lessons' => json_decode($row['lessons_completed'], true) ?: [],
                ];
            }
            api_response(['progress' => $progress]);
            break;

        case 'progress_save':
            $clientId = $body['clientId'] ?? null;
            $chapter = $body['chapter'] ?? null;
            $level = $body['level'] ?? null;
            $lessons = $body['lessons'] ?? [];
            if (!$clientId || !$chapter || !$level) api_response(['error' => 'Missing fields'], 422);

            $stmt = $pdo->prepare('SELECT id FROM clients WHERE external_id = ?');
            $stmt->execute([$clientId]);
            $clientRow = $stmt->fetch();
            if (!$clientRow) api_response(['error' => 'Client missing'], 404);

            $stmt = $pdo->prepare('INSERT INTO progress (client_id, chapter_slug, level_id, lessons_completed) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE lessons_completed=VALUES(lessons_completed)');
            $stmt->execute([$clientRow['id'], $chapter, $level, json_encode(array_values(array_unique($lessons)))]);
            api_response(['status' => 'ok']);
            break;

        case 'admin_clients':
            require_api_key($config);
            $stmt = $pdo->query('SELECT external_id, name, email, ndis, plan_manager, unlocked_all, created_at FROM clients ORDER BY created_at DESC');
            api_response(['clients' => $stmt->fetchAll()]);
            break;

        case 'admin_unlock':
            require_api_key($config);
            $clientId = $body['clientId'] ?? null;
            $unlock = !empty($body['unlock']);
            if (!$clientId) api_response(['error' => 'Missing client'], 422);
            $stmt = $pdo->prepare('UPDATE clients SET unlocked_all = ? WHERE external_id = ?');
            $stmt->execute([$unlock ? 1 : 0, $clientId]);
            api_response(['status' => 'ok']);
            break;

        default:
            api_response(['error' => 'Unknown action'], 404);
    }
} catch (Throwable $e) {
    api_response(['error' => $e->getMessage()], 500);
}

<?php
// Minimal API: accepts JSON body or form/query data (for simple local/XAMPP testing)
header('Content-Type: application/json');

// Allow CORS for localhost origins during development
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $origin = $_SERVER['HTTP_ORIGIN'];
    if (strpos($origin, 'http://localhost') === 0 || strpos($origin, 'http://127.0.0.1') === 0) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Accept');
    }
}
// Handle preflight early
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();

// Read action (from query or form)
$action = $_REQUEST['action'] ?? null;

// Read JSON body if present, otherwise use POST/GET
$raw = file_get_contents('php://input');
$input = [];
if ($raw && in_array(substr(trim($raw),0,1), ['{','['])) {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) $input = $decoded;
}
$input = $input + $_POST + $_GET; // precedence: JSON body > POST > GET

function send($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Minimal DB connection (keep your MySQL settings)
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=portfolio_db;charset=utf8mb4', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (Exception $e) {
    send(['success' => false, 'message' => 'DB connection error'], 500);
}

switch ($action) {
    case 'login':
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        if (!$email || !$password) send(['success' => false, 'message' => 'Email and password required'], 400);
        $stmt = $pdo->prepare('SELECT id,name,email,password,portfolio FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password'])) send(['success' => false, 'message' => 'Invalid email or password'], 401);
        $_SESSION['user_id'] = (int)$user['id'];
        send(['success' => true, 'user' => ['id' => (int)$user['id'], 'name' => $user['name'], 'email' => $user['email'], 'portfolio' => json_decode($user['portfolio'] ?? '{}')]]);
        break;

    case 'signup':
        $name = trim($input['name'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        if (!$name || !$email || !$password) send(['success' => false, 'message' => 'All fields are required'], 400);
        // Grading Requirement: Regex Validation for Email
        if (!preg_match("/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/", $email)) {
             send(['success' => false, 'message' => 'Invalid email format'], 400);
        }
        if (strlen($password) < 6) send(['success' => false, 'message' => 'Password must be at least 6 characters'], 400);
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        if ($stmt->fetch()) send(['success' => false, 'message' => 'Email already registered'], 409);
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $defaultPortfolio = json_encode(['fonts'=>['heading'=>'Poppins','body'=>'Roboto','size'=>'16px'],'colors'=>[],'content'=>['name'=>$name,'title'=>'Creative Developer','about'=>'','contact'=>''],'effects'=>['boxShadow'=>true,'borderRadius'=>'8px','hoverEffects'=>true],'projects'=>[],'skills'=>[]]);
        $insert = $pdo->prepare('INSERT INTO users (name, email, password, portfolio) VALUES (?, ?, ?, ?)');
        $insert->execute([$name, $email, $hash, $defaultPortfolio]);
        $userId = (int)$pdo->lastInsertId();
        $_SESSION['user_id'] = $userId;
        send(['success' => true, 'user' => ['id' => $userId, 'name' => $name, 'email' => $email, 'portfolio' => json_decode($defaultPortfolio)]] , 201);
        break;

    case 'session':
        if (empty($_SESSION['user_id'])) send(['success' => false]);
        $stmt = $pdo->prepare('SELECT id,name,email,portfolio FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        if (!$user) send(['success' => false]);
        send(['success' => true, 'user' => ['id' => (int)$user['id'], 'name' => $user['name'], 'email' => $user['email'], 'portfolio' => json_decode($user['portfolio'] ?? '{}')]]);
        break;

    case 'logout':
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        send(['success' => true, 'message' => 'Logged out']);
        break;

    case 'save_portfolio':
        // Save the portfolio JSON for the authenticated user
        if (empty($_SESSION['user_id'])) send(['success' => false, 'message' => 'Not authenticated'], 401);
        $portfolio = $input['portfolio'] ?? null;
        if ($portfolio === null) send(['success' => false, 'message' => 'Portfolio data required'], 400);
        // Ensure we store valid JSON string
        if (is_array($portfolio)) {
            $json = json_encode($portfolio, JSON_UNESCAPED_UNICODE);
        } elseif (is_string($portfolio)) {
            // validate
            $decoded = json_decode($portfolio, true);
            if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
                send(['success' => false, 'message' => 'Invalid JSON for portfolio'], 400);
            }
            $json = $portfolio;
        } else {
            send(['success' => false, 'message' => 'Invalid portfolio format'], 400);
        }
        $update = $pdo->prepare('UPDATE users SET portfolio = ? WHERE id = ?');
        $update->execute([$json, $_SESSION['user_id']]);
        send(['success' => true, 'message' => 'Portfolio saved']);
        break;

    case 'export_portfolio':
        // Return the stored portfolio for the authenticated user
        if (empty($_SESSION['user_id'])) send(['success' => false, 'message' => 'Not authenticated'], 401);
        $stmt = $pdo->prepare('SELECT portfolio FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$_SESSION['user_id']]);
        $row = $stmt->fetch();
        if (!$row) send(['success' => false, 'message' => 'User not found'], 404);
        $portfolioData = json_decode($row['portfolio'] ?? '{}', true);
        send(['success' => true, 'data' => $portfolioData]);
        break;

    default:
        send(['success' => false, 'message' => 'Invalid action or missing action parameter'], 400);
        break;
}
?>
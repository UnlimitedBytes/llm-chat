<?php

// Development mode
define('DEVELOPMENT', true);

// Require composer autoloader
require __DIR__ . '/../vendor/autoload.php';

// Bootstrap the application
require __DIR__ . '/../app/bootstrap.php';

// API Routes
Flight::route('POST /api/chat', function() {
    $request = Flight::request();
    $message = $request->data->message ?? '';

    if (empty($message)) {
        Flight::json(['error' => 'Message is required'], 400);
        return;
    }

    // Process the chat message here
    // This is where you'd integrate with your AI service
    $response = [
        'message' => 'AI Response: ' . $message,
        'timestamp' => time()
    ];

    Flight::json($response);
});

Flight::route('GET /config', function() {
    Flight::json([
        'API_KEY' => $_ENV['API_KEY'] ?? null,
        'API_BASE_URL' => $_ENV['API_BASE_URL'] ?? null,
        'DEFAULT_MODEL' => $_ENV['DEFAULT_MODEL'] ?? null,
    ]);
});

// Main route for the chat interface
Flight::route('GET /', function() {
    Flight::render('chat');
});

Flight::start();

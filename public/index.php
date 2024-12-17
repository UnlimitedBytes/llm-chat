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

// Main route for the chat interface
Flight::route('GET /', function() {
    Flight::render('chat');
});

Flight::start();

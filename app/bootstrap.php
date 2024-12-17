<?php

// Error reporting in development
if (defined('DEVELOPMENT') && DEVELOPMENT === true) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Initialize Flight configuration
Flight::set('flight.views.path', __DIR__ . '/views');
Flight::set('flight.log_errors', true);

// Database configuration if needed
// Flight::register('db', 'PDO', array('mysql:host=localhost;dbname=chat_db', 'user', 'pass'));

// Register error handler
Flight::map('error', function(Exception $ex) {
    Flight::response()->status(500);
    if (defined('DEVELOPMENT') && DEVELOPMENT === true) {
        Flight::json([
            'error' => $ex->getMessage(),
            'file' => $ex->getFile(),
            'line' => $ex->getLine(),
            'trace' => $ex->getTraceAsString()
        ]);
    } else {
        Flight::json(['error' => 'Internal Server Error']);
    }
});

// Register not found handler
Flight::map('notFound', function() {
    Flight::response()->status(404);
    Flight::json(['error' => 'Not Found']);
});

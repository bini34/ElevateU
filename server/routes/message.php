<?php

use App\Http\Controllers\MessageController;

// ... existing routes ...
Route::get('/message', function () {
    return "message";
});

Route::get('/message-cards/{userId}', [MessageController::class, 'getMessageCards']);

Route::get('/conversations/{conversationId}/messages', [MessageController::class, 'getMessagesByConversation']);

Route::get('/groups/{groupId}/messages', [MessageController::class, 'getMessagesByGroup']); // Get messages by group
// ... existing routes ...

Route::post('/messages', [MessageController::class, 'store']);  // Store a new message
Route::get('/messages/{id}', [MessageController::class, 'show']);  // Get a message by ID
Route::get('/groups/{groupId}/messages', [MessageController::class, 'getMessagesByGroup']); // Get messages by group
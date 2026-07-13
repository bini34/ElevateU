<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MessageController;

Route::middleware('auth:api')->group(function () {
    Route::get('/message-cards/{userId}', [MessageController::class, 'getMessageCards']);

    Route::get('/conversations/{conversationId}/messages', [MessageController::class, 'getMessagesByConversation']);

    Route::get('/groups/{groupId}/messages', [MessageController::class, 'getMessagesByGroup']); // Get messages by group

    Route::post('/messages', [MessageController::class, 'store']);  // Store a new message
    Route::get('/messages/{id}', [MessageController::class, 'show']);  // Get a message by ID
});

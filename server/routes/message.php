<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MessageController;

Route::get('/message', function () {
    return "Welcome to message route";
});

Route::post('/messages', [MessageController::class, 'store']);  // Store a new message
Route::get('/messages/{id}', [MessageController::class, 'show']);  // Get a message by ID
Route::get('/conversations/{conversationId}/messages', [MessageController::class, 'getMessagesByConversation']); // Get messages by conversation
Route::get('/groups/{groupId}/messages', [MessageController::class, 'getMessagesByGroup']); // Get messages by group

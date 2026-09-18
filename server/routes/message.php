<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\MessageAttachmentController;

Route::middleware('auth:api')->group(function () {
    Route::get('/message-attachments/{id}', [MessageAttachmentController::class, 'show']);
    // Chat list cards for the authenticated user
    Route::get('/message-cards', [MessageController::class, 'getMessageCards']);

    // Other user + conversation lookup for /chat/{userId}
    Route::get('/conversations/with/{userId}', [MessageController::class, 'conversationWith']);

    // Conversation history + read receipts
    Route::get('/conversations/{conversationId}/messages', [MessageController::class, 'getMessagesByConversation']);
    Route::post('/conversations/{conversationId}/read', [MessageController::class, 'markRead']);

    // Group history
    Route::get('/groups/{groupId}/messages', [MessageController::class, 'getMessagesByGroup']);

    // Messages
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/messages/{id}', [MessageController::class, 'show']);
});

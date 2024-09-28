<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\CommentController;

Route::middleware('auth:api')->group(function () {
    // Posts CRUD
    Route::post('/posts', [PostController::class, 'store']);          // Create a new post
    Route::get('/posts', [PostController::class, 'index']);           // Get all posts
    Route::get('/posts/{id}', [PostController::class, 'show']);       // Get a specific post by ID
    Route::put('/posts/{id}', [PostController::class, 'update']);     // Update a specific post
    Route::delete('/posts/{id}', [PostController::class, 'destroy']); // Delete a specific post

    // Post Likes
    Route::post('/posts/{id}/like', [LikeController::class, 'like']);     // Like a specific post
    Route::get('/posts/{id}/likes', [LikeController::class, 'index']);    // Get all likes for a post

    // Post Comments
    Route::post('/posts/{id}/comments', [CommentController::class, 'store']);   // Comment on a specific post
    Route::get('/posts/{id}/comments', [CommentController::class, 'index']);    // Get all comments for a post

    // Search Posts
    Route::get('/posts/search', [PostController::class, 'search']);   // Search for posts
});

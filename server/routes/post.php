<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\CommentController;

Route::middleware('auth:api')->group(function () {
    // Posts (note: /posts/search must be registered before /posts/{id})
    Route::post('/post', [PostController::class, 'store']);          // Create a new post
    Route::get('/posts', [PostController::class, 'index']);          // Get paginated posts
    Route::get('/posts/search', [PostController::class, 'search']);  // Search for posts
    Route::get('/posts/{id}', [PostController::class, 'show']);      // Get a specific post by ID
    Route::put('/posts/{id}', [PostController::class, 'update']);    // Update own post
    Route::delete('/post/{id}', [PostController::class, 'destroy']); // Delete own post

    // User posts (page is passed as a ?page= query parameter)
    Route::get('/user/{userId}/posts', [PostController::class, 'userPosts']);

    // Post Likes
    Route::post('/posts/{id}/like', [LikeController::class, 'toggle']); // Toggle like on a post
    Route::get('/posts/{id}/likes', [LikeController::class, 'index']);  // Get all likes for a post

    // Post Comments
    Route::post('/posts/{id}/comments', [CommentController::class, 'store']); // Comment on a post
    Route::get('/posts/{id}/comments', [CommentController::class, 'index']);  // Get comments for a post
    Route::put('/comments/{id}', [CommentController::class, 'update']);       // Edit own comment
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']);   // Delete own comment
});

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;


Route::get('/post', function () {
    return "welcome to post route";
});

Route::post('/posts', [PostController::class, 'store']);  
Route::get('/posts', [PostController::class, 'index']);        // Create a new post
Route::get('/posts/{id}', [PostController::class, 'show']);       // Get a specific post by ID
Route::put('/user/${userId}/post/{id}', [PostController::class, 'update']);     // Update a specific post
Route::delete('/post/{id}', [PostController::class, 'destroy']); // Delete a specific post

// user posts
Route::get('/user/${userId}/posts?page=${page}', [PostController::class, 'userPosts']); // Get all posts for a specific user

// Post Likes
Route::post('/posts/{id}/like', [LikeController::class, 'like']);     // Like a specific post
Route::get('/posts/{id}/likes', [LikeController::class, 'index']);    // Get all likes for a post

// Post Comments
Route::post('/posts/{id}/comments', [CommentController::class, 'store']);   // Comment on a specific post
Route::get('/posts/{id}/comments', [CommentController::class, 'index']);    // Get all comments for a post

// Search Posts
Route::get('/posts/search', [PostController::class, 'search']);   // Search for posts
<?php

use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/user', function () {
    return "Welcome to the user route!";
});

// Social Login Routes
Route::get('auth/{provider}/redirect', [SocialLoginController::class, 'redirectToProvider']);
Route::get('auth/{provider}/callback', [SocialLoginController::class, 'handleProviderCallback']);


// Authentication Routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected Routes (Only accessible for authenticated users)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
});

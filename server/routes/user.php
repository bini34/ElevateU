<?php

use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/user', function () {
    return "Welcome to the user route!";
});

// Social Login Routes
Route::get('/{provider}/redirect', [AuthController::class, 'redirectToProvider']);
Route::get('/{provider}/callback', [AuthController::class, 'handleProviderCallback']);

// Authentication Routes
Route::post('/auth/register', [UserController::class, 'store']);
Route::get('/auth/login', [AuthController::class, 'login']);

// Protected Routes (Only accessible for authenticated users)
Route::middleware('auth:api')->group(function () {
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
});

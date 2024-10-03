<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;


Route::get('/tx', function () {
    return response()->json(['message' => 'Route works!'], 200);
});

// Authentication Routes
Route::post('/auth/register', [UserController::class, 'store']);
Route::get('/auth/login', [AuthController::class, 'login']);


Route::middleware('auth:api')->group(function () {
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
});
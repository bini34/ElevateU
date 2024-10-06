<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GroupController;

// Group routes
Route::post('/groups', [GroupController::class, 'store']);        // Create a new group
Route::get('/groups/{id}', [GroupController::class, 'show']);     // Get a specific group by ID
Route::put('/groups/{id}', [GroupController::class, 'update']);   // Update a group
Route::delete('/groups/{id}', [GroupController::class, 'destroy']); // Delete a group
Route::post('/groups/{groupId}/add-user', [GroupController::class, 'addUser']); // Add user to group
Route::post('/groups/{groupId}/remove-user', [GroupController::class, 'removeUser']); // Remove user from group

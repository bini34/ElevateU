<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GroupController;

// Group routes
Route::post('/group', [GroupController::class, 'store']);        // Create a new group
Route::get('/groups/{id}', [GroupController::class, 'show']);     // Get a specific group by ID
Route::put('/group/{id}', [GroupController::class, 'update']);   // Update a group
Route::delete('/group/{id}', [GroupController::class, 'destroy']); // Delete a group
Route::post('/group/{groupId}/add-user', [GroupController::class, 'addUser']); // Add user to group
Route::post('/group/{groupId}/remove-user', [GroupController::class, 'removeUser']); // Remove user from group
Route::get('/users/{userId}/groups', [GroupController::class, 'listUserGroups']); // List groups a user has joined

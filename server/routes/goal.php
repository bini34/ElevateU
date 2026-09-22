<?php

use App\Http\Controllers\GoalController;
use App\Http\Controllers\GoalMilestoneController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::get('/goals', [GoalController::class, 'index']);
    Route::post('/goals', [GoalController::class, 'store']);
    Route::get('/goals/{id}', [GoalController::class, 'show'])->whereUuid('id');
    Route::match(['put', 'patch'], '/goals/{id}', [GoalController::class, 'update'])->whereUuid('id');
    Route::post('/goals/{id}/{operation}', [GoalController::class, 'transition'])->whereUuid('id')->whereIn('operation', ['complete', 'reopen', 'archive']);
    Route::get('/goals/{id}/milestones', [GoalMilestoneController::class, 'index'])->whereUuid('id');
    Route::post('/goals/{id}/milestones', [GoalMilestoneController::class, 'store'])->whereUuid('id');
    Route::match(['put', 'patch'], '/milestones/{id}', [GoalMilestoneController::class, 'update'])->whereUuid('id');
    Route::post('/milestones/{id}/{operation}', [GoalMilestoneController::class, 'transition'])->whereUuid('id')->whereIn('operation', ['complete', 'reopen']);
    Route::delete('/milestones/{id}', [GoalMilestoneController::class, 'destroy'])->whereUuid('id');
});

<?php

use Illuminate\Support\Facades\Route;



Route::get('/t', function () {
    return response()->json(['message' => 'Route works!'], 200);
});

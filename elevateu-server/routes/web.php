<?php

use Illuminate\Support\Facades\Route;


Route::post('/signin', function () {

});
Route::get('/test', function () {
    return response()->json(['message' => 'Route works!'], 200);
});

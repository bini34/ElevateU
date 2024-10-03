<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/post', function () {
    return "welcome to post route";
});
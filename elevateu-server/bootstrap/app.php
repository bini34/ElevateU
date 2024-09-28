<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('auth:api')
                ->prefix('api')
                ->group(base_path('routes/user.php'));
            Route::middleware('auth:api')
                ->prefix('api')
                ->group(base_path('routes/post.php'));
            Route::middleware('auth:api')
                ->prefix('api')
                ->group(base_path('routes/group.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
    
    })
    ->withExceptions(function (Exceptions $exceptions) {
    })->create();

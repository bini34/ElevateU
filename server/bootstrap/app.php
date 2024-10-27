<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
            then: function () {
                Route::namespace('Post')->prefix('api')->group(base_path('routes/post.php'));
                Route::namespace('Group')->prefix('api')->group(base_path('routes/group.php'));
                Route::namespace('Message')->prefix('api')->group(base_path('routes/message.php'));
                Route::namespace('User')->prefix('api')->group(base_path('routes/user.php'));

            },
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['prefix' => 'api', 'middleware' => ['api', 'auth:api']]
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();

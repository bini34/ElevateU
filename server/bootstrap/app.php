<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
            then: function () {
                Route::middleware('api')->prefix('api')->group(base_path('routes/post.php'));
                Route::middleware('api')->prefix('api')->group(base_path('routes/group.php'));
                Route::middleware('api')->prefix('api')->group(base_path('routes/message.php'));
                Route::middleware('api')->prefix('api')->group(base_path('routes/user.php'));
            },
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['prefix' => 'api', 'middleware' => ['api', 'auth:api']]
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(append: [\App\Http\Middleware\PrivateApiResponse::class]);
        // Applies throttle:api (see RateLimiter::for('api')) to the api
        // group, which every route file in this app is registered under.
        $middleware->throttleApi();

        // Pure API: guests get a 401 instead of a redirect to a login page
        // that doesn't exist.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // This is a pure API: always render JSON errors for /api requests
        // (an unauthenticated HTML request would otherwise try to redirect
        // to a web login route that doesn't exist).
        $exceptions->shouldRenderJsonWhen(function ($request) {
            return $request->is('api/*') || $request->expectsJson();
        });
    })->create();

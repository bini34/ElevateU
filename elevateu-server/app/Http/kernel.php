<?php
protected $middlewareGroups = [
    'api' => [
        \App\Http\Middleware\Authenticate::class,
        // Other API middleware (e.g., throttle, bindings, etc.)
    ],
];

<?php

return [
    'enabled' => env('ELEVATEU_DEMO_ENABLED', false),
    // Supply locally. Never ship a usable default password with the dataset.
    'password' => env('ELEVATEU_DEMO_PASSWORD'),
];

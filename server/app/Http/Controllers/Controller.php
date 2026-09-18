<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    protected function perPage(Request $request, int $default): int
    {
        $validated = $request->validate(['per_page' => 'sometimes|integer|min:1']);

        return min((int) ($validated['per_page'] ?? $default), 50);
    }
}

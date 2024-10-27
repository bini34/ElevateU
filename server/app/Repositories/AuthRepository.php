<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthRepository
{
    public function create(array $data)
    {
        return User::create([
            'user_name' => $data['user_name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);
    }

    public function findByEmail(string $email)
    {
        return User::where('email', $email)->first();
    }
}

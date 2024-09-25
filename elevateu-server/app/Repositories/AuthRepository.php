<?php

namespace App\Repositories;

use App\Models\User;

class AuthRepository
{
    public function login(array $data)
    {
        // Find the user by email
        return User::where('email', $data['email'])->first();
    }

    public function logout($user)
    {
        // Revoke the current user's access token to logout
        return $user->token()->revoke();
    }
}

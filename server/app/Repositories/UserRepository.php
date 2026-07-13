<?php
namespace App\Repositories;

use App\Models\User;

class UserRepository
{
    public function createUser(array $data)
    {
        return User::create($data);
    }

    public function getUserById($id)
    {
        return User::with('profile')->findOrFail($id);
    }

    public function findByEmail(string $email)
    {
        return User::where('email', $email)->first();
    }
}

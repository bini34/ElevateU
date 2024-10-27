<?php
namespace App\Repositories;

use App\Models\User;

class AuthRepository
{
    public function createUser(array $data)
    {
        return User::create($data);
    }
    public function getUserById($id)
    {
        return User::findOrFail($id);
    }
}

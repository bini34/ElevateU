<?php
namespace App\Repositories;

use App\Models\User;

class UserRepository
{
    public function getUserById($id)
    {
        return User::with('profile')->findOrFail($id);
    }

}

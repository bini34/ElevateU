<?php

namespace App\Repositories;

use App\Models\Profile;

class ProfileRepository
{
    // Create a new profile
    public function createProfile(array $data)
    {
        return Profile::create($data);
    }

    // Update an existing profile
    public function updateProfile($userId, array $data)
    {
        $profile = Profile::where('user_id', $userId)->first();

        if ($profile) {
            $profile->update($data);
            return $profile;
        }

        return null; // or throw an exception if preferred
    }
}

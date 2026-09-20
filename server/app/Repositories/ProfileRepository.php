<?php

namespace App\Repositories;

use App\Models\Profile;
use App\Support\UniqueResource;

class ProfileRepository
{
    // Create a new profile
    public function createProfile(array $data)
    {
        return UniqueResource::resolve(Profile::where('user_id', $data['user_id']), $data,
            'profiles_user_id_unique', ['profiles.user_id']);
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

    public function getProfileByUserId($userId)
    {
        return Profile::where('user_id', $userId)->first(['first_name', 'last_name', 'profile_picture_URL']);
    }
}

<?php

namespace App\Services;

use App\Repositories\UserRepository;
use App\Repositories\ProfileRepository;
class UserService
{
    protected $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function getUserById($id)
    {
        return $this->userRepository->getUserById($id);
    }

    public function createUser(array $data)
    {
        $user = $this->userRepository->createUser($data);
        
        // Send first name, last name, and user ID to profile
        $profileData = [
            'user_id' => $user->id,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
        ];
        
        // Assuming you have a method to send data to the profile
        $userProfile = $this->ProfileRepository->createProfile($profileData);
        log::info($userProfile);
        return $user;
    }
    
    // Method to send data to the profile (you may need to implement this

}

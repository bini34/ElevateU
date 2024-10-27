<?php

namespace App\Services;

use App\Repositories\UserRepository;
use App\Repositories\ProfileRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

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
    

    public function register(array $data)
    {
        // Create the user
        return $this->userRepository->create($data);
    }

    public function login(array $data)
    {
        // Validate login credentials
        $user = $this->userRepository->findByEmail($data['email']);

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return ['error' => 'Invalid email or password'];
        }

        // Generate token
        $token = $user->createToken('YourAppName')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }
}

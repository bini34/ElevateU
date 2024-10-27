<?php

namespace App\Services;

use App\Repositories\AuthRepository;
use App\Repositories\ProfileRepository;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    protected $authRepository;
    protected $profileRepository;

    public function __construct(AuthRepository $authRepository, ProfileRepository $profileRepository)
    {
        $this->authRepository = $authRepository;
        $this->profileRepository = $profileRepository;
    }

    public function register(array $data)
    {
        $userData['user_name'] = $data['user_name'];
        $userData['email'] = $data['email'];
        $userData['password'] = Hash::make($data['password']);
        $profileData['first_name'] = $data['first_name'];
        $profileData['last_name'] = $data['last_name'];

        // Create the user
        $user = $this->authRepository->create($userData);
        
        if ($user) {
            $profileData['user_id'] = $user->id;
            $this->profileRepository->createProfile($profileData);

            // Fetch the profile data
            $profile = $this->profileRepository->getProfileByUserId($user->id);
            $user->profile = $profile;
        }

        return $user;
    }

    public function login(array $data)
    {
        // Validate login credentials
        $validator = Validator::make($data, [
            'email' => 'required|string|email',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // Attempt to log the user in
        $user = $this->authRepository->findByEmail($data['email']);

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['error' => 'Invalid email or password'], 401);
        }

        // Fetch the profile data
        $profile = $this->profileRepository->getProfileByUserId($user->id);
        $user->profile = $profile;

        return $user;
    }
}

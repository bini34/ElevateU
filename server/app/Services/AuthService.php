<?php

namespace App\Services;

use App\Repositories\AuthRepository;
use App\Repositories\ProfileRepository;
use Illuminate\Support\Facades\DB;
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

        // Create the user and profile together so a failure leaves no orphan user
        return DB::transaction(function () use ($userData, $profileData) {
            $user = $this->authRepository->create($userData);

            $profileData['user_id'] = $user->id;
            $this->profileRepository->createProfile($profileData);

            return $user->load('profile');
        });
    }

    /**
     * Attempt to authenticate the user.
     *
     * @return \App\Models\User|null The user on success, null on invalid credentials.
     */
    public function login(array $data)
    {
        $user = $this->authRepository->findByEmail($data['email']);

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return null;
        }

        return $user->load('profile');
    }
}

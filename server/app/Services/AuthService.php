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

        // User, profile and token must either all succeed or all roll back.
        return DB::transaction(function () use ($userData, $profileData) {
            $user = $this->authRepository->create($userData);

            $profileData['user_id'] = $user->id;
            $this->profileRepository->createProfile($profileData);

            return ['user' => $user->load('profile'), 'token' => $user->createToken('auth_token')->accessToken];
        });
    }

    /**
     * Attempt to authenticate the user.
     *
     * @return array|null The session on success, null on invalid credentials.
     */
    public function login(array $data)
    {
        return DB::transaction(function () use ($data) {
            // Lock through token issuance so a password change/reset cannot
            // revoke tokens and then race an old-password login into a new one.
            $user = $this->authRepository->findByEmail($data['email']);

            if (!$user || !Hash::check($data['password'], $user->password)) {
                return null;
            }

            return ['user' => $user->load('profile'), 'token' => $user->createToken('auth_token')->accessToken];
        });
    }
}

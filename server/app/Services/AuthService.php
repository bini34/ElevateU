<?php

namespace App\Services;

use App\Repositories\AuthRepository;

class AuthService
{
    protected $authRepository;

    public function __construct(AuthRepository $authRepository)
    {
        $this->authRepository = $authRepository;
    }

    public function login(array $data)
    {
        return $this->authRepository->login($data);
    }
    public function logout()
    {
        return $this->authRepository->logout();
    }

}

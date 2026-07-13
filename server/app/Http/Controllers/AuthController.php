<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    use ApiResponse;

    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(Request $request)
    {
        // Validate the request data
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'user_name' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            $messages = $validator->errors()->all(); // Extract only the messages
            return $this->errorResponse($messages, 400);
        }

        // Call the register method from AuthService
        $user = $this->authService->register($request->all());

        // Create a token for the user
        $token = $user->createToken('auth_token')->accessToken;

        // Return success response with user data and token
        return $this->successResponse(['user' => $user, 'token' => $token], "User registered successfully", 201);
    }

    public function login(Request $request)
    {
        // Validate the request data
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            $messages = $validator->errors()->all(); // Extract only the messages
            return $this->errorResponse($messages, 400);
        }

        // Call the login method from AuthService
        $user = $this->authService->login($request->only(['email', 'password']));

        if (!$user) {
            return $this->errorResponse('Invalid email or password', 401);
        }

        // Create a token for the user
        $token = $user->createToken('auth_token')->accessToken;

        // Return success response with user data and token
        return $this->successResponse(['user' => $user, 'token' => $token], "User logged in successfully");
    }

    public function me(Request $request)
    {
        return $this->successResponse(['user' => $request->user()->load('profile')]);
    }

    public function logout(Request $request)
    {
        $request->user()->token()->revoke();

        return $this->successResponse(null, "Logged out successfully");
    }
}

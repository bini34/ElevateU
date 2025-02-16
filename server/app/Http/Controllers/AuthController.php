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
            'password' => 'required|string|min:8|',
        ]);

        if ($validator->fails()) {
            $messages = $validator->errors()->all(); // Extract only the messages
            return $this->errorResponse($messages, 400);
        }

        // Call the register method from AuthService
        $user = $this->authService->register($request->all());

        // Create a token for the user
       // $token = $user->createToken('Personal Access Token')->accessToken;
        $token = "1234567890";
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
        $result = $this->authService->login($request->all());

        // Check if the login was unsuccessful
        if ($result instanceof \Illuminate\Http\JsonResponse && $result->getStatusCode() === 401) {
            return $this->errorResponse($result->getData()->error, $result->getStatusCode());
        }

        // Create a token for the user
        // $token = $result->createToken('Personal Access Token')->accessToken;
        $token = "1234567890";
        // Return success response with user data and token
        return $this->successResponse(['user' => $result, 'token' => $token], "User logged in successfully");
    }
}

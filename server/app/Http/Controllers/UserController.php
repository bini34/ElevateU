<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\UserService;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Hash;
use App\Traits\ApiResponse;

class UserController extends Controller
{
    use ApiResponse;

    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    // Retrieve user by ID
    public function show($id)
    {
        $user = $this->userService->getUserById($id);

        if (!$user) {
            return $this->errorResponse('User not found', 404);
        }

        return $this->successResponse($user);
    }

    // Store a new user
    public function store(Request $request)
    {
        // Validation rules
        $validatedData = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'user_name' => 'required|string|max:255|unique:users,user_name',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6'
            
        ]);

        // Hash password before creating the user
        $validatedData['password'] = Hash::make($validatedData['password']);

        try {
            // Create a new user using the service
            $user = $this->userService->createUser($validatedData);

            // Check if user creation was successful
            if (!$user) {
                return $this->errorResponse('User not created', 500);
            }

            return $this->successResponse($user, "Success", 201);
        } catch (ValidationException $e) {
            // Handle validation exceptions
            return $this->errorResponse('User creation failed', 422);
        } catch (\Exception $e) {
            // Handle other exceptions
            return $this->errorResponse('An unexpected error occurred', 500);
        }
    }
}

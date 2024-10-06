<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\UserService;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
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
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json($user, 200);
    }

    // Store a new user
    public function store(Request $request)
    {
        // Validation rules
        $validatedData = $request->validate([
            'user_name' => 'required|string|max:255|unique:users,user_name',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        // Hash password before creating the user
        $validatedData['password'] = Hash::make($validatedData['password']);

        try {
            // Create a new user using the service
            $user = $this->userService->createUser($validatedData);

            // Check if user creation was successful
            if (!$user) {
                return response()->json(['message' => 'User not created'], 500);
            }

            return response()->json($user, 201);
        } catch (ValidationException $e) {
            // Handle validation exceptions
            return response()->json(['message' => 'User creation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            // Handle other exceptions
            return response()->json(['message' => 'An unexpected error occurred', 'error' => $e->getMessage()], 500);
        }
    }
}

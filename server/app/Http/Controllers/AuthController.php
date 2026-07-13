<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
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

    /**
     * Change the authenticated user's password. Revokes every other token
     * so stolen sessions die with the old password.
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed|different:current_password',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return $this->errorResponse('The current password is incorrect.', 422);
        }

        $user->update(['password' => Hash::make($validated['password'])]);

        $currentTokenId = $user->token()->id;
        $user->tokens()->where('id', '!=', $currentTokenId)->update(['revoked' => true]);

        return $this->successResponse(null, 'Password changed successfully');
    }

    /**
     * Send a password reset link. Always responds success so the endpoint
     * cannot be used to probe which emails exist.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        Password::sendResetLink($request->only('email'));

        return $this->successResponse(null, 'If that email is registered, a reset link has been sent.');
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $validated,
            function ($user, $password) {
                $user->update(['password' => Hash::make($password)]);
                // Invalidate every existing session
                $user->tokens()->update(['revoked' => true]);
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->errorResponse(__($status), 422);
        }

        return $this->successResponse(null, 'Password has been reset. You can now sign in.');
    }
}

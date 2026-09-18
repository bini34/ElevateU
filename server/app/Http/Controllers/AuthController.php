<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
            'email' => 'required|string|email|max:255|not_regex:/[\x00-\x1F\x7F]/|unique:users',
            'password' => 'required|string|min:8|max:4096|confirmed',
        ]);

        if ($validator->fails()) {
            $messages = $validator->errors()->all(); // Extract only the messages
            return $this->errorResponse($messages, 400);
        }

        // Call the register method from AuthService
        $session = $this->authService->register($validator->validated());

        // Return success response with user data and token
        return $this->successResponse($session, "User registered successfully", 201);
    }

    public function login(Request $request)
    {
        // Validate the request data
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:255|not_regex:/[\x00-\x1F\x7F]/',
            'password' => 'required|string|max:4096',
        ]);

        if ($validator->fails()) {
            $messages = $validator->errors()->all(); // Extract only the messages
            return $this->errorResponse($messages, 400);
        }

        // Call the login method from AuthService
        $session = $this->authService->login($request->only(['email', 'password']));

        if (!$session) {
            return $this->errorResponse('Invalid email or password', 401);
        }

        // Return success response with user data and token
        return $this->successResponse($session, "User logged in successfully");
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
            'current_password' => 'required|string|max:4096',
            'password' => 'required|string|min:8|max:4096|confirmed|different:current_password',
        ]);

        $currentTokenId = $request->user()->token()->id;
        $changed = DB::transaction(function () use ($request, $validated, $currentTokenId) {
            $user = $request->user()->newQuery()->lockForUpdate()->findOrFail($request->user()->id);
            if (!Hash::check($validated['current_password'], $user->password)) {
                return false;
            }
            $user->update(['password' => Hash::make($validated['password'])]);
            $user->tokens()->where('id', '!=', $currentTokenId)->update(['revoked' => true]);

            return true;
        });
        if (!$changed) {
            return $this->errorResponse('The current password is incorrect.', 422);
        }

        return $this->successResponse(null, 'Password changed successfully');
    }

    /**
     * Send a password reset link. Always responds success so the endpoint
     * cannot be used to probe which emails exist.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email|max:255|not_regex:/[\x00-\x1F\x7F]/']);

        try {
            Password::sendResetLink($request->only('email'));
        } catch (\Throwable $e) {
            // Preserve the same account-neutral response during mail outages.
            // Report the failure for operations; do not expose transport details.
            report($e);
        }

        return $this->successResponse(null, 'If that email is registered, a reset link has been sent.');
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email|max:255|not_regex:/[\x00-\x1F\x7F]/',
            'password' => 'required|string|min:8|max:4096|confirmed',
        ]);

        $status = DB::transaction(function () use ($validated) {
            // Serialize requests for the same reset token on MySQL; consume the
            // token and revoke sessions in the same transaction as the password.
            $broker = config('auth.defaults.passwords');
            DB::table(config("auth.passwords.{$broker}.table"))
                ->where('email', $validated['email'])->lockForUpdate()->first();

            return Password::reset($validated, function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();
                $user->tokens()->update(['revoked' => true]);
            });
        });

        if ($status !== Password::PASSWORD_RESET) {
            return $this->errorResponse('This password reset link is invalid or expired.', 422);
        }

        return $this->successResponse(null, 'Password has been reset. You can now sign in.');
    }
}

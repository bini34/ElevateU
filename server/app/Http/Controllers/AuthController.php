<?php

namespace App\Http\Controllers;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Http\Request;
use App\Services\AuthService;
use Illuminate\Support\Facades\Auth;
use App\Traits\ApiResponse;

class AuthController extends Controller
{
    use ApiResponse;

    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(Request $request)
    {
        try {
            // Validate the input data
            $request->validate([
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);
    
            // Attempt to authenticate the user
            if (!Auth::attempt($request->only('email', 'password'))) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }
    
            // Retrieve the authenticated user
            $user = Auth::user();
            // Generate a token for the user using Passport
             $token = $user->createToken('Personal Access Token')->accessToken;
    
            return $this->successResponse([
            'user' => $user,
            'token' => $token
            ], 200);
    
        } catch (\Exception $e) {
            // Catch any exceptions and return an error message
            return $this->errorResponse('Something went wrong, please try again later.', 500);
        }
    }
    

    public function logout(Request $request)
    {
        // Use the service to handle the logout
        $this->authService->logout($request->user());

        return $this->successResponse(['message' => 'Successfully logged out'], 200);
    }
    public function handleProviderCallback($provider)
    {
        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
            $user = User::where('email', $socialUser->getEmail())->first();

            if (!$user) {
                $user = User::create([
                    'name' => $socialUser->getName(),
                    'email' => $socialUser->getEmail(),
                    $provider . '_id' => $socialUser->getId(),
                    'avatar' => $socialUser->getAvatar(),
                ]);
            }

            $token = $user->createToken('API Token')->accessToken;

            return $this->successResponse(['token' => $token], 200);
        } catch (\Exception $e) {
            return $this->errorResponse('Authentication failed', 400);
        }
    }
}

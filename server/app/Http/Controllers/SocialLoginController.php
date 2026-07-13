<?php

namespace App\Http\Controllers;

use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use App\Models\Profile;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SocialLoginController extends Controller
{
    use ApiResponse;

    protected const SUPPORTED_PROVIDERS = ['google', 'facebook'];

    public function redirectToProvider($provider)
    {
        if (!in_array($provider, self::SUPPORTED_PROVIDERS, true)) {
            return $this->errorResponse('Unsupported login provider', 404);
        }

        return Socialite::driver($provider)->stateless()->redirect();
    }

    public function handleProviderCallback($provider)
    {
        if (!in_array($provider, self::SUPPORTED_PROVIDERS, true)) {
            return $this->errorResponse('Unsupported login provider', 404);
        }

        $socialUser = Socialite::driver($provider)->stateless()->user();

        if (!$socialUser->getEmail()) {
            return $this->errorResponse('Could not retrieve an email address from the provider', 422);
        }

        $user = User::where('email', $socialUser->getEmail())->first();

        if (!$user) {
            $user = DB::transaction(function () use ($socialUser) {
                $user = User::create([
                    'email' => $socialUser->getEmail(),
                    'user_name' => $this->generateUserName($socialUser->getEmail()),
                    // Social accounts have no local password; store an unguessable one
                    'password' => Hash::make(Str::random(40)),
                ]);

                [$firstName, $lastName] = $this->splitName($socialUser->getName());
                Profile::create([
                    'user_id' => $user->id,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                ]);

                return $user;
            });
        }

        $token = $user->createToken('auth_token')->accessToken;

        return $this->successResponse(
            ['user' => $user->load('profile'), 'token' => $token],
            'User logged in successfully'
        );
    }

    protected function generateUserName(string $email): string
    {
        $base = Str::slug(Str::before($email, '@'), '_') ?: 'user';
        $userName = $base;

        while (User::where('user_name', $userName)->exists()) {
            $userName = $base . '_' . Str::lower(Str::random(6));
        }

        return $userName;
    }

    protected function splitName(?string $name): array
    {
        $parts = preg_split('/\s+/', trim((string) $name), 2);

        return [$parts[0] ?: 'User', $parts[1] ?? ''];
    }
}

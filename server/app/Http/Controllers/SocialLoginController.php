<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponse;

class SocialLoginController extends Controller
{
    use ApiResponse;

    public function redirectToProvider(string $provider)
    {
        return $this->unavailable($provider);
    }

    public function handleProviderCallback(string $provider)
    {
        return $this->unavailable($provider);
    }

    private function unavailable(string $provider)
    {
        if (! in_array($provider, ['google', 'facebook'], true)) {
            return $this->errorResponse('Unsupported login provider', 404);
        }

        // The former stateless, email-linked callback is intentionally disabled.
        // Re-enable only with stored provider identities, state validation and
        // a tested one-time client handoff. See docs/SECURITY.md.
        return $this->errorResponse('Social sign-in is unavailable. Please sign in with your email and password.', 503);
    }
}

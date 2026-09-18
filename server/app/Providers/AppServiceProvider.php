<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Passport::tokensExpireIn(now()->addDays(15));
        Passport::refreshTokensExpireIn(now()->addDays(30));
        Passport::personalAccessTokensExpireIn(now()->addDays(30));

        // Baseline rate limit for every API route (per user, else per IP).
        // Chat/feed polling stays comfortably below this; abuse does not.
        RateLimiter::for('api', function (Request $request) {
            $user = $request->user('api');

            return Limit::perMinute(120)->by($user ? 'user:'.$user->id : 'ip:'.$request->ip());
        });

        RateLimiter::for('public-auth', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));

        // Password reset links must land on the Next.js client, not the API
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            $frontend = rtrim(config('app.frontend_url'), '/');

            return $frontend . '/reset-password?token=' . $token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}

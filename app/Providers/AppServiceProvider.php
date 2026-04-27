<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // FR-002: New password must be ≥ 10 chars, mixed case, digit, symbol.
        Password::defaults(fn () => Password::min(10)->mixedCase()->numbers()->symbols());
    }
}

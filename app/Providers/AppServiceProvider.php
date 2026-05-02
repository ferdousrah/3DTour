<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\View;
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

        // Expose branding settings to the root Inertia template (favicon + title).
        // Wrapped in a Schema check so `php artisan migrate` on a fresh DB doesn't
        // crash before the settings table exists.
        View::composer('app', function ($view) {
            $brand = Schema::hasTable('settings') ? Setting::current() : null;
            $view->with('brandSettings', $brand);
        });
    }
}

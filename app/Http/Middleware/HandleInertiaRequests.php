<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            // Brand info for chrome (logo + name + accent). Lazy-resolved per
            // request so a settings update is reflected immediately.
            'branding' => function () {
                $s = Setting::current();
                return [
                    'company_name'  => $s->company_name,
                    'logo_url'      => $s->logo_url,
                    'favicon_url'   => $s->favicon_url,
                    'primary_color' => $s->primary_color,
                ];
            },
        ];
    }
}

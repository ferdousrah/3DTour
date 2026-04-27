<?php

namespace App\Http\Middleware;

use App\Models\Tour;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EmbedFrameAncestors
{
    /**
     * FR-093: enforce iframe embed allow-list via CSP frame-ancestors.
     *
     * Resolves the tour from the route, then sets:
     *   - `frame-ancestors 'none'` if `allow_embed=false`
     *   - `frame-ancestors 'self' <hosts>` if a list is configured
     *   - no header (browsers default to same-origin) when allow_embed=true & list is empty
     *
     * Wildcards like `*.example.com` are passed through to the browser's CSP parser
     * which natively supports them.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $slug = $request->route('slug');
        if (! $slug) return $response;

        $tour = Tour::where('public_slug', $slug)
            ->orWhere('custom_slug', $slug)
            ->first();
        if (! $tour) return $response;

        if (! $tour->allow_embed) {
            $response->headers->set('Content-Security-Policy', "frame-ancestors 'none'");
            return $response;
        }

        $hosts = $tour->embed_allowed_hosts ?? [];
        if (! empty($hosts)) {
            $sources = array_map(static function ($host) {
                // Browsers expect host with optional scheme. We normalize to https://host.
                return 'https://' . ltrim((string) $host, 'https://');
            }, $hosts);
            $directive = "frame-ancestors 'self' " . implode(' ', $sources);
            $response->headers->set('Content-Security-Policy', $directive);
        }

        return $response;
    }
}

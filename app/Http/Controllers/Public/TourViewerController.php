<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\SlugRedirect;
use App\Models\Tour;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TourViewerController extends Controller
{
    /**
     * GET /t/{slug}
     *
     * Resolves public_slug, then custom_slug, then the slug_redirects table for
     * 30-day legacy URL support. Applies visibility / expiry / password gates
     * per FR-070 and FR-090–FR-092.
     */
    public function show(Request $request, string $slug): Response|RedirectResponse
    {
        $tour = Tour::where('public_slug', $slug)
            ->orWhere('custom_slug', $slug)
            ->first();

        // Fall back to slug_redirects table (FR-081 30-day window).
        if (! $tour) {
            $redirect = SlugRedirect::where('old_slug', $slug)
                ->where('expires_at', '>', now())
                ->first();
            if ($redirect) {
                $current = $redirect->tour;
                if ($current) {
                    return redirect(
                        '/t/' . ($current->custom_slug ?: $current->public_slug),
                        301,
                    );
                }
            }
            abort(404);
        }

        // FR-015: unpublished tours 404 on public URL (admins can preview by signing in).
        if ($tour->status !== 'published' && ! $request->user()) {
            abort(404);
        }

        // FR-090: private tours return 404 to unauthenticated users (do not reveal existence).
        if ($tour->visibility === 'private' && ! $request->user()) {
            abort(404);
        }

        // FR-092: expired tours return 410.
        if ($tour->expires_at && $tour->expires_at->isPast()) {
            abort(410, 'This tour has expired.');
        }

        // FR-091: password gate.
        if ($tour->password_hash && ! $request->session()->get($this->unlockKey($tour))) {
            return Inertia::render('Public/PasswordGate', [
                'slug' => $slug,
                'tourName' => $tour->name,
            ]);
        }

        // Server-render OG/Twitter meta in <head> for social crawlers (which
        // don't run JS and won't see Inertia's <Head>).
        \Illuminate\Support\Facades\View::share('ogMeta', [
            'title'       => $tour->og_title ?: $tour->name,
            'description' => $tour->og_description ?: $tour->description,
            'image'       => $tour->og_image_url ?: $tour->thumbnail_url,
            'url'         => $tour->public_url,
            'noindex'     => $tour->visibility === 'unlisted',
        ]);

        return Inertia::render('Public/TourViewer', [
            'tour' => $this->serializeTour($tour),
            'embed' => $request->boolean('embed'),
        ]);
    }

    /**
     * POST /t/{slug}/unlock — exchange password for a session-flag unlock.
     * Rate-limited per FR-091 (5 fails / IP / hour → 1 hour cooldown).
     */
    public function unlock(Request $request, string $slug): RedirectResponse
    {
        $tour = Tour::where('public_slug', $slug)
            ->orWhere('custom_slug', $slug)
            ->firstOrFail();

        if (! $tour->password_hash) {
            return redirect('/t/' . $slug);
        }

        $key = 'unlock|' . $request->ip() . '|' . $tour->id;
        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = \Illuminate\Support\Facades\RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'password' => "Too many attempts. Try again in " . ceil($seconds / 60) . " minute(s).",
            ]);
        }

        $data = $request->validate([
            'password' => ['required', 'string'],
        ]);

        if (! Hash::check($data['password'], $tour->password_hash)) {
            \Illuminate\Support\Facades\RateLimiter::hit($key, 60 * 60);
            throw ValidationException::withMessages([
                'password' => 'Incorrect password.',
            ]);
        }

        \Illuminate\Support\Facades\RateLimiter::clear($key);

        // FR-091: 24-hour unlock window stored in session.
        $request->session()->put($this->unlockKey($tour), now()->addHours(24)->timestamp);

        return redirect('/t/' . $slug);
    }

    private function unlockKey(Tour $tour): string
    {
        return "tour_unlocked_{$tour->id}";
    }

    /**
     * Serialize for the viewer payload — only fields the public is allowed to see.
     */
    private function serializeTour(Tour $tour): array
    {
        $tour->loadMissing(['waypoints', 'visibleHotspots.media']);

        return [
            'id'              => $tour->id,
            'name'            => $tour->name,
            'description'     => $tour->description,
            'client_name'     => $tour->client_name,
            'thumbnail_url'   => $tour->thumbnail_url,
            'model_url'       => $tour->model_url,
            'default_camera'  => $tour->default_camera,
            'public_slug'     => $tour->public_slug,
            'custom_slug'     => $tour->custom_slug,
            'visibility'      => $tour->visibility,
            'og_title'        => $tour->og_title ?: $tour->name,
            'og_description'  => $tour->og_description ?: $tour->description,
            'og_image_url'    => $tour->og_image_url ?: $tour->thumbnail_url,
            'allow_embed'     => (bool) $tour->allow_embed,
            'waypoints'       => $tour->waypoints->map(fn ($w) => $w->only([
                'id', 'label', 'position', 'look_at',
                'display_order', 'transition_ms', 'thumbnail_url',
            ])),
            'hotspots'        => $tour->visibleHotspots->map(fn ($h) => array_merge(
                $h->only([
                    'id', 'title', 'description', 'position', 'normal',
                    'type', 'price_bdt', 'external_url', 'icon', 'color',
                    'display_order',
                ]),
                ['media' => $h->media->map->only(['id', 'file_url', 'alt_text', 'caption'])],
            )),
            'branding'        => (function () {
                $s = Setting::current();
                return [
                    'company_name' => $s->company_name,
                    'logo_url'     => $s->logo_url,
                ];
            })(),
        ];
    }
}

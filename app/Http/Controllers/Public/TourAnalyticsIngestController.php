<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TourAnalyticsIngestController extends Controller
{
    public function __construct(private AnalyticsService $analytics) {}

    /**
     * POST /api/public/tours/{slug}/view
     * Begins a session, returns the session id for the client to echo back on /view/end.
     */
    public function start(Request $request, string $slug): JsonResponse
    {
        $tour = $this->resolveViewableTour($request, $slug);
        if (! $tour) abort(404);

        $sessionId = $this->analytics->recordStart($tour, $request);

        return response()->json(['session_id' => $sessionId]);
    }

    /**
     * POST /api/public/tours/{slug}/view/end
     * Sent via navigator.sendBeacon on unload. Idempotent.
     */
    public function end(Request $request, string $slug): JsonResponse
    {
        $tour = $this->resolveViewableTour($request, $slug);
        if (! $tour) abort(404);

        $data = $request->validate([
            'session_id'           => ['required', 'string', 'size:36'],
            'duration'             => ['required', 'integer', 'min:0', 'max:86400'],
            'waypoints_visited'    => ['nullable', 'array'],
            'waypoints_visited.*'  => ['integer'],
            'hotspots_opened'      => ['nullable', 'array'],
            'hotspots_opened.*'    => ['integer'],
        ]);

        $this->analytics->recordEnd(
            $tour,
            $data['session_id'],
            (int) $data['duration'],
            $data['waypoints_visited'] ?? [],
            $data['hotspots_opened'] ?? [],
        );

        return response()->json(['ok' => true]);
    }

    /**
     * Apply the same gates as TourViewerController: only published tours that
     * the visitor can actually see should be tracked. Avoids leaking telemetry
     * on private/expired tours.
     */
    private function resolveViewableTour(Request $request, string $slug): ?Tour
    {
        $tour = Tour::where('public_slug', $slug)
            ->orWhere('custom_slug', $slug)
            ->first();

        if (! $tour) return null;
        if ($tour->status !== 'published' && ! $request->user()) return null;
        if ($tour->visibility === 'private' && ! $request->user()) return null;
        if ($tour->expires_at && $tour->expires_at->isPast()) return null;
        // Password-protected: still track — the client is past the gate if it's calling this.

        return $tour;
    }
}

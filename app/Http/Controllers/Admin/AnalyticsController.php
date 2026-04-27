<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Models\TourView;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnalyticsController extends Controller
{
    public function __construct(private AnalyticsService $analytics) {}

    public function show(Request $request, Tour $tour): Response
    {
        $this->authorize('view', $tour);

        [$from, $to, $rangeKey] = $this->resolveRange($request);

        return Inertia::render('Admin/Tours/Analytics', [
            'tour' => $tour->only(['id', 'name', 'public_slug', 'custom_slug', 'status', 'visibility', 'view_count']),
            'range' => [
                'key'  => $rangeKey,
                'from' => $from->toIso8601String(),
                'to'   => $to->toIso8601String(),
            ],
            'overview'   => $this->analytics->overview($tour, $from, $to),
            'timeseries' => $this->analytics->timeseries($tour, $from, $to),
            'referrers'  => $this->analytics->topReferrers($tour, $from, $to),
            'devices'    => $this->analytics->devices($tour, $from, $to),
            'countries'  => $this->analytics->countries($tour, $from, $to),
            'waypoints'  => $this->analytics->waypointHeatmap($tour, $from, $to),
        ]);
    }

    public function csv(Request $request, Tour $tour): StreamedResponse
    {
        $this->authorize('view', $tour);

        [$from, $to] = $this->resolveRange($request);

        $filename = sprintf(
            '%s_views_%s_%s.csv',
            $tour->public_slug,
            $from->format('Ymd'),
            $to->format('Ymd'),
        );

        return response()->streamDownload(function () use ($tour, $from, $to) {
            $out = fopen('php://output', 'w');
            fputcsv($out, [
                'viewed_at', 'session_id', 'device_type', 'country',
                'referrer', 'session_duration_seconds', 'waypoints_visited',
                'hotspots_opened', 'completed',
            ]);
            TourView::where('tour_id', $tour->id)
                ->whereBetween('viewed_at', [$from, $to])
                ->orderBy('viewed_at')
                ->chunk(500, function ($rows) use ($out) {
                    foreach ($rows as $r) {
                        fputcsv($out, [
                            $r->viewed_at?->toIso8601String(),
                            $r->session_id,
                            $r->device_type,
                            $r->country,
                            $r->referrer,
                            $r->session_duration_seconds,
                            json_encode($r->waypoints_visited),
                            json_encode($r->hotspots_opened),
                            $r->completed ? '1' : '0',
                        ]);
                    }
                });
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Resolve the date range from `range=7d|30d|90d|all|custom`. Custom expects
     * `from`/`to` ISO timestamps.
     *
     * @return array{0: Carbon, 1: Carbon, 2: string}
     */
    private function resolveRange(Request $request): array
    {
        $key = (string) $request->query('range', '30d');
        $now = now();

        return match ($key) {
            '7d'     => [$now->copy()->subDays(7), $now, '7d'],
            '90d'    => [$now->copy()->subDays(90), $now, '90d'],
            // MySQL TIMESTAMP can't represent 1970-01-01 00:00:00 (it's the zero date).
            // 1970-01-02 is safely past the boundary and predates any real tour.
            'all'    => [Carbon::create(1970, 1, 2), $now, 'all'],
            'custom' => [
                $request->date('from') ?: $now->copy()->subDays(30),
                $request->date('to') ?: $now,
                'custom',
            ],
            default  => [$now->copy()->subDays(30), $now, '30d'],
        };
    }
}

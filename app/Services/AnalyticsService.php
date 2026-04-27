<?php

namespace App\Services;

use App\Models\Tour;
use App\Models\TourView;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AnalyticsService
{
    /** SRS .env.example: TOUR_VIEW_COOLDOWN_SECONDS=1800 (30 min). */
    public const VIEW_COOLDOWN_SECONDS = 1800;

    /**
     * FR-100: record a session start. Returns the session UUID.
     *
     * Within the cooldown window, a same-IP-hash + same-tour view
     * does NOT increment view_count (dedupes rapid refreshes).
     */
    public function recordStart(Tour $tour, Request $request): string
    {
        $sessionId   = (string) Str::uuid();
        $ipHash      = $this->hashIp($request->ip());
        $userAgent   = (string) $request->userAgent();
        $referrer    = $request->headers->get('referer');
        $deviceType  = $this->detectDevice($userAgent);

        DB::transaction(function () use ($tour, $sessionId, $ipHash, $userAgent, $referrer, $deviceType) {
            TourView::create([
                'tour_id'     => $tour->id,
                'session_id'  => $sessionId,
                'ip_hash'     => $ipHash,
                'user_agent'  => Str::limit($userAgent, 500, ''),
                'referrer'    => $referrer ? Str::limit($referrer, 500, '') : null,
                'country'     => null, // GeoIP integration deferred — see slice notes
                'device_type' => $deviceType,
                'viewed_at'   => now(),
                'completed'   => false,
            ]);

            // De-dup view count per cooldown window.
            $recent = TourView::where('tour_id', $tour->id)
                ->where('ip_hash', $ipHash)
                ->where('viewed_at', '>=', now()->subSeconds(self::VIEW_COOLDOWN_SECONDS))
                ->where('session_id', '!=', $sessionId)
                ->exists();

            if (! $recent) {
                $tour->increment('view_count');
            }
        });

        return $sessionId;
    }

    /**
     * FR-100: complete a session. Sent via sendBeacon on unload — best-effort.
     * Idempotent: if already completed, just refreshes the totals.
     */
    public function recordEnd(
        Tour $tour,
        string $sessionId,
        int $durationSeconds,
        array $waypointsVisited,
        array $hotspotsOpened,
    ): void {
        TourView::where('tour_id', $tour->id)
            ->where('session_id', $sessionId)
            ->update([
                'session_duration_seconds' => max(0, min($durationSeconds, 86400)),
                'waypoints_visited'        => array_values(array_unique(array_map('intval', $waypointsVisited))),
                'hotspots_opened'          => array_values(array_unique(array_map('intval', $hotspotsOpened))),
                'completed'                => true,
            ]);
    }

    public function overview(Tour $tour, CarbonInterface $from, CarbonInterface $to): array
    {
        $views = TourView::where('tour_id', $tour->id)
            ->whereBetween('viewed_at', [$from, $to]);

        $totalViews     = (clone $views)->count();
        $uniqueVisitors = (clone $views)->distinct('ip_hash')->count('ip_hash');
        $avgDurationSec = (int) (clone $views)
            ->whereNotNull('session_duration_seconds')
            ->avg('session_duration_seconds');
        $completed      = (clone $views)->where('completed', true)->count();

        return [
            'total_views'        => $totalViews,
            'unique_visitors'    => $uniqueVisitors,
            'avg_duration_sec'   => $avgDurationSec,
            'engagement_rate'    => $totalViews > 0 ? round($completed / $totalViews * 100, 1) : 0.0,
        ];
    }

    /** Daily view counts within range. */
    public function timeseries(Tour $tour, CarbonInterface $from, CarbonInterface $to): array
    {
        $rows = TourView::where('tour_id', $tour->id)
            ->whereBetween('viewed_at', [$from, $to])
            ->selectRaw('DATE(viewed_at) as day, COUNT(*) as views')
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        // Fill gaps with zeros so the chart is contiguous.
        $byDay = $rows->keyBy('day');
        $series = [];
        $cursor = $from->copy()->startOfDay();
        $end    = $to->copy()->startOfDay();
        while ($cursor->lte($end)) {
            $key = $cursor->format('Y-m-d');
            $series[] = [
                'date'  => $key,
                'views' => (int) ($byDay->get($key)->views ?? 0),
            ];
            $cursor->addDay();
        }
        return $series;
    }

    /** Top 10 referrer hosts (referrer host extracted from URL). */
    public function topReferrers(Tour $tour, CarbonInterface $from, CarbonInterface $to, int $limit = 10): array
    {
        $rows = TourView::where('tour_id', $tour->id)
            ->whereBetween('viewed_at', [$from, $to])
            ->whereNotNull('referrer')
            ->select('referrer', DB::raw('COUNT(*) as views'))
            ->groupBy('referrer')
            ->orderByDesc('views')
            ->limit($limit * 3) // pull more to dedupe by host
            ->get();

        $byHost = [];
        foreach ($rows as $r) {
            $host = parse_url($r->referrer, PHP_URL_HOST) ?: 'unknown';
            $byHost[$host] = ($byHost[$host] ?? 0) + (int) $r->views;
        }
        arsort($byHost);
        $byHost = array_slice($byHost, 0, $limit, true);
        return array_map(
            fn ($host, $views) => ['host' => $host, 'views' => $views],
            array_keys($byHost),
            array_values($byHost),
        );
    }

    public function devices(Tour $tour, CarbonInterface $from, CarbonInterface $to): array
    {
        $rows = TourView::where('tour_id', $tour->id)
            ->whereBetween('viewed_at', [$from, $to])
            ->select('device_type', DB::raw('COUNT(*) as views'))
            ->groupBy('device_type')
            ->orderByDesc('views')
            ->get();

        return $rows->map(fn ($r) => [
            'device_type' => $r->device_type,
            'views'       => (int) $r->views,
        ])->all();
    }

    public function countries(Tour $tour, CarbonInterface $from, CarbonInterface $to, int $limit = 10): array
    {
        $rows = TourView::where('tour_id', $tour->id)
            ->whereBetween('viewed_at', [$from, $to])
            ->whereNotNull('country')
            ->select('country', DB::raw('COUNT(*) as views'))
            ->groupBy('country')
            ->orderByDesc('views')
            ->limit($limit)
            ->get();

        return $rows->map(fn ($r) => [
            'country' => $r->country,
            'views'   => (int) $r->views,
        ])->all();
    }

    /** Per-waypoint visit frequency, joined with the waypoint's label. */
    public function waypointHeatmap(Tour $tour, CarbonInterface $from, CarbonInterface $to): array
    {
        $views = TourView::where('tour_id', $tour->id)
            ->whereBetween('viewed_at', [$from, $to])
            ->whereNotNull('waypoints_visited')
            ->pluck('waypoints_visited');

        $counts = [];
        foreach ($views as $list) {
            foreach ((array) $list as $wpId) {
                $counts[$wpId] = ($counts[$wpId] ?? 0) + 1;
            }
        }

        $waypoints = $tour->waypoints()->get(['id', 'label', 'display_order'])->keyBy('id');

        $rows = [];
        foreach ($waypoints as $id => $w) {
            $rows[] = [
                'id'    => $id,
                'label' => $w->label,
                'order' => $w->display_order,
                'visits' => $counts[$id] ?? 0,
            ];
        }
        usort($rows, fn ($a, $b) => $a['order'] <=> $b['order']);
        return $rows;
    }

    public function hashIp(?string $ip): string
    {
        $salt = (string) config('analytics.ip_salt', env('ANALYTICS_IP_HASH_SALT', 'change-me'));
        return hash('sha256', ($ip ?: '0.0.0.0') . '|' . $salt);
    }

    private function detectDevice(string $ua): string
    {
        $u = strtolower($ua);
        if (preg_match('/bot|crawl|spider|slurp/', $u)) return 'bot';
        if (preg_match('/ipad|tablet|playbook|kindle/', $u)) return 'tablet';
        if (preg_match('/mobi|android|iphone|ipod|blackberry|windows phone/', $u)) return 'mobile';
        if (preg_match('/macintosh|windows|linux|x11/', $u)) return 'desktop';
        return 'other';
    }
}

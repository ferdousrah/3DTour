import { TourSubnav } from '@/Components/TourSubnav';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';

type RangeKey = '7d' | '30d' | '90d' | 'all';

type Tour = {
    id: number;
    name: string;
    public_slug: string;
    custom_slug: string | null;
    status: string;
    visibility: string;
    view_count: number;
};

type Overview = {
    total_views: number;
    unique_visitors: number;
    avg_duration_sec: number;
    engagement_rate: number;
};

type Series = { date: string; views: number }[];

type Props = {
    tour: Tour;
    range: { key: RangeKey | 'custom'; from: string; to: string };
    overview: Overview;
    timeseries: Series;
    referrers: { host: string; views: number }[];
    devices: { device_type: string; views: number }[];
    countries: { country: string; views: number }[];
    waypoints: { id: number; label: string; visits: number }[];
};

const RANGES: { key: RangeKey; label: string }[] = [
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: '90d', label: 'Last 90 days' },
    { key: 'all', label: 'All time' },
];

const formatDuration = (sec: number): string => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
};

export default function Analytics({
    tour,
    range,
    overview,
    timeseries,
    referrers,
    devices,
    countries,
    waypoints,
}: Props) {
    const setRange = (key: RangeKey) => {
        router.get(
            route('admin.tours.analytics', tour.id),
            { range: key },
            { preserveState: false, preserveScroll: true },
        );
    };

    const csvHref = `${route('admin.tours.analytics.csv', tour.id)}?range=${range.key}`;

    const maxView = Math.max(1, ...timeseries.map((p) => p.views));
    const totalDevice = Math.max(1, devices.reduce((s, d) => s + d.views, 0));
    const maxWaypointVisits = Math.max(1, ...waypoints.map((w) => w.visits));

    return (
        <AdminLayout
            header={
                <div>
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {tour.name}
                        </h1>
                        <a
                            href={csvHref}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Export CSV
                        </a>
                    </div>
                    <div className="mt-3">
                        <TourSubnav tourId={tour.id} />
                    </div>
                </div>
            }
        >
            <Head title={`Analytics · ${tour.name}`} />

            {/* Range picker */}
            <div className="mb-4 flex flex-wrap gap-2">
                {RANGES.map((r) => (
                    <button
                        key={r.key}
                        type="button"
                        onClick={() => setRange(r.key)}
                        className={`rounded-md px-3 py-1.5 text-sm ${
                            range.key === r.key
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Overview cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card label="Total views" value={overview.total_views.toLocaleString()} />
                <Card
                    label="Unique visitors"
                    value={overview.unique_visitors.toLocaleString()}
                />
                <Card
                    label="Avg session"
                    value={formatDuration(overview.avg_duration_sec)}
                />
                <Card
                    label="Engagement rate"
                    value={`${overview.engagement_rate}%`}
                    hint="% of sessions that fired view-end"
                />
            </div>

            {/* Time-series */}
            <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-base font-semibold text-gray-900">
                    Views over time
                </h2>
                {timeseries.length === 0 ? (
                    <Empty>No views yet in this range.</Empty>
                ) : (
                    <div className="mt-4 flex h-40 items-end gap-1">
                        {timeseries.map((p) => (
                            <div
                                key={p.date}
                                className="flex-1 flex-col items-center justify-end"
                                title={`${p.date}: ${p.views}`}
                            >
                                <div
                                    className="rounded-sm bg-blue-500 transition-all hover:bg-blue-600"
                                    style={{
                                        height: `${(p.views / maxView) * 100}%`,
                                        minHeight: p.views > 0 ? '2px' : '0',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
                {timeseries.length > 0 && (
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>{timeseries[0].date}</span>
                        <span>{timeseries[timeseries.length - 1].date}</span>
                    </div>
                )}
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Devices */}
                <Section title="Devices">
                    {devices.length === 0 ? (
                        <Empty>No data.</Empty>
                    ) : (
                        <ul className="space-y-2">
                            {devices.map((d) => {
                                const pct = (d.views / totalDevice) * 100;
                                return (
                                    <li key={d.device_type}>
                                        <div className="flex items-baseline justify-between text-sm">
                                            <span className="capitalize text-gray-700">
                                                {d.device_type}
                                            </span>
                                            <span className="tabular-nums text-gray-600">
                                                {d.views} ({pct.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className="h-full bg-emerald-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Section>

                {/* Top referrers */}
                <Section title="Top referrers">
                    {referrers.length === 0 ? (
                        <Empty>No referrers tracked yet.</Empty>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {referrers.map((r) => (
                                <li
                                    key={r.host}
                                    className="flex items-center justify-between py-2 text-sm"
                                >
                                    <span className="truncate text-gray-700">
                                        {r.host}
                                    </span>
                                    <span className="tabular-nums text-gray-600">
                                        {r.views}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                {/* Countries */}
                <Section title="Top countries">
                    {countries.length === 0 ? (
                        <Empty>
                            Country detection requires a GeoIP database — see
                            slice 9 deferred items.
                        </Empty>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {countries.map((c) => (
                                <li
                                    key={c.country}
                                    className="flex items-center justify-between py-2 text-sm"
                                >
                                    <span className="text-gray-700">
                                        {c.country}
                                    </span>
                                    <span className="tabular-nums text-gray-600">
                                        {c.views}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                {/* Waypoint heatmap */}
                <Section title="Waypoint visits">
                    {waypoints.length === 0 ? (
                        <Empty>This tour has no waypoints.</Empty>
                    ) : (
                        <ul className="space-y-2">
                            {waypoints.map((w) => {
                                const pct = (w.visits / maxWaypointVisits) * 100;
                                return (
                                    <li key={w.id}>
                                        <div className="flex items-baseline justify-between text-sm">
                                            <span className="text-gray-700">
                                                {w.label}
                                            </span>
                                            <span className="tabular-nums text-gray-600">
                                                {w.visits}
                                            </span>
                                        </div>
                                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className="h-full bg-amber-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Section>
            </div>
        </AdminLayout>
    );
}

function Card({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">
                {label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                {value}
            </div>
            {hint && (
                <div className="mt-1 text-xs text-gray-500">{hint}</div>
            )}
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function Empty({ children }: { children: React.ReactNode }) {
    return <p className="text-sm text-gray-500">{children}</p>;
}

import { Link } from '@inertiajs/react';

type Tab = {
    label: string;
    routeName: string;
    routeMatch: string;
};

const TABS: Tab[] = [
    { label: 'Editor', routeName: 'admin.tours.editor', routeMatch: 'admin.tours.editor' },
    { label: 'Metadata', routeName: 'admin.tours.edit', routeMatch: 'admin.tours.edit' },
    { label: 'Settings', routeName: 'admin.tours.settings', routeMatch: 'admin.tours.settings' },
    { label: 'Sharing', routeName: 'admin.tours.share', routeMatch: 'admin.tours.share' },
    { label: 'Analytics', routeName: 'admin.tours.analytics', routeMatch: 'admin.tours.analytics' },
];

export function TourSubnav({ tourId }: { tourId: number }) {
    const isCurrent = (match: string) => {
        try {
            return route().current(match);
        } catch {
            return false;
        }
    };

    return (
        <nav className="-mb-px flex gap-6 border-b border-gray-200 text-sm">
            {TABS.map((t) => (
                <Link
                    key={t.routeName}
                    href={route(t.routeName, tourId)}
                    className={`border-b-2 px-1 py-2 ${
                        isCurrent(t.routeMatch)
                            ? 'border-gray-900 font-medium text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                    {t.label}
                </Link>
            ))}
        </nav>
    );
}

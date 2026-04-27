import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Tour = {
    id: number;
    name: string;
    client_name: string | null;
    public_slug: string;
    custom_slug: string | null;
    status: 'draft' | 'published' | 'archived';
    visibility: 'private' | 'unlisted' | 'public';
    thumbnail_url: string | null;
    view_count: number;
    updated_at: string;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Filters = {
    search?: string;
    status?: string;
    visibility?: string;
    client_name?: string;
    sort?: string;
    direction?: string;
};

const STATUS_BADGE: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-amber-100 text-amber-700',
};

const VISIBILITY_BADGE: Record<string, string> = {
    private: 'bg-red-50 text-red-700',
    unlisted: 'bg-blue-50 text-blue-700',
    public: 'bg-emerald-50 text-emerald-700',
};

export default function ToursIndex({
    tours,
    filters,
}: {
    tours: Paginator<Tour>;
    filters: Filters;
}) {
    const { data, setData, get, processing } = useForm({
        search: filters.search ?? '',
        status: filters.status ?? '',
        visibility: filters.visibility ?? '',
        client_name: filters.client_name ?? '',
        sort: filters.sort ?? 'updated_at',
        direction: filters.direction ?? 'desc',
    });

    const submitFilters: FormEventHandler = (e) => {
        e.preventDefault();
        get(route('admin.tours.index'), { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        router.get(
            route('admin.tours.index'),
            {},
            { preserveState: false, replace: true },
        );
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Tours
                    </h1>
                    <Link
                        href={route('admin.tours.create')}
                        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        New tour
                    </Link>
                </div>
            }
        >
            <Head title="Tours" />

            {/* Filters */}
            <form
                onSubmit={submitFilters}
                className="mb-4 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6"
            >
                <input
                    type="search"
                    placeholder="Search…"
                    value={data.search}
                    onChange={(e) => setData('search', e.target.value)}
                    className="rounded-md border-gray-300 text-sm shadow-sm focus:border-gray-500 focus:ring-gray-500 lg:col-span-2"
                />
                <select
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="rounded-md border-gray-300 text-sm shadow-sm"
                >
                    <option value="">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                </select>
                <select
                    value={data.visibility}
                    onChange={(e) => setData('visibility', e.target.value)}
                    className="rounded-md border-gray-300 text-sm shadow-sm"
                >
                    <option value="">All visibility</option>
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                </select>
                <select
                    value={`${data.sort}:${data.direction}`}
                    onChange={(e) => {
                        const [sort, direction] = e.target.value.split(':');
                        setData((prev) => ({ ...prev, sort, direction }));
                    }}
                    className="rounded-md border-gray-300 text-sm shadow-sm"
                >
                    <option value="updated_at:desc">Last modified ↓</option>
                    <option value="updated_at:asc">Last modified ↑</option>
                    <option value="name:asc">Name A→Z</option>
                    <option value="name:desc">Name Z→A</option>
                    <option value="view_count:desc">Most viewed</option>
                    <option value="created_at:desc">Newest</option>
                </select>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex-1 rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
                    >
                        Apply
                    </button>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Clear
                    </button>
                </div>
            </form>

            {/* Tour list */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                {tours.data.length === 0 ? (
                    <div className="px-6 py-16 text-center text-sm text-gray-500">
                        No tours yet.{' '}
                        <Link
                            href={route('admin.tours.create')}
                            className="font-medium text-gray-900 underline"
                        >
                            Create your first tour
                        </Link>
                        .
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Tour</th>
                                <th className="px-4 py-3 text-left">Client</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">
                                    Visibility
                                </th>
                                <th className="px-4 py-3 text-right">Views</th>
                                <th className="px-4 py-3 text-left">
                                    Modified
                                </th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {tours.data.map((tour) => (
                                <tr key={tour.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-14 shrink-0 rounded bg-gray-200">
                                                {tour.thumbnail_url && (
                                                    <img
                                                        src={tour.thumbnail_url}
                                                        alt=""
                                                        className="h-full w-full rounded object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <Link
                                                    href={route(
                                                        'admin.tours.editor',
                                                        tour.id,
                                                    )}
                                                    className="font-medium text-gray-900 hover:underline"
                                                >
                                                    {tour.name}
                                                </Link>
                                                <div className="text-xs text-gray-500">
                                                    /
                                                    {tour.custom_slug ??
                                                        tour.public_slug}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {tour.client_name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[tour.status]}`}
                                        >
                                            {tour.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${VISIBILITY_BADGE[tour.visibility]}`}
                                        >
                                            {tour.visibility}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                        {tour.view_count.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Date(
                                            tour.updated_at,
                                        ).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={route(
                                                'admin.tours.edit',
                                                tour.id,
                                            )}
                                            className="text-sm text-gray-700 hover:text-gray-900"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {tours.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <div>
                        Showing {tours.from}–{tours.to} of {tours.total}
                    </div>
                    <div className="flex gap-1">
                        {tours.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                preserveScroll
                                preserveState
                                className={`rounded px-3 py-1 ${
                                    link.active
                                        ? 'bg-gray-900 text-white'
                                        : link.url
                                          ? 'border border-gray-300 hover:bg-gray-50'
                                          : 'cursor-default text-gray-400'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

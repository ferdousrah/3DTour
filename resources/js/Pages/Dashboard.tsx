import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Dashboard() {
    const user = usePage().props.auth.user;

    return (
        <AdminLayout
            header={
                <h1 className="text-2xl font-semibold text-gray-900">
                    Dashboard
                </h1>
            }
        >
            <Head title="Dashboard" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-sm font-semibold text-gray-900">
                        Welcome, {user.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Get started by creating your first 3D tour.
                    </p>
                    <Link
                        href={route('admin.tours.create')}
                        className="mt-4 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        New tour
                    </Link>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-sm font-semibold text-gray-900">
                        Tours
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage drafts, published tours, and analytics.
                    </p>
                    <Link
                        href={route('admin.tours.index')}
                        className="mt-4 inline-block text-sm font-medium text-gray-700 underline hover:text-gray-900"
                    >
                        Open tours →
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
}

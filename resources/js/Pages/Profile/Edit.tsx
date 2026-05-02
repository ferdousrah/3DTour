import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const user = usePage().props.auth.user as { role?: string };
    const isAdmin = user.role === 'admin';

    return (
        <AdminLayout
            header={
                <div className="-mx-4 -my-6 border-b border-white/10 bg-slate-950 px-4 py-5 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                        Account
                    </div>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                        Profile
                    </h1>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                {isAdmin ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-6 shadow-sm sm:p-8">
                        <h2 className="text-lg font-medium text-gray-900">
                            Delete Account
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Admin accounts are protected from self-deletion.
                            Ask another admin to remove this account from the{' '}
                            <a
                                href={route('admin.users.index')}
                                className="font-medium text-amber-800 underline hover:text-amber-900"
                            >
                                Users page
                            </a>
                            .
                        </p>
                    </div>
                ) : (
                    <div className="rounded-lg border border-red-200 bg-red-50/40 p-6 shadow-sm sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function PasswordGate({
    slug,
    tourName,
}: {
    slug: string;
    tourName: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/t/${slug}/unlock`, {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Head title={`${tourName} — password required`} />
            <form
                onSubmit={submit}
                className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
                <h1 className="text-lg font-semibold text-gray-900">
                    Password required
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                    {tourName ? (
                        <>
                            Enter the password to view{' '}
                            <span className="font-medium text-gray-900">
                                {tourName}
                            </span>
                            .
                        </>
                    ) : (
                        'Enter the password to view this tour.'
                    )}
                </p>

                <label className="mt-4 block">
                    <span className="text-xs font-medium text-gray-700">
                        Password
                    </span>
                    <input
                        type="password"
                        autoFocus
                        autoComplete="current-password"
                        required
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-gray-500 focus:ring-gray-500"
                    />
                </label>
                {errors.password && (
                    <p className="mt-2 text-sm text-red-600">
                        {errors.password}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={processing}
                    className="mt-4 w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                    {processing ? 'Checking…' : 'Unlock tour'}
                </button>
            </form>
        </div>
    );
}

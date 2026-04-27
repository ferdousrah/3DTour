import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { TourSubnav } from '@/Components/TourSubnav';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type Tour = {
    id: number;
    name: string;
    description: string | null;
    client_name: string | null;
    project_date: string | null;
    thumbnail_url: string | null;
    public_slug: string;
    custom_slug: string | null;
    status: 'draft' | 'published' | 'archived';
    visibility: 'private' | 'unlisted' | 'public';
    model_url: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image_url: string | null;
};

export default function ToursEdit({ tour }: { tour: Tour }) {
    const page = usePage();
    const isAdmin =
        (page.props.auth.user as { role?: string }).role === 'admin';
    const pageErrors = (page.props.errors ?? {}) as Record<
        string,
        string | string[] | undefined
    >;

    const { data, setData, patch, processing, errors } = useForm({
        name: tour.name,
        description: tour.description ?? '',
        client_name: tour.client_name ?? '',
        project_date: tour.project_date ?? '',
        thumbnail_url: tour.thumbnail_url ?? '',
        custom_slug: tour.custom_slug ?? '',
        og_title: tour.og_title ?? '',
        og_description: tour.og_description ?? '',
        og_image_url: tour.og_image_url ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('admin.tours.update', tour.id), { preserveScroll: true });
    };

    const [confirmName, setConfirmName] = useState('');
    const [showDelete, setShowDelete] = useState(false);

    const onDelete = () => {
        router.delete(route('admin.tours.destroy', tour.id), {
            data: { confirm_name: confirmName },
        });
    };

    const onDuplicate = () => {
        router.post(route('admin.tours.duplicate', tour.id));
    };

    const onPublish = () => {
        router.post(route('admin.tours.publish', tour.id));
    };

    const onUnpublish = () => {
        router.post(route('admin.tours.unpublish', tour.id));
    };

    return (
        <AdminLayout
            header={
                <div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {tour.name}
                            </h1>
                            <div className="mt-1 text-sm text-gray-500">
                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase">
                                    {tour.status}
                                </span>{' '}
                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase">
                                    {tour.visibility}
                                </span>{' '}
                                · /t/{tour.custom_slug ?? tour.public_slug}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {tour.status === 'published' ? (
                                <button
                                    type="button"
                                    onClick={onUnpublish}
                                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Unpublish
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onPublish}
                                    className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                                >
                                    Publish
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="mt-3">
                        <TourSubnav tourId={tour.id} />
                    </div>
                </div>
            }
        >
            <Head title={`Edit · ${tour.name}`} />

            {pageErrors.publish && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {Array.isArray(pageErrors.publish)
                        ? pageErrors.publish.join(' ')
                        : pageErrors.publish}
                </div>
            )}

            <form
                onSubmit={submit}
                className="max-w-3xl space-y-6 rounded-lg border border-gray-200 bg-white p-6"
            >
                <div>
                    <InputLabel htmlFor="name" value="Tour name" />
                    <TextInput
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="mt-1 block w-full"
                        required
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="client_name" value="Client" />
                    <TextInput
                        id="client_name"
                        value={data.client_name}
                        onChange={(e) =>
                            setData('client_name', e.target.value)
                        }
                        className="mt-1 block w-full"
                    />
                    <InputError message={errors.client_name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="project_date" value="Project date" />
                    <TextInput
                        id="project_date"
                        type="date"
                        value={data.project_date}
                        onChange={(e) =>
                            setData('project_date', e.target.value)
                        }
                        className="mt-1 block w-full"
                    />
                    <InputError
                        message={errors.project_date}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="description" value="Description" />
                    <textarea
                        id="description"
                        value={data.description}
                        onChange={(e) =>
                            setData('description', e.target.value)
                        }
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                    <InputError message={errors.description} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="thumbnail_url" value="Thumbnail URL" />
                    <TextInput
                        id="thumbnail_url"
                        type="url"
                        value={data.thumbnail_url}
                        onChange={(e) =>
                            setData('thumbnail_url', e.target.value)
                        }
                        className="mt-1 block w-full"
                    />
                    <InputError
                        message={errors.thumbnail_url}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="custom_slug" value="Custom slug" />
                    <TextInput
                        id="custom_slug"
                        value={data.custom_slug}
                        onChange={(e) =>
                            setData('custom_slug', e.target.value)
                        }
                        className="mt-1 block w-full"
                        placeholder={tour.public_slug}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Lowercase letters, digits, and dashes. 3–120 chars. Old
                        slug redirects for 30 days.
                    </p>
                    <InputError message={errors.custom_slug} className="mt-2" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="og_title" value="Social title" />
                        <TextInput
                            id="og_title"
                            value={data.og_title}
                            onChange={(e) =>
                                setData('og_title', e.target.value)
                            }
                            className="mt-1 block w-full"
                            placeholder={tour.name}
                        />
                        <InputError
                            message={errors.og_title}
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <InputLabel
                            htmlFor="og_image_url"
                            value="Social image URL"
                        />
                        <TextInput
                            id="og_image_url"
                            type="url"
                            value={data.og_image_url}
                            onChange={(e) =>
                                setData('og_image_url', e.target.value)
                            }
                            className="mt-1 block w-full"
                        />
                        <InputError
                            message={errors.og_image_url}
                            className="mt-2"
                        />
                    </div>
                </div>

                <div>
                    <InputLabel
                        htmlFor="og_description"
                        value="Social description"
                    />
                    <textarea
                        id="og_description"
                        value={data.og_description}
                        onChange={(e) =>
                            setData('og_description', e.target.value)
                        }
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                    <InputError
                        message={errors.og_description}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                    <Link
                        href={route('admin.tours.index')}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Back
                    </Link>
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>
                </div>
            </form>

            {/* Other actions */}
            <div className="mt-6 max-w-3xl space-y-3 rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-gray-900">
                    Other actions
                </h2>
                <button
                    type="button"
                    onClick={onDuplicate}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Duplicate this tour
                </button>
            </div>

            {/* Danger zone (admin only per FR-003) */}
            {isAdmin && (
                <div className="mt-6 max-w-3xl rounded-lg border border-red-200 bg-red-50 p-6">
                    <h2 className="text-sm font-semibold text-red-800">
                        Danger zone
                    </h2>
                    {!showDelete ? (
                        <button
                            type="button"
                            onClick={() => setShowDelete(true)}
                            className="mt-3 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                            Delete this tour
                        </button>
                    ) : (
                        <div className="mt-3 space-y-3">
                            <p className="text-sm text-red-700">
                                Type{' '}
                                <code className="rounded bg-white px-1 font-mono">
                                    {tour.name}
                                </code>{' '}
                                to confirm. The tour is moved to trash and
                                purged after 30 days.
                            </p>
                            <TextInput
                                value={confirmName}
                                onChange={(e) =>
                                    setConfirmName(e.target.value)
                                }
                                className="block w-full"
                                placeholder={tour.name}
                            />
                            {pageErrors.confirm_name && (
                                <InputError
                                    message={
                                        Array.isArray(pageErrors.confirm_name)
                                            ? pageErrors.confirm_name[0]
                                            : pageErrors.confirm_name
                                    }
                                    className="mt-1"
                                />
                            )}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    disabled={confirmName !== tour.name}
                                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Delete tour
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDelete(false)}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}

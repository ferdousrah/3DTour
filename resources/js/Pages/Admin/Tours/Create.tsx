import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ToursCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        client_name: '',
        project_date: '',
        thumbnail_url: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.tours.store'));
    };

    return (
        <AdminLayout
            header={
                <h1 className="text-2xl font-semibold text-gray-900">
                    New tour
                </h1>
            }
        >
            <Head title="New tour" />

            <form
                onSubmit={submit}
                className="max-w-2xl space-y-6 rounded-lg border border-gray-200 bg-white p-6"
            >
                <div>
                    <InputLabel htmlFor="name" value="Tour name" />
                    <TextInput
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="mt-1 block w-full"
                        isFocused
                        required
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="client_name" value="Client (optional)" />
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
                    <InputLabel
                        htmlFor="project_date"
                        value="Project date (optional)"
                    />
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                    />
                    <InputError message={errors.description} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="thumbnail_url"
                        value="Thumbnail URL (optional)"
                    />
                    <TextInput
                        id="thumbnail_url"
                        type="url"
                        value={data.thumbnail_url}
                        onChange={(e) =>
                            setData('thumbnail_url', e.target.value)
                        }
                        className="mt-1 block w-full"
                        placeholder="https://…"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Direct file upload comes in the media library slice. For
                        now, paste a URL.
                    </p>
                    <InputError
                        message={errors.thumbnail_url}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                    <Link
                        href={route('admin.tours.index')}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Cancel
                    </Link>
                    <PrimaryButton disabled={processing}>
                        Create tour
                    </PrimaryButton>
                </div>
            </form>
        </AdminLayout>
    );
}

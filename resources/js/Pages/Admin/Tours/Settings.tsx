import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { TourSubnav } from '@/Components/TourSubnav';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type Tour = {
    id: number;
    name: string;
    public_slug: string;
    custom_slug: string | null;
    status: string;
    visibility: 'private' | 'unlisted' | 'public';
    expires_at: string | null;
    allow_embed: boolean;
    embed_allowed_hosts: string[] | null;
    has_password: boolean;
};

export default function Settings({ tour }: { tour: Tour }) {
    const { data, setData, patch, processing, errors, recentlySuccessful } =
        useForm({
            visibility: tour.visibility,
            password: '',
            clear_password: false as boolean,
            expires_at: tour.expires_at
                ? toLocalInput(tour.expires_at)
                : '',
            allow_embed: tour.allow_embed,
            embed_allowed_hosts: tour.embed_allowed_hosts ?? [],
        });

    const [hostInput, setHostInput] = useState('');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // Convert local datetime back to ISO; null when blank.
        patch(route('admin.tours.update', tour.id), {
            preserveScroll: true,
        });
    };

    const addHost = () => {
        const v = hostInput.trim().toLowerCase();
        if (!v) return;
        if (data.embed_allowed_hosts.includes(v)) return;
        setData('embed_allowed_hosts', [...data.embed_allowed_hosts, v]);
        setHostInput('');
    };

    const removeHost = (host: string) => {
        setData(
            'embed_allowed_hosts',
            data.embed_allowed_hosts.filter((h) => h !== host),
        );
    };

    return (
        <AdminLayout
            header={
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {tour.name}
                    </h1>
                    <div className="mt-3">
                        <TourSubnav tourId={tour.id} />
                    </div>
                </div>
            }
        >
            <Head title={`Settings · ${tour.name}`} />

            {recentlySuccessful && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    Settings saved.
                </div>
            )}

            <form
                onSubmit={submit}
                className="max-w-3xl space-y-8 rounded-lg border border-gray-200 bg-white p-6"
            >
                {/* Visibility */}
                <fieldset className="space-y-3">
                    <legend className="text-base font-semibold text-gray-900">
                        Visibility
                    </legend>
                    <p className="text-sm text-gray-600">
                        Controls who can reach the tour's public URL.
                    </p>
                    {(['private', 'unlisted', 'public'] as const).map((v) => (
                        <label
                            key={v}
                            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                                data.visibility === v
                                    ? 'border-gray-900 bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <input
                                type="radio"
                                name="visibility"
                                value={v}
                                checked={data.visibility === v}
                                onChange={() => setData('visibility', v)}
                                className="mt-0.5"
                            />
                            <div>
                                <div className="font-medium capitalize text-gray-900">
                                    {v}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {v === 'private' &&
                                        'Public URL returns 404 unless the visitor is signed in.'}
                                    {v === 'unlisted' &&
                                        'Anyone with the link may view. Excluded from search engines.'}
                                    {v === 'public' &&
                                        'Anyone may view. Indexed by search engines.'}
                                </div>
                            </div>
                        </label>
                    ))}
                    <InputError message={errors.visibility} />
                </fieldset>

                {/* Password */}
                <fieldset className="space-y-3">
                    <legend className="text-base font-semibold text-gray-900">
                        Password protection
                    </legend>
                    {tour.has_password && !data.clear_password && (
                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                            A password is currently set. Enter a new one below
                            to replace it, or remove protection.
                        </div>
                    )}
                    <div>
                        <InputLabel
                            htmlFor="password"
                            value="Set password (leave blank to keep current)"
                        />
                        <TextInput
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-full"
                            disabled={data.clear_password}
                        />
                        <InputError message={errors.password} className="mt-1" />
                    </div>
                    {tour.has_password && (
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={data.clear_password}
                                onChange={(e) => {
                                    setData('clear_password', e.target.checked);
                                    if (e.target.checked) setData('password', '');
                                }}
                                className="rounded border-gray-300"
                            />
                            Remove password protection
                        </label>
                    )}
                </fieldset>

                {/* Expiry */}
                <fieldset className="space-y-3">
                    <legend className="text-base font-semibold text-gray-900">
                        Expiry
                    </legend>
                    <p className="text-sm text-gray-600">
                        After this date the public URL returns a 410 (Gone)
                        page. Leave blank for no expiry.
                    </p>
                    <div>
                        <InputLabel htmlFor="expires_at" value="Expires at (local time)" />
                        <TextInput
                            id="expires_at"
                            type="datetime-local"
                            value={data.expires_at}
                            onChange={(e) =>
                                setData('expires_at', e.target.value)
                            }
                            className="mt-1"
                        />
                        <InputError
                            message={errors.expires_at}
                            className="mt-1"
                        />
                    </div>
                </fieldset>

                {/* Embed */}
                <fieldset className="space-y-3">
                    <legend className="text-base font-semibold text-gray-900">
                        Embed control
                    </legend>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={data.allow_embed}
                            onChange={(e) =>
                                setData('allow_embed', e.target.checked)
                            }
                            className="rounded border-gray-300"
                        />
                        Allow this tour to be embedded in iframes
                    </label>

                    {data.allow_embed && (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-600">
                                Restrict embedding to specific domains (leave
                                empty to allow any). Supports{' '}
                                <code className="rounded bg-gray-100 px-1">
                                    *.example.com
                                </code>{' '}
                                wildcard.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={hostInput}
                                    onChange={(e) =>
                                        setHostInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addHost();
                                        }
                                    }}
                                    placeholder="example.com or *.example.com"
                                    className="flex-1 rounded-md border-gray-300 text-sm shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={addHost}
                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                    Add
                                </button>
                            </div>
                            {data.embed_allowed_hosts.length > 0 && (
                                <ul className="flex flex-wrap gap-2">
                                    {data.embed_allowed_hosts.map((h) => (
                                        <li
                                            key={h}
                                            className="flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-3 pr-1 text-xs"
                                        >
                                            <span>{h}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeHost(h)}
                                                className="rounded-full p-0.5 text-gray-500 hover:bg-gray-200"
                                                aria-label={`Remove ${h}`}
                                            >
                                                ×
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <InputError
                                message={errors['embed_allowed_hosts.0']}
                                className="mt-1"
                            />
                        </div>
                    )}
                </fieldset>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                    <PrimaryButton disabled={processing}>
                        Save settings
                    </PrimaryButton>
                </div>
            </form>
        </AdminLayout>
    );
}

/** Convert ISO datetime to `YYYY-MM-DDTHH:mm` for `<input type=datetime-local>`. */
function toLocalInput(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate(),
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

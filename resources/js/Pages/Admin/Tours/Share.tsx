import { TourSubnav } from '@/Components/TourSubnav';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

type Tour = {
    id: number;
    name: string;
    public_slug: string;
    custom_slug: string | null;
    public_url: string;
    status: string;
    visibility: string;
    allow_embed: boolean;
};

export default function Share({ tour }: { tour: Tour }) {
    const url = tour.public_url;
    const [copied, setCopied] = useState<'url' | 'embed' | null>(null);

    const copy = async (text: string, kind: 'url' | 'embed') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(kind);
            window.setTimeout(() => setCopied(null), 1500);
        } catch {
            /* clipboard unsupported in some contexts */
        }
    };

    const embedSnippet = `<iframe src="${url}?embed=1" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
    const qrUrl = route('admin.tours.qrcode', tour.id);

    const isShareable = tour.status === 'published';

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
            <Head title={`Share · ${tour.name}`} />

            {!isShareable && (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    This tour isn't published yet. Share links will return 404
                    until you publish.
                </div>
            )}

            <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
                {/* URL + QR */}
                <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-base font-semibold text-gray-900">
                        Public URL
                    </h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            readOnly
                            value={url}
                            onFocus={(e) => e.currentTarget.select()}
                            className="flex-1 rounded-md border-gray-300 bg-gray-50 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => copy(url, 'url')}
                            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            {copied === 'url' ? 'Copied' : 'Copy'}
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md border border-gray-300 px-3 py-2 text-center text-sm hover:bg-gray-50"
                        >
                            WhatsApp
                        </a>
                        <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md border border-gray-300 px-3 py-2 text-center text-sm hover:bg-gray-50"
                        >
                            Facebook
                        </a>
                        <a
                            href={`mailto:?subject=${encodeURIComponent(tour.name)}&body=${encodeURIComponent(url)}`}
                            className="rounded-md border border-gray-300 px-3 py-2 text-center text-sm hover:bg-gray-50"
                        >
                            Email
                        </a>
                    </div>

                    <div>
                        <h3 className="mt-4 text-sm font-semibold text-gray-900">
                            QR code
                        </h3>
                        <div className="mt-2 flex items-start gap-4">
                            <div className="overflow-hidden rounded-md border border-gray-200 bg-white p-2">
                                <img
                                    src={qrUrl}
                                    alt={`QR for ${tour.name}`}
                                    className="h-32 w-32"
                                />
                            </div>
                            <div className="space-y-2 text-sm">
                                <a
                                    href={qrUrl}
                                    download={`${tour.public_slug}-qr.svg`}
                                    className="block text-gray-900 underline"
                                >
                                    Download SVG
                                </a>
                                <p className="text-xs text-gray-500">
                                    Vector format — scales to any size for
                                    print.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Embed */}
                <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="text-base font-semibold text-gray-900">
                        Embed code
                    </h2>
                    {tour.allow_embed ? (
                        <>
                            <p className="text-sm text-gray-600">
                                Paste this into any website to embed the tour.
                                Restrict allowed domains in Settings.
                            </p>
                            <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
                                <code>{embedSnippet}</code>
                            </pre>
                            <button
                                type="button"
                                onClick={() => copy(embedSnippet, 'embed')}
                                className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                            >
                                {copied === 'embed'
                                    ? 'Copied'
                                    : 'Copy embed code'}
                            </button>
                        </>
                    ) : (
                        <p className="text-sm text-gray-600">
                            Embedding is disabled for this tour. Enable it in
                            Settings to generate an embed snippet.
                        </p>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}

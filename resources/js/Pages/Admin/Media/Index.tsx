import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

type MediaItem = {
    id: number;
    file_name: string;
    file_url: string;
    mime_type: string;
    file_size: number;
    width: number | null;
    height: number | null;
    uploader: { id: number; name: string } | null;
    created_at: string;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MediaIndex({ items }: { items: Paginator<MediaItem> }) {
    const pageErrors = (usePage().props.errors ?? {}) as Record<
        string,
        string | string[] | undefined
    >;

    const fileRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const { data, setData, post, processing, progress, errors, reset } =
        useForm<{ file: File | null }>({ file: null });

    const onPick = (file: File | null) => {
        setData('file', file);
        if (file) {
            // auto-submit on pick
            post(route('admin.media.store'), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    reset('file');
                    if (fileRef.current) fileRef.current.value = '';
                },
            });
        }
    };

    const submitManual: FormEventHandler = (e) => {
        e.preventDefault();
        if (!data.file) return;
        post(route('admin.media.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset('file');
                if (fileRef.current) fileRef.current.value = '';
            },
        });
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const f = e.dataTransfer.files?.[0] ?? null;
        if (f) onPick(f);
    };

    const copyUrl = async (item: MediaItem) => {
        const fullUrl = window.location.origin + item.file_url;
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopiedId(item.id);
            window.setTimeout(() => setCopiedId(null), 1500);
        } catch {
            /* clipboard unsupported */
        }
    };

    const remove = (item: MediaItem) => {
        if (
            !confirm(
                `Delete "${item.file_name}"? Files in use by hotspots can't be deleted.`,
            )
        )
            return;
        router.delete(route('admin.media.destroy', item.id), {
            preserveScroll: true,
        });
    };

    const flashError = pageErrors.media || errors.file;

    return (
        <AdminLayout
            header={
                <div className="-mx-4 -my-6 border-b border-white/10 bg-slate-950 px-4 py-5 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                                Library
                            </div>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                                Media
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/50">
                            <span className="rounded border border-white/10 bg-white/5 px-2 py-1">
                                {String(items.total).padStart(3, '0')} files
                            </span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Media library" />

            {/* Upload area */}
            <form
                onSubmit={submitManual}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                className={`mb-6 rounded-xl border-2 border-dashed p-8 text-center transition ${
                    dragActive
                        ? 'border-cyan-400 bg-cyan-400/5'
                        : 'border-gray-300 bg-white hover:border-cyan-400/40'
                }`}
            >
                <input
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    className="hidden"
                    onChange={(e) => onPick(e.target.files?.[0] ?? null)}
                />
                <div className="space-y-2">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                        Drop file or click to upload
                    </div>
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {processing ? 'Uploading…' : 'Choose file'}
                    </button>
                    <p className="text-xs text-gray-500">
                        JPG, PNG, WebP, GIF · max 10 MB · auto-uploads on
                        select
                    </p>
                </div>

                {progress && (
                    <div className="mx-auto mt-4 max-w-md space-y-1">
                        <div className="h-1.5 w-full overflow-hidden rounded bg-gray-200">
                            <div
                                className="h-full bg-cyan-500 transition-all"
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>
                        <div className="font-mono text-[10px] text-gray-500">
                            {progress.percentage}%
                        </div>
                    </div>
                )}

                {flashError && (
                    <p className="mt-3 text-sm text-red-600">
                        {Array.isArray(flashError)
                            ? flashError.join(' ')
                            : flashError}
                    </p>
                )}
            </form>

            {/* Grid */}
            {items.data.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-gray-500">
                        Library is empty
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                        Upload an image above to get started.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {items.data.map((item) => (
                        <div
                            key={item.id}
                            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-cyan-400/50 hover:shadow-md"
                        >
                            <div className="aspect-square bg-gray-100">
                                <img
                                    src={item.file_url}
                                    alt={item.file_name}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="border-t border-gray-100 p-2">
                                <div
                                    className="truncate text-xs font-medium text-gray-900"
                                    title={item.file_name}
                                >
                                    {item.file_name}
                                </div>
                                <div className="mt-0.5 flex items-center justify-between font-mono text-[10px] text-gray-500">
                                    <span>
                                        {item.width && item.height
                                            ? `${item.width}×${item.height}`
                                            : '—'}
                                    </span>
                                    <span>{formatBytes(item.file_size)}</span>
                                </div>
                            </div>
                            <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-1 bg-gradient-to-b from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                                <button
                                    type="button"
                                    onClick={() => copyUrl(item)}
                                    title="Copy URL"
                                    className="rounded bg-white/90 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-gray-700 hover:bg-white"
                                >
                                    {copiedId === item.id ? '✓ Copied' : 'Copy URL'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => remove(item)}
                                    title="Delete"
                                    aria-label="Delete media"
                                    className="rounded bg-rose-500/90 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-white hover:bg-rose-500"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {items.last_page > 1 && (
                <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
                    <div className="font-mono text-xs">
                        {items.from}–{items.to} of {items.total}
                    </div>
                    <div className="flex gap-1">
                        {items.links.map((link, i) => (
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

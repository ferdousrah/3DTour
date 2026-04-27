import { useEffect, useState } from 'react';
import { Hotspot } from './types';

type Draft = {
    title: string;
    description: string;
    type: 'info' | 'product' | 'link';
    price_bdt: string;
    external_url: string;
    color: string;
    is_visible: boolean;
};

export function HotspotForm({
    initial,
    open,
    onSave,
    onCancel,
    onDelete,
}: {
    initial: Hotspot | null;
    open: boolean;
    onSave: (data: Partial<Hotspot>) => void;
    onCancel: () => void;
    onDelete?: () => void;
}) {
    const [draft, setDraft] = useState<Draft>(toDraft(initial));

    useEffect(() => {
        setDraft(toDraft(initial));
    }, [initial]);

    if (!open || !initial) return null;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const data: Partial<Hotspot> = {
            title: draft.title,
            description: draft.description || null,
            type: draft.type,
            price_bdt:
                draft.type === 'product' && draft.price_bdt
                    ? draft.price_bdt
                    : null,
            external_url:
                draft.type === 'link' && draft.external_url
                    ? draft.external_url
                    : null,
            color: draft.color,
            is_visible: draft.is_visible,
        };
        onSave(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <form
                onSubmit={submit}
                className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 text-white backdrop-blur-2xl"
                style={{
                    boxShadow:
                        '0 0 0 1px rgba(34,211,238,0.15), 0 30px 80px -20px rgba(0,0,0,0.8), 0 0 80px -20px rgba(34,211,238,0.3)',
                }}
            >
                {/* Top accent */}
                <div
                    aria-hidden
                    className="h-px w-full"
                    style={{
                        background:
                            'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)',
                        boxShadow: '0 0 12px rgba(34,211,238,0.5)',
                    }}
                />

                <div className="space-y-4 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                                {initial.id < 0
                                    ? 'New Hotspot'
                                    : 'Edit Hotspot'}
                            </div>
                            <h2 className="mt-1 text-lg font-semibold">
                                {draft.title || 'Untitled'}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="-m-2 p-2 text-white/40 hover:text-white"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>

                    <Field label="Title">
                        <input
                            autoFocus
                            type="text"
                            required
                            maxLength={200}
                            value={draft.title}
                            onChange={(e) =>
                                setDraft({ ...draft, title: e.target.value })
                            }
                            className="block w-full rounded-md border-white/10 bg-white/5 text-sm text-white placeholder-white/30 focus:border-cyan-400/60 focus:ring-cyan-400/30"
                        />
                    </Field>

                    <Field label="Type">
                        <div className="grid grid-cols-3 gap-1.5">
                            {(['info', 'product', 'link'] as const).map(
                                (t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() =>
                                            setDraft({ ...draft, type: t })
                                        }
                                        className={`rounded-md border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition ${
                                            draft.type === t
                                                ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100'
                                                : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ),
                            )}
                        </div>
                    </Field>

                    <Field label="Description">
                        <textarea
                            rows={3}
                            value={draft.description}
                            onChange={(e) =>
                                setDraft({
                                    ...draft,
                                    description: e.target.value,
                                })
                            }
                            className="block w-full rounded-md border-white/10 bg-white/5 text-sm text-white placeholder-white/30 focus:border-cyan-400/60 focus:ring-cyan-400/30"
                            placeholder="Optional"
                        />
                    </Field>

                    {draft.type === 'product' && (
                        <Field label="Price (BDT)">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft.price_bdt}
                                onChange={(e) =>
                                    setDraft({
                                        ...draft,
                                        price_bdt: e.target.value,
                                    })
                                }
                                className="block w-full rounded-md border-white/10 bg-white/5 font-mono text-sm text-white placeholder-white/30 focus:border-cyan-400/60 focus:ring-cyan-400/30"
                            />
                        </Field>
                    )}

                    {draft.type === 'link' && (
                        <Field label="External URL">
                            <input
                                type="url"
                                value={draft.external_url}
                                onChange={(e) =>
                                    setDraft({
                                        ...draft,
                                        external_url: e.target.value,
                                    })
                                }
                                className="block w-full rounded-md border-white/10 bg-white/5 font-mono text-sm text-white placeholder-white/30 focus:border-cyan-400/60 focus:ring-cyan-400/30"
                                placeholder="https://"
                            />
                        </Field>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Pin color">
                            <input
                                type="color"
                                value={draft.color}
                                onChange={(e) =>
                                    setDraft({
                                        ...draft,
                                        color: e.target.value,
                                    })
                                }
                                className="h-9 w-full cursor-pointer rounded-md border border-white/10 bg-transparent"
                            />
                        </Field>
                        <Field label="Visible">
                            <label className="mt-1 flex items-center gap-2 text-sm text-white/80">
                                <input
                                    type="checkbox"
                                    checked={draft.is_visible}
                                    onChange={(e) =>
                                        setDraft({
                                            ...draft,
                                            is_visible: e.target.checked,
                                        })
                                    }
                                    className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400/50"
                                />
                                Show in viewer
                            </label>
                        </Field>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-6 py-3">
                    <div>
                        {onDelete && initial.id >= 0 && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="font-mono text-[10px] uppercase tracking-widest text-rose-400 hover:text-rose-300"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-md border border-white/10 bg-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white/70 hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-md border border-cyan-400/60 bg-cyan-400/15 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-100 hover:bg-cyan-400/25"
                            style={{
                                boxShadow:
                                    '0 0 16px rgba(34,211,238,0.3)',
                            }}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300/60">
                {label}
            </span>
            <div className="mt-1.5">{children}</div>
        </label>
    );
}

function toDraft(h: Hotspot | null): Draft {
    return {
        title: h?.title ?? '',
        description: h?.description ?? '',
        type: h?.type ?? 'info',
        price_bdt: h?.price_bdt ?? '',
        external_url: h?.external_url ?? '',
        color: h?.color ?? '#22d3ee',
        is_visible: h?.is_visible ?? true,
    };
}

import { useEffect, useState } from 'react';
import { ViewerHotspot } from './types';

const TYPE_BADGE: Record<ViewerHotspot['type'], string> = {
    info: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
    product: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
    link: 'border-violet-400/40 bg-violet-400/10 text-violet-200',
};

export function HotspotPanel({
    hotspot,
    onClose,
}: {
    hotspot: ViewerHotspot | null;
    onClose: () => void;
}) {
    const [imgIndex, setImgIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setImgIndex(0);
        if (hotspot) {
            // next-tick → triggers the transition
            const t = window.setTimeout(() => setMounted(true), 10);
            return () => {
                window.clearTimeout(t);
                setMounted(false);
            };
        }
        setMounted(false);
    }, [hotspot?.id]);

    useEffect(() => {
        if (!hotspot) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [hotspot, onClose]);

    if (!hotspot) return null;

    const accent = hotspot.color || '#22d3ee';
    const img = hotspot.media[imgIndex];
    const hasMedia = hotspot.media.length > 0;
    const hasDescription = (hotspot.description ?? '').trim().length > 0;

    return (
        <div
            role="dialog"
            aria-modal="false"
            aria-label={hotspot.title}
            className={`fixed inset-x-0 bottom-0 z-30 flex max-h-[80vh] flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-slate-950/85 text-white shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto sm:max-h-[calc(100vh-3rem)] sm:w-[24rem] sm:rounded-2xl ${
                mounted
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
            }`}
            style={
                {
                    boxShadow: `0 0 0 1px ${accent}33, 0 30px 60px -20px ${accent}33, 0 0 80px -20px rgba(0,0,0,0.8)`,
                } as React.CSSProperties
            }
        >
            {/* Top accent bar (color of the hotspot) */}
            <div
                aria-hidden
                className="h-px w-full"
                style={{
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                    boxShadow: `0 0 12px ${accent}, 0 0 4px ${accent}`,
                }}
            />

            {/* Header */}
            <div className="flex shrink-0 items-start gap-3 px-5 py-4">
                <div
                    aria-hidden
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                        background: accent,
                        boxShadow: `0 0 12px ${accent}, 0 0 4px ${accent}`,
                    }}
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                            HOT.{String(hotspot.id).padStart(3, '0')}
                        </span>
                        <span
                            className={`rounded-sm border px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-wider ${TYPE_BADGE[hotspot.type]}`}
                        >
                            {hotspot.type}
                        </span>
                    </div>
                    <h2 className="mt-1 text-lg font-semibold leading-tight tracking-tight">
                        {hotspot.title}
                    </h2>
                    {hotspot.type === 'product' && hotspot.price_bdt && (
                        <div className="mt-1 font-mono text-sm font-semibold text-emerald-300">
                            ৳ {Number(hotspot.price_bdt).toLocaleString()}
                            <span className="ml-1 text-[10px] tracking-widest text-emerald-400/60">
                                BDT
                            </span>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="-m-2 shrink-0 rounded-md p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                    >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>

            <div className="border-t border-white/5" />

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                {hasMedia && (
                    <div className="px-5 pt-4">
                        <div
                            className="overflow-hidden rounded-lg ring-1 ring-white/10"
                            style={{
                                boxShadow: `0 10px 30px -10px ${accent}55`,
                            }}
                        >
                            <img
                                src={img.file_url}
                                alt={img.alt_text ?? hotspot.title}
                                className="aspect-video w-full bg-slate-900 object-cover"
                            />
                        </div>
                        {hotspot.media.length > 1 && (
                            <div className="mt-3 flex items-center justify-center gap-1.5">
                                {hotspot.media.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setImgIndex(i)}
                                        aria-label={`Image ${i + 1}`}
                                        className={`h-1 rounded-full transition-all ${
                                            i === imgIndex
                                                ? 'w-6'
                                                : 'w-1 hover:w-2'
                                        }`}
                                        style={{
                                            background:
                                                i === imgIndex
                                                    ? accent
                                                    : 'rgba(255,255,255,0.2)',
                                            boxShadow:
                                                i === imgIndex
                                                    ? `0 0 8px ${accent}`
                                                    : undefined,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        {img.caption && (
                            <div className="mt-2 font-mono text-[11px] text-white/40">
                                {img.caption}
                            </div>
                        )}
                    </div>
                )}

                <div className="px-5 py-4">
                    {hasDescription ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                            {hotspot.description}
                        </p>
                    ) : (
                        <div className="rounded-md border border-dashed border-white/10 px-3 py-4 text-center">
                            <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                                NO DATA
                            </p>
                            <p className="mt-1 text-xs italic text-white/40">
                                No description for this point.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer action */}
            {hotspot.type === 'link' && hotspot.external_url && (
                <div className="shrink-0 border-t border-white/5 px-5 py-3">
                    <a
                        href={hotspot.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition"
                        style={
                            {
                                borderColor: `${accent}55`,
                                background: `${accent}1a`,
                                color: '#fff',
                            } as React.CSSProperties
                        }
                    >
                        <span className="font-mono uppercase tracking-widest">
                            Visit link
                        </span>
                        <svg
                            className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden
                        >
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                    </a>
                </div>
            )}
        </div>
    );
}

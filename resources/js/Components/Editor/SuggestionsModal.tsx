import { useEffect, useState } from 'react';

export type SuggestedWaypoint = {
    label: string;
    position: { x: number; y: number; z: number };
    look_at: { x: number; y: number; z: number };
    reason: string;
};

export type SuggestedHotspot = {
    title: string;
    description: string;
    position: { x: number; y: number; z: number };
    type: 'info' | 'product' | 'link';
    reason: string;
};

export type SuggestionResult = {
    waypoints: SuggestedWaypoint[];
    hotspots: SuggestedHotspot[];
    axis_convention: 'y_up' | 'z_up' | 'unknown';
    context: {
        mesh_count: number;
        named_node_count: number;
    };
};

const TYPE_BADGE: Record<SuggestedHotspot['type'], string> = {
    info: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
    product: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
    link: 'border-violet-400/40 bg-violet-400/10 text-violet-200',
};

export function SuggestionsModal({
    open,
    loading,
    error,
    result,
    onClose,
    onAccept,
    onRetry,
}: {
    open: boolean;
    loading: boolean;
    error: string | null;
    result: SuggestionResult | null;
    onClose: () => void;
    onAccept: (
        waypoints: SuggestedWaypoint[],
        hotspots: SuggestedHotspot[],
    ) => void;
    onRetry: () => void;
}) {
    const [wpSelected, setWpSelected] = useState<Set<number>>(new Set());
    const [hsSelected, setHsSelected] = useState<Set<number>>(new Set());

    // Default to all-selected when fresh suggestions arrive.
    useEffect(() => {
        if (result) {
            setWpSelected(new Set(result.waypoints.map((_, i) => i)));
            setHsSelected(new Set(result.hotspots.map((_, i) => i)));
        }
    }, [result]);

    if (!open) return null;

    const toggle = (
        set: Set<number>,
        idx: number,
        setSet: (s: Set<number>) => void,
    ) => {
        const next = new Set(set);
        next.has(idx) ? next.delete(idx) : next.add(idx);
        setSet(next);
    };

    const accept = () => {
        if (!result) return;
        onAccept(
            result.waypoints.filter((_, i) => wpSelected.has(i)),
            result.hotspots.filter((_, i) => hsSelected.has(i)),
        );
    };

    const totalSelected = wpSelected.size + hsSelected.size;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div
                className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 text-white backdrop-blur-2xl"
                style={{
                    boxShadow:
                        '0 0 0 1px rgba(34,211,238,0.15), 0 30px 80px -20px rgba(0,0,0,0.8), 0 0 80px -20px rgba(34,211,238,0.3)',
                }}
            >
                <div
                    aria-hidden
                    className="h-px w-full"
                    style={{
                        background:
                            'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)',
                        boxShadow: '0 0 12px rgba(34,211,238,0.5)',
                    }}
                />

                {/* Header */}
                <div className="flex shrink-0 items-start justify-between border-b border-white/5 px-6 py-4">
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                            ✨ Gemini · Beta
                        </div>
                        <h2 className="mt-1 text-lg font-semibold tracking-tight">
                            AI tour suggestions
                        </h2>
                        {result && (
                            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/40">
                                {result.context.named_node_count} of{' '}
                                {result.context.mesh_count} meshes named ·{' '}
                                axis: {result.axis_convention}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="-m-2 p-2 text-white/40 hover:text-white"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading && <Loading />}
                    {error && !loading && (
                        <ErrorState error={error} onRetry={onRetry} />
                    )}
                    {result && !loading && !error && (
                        <ResultView
                            result={result}
                            wpSelected={wpSelected}
                            hsSelected={hsSelected}
                            toggleWp={(i) =>
                                toggle(wpSelected, i, setWpSelected)
                            }
                            toggleHs={(i) =>
                                toggle(hsSelected, i, setHsSelected)
                            }
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/5 bg-black/20 px-6 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        {result
                            ? `${totalSelected} of ${result.waypoints.length + result.hotspots.length} selected`
                            : ''}
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-white/10 bg-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white/70 hover:bg-white/10"
                        >
                            Close
                        </button>
                        {result && !loading && (
                            <button
                                type="button"
                                onClick={accept}
                                disabled={totalSelected === 0}
                                className="rounded-md border border-cyan-400/60 bg-cyan-400/15 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
                                style={{
                                    boxShadow:
                                        '0 0 16px rgba(34,211,238,0.3)',
                                }}
                            >
                                Add to tour
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Loading() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center gap-2">
                <span
                    className="inline-block h-2 w-2 animate-pulse rounded-full"
                    style={{
                        background: '#22d3ee',
                        boxShadow: '0 0 8px #22d3ee',
                    }}
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                    Asking Gemini…
                </span>
            </div>
            <p className="mt-3 text-xs text-white/50">
                Analyzing the model's mesh tree and proposing waypoints +
                hotspots. Usually 2–4 seconds.
            </p>
        </div>
    );
}

function ErrorState({
    error,
    onRetry,
}: {
    error: string;
    onRetry: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-300">
                Suggestion failed
            </div>
            <p className="mt-3 max-w-sm text-sm text-white/70">{error}</p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-md border border-white/10 bg-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white/70 hover:bg-white/10"
            >
                Try again
            </button>
        </div>
    );
}

function ResultView({
    result,
    wpSelected,
    hsSelected,
    toggleWp,
    toggleHs,
}: {
    result: SuggestionResult;
    wpSelected: Set<number>;
    hsSelected: Set<number>;
    toggleWp: (i: number) => void;
    toggleHs: (i: number) => void;
}) {
    if (
        result.waypoints.length === 0 &&
        result.hotspots.length === 0
    ) {
        return (
            <div className="rounded-md border border-dashed border-white/10 px-4 py-6 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                    No confident suggestions
                </p>
                <p className="mt-2 text-xs text-white/60">
                    Gemini didn't find enough semantic info in this model to
                    propose a tour. Most likely the meshes have generic names
                    like "Object001" — re-export from your modelling tool with
                    descriptive names, or add waypoints manually.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {result.waypoints.length > 0 && (
                <Section
                    title="Waypoints"
                    count={result.waypoints.length}
                    selected={wpSelected.size}
                >
                    {result.waypoints.map((w, i) => (
                        <SuggestionRow
                            key={i}
                            selected={wpSelected.has(i)}
                            onToggle={() => toggleWp(i)}
                            title={w.label}
                            reason={w.reason}
                            position={w.position}
                        />
                    ))}
                </Section>
            )}

            {result.hotspots.length > 0 && (
                <Section
                    title="Hotspots"
                    count={result.hotspots.length}
                    selected={hsSelected.size}
                >
                    {result.hotspots.map((h, i) => (
                        <SuggestionRow
                            key={i}
                            selected={hsSelected.has(i)}
                            onToggle={() => toggleHs(i)}
                            title={h.title}
                            reason={h.reason}
                            badge={
                                <span
                                    className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${TYPE_BADGE[h.type]}`}
                                >
                                    {h.type}
                                </span>
                            }
                            description={h.description}
                            position={h.position}
                        />
                    ))}
                </Section>
            )}

            <p className="rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-amber-200/70">
                Beta — review each suggestion before adding. AI guesses can
                be wrong.
            </p>
        </div>
    );
}

function Section({
    title,
    count,
    selected,
    children,
}: {
    title: string;
    count: number;
    selected: number;
    children: React.ReactNode;
}) {
    return (
        <section>
            <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                    {title}
                </span>
                <span className="font-mono text-[10px] text-white/40">
                    {selected}/{count} selected
                </span>
            </div>
            <ul className="space-y-1.5">{children}</ul>
        </section>
    );
}

function SuggestionRow({
    selected,
    onToggle,
    title,
    reason,
    description,
    position,
    badge,
}: {
    selected: boolean;
    onToggle: () => void;
    title: string;
    reason: string;
    description?: string;
    position: { x: number; y: number; z: number };
    badge?: React.ReactNode;
}) {
    return (
        <li>
            <button
                type="button"
                onClick={onToggle}
                className={`flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition ${
                    selected
                        ? 'border-cyan-400/50 bg-cyan-400/5'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
            >
                <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected
                            ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                            : 'border-white/30'
                    }`}
                >
                    {selected && (
                        <svg
                            className="h-3 w-3"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path d="M2 6l3 3 5-6" />
                        </svg>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                            {title}
                        </span>
                        {badge}
                    </div>
                    {description && (
                        <p className="mt-1 text-xs text-white/70">
                            {description}
                        </p>
                    )}
                    <p className="mt-1 text-xs italic text-white/40">
                        {reason}
                    </p>
                    <div className="mt-1 font-mono text-[10px] text-white/30">
                        [{position.x.toFixed(1)}, {position.y.toFixed(1)},{' '}
                        {position.z.toFixed(1)}]
                    </div>
                </div>
            </button>
        </li>
    );
}

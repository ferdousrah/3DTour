import { EditorMode } from './types';

const MODES: { id: EditorMode; label: string; key: string; hint: string }[] = [
    { id: 'view', label: 'View', key: 'V', hint: 'Orbit only' },
    { id: 'addWaypoint', label: 'Waypoint', key: 'W', hint: 'Click floor' },
    { id: 'addHotspot', label: 'Hotspot', key: 'H', hint: 'Click any surface' },
    { id: 'edit', label: 'Edit', key: 'E', hint: 'Select existing points' },
];

export function Toolbar({
    mode,
    onModeChange,
    onResetView,
    onSetDefaultCamera,
    saveStatus,
    autoTourEnabled,
    onToggleAutoTour,
    canAutoTour,
}: {
    mode: EditorMode;
    onModeChange: (mode: EditorMode) => void;
    onResetView: () => void;
    onSetDefaultCamera: () => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    autoTourEnabled: boolean;
    onToggleAutoTour: () => void;
    canAutoTour: boolean;
}) {
    return (
        <div
            className="relative flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/95 px-4 py-2 text-white backdrop-blur-xl"
            style={{ boxShadow: '0 1px 0 0 rgba(34, 211, 238, 0.15)' }}
        >
            {/* Cyan scan line */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
                style={{
                    background:
                        'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)',
                }}
            />

            <div
                className="flex gap-1 rounded-md border border-white/10 bg-white/5 p-0.5"
                role="radiogroup"
                aria-label="Editor mode"
            >
                {MODES.map((m) => {
                    const active = mode === m.id;
                    return (
                        <button
                            key={m.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => onModeChange(m.id)}
                            title={`${m.hint} (${m.key})`}
                            className={`group flex items-center gap-2 rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition ${
                                active
                                    ? 'bg-cyan-400/20 text-cyan-100'
                                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                            style={
                                active
                                    ? {
                                          boxShadow:
                                              'inset 0 0 0 1px rgba(34,211,238,0.4), 0 0 12px rgba(34,211,238,0.25)',
                                      }
                                    : undefined
                            }
                        >
                            <span>{m.label}</span>
                            <span
                                className={`rounded border px-1 text-[9px] font-semibold ${
                                    active
                                        ? 'border-cyan-400/40 text-cyan-300'
                                        : 'border-white/15 text-white/30'
                                }`}
                            >
                                {m.key}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center gap-3">
                <SaveStatusIndicator status={saveStatus} />

                {canAutoTour && (
                    <button
                        type="button"
                        onClick={onToggleAutoTour}
                        title={
                            autoTourEnabled ? 'Stop preview' : 'Play preview'
                        }
                        className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition ${
                            autoTourEnabled
                                ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                                : 'border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200'
                        }`}
                        style={
                            autoTourEnabled
                                ? {
                                      boxShadow:
                                          '0 0 16px rgba(251,191,36,0.4)',
                                  }
                                : undefined
                        }
                    >
                        {autoTourEnabled ? (
                            <>
                                <svg
                                    className="h-3 w-3"
                                    viewBox="0 0 12 12"
                                    fill="currentColor"
                                    aria-hidden
                                >
                                    <rect x="2" y="2" width="3" height="8" />
                                    <rect x="7" y="2" width="3" height="8" />
                                </svg>
                                Stop
                            </>
                        ) : (
                            <>
                                <svg
                                    className="h-3 w-3"
                                    viewBox="0 0 12 12"
                                    fill="currentColor"
                                    aria-hidden
                                >
                                    <path d="M2 1.5v9l8-4.5z" />
                                </svg>
                                Preview
                            </>
                        )}
                    </button>
                )}
                <button
                    type="button"
                    onClick={onResetView}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/70 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200"
                >
                    Reset view
                </button>
                <button
                    type="button"
                    onClick={onSetDefaultCamera}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/70 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200"
                >
                    Save view
                </button>
            </div>
        </div>
    );
}

function SaveStatusIndicator({
    status,
}: {
    status: 'idle' | 'saving' | 'saved' | 'error';
}) {
    if (status === 'idle') {
        return (
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                ● ready
            </span>
        );
    }
    if (status === 'saving') {
        return (
            <span
                className="font-mono text-[10px] uppercase tracking-widest text-cyan-300"
                style={{ textShadow: '0 0 8px rgba(34,211,238,0.5)' }}
            >
                <span className="inline-block animate-pulse">●</span> saving
            </span>
        );
    }
    if (status === 'saved') {
        return (
            <span
                className="font-mono text-[10px] uppercase tracking-widest text-emerald-300"
                style={{ textShadow: '0 0 8px rgba(110,231,183,0.5)' }}
            >
                ✓ saved
            </span>
        );
    }
    return (
        <span className="font-mono text-[10px] uppercase tracking-widest text-rose-300">
            ! error
        </span>
    );
}

import { useState } from 'react';
import { ViewerWaypoint } from './types';

export function WaypointList({
    waypoints,
    onSelect,
    activeId,
}: {
    waypoints: ViewerWaypoint[];
    onSelect: (w: ViewerWaypoint) => void;
    activeId: number | null;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);

    if (waypoints.length === 0) return null;

    return (
        <>
            {/* Desktop: glass sidebar */}
            <aside
                className="relative hidden w-64 shrink-0 overflow-y-auto border-r border-white/10 bg-slate-950/70 text-white backdrop-blur-xl sm:block"
                style={{
                    boxShadow: 'inset -1px 0 0 0 rgba(34,211,238,0.1)',
                }}
            >
                <div className="px-4 py-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                        Waypoints
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-white/30">
                        {String(waypoints.length).padStart(2, '0')} POINTS
                    </div>
                </div>
                <ul className="space-y-0.5 px-2 pb-4">
                    {waypoints.map((w, i) => (
                        <li key={w.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(w)}
                                className={`group relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${
                                    activeId === w.id
                                        ? 'bg-cyan-400/15 text-cyan-100'
                                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                {/* Active indicator bar */}
                                {activeId === w.id && (
                                    <div
                                        aria-hidden
                                        className="absolute inset-y-2 left-0 w-0.5 rounded-r"
                                        style={{
                                            background: '#22d3ee',
                                            boxShadow: '0 0 8px #22d3ee',
                                        }}
                                    />
                                )}
                                <span
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-semibold ${
                                        activeId === w.id
                                            ? 'border-cyan-400/60 bg-cyan-400/20 text-cyan-100'
                                            : 'border-white/15 bg-white/5 text-white/60 group-hover:border-cyan-400/40 group-hover:text-cyan-200'
                                    }`}
                                    style={
                                        activeId === w.id
                                            ? {
                                                  boxShadow:
                                                      '0 0 12px rgba(34,211,238,0.4)',
                                              }
                                            : undefined
                                    }
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <span className="truncate">{w.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>

            {/* Mobile: pill trigger + bottom sheet */}
            <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-cyan-400/40 bg-slate-950/80 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-cyan-100 backdrop-blur sm:hidden"
                style={{ boxShadow: '0 0 20px rgba(34,211,238,0.25)' }}
            >
                Waypoints · {waypoints.length}
            </button>

            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 sm:hidden"
                    onClick={() => setMobileOpen(false)}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="absolute inset-x-0 bottom-0 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-slate-950/95 p-2 text-white backdrop-blur-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                                Waypoints
                            </span>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                aria-label="Close"
                                className="-m-2 p-2 text-white/40 hover:text-white"
                            >
                                ×
                            </button>
                        </div>
                        <ul className="space-y-0.5 p-1">
                            {waypoints.map((w, i) => (
                                <li key={w.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelect(w);
                                            setMobileOpen(false);
                                        }}
                                        className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm ${
                                            activeId === w.id
                                                ? 'bg-cyan-400/15 text-cyan-100'
                                                : 'text-white/80'
                                        }`}
                                    >
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 font-mono text-[10px] text-white/60">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <span className="truncate">
                                            {w.label}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
}

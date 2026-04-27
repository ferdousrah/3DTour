import { useRef, useState } from 'react';
import { Hotspot, Waypoint } from './types';

const TYPE_BADGE: Record<Hotspot['type'], string> = {
    info: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
    product: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
    link: 'border-violet-400/40 bg-violet-400/10 text-violet-200',
};

export function Sidebar({
    waypoints,
    hotspots,
    selectedId,
    onSelectWaypoint,
    onSelectHotspot,
    onDeleteWaypoint,
    onDeleteHotspot,
    onEditHotspot,
    onRenameWaypoint,
    onReorderWaypoints,
    onToggleHotspotVisibility,
}: {
    waypoints: Waypoint[];
    hotspots: Hotspot[];
    selectedId: string | null;
    onSelectWaypoint: (id: number) => void;
    onSelectHotspot: (id: number) => void;
    onDeleteWaypoint: (id: number) => void;
    onDeleteHotspot: (id: number) => void;
    onEditHotspot: (id: number) => void;
    onRenameWaypoint: (id: number, label: string) => void;
    onReorderWaypoints: (orderedIds: number[]) => void;
    onToggleHotspotVisibility: (id: number) => void;
}) {
    return (
        <aside
            className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-slate-950/95 text-white backdrop-blur-xl"
            style={{ boxShadow: 'inset -1px 0 0 0 rgba(34,211,238,0.1)' }}
        >
            <Section
                title="Waypoints"
                count={waypoints.length}
                empty="Press W and click the floor."
            >
                <WaypointsList
                    waypoints={waypoints}
                    selectedId={selectedId}
                    onSelect={onSelectWaypoint}
                    onDelete={onDeleteWaypoint}
                    onRename={onRenameWaypoint}
                    onReorder={onReorderWaypoints}
                />
            </Section>

            <Section
                title="Hotspots"
                count={hotspots.length}
                empty="Press H and click any surface."
            >
                {hotspots.map((h, i) => {
                    const active = selectedId === `hs-${h.id}`;
                    return (
                        <li
                            key={h.id}
                            className={`group relative flex items-center gap-2 px-3 py-2 text-sm transition ${
                                active
                                    ? 'bg-amber-400/10'
                                    : 'hover:bg-white/5'
                            }`}
                        >
                            {active && (
                                <div
                                    aria-hidden
                                    className="absolute inset-y-2 left-0 w-0.5 rounded-r"
                                    style={{
                                        background: '#fbbf24',
                                        boxShadow: '0 0 8px #fbbf24',
                                    }}
                                />
                            )}
                            <button
                                type="button"
                                onClick={() =>
                                    onToggleHotspotVisibility(h.id)
                                }
                                title={
                                    h.is_visible
                                        ? 'Hide in viewer'
                                        : 'Show in viewer'
                                }
                                aria-label={
                                    h.is_visible
                                        ? 'Hide hotspot'
                                        : 'Show hotspot'
                                }
                                className={`shrink-0 transition ${
                                    h.is_visible
                                        ? 'text-cyan-300/80 hover:text-cyan-200'
                                        : 'text-white/20 hover:text-white/40'
                                }`}
                                style={
                                    h.is_visible
                                        ? {
                                              textShadow:
                                                  '0 0 6px rgba(34,211,238,0.6)',
                                          }
                                        : undefined
                                }
                            >
                                ●
                            </button>
                            <button
                                type="button"
                                onClick={() => onSelectHotspot(h.id)}
                                className="flex-1 text-left"
                            >
                                <span className="font-mono text-[10px] text-white/40">
                                    {String(i + 1).padStart(2, '0')}
                                </span>{' '}
                                <span
                                    className={`${
                                        h.is_visible
                                            ? 'text-white/90'
                                            : 'text-white/30 line-through'
                                    }`}
                                >
                                    {h.title}
                                </span>{' '}
                                <span
                                    className={`ml-1 rounded border px-1 py-px font-mono text-[9px] uppercase ${TYPE_BADGE[h.type]}`}
                                >
                                    {h.type}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onEditHotspot(h.id)}
                                className="font-mono text-[9px] uppercase text-white/30 opacity-0 transition group-hover:opacity-100 hover:text-cyan-300"
                                aria-label={`Edit hotspot ${h.title}`}
                            >
                                edit
                            </button>
                            <button
                                type="button"
                                onClick={() => onDeleteHotspot(h.id)}
                                className="text-white/30 opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
                                aria-label={`Delete hotspot ${h.title}`}
                            >
                                ×
                            </button>
                        </li>
                    );
                })}
            </Section>
        </aside>
    );
}

function WaypointsList({
    waypoints,
    selectedId,
    onSelect,
    onDelete,
    onRename,
    onReorder,
}: {
    waypoints: Waypoint[];
    selectedId: string | null;
    onSelect: (id: number) => void;
    onDelete: (id: number) => void;
    onRename: (id: number, label: string) => void;
    onReorder: (orderedIds: number[]) => void;
}) {
    const dragId = useRef<number | null>(null);
    const [dragOver, setDragOver] = useState<number | null>(null);

    const handleDrop = (targetId: number) => {
        const sourceId = dragId.current;
        dragId.current = null;
        setDragOver(null);
        if (sourceId === null || sourceId === targetId) return;

        const ids = waypoints.map((w) => w.id);
        const sourceIdx = ids.indexOf(sourceId);
        const targetIdx = ids.indexOf(targetId);
        if (sourceIdx < 0 || targetIdx < 0) return;

        ids.splice(sourceIdx, 1);
        ids.splice(targetIdx, 0, sourceId);
        onReorder(ids);
    };

    return (
        <>
            {waypoints.map((w, i) => {
                const active = selectedId === `wp-${w.id}`;
                return (
                    <li
                        key={w.id}
                        draggable
                        onDragStart={() => {
                            dragId.current = w.id;
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(w.id);
                        }}
                        onDragLeave={() =>
                            setDragOver((d) => (d === w.id ? null : d))
                        }
                        onDrop={(e) => {
                            e.preventDefault();
                            handleDrop(w.id);
                        }}
                        onDragEnd={() => {
                            dragId.current = null;
                            setDragOver(null);
                        }}
                        className={`group relative flex cursor-grab items-center gap-2 px-3 py-2 text-sm transition ${
                            dragOver === w.id
                                ? 'border-t border-cyan-400'
                                : 'border-t border-transparent'
                        } ${
                            active
                                ? 'bg-cyan-400/10'
                                : 'hover:bg-white/5'
                        }`}
                    >
                        {active && (
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
                            aria-hidden
                            className="cursor-grab select-none text-white/20 group-hover:text-white/50"
                            title="Drag to reorder"
                        >
                            ⋮⋮
                        </span>
                        <button
                            type="button"
                            onClick={() => onSelect(w.id)}
                            className="flex-1 text-left"
                        >
                            <span className="font-mono text-[10px] text-white/40">
                                {String(i + 1).padStart(2, '0')}
                            </span>{' '}
                            <input
                                type="text"
                                defaultValue={w.label}
                                onBlur={(e) =>
                                    e.target.value !== w.label &&
                                    onRename(w.id, e.target.value)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        (e.target as HTMLInputElement).blur();
                                    }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-40 border-0 bg-transparent p-0 text-sm text-white/90 focus:ring-1 focus:ring-cyan-400/50"
                            />
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(w.id)}
                            className="text-white/30 opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
                            aria-label={`Delete waypoint ${w.label}`}
                        >
                            ×
                        </button>
                    </li>
                );
            })}
        </>
    );
}

function Section({
    title,
    count,
    empty,
    children,
}: {
    title: string;
    count: number;
    empty: string;
    children: React.ReactNode;
}) {
    return (
        <div className="border-b border-white/10">
            <div className="flex items-center justify-between px-3 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                    {title}
                </span>
                <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/60">
                    {String(count).padStart(2, '0')}
                </span>
            </div>
            {count === 0 ? (
                <div className="px-3 pb-3 font-mono text-[10px] uppercase tracking-wider text-white/30">
                    {empty}
                </div>
            ) : (
                <ul className="divide-y divide-white/5 pb-1">{children}</ul>
            )}
        </div>
    );
}

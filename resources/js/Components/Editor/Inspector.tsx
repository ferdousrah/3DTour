import { Hotspot, Waypoint } from './types';

type Props = {
    selection:
        | { kind: 'waypoint'; data: Waypoint; index: number }
        | { kind: 'hotspot'; data: Hotspot; index: number }
        | null;
    onClose: () => void;
    onUpdateWaypoint: (id: number, patch: Partial<Waypoint>) => void;
    onDeleteWaypoint: (id: number) => void;
    onRecaptureWaypoint: (id: number) => void;
    onEditHotspot: (id: number) => void;
    onToggleHotspotVisibility: (id: number) => void;
    onDeleteHotspot: (id: number) => void;
};

const TYPE_BADGE: Record<Hotspot['type'], string> = {
    info: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
    product: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
    link: 'border-violet-400/40 bg-violet-400/10 text-violet-200',
};

const formatNum = (n: number) => n.toFixed(2);

export function Inspector({
    selection,
    onClose,
    onUpdateWaypoint,
    onDeleteWaypoint,
    onRecaptureWaypoint,
    onEditHotspot,
    onToggleHotspotVisibility,
    onDeleteHotspot,
}: Props) {
    if (!selection) {
        return (
            <aside
                className="hidden w-72 shrink-0 border-l border-white/10 bg-slate-950/95 text-white backdrop-blur-xl xl:block"
                style={{
                    boxShadow: 'inset 1px 0 0 0 rgba(34,211,238,0.1)',
                }}
            >
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-cyan-400/30 font-mono text-[10px] uppercase text-cyan-300/40">
                        Idle
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        No selection
                    </p>
                    <p className="mt-2 text-xs text-white/40">
                        Select a waypoint or hotspot to inspect.
                    </p>
                </div>
            </aside>
        );
    }

    const isWp = selection.kind === 'waypoint';

    return (
        <aside
            className="w-72 shrink-0 overflow-y-auto border-l border-white/10 bg-slate-950/95 text-white backdrop-blur-xl"
            style={{ boxShadow: 'inset 1px 0 0 0 rgba(34,211,238,0.1)' }}
        >
            <div className="flex items-start justify-between gap-2 border-b border-white/5 px-4 py-3">
                <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                        {isWp
                            ? `WAYPOINT ${String(selection.index + 1).padStart(2, '0')}`
                            : `HOTSPOT ${String(selection.index + 1).padStart(2, '0')}`}
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold">
                        {isWp
                            ? (selection.data as Waypoint).label
                            : (selection.data as Hotspot).title}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close inspector"
                    className="-m-2 p-2 text-white/40 hover:text-white"
                >
                    ×
                </button>
            </div>

            {isWp ? (
                <WaypointInspector
                    waypoint={selection.data as Waypoint}
                    onUpdate={(patch) =>
                        onUpdateWaypoint(selection.data.id, patch)
                    }
                    onRecapture={() =>
                        onRecaptureWaypoint(selection.data.id)
                    }
                    onDelete={() => onDeleteWaypoint(selection.data.id)}
                />
            ) : (
                <HotspotInspector
                    hotspot={selection.data as Hotspot}
                    onEdit={() => onEditHotspot(selection.data.id)}
                    onToggleVisibility={() =>
                        onToggleHotspotVisibility(selection.data.id)
                    }
                    onDelete={() => onDeleteHotspot(selection.data.id)}
                />
            )}
        </aside>
    );
}

function WaypointInspector({
    waypoint,
    onUpdate,
    onRecapture,
    onDelete,
}: {
    waypoint: Waypoint;
    onUpdate: (patch: Partial<Waypoint>) => void;
    onRecapture: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="space-y-5 px-4 py-4 text-sm">
            <Field label="Label">
                <input
                    type="text"
                    value={waypoint.label}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    className="block w-full rounded-md border-white/10 bg-white/5 text-sm text-white placeholder-white/30 focus:border-cyan-400/60 focus:ring-cyan-400/30"
                    maxLength={120}
                />
            </Field>

            <Field label="Transition">
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min={300}
                        max={4000}
                        step={100}
                        value={waypoint.transition_ms}
                        onChange={(e) =>
                            onUpdate({
                                transition_ms: Number(e.target.value),
                            })
                        }
                        className="flex-1 accent-cyan-400"
                    />
                    <span className="w-16 text-right font-mono text-xs tabular-nums text-cyan-300">
                        {(waypoint.transition_ms / 1000).toFixed(1)}s
                    </span>
                </div>
            </Field>

            <Field label="Position">
                <div className="grid grid-cols-3 gap-1.5">
                    <Coord label="x" value={waypoint.position.x} />
                    <Coord label="y" value={waypoint.position.y} />
                    <Coord label="z" value={waypoint.position.z} />
                </div>
            </Field>

            <Field label="Look-at">
                <div className="grid grid-cols-3 gap-1.5">
                    <Coord label="x" value={waypoint.look_at.x} />
                    <Coord label="y" value={waypoint.look_at.y} />
                    <Coord label="z" value={waypoint.look_at.z} />
                </div>
            </Field>

            <div className="space-y-2 pt-1">
                <button
                    type="button"
                    onClick={onRecapture}
                    className="w-full rounded-md border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-400/20"
                    title="Replace this waypoint's camera with the current orbit position"
                >
                    Recapture from view
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="w-full rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-rose-300 transition hover:bg-rose-500/15"
                >
                    Delete waypoint
                </button>
            </div>
        </div>
    );
}

function HotspotInspector({
    hotspot,
    onEdit,
    onToggleVisibility,
    onDelete,
}: {
    hotspot: Hotspot;
    onEdit: () => void;
    onToggleVisibility: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="space-y-5 px-4 py-4 text-sm">
            <div className="flex items-center gap-2">
                <span
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${TYPE_BADGE[hotspot.type]}`}
                >
                    {hotspot.type}
                </span>
                {hotspot.type === 'product' && hotspot.price_bdt && (
                    <span className="font-mono text-sm font-semibold text-emerald-300">
                        ৳ {Number(hotspot.price_bdt).toLocaleString()}
                    </span>
                )}
            </div>

            {hotspot.description && (
                <Field label="Description">
                    <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-white/70">
                        {hotspot.description}
                    </p>
                </Field>
            )}

            {hotspot.type === 'link' && hotspot.external_url && (
                <Field label="URL">
                    <a
                        href={hotspot.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-mono text-[11px] text-violet-300 underline hover:text-violet-200"
                    >
                        {hotspot.external_url}
                    </a>
                </Field>
            )}

            <Field label="Position">
                <div className="grid grid-cols-3 gap-1.5">
                    <Coord label="x" value={hotspot.position.x} />
                    <Coord label="y" value={hotspot.position.y} />
                    <Coord label="z" value={hotspot.position.z} />
                </div>
            </Field>

            <Field label="Visibility">
                <button
                    type="button"
                    onClick={onToggleVisibility}
                    className={`flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition ${
                        hotspot.is_visible
                            ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20'
                            : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                >
                    {hotspot.is_visible ? '● Visible' : '○ Hidden'}
                </button>
            </Field>

            <div className="space-y-2 pt-1">
                <button
                    type="button"
                    onClick={onEdit}
                    className="w-full rounded-md border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-400/20"
                >
                    Edit content
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="w-full rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-rose-300 transition hover:bg-rose-500/15"
                >
                    Delete hotspot
                </button>
            </div>
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
        <div>
            <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300/60">
                {label}
            </div>
            {children}
        </div>
    );
}

function Coord({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded border border-white/10 bg-white/5 px-2 py-1.5 font-mono text-[11px] text-white/70">
            <span className="mr-1 text-white/30">{label}</span>
            {formatNum(value)}
        </div>
    );
}

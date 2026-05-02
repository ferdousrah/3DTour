import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { HotspotForm } from '@/Components/Editor/HotspotForm';
import { Inspector } from '@/Components/Editor/Inspector';
import { Scene, SceneHandle } from '@/Components/Editor/Scene';
import { Sidebar } from '@/Components/Editor/Sidebar';
import {
    SuggestedHotspot,
    SuggestedWaypoint,
    SuggestionResult,
    SuggestionsModal,
} from '@/Components/Editor/SuggestionsModal';
import { Toolbar } from '@/Components/Editor/Toolbar';
import { SceneErrorBoundary } from '@/Components/SceneErrorBoundary';
import {
    EditorMode,
    EditorTour,
    Hotspot,
    Vec3,
    Waypoint,
} from '@/Components/Editor/types';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function ToursEditor({ tour }: { tour: EditorTour }) {
    if (!tour.model_url) {
        return <UploadOnlyState tour={tour} />;
    }
    return <FullEditor tour={tour} />;
}

/** Pre-upload state — preserves slice 5 upload UI. */
function UploadOnlyState({ tour }: { tour: EditorTour }) {
    const pageErrors = (usePage().props.errors ?? {}) as Record<
        string,
        string | string[] | undefined
    >;

    const { data, setData, post, processing, progress, errors, reset } =
        useForm<{ model: File | null }>({ model: null });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!data.model) return;
        post(route('admin.tours.model.store', tour.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset('model'),
        });
    };

    const flashError = pageErrors.model;

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {tour.name}
                    </h1>
                    <Link
                        href={route('admin.tours.edit', tour.id)}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Tour settings
                    </Link>
                </div>
            }
        >
            <Head title={`Editor · ${tour.name}`} />

            <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                    Upload a 3D model
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    Upload a glTF/GLB to begin placing waypoints and hotspots.
                </p>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <input
                        id="model"
                        type="file"
                        accept=".glb,.gltf"
                        onChange={(e) =>
                            setData('model', e.target.files?.[0] ?? null)
                        }
                        className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500">
                        .glb or .gltf · max 500 MB
                    </p>
                    <InputError message={errors.model} className="mt-1" />
                    {flashError && !errors.model && (
                        <p className="text-sm text-red-600">
                            {Array.isArray(flashError)
                                ? flashError.join(' ')
                                : flashError}
                        </p>
                    )}
                    {progress && (
                        <div className="space-y-1">
                            <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
                                <div
                                    className="h-full bg-gray-900 transition-all"
                                    style={{
                                        width: `${progress.percentage}%`,
                                    }}
                                />
                            </div>
                            <div className="text-xs text-gray-600">
                                {progress.percentage}%
                            </div>
                        </div>
                    )}
                    <PrimaryButton disabled={processing || !data.model}>
                        {processing ? 'Uploading…' : 'Upload model'}
                    </PrimaryButton>
                </form>
            </div>
        </AdminLayout>
    );
}

/** Full editor: 3-column layout with toolbar, sidebar, canvas, and inspector. */
function FullEditor({ tour }: { tour: EditorTour }) {
    const sceneRef = useRef<SceneHandle>(null);

    const [waypoints, setWaypoints] = useState<Waypoint[]>(tour.waypoints);
    const [hotspots, setHotspots] = useState<Hotspot[]>(tour.hotspots);
    const [mode, setMode] = useState<EditorMode>('view');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [autoTour, setAutoTour] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);

    // AI suggestions modal state
    const [suggestOpen, setSuggestOpen] = useState(false);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [suggestError, setSuggestError] = useState<string | null>(null);
    const [suggestResult, setSuggestResult] =
        useState<SuggestionResult | null>(null);

    const aiAvailable = Boolean(
        (usePage().props.features as { ai_suggestions?: boolean } | undefined)
            ?.ai_suggestions,
    );

    const [draftHotspot, setDraftHotspot] = useState<Hotspot | null>(null);

    const wrapSave = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
        setSaveStatus('saving');
        try {
            const r = await fn();
            setSaveStatus('saved');
            window.setTimeout(() => setSaveStatus('idle'), 1500);
            return r;
        } catch (err) {
            console.error(err);
            setSaveStatus('error');
            return null;
        }
    };

    /** Click on the model — branch by mode. */
    const onModelClick = (point: Vec3, normal: Vec3 | null) => {
        if (mode === 'addWaypoint') {
            createWaypoint(point);
            setMode('view');
        } else if (mode === 'addHotspot') {
            const draft: Hotspot = {
                id: -Date.now(),
                tour_id: tour.id,
                title: 'New hotspot',
                description: null,
                position: point,
                normal,
                type: 'info',
                price_bdt: null,
                external_url: null,
                icon: 'info',
                color: '#2C4F7D',
                display_order: hotspots.length,
                is_visible: true,
                media: [],
            };
            setDraftHotspot(draft);
        }
    };

    const createWaypoint = (clickPoint: Vec3) => {
        const position = {
            x: clickPoint.x,
            y: clickPoint.y + 1.6,
            z: clickPoint.z,
        };
        const optimistic: Waypoint = {
            id: -Date.now(),
            tour_id: tour.id,
            label: `Waypoint ${waypoints.length + 1}`,
            position,
            look_at: { x: position.x, y: position.y, z: position.z - 1 },
            display_order: waypoints.length,
            transition_ms: 1200,
            thumbnail_url: null,
        };
        setWaypoints((prev) => [...prev, optimistic]);
        setSelectedId(`wp-${optimistic.id}`);
        wrapSave(async () => {
            const res = await window.axios.post<Waypoint>(
                route('admin.waypoints.store', tour.id),
                {
                    label: optimistic.label,
                    position: optimistic.position,
                    look_at: optimistic.look_at,
                    display_order: optimistic.display_order,
                },
            );
            setWaypoints((prev) =>
                prev.map((w) => (w.id === optimistic.id ? res.data : w)),
            );
            setSelectedId(`wp-${res.data.id}`);
        });
    };

    /** Generic patch — used by inspector for label/transition_ms/etc. */
    const updateWaypoint = (id: number, patch: Partial<Waypoint>) => {
        setWaypoints((prev) =>
            prev.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        );
        if (id < 0) return; // optimistic row not yet persisted
        wrapSave(() =>
            window.axios.patch(route('admin.waypoints.update', id), patch),
        );
    };

    /**
     * Drag-end handler for the WaypointMarker gizmo. The marker sits on the
     * floor (`waypoint.position.y - 1.6 + 0.02`), so we add 1.58 back to
     * recover the camera eye position. Look-at follows the same XZ delta so
     * the camera continues facing the same direction after the drag.
     */
    const onWaypointDragEnd = (id: number, markerPos: Vec3) => {
        const wp = waypoints.find((w) => w.id === id);
        if (!wp) return;
        const newCameraPos: Vec3 = {
            x: markerPos.x,
            y: markerPos.y + 1.58,
            z: markerPos.z,
        };
        const dx = newCameraPos.x - wp.position.x;
        const dy = newCameraPos.y - wp.position.y;
        const dz = newCameraPos.z - wp.position.z;
        const newLookAt: Vec3 = {
            x: wp.look_at.x + dx,
            y: wp.look_at.y + dy,
            z: wp.look_at.z + dz,
        };
        updateWaypoint(id, { position: newCameraPos, look_at: newLookAt });
    };

    const onHotspotDragEnd = (id: number, newPos: Vec3) => {
        setHotspots((prev) =>
            prev.map((h) => (h.id === id ? { ...h, position: newPos } : h)),
        );
        if (id < 0) return;
        wrapSave(() =>
            window.axios.patch(route('admin.hotspots.update', id), {
                position: newPos,
            }),
        );
    };

    /** Replace a waypoint's position + look_at with the current camera view. */
    const recaptureWaypoint = (id: number) => {
        const cam = sceneRef.current?.captureCamera();
        if (!cam) return;
        updateWaypoint(id, { position: cam.position, look_at: cam.target });
    };

    const deleteWaypoint = (id: number) => {
        if (!confirm('Delete this waypoint?')) return;
        const prev = waypoints;
        setWaypoints((p) => p.filter((w) => w.id !== id));
        if (selectedId === `wp-${id}`) setSelectedId(null);
        if (id < 0) return;
        wrapSave(() =>
            window.axios.delete(route('admin.waypoints.destroy', id)),
        )?.catch(() => setWaypoints(prev));
    };

    const reorderWaypoints = (orderedIds: number[]) => {
        setWaypoints((prev) =>
            orderedIds
                .map((id, idx) => {
                    const w = prev.find((x) => x.id === id);
                    return w ? { ...w, display_order: idx } : null;
                })
                .filter((w): w is Waypoint => w !== null),
        );
        wrapSave(() =>
            window.axios.post(
                route('admin.waypoints.reorder', tour.id),
                { order: orderedIds },
            ),
        );
    };

    const selectWaypoint = (id: number) => {
        setSelectedId(`wp-${id}`);
        const w = waypoints.find((x) => x.id === id);
        if (w) sceneRef.current?.flyTo(w.position, w.look_at, w.transition_ms);
    };

    const saveHotspot = (data: Partial<Hotspot>) => {
        if (!draftHotspot) return;

        if (draftHotspot.id < 0) {
            const optimistic: Hotspot = {
                ...draftHotspot,
                ...data,
            } as Hotspot;
            setHotspots((p) => [...p, optimistic]);
            setSelectedId(`hs-${optimistic.id}`);
            setDraftHotspot(null);
            setMode('view');
            wrapSave(async () => {
                const res = await window.axios.post<Hotspot>(
                    route('admin.hotspots.store', tour.id),
                    {
                        title: data.title,
                        description: data.description,
                        position: draftHotspot.position,
                        normal: draftHotspot.normal,
                        type: data.type,
                        price_bdt: data.price_bdt ?? undefined,
                        external_url: data.external_url ?? undefined,
                        color: data.color,
                        is_visible: data.is_visible,
                        display_order: optimistic.display_order,
                    },
                );
                setHotspots((p) =>
                    p.map((h) => (h.id === optimistic.id ? res.data : h)),
                );
                setSelectedId(`hs-${res.data.id}`);
            });
        } else {
            setHotspots((p) =>
                p.map((h) =>
                    h.id === draftHotspot.id ? { ...h, ...data } : h,
                ),
            );
            const id = draftHotspot.id;
            setDraftHotspot(null);
            wrapSave(() =>
                window.axios.patch(route('admin.hotspots.update', id), data),
            );
        }
    };

    const toggleHotspotVisibility = (id: number) => {
        const next = !hotspots.find((h) => h.id === id)?.is_visible;
        setHotspots((p) =>
            p.map((h) => (h.id === id ? { ...h, is_visible: next } : h)),
        );
        wrapSave(() =>
            window.axios.patch(route('admin.hotspots.update', id), {
                is_visible: next,
            }),
        );
    };

    const deleteHotspot = (id: number) => {
        if (!confirm('Delete this hotspot?')) return;
        const prev = hotspots;
        setHotspots((p) => p.filter((h) => h.id !== id));
        setDraftHotspot(null);
        if (selectedId === `hs-${id}`) setSelectedId(null);
        if (id < 0) return;
        wrapSave(() =>
            window.axios.delete(route('admin.hotspots.destroy', id)),
        )?.catch(() => setHotspots(prev));
    };

    const editHotspot = (id: number) => {
        const h = hotspots.find((x) => x.id === id);
        if (h) setDraftHotspot(h);
    };

    /** Auto-preview cycle — same loop logic as the public viewer. */
    const AUTO_PREVIEW_DWELL_MS = 3500;
    useEffect(() => {
        if (!autoTour || waypoints.length === 0) return;
        if (mode !== 'view') setMode('view');

        const activeWaypointId = selectedId?.startsWith('wp-')
            ? Number(selectedId.slice(3))
            : null;
        const currentIdx =
            activeWaypointId !== null
                ? waypoints.findIndex((w) => w.id === activeWaypointId)
                : -1;

        if (currentIdx < 0) {
            selectWaypoint(waypoints[0].id);
            return;
        }

        const current = waypoints[currentIdx];
        const next = waypoints[(currentIdx + 1) % waypoints.length];
        const wait = (current.transition_ms || 1500) + AUTO_PREVIEW_DWELL_MS;

        const timer = window.setTimeout(() => {
            selectWaypoint(next.id);
        }, wait);

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoTour, selectedId, waypoints]);

    /** Run a fresh round of AI suggestions and open the review modal. */
    const runSuggest = async () => {
        setSuggestOpen(true);
        setSuggestLoading(true);
        setSuggestError(null);
        setSuggestResult(null);
        try {
            const res = await window.axios.post<SuggestionResult>(
                route('admin.tours.suggest', tour.id),
            );
            setSuggestResult(res.data);
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { error?: string } } })?.response
                    ?.data?.error ??
                'Could not reach the AI service. Check your GEMINI_API_KEY.';
            setSuggestError(message);
        } finally {
            setSuggestLoading(false);
        }
    };

    const acceptSuggestions = async (
        wps: SuggestedWaypoint[],
        hps: SuggestedHotspot[],
    ) => {
        // Close immediately — user already chose. Persist optimistically below.
        setSuggestOpen(false);

        for (let i = 0; i < wps.length; i++) {
            const w = wps[i];
            // Use the create endpoint directly so each row gets a real ID + lands
            // in the sidebar/canvas without needing a page reload.
            const optimistic: Waypoint = {
                id: -Date.now() - i,
                tour_id: tour.id,
                label: w.label,
                position: w.position,
                look_at: w.look_at,
                display_order: waypoints.length + i,
                transition_ms: 1500,
                thumbnail_url: null,
            };
            setWaypoints((prev) => [...prev, optimistic]);
            // eslint-disable-next-line no-await-in-loop
            await wrapSave(async () => {
                const res = await window.axios.post<Waypoint>(
                    route('admin.waypoints.store', tour.id),
                    {
                        label: w.label,
                        position: w.position,
                        look_at: w.look_at,
                        display_order: optimistic.display_order,
                    },
                );
                setWaypoints((prev) =>
                    prev.map((x) =>
                        x.id === optimistic.id ? res.data : x,
                    ),
                );
            });
        }

        for (let i = 0; i < hps.length; i++) {
            const h = hps[i];
            const optimistic: Hotspot = {
                id: -Date.now() - 1000 - i,
                tour_id: tour.id,
                title: h.title,
                description: h.description,
                position: h.position,
                normal: null,
                type: h.type,
                price_bdt: null,
                external_url: null,
                icon: 'info',
                color:
                    h.type === 'product'
                        ? '#10b981'
                        : h.type === 'link'
                          ? '#a855f7'
                          : '#22d3ee',
                display_order: hotspots.length + i,
                is_visible: true,
                media: [],
            };
            setHotspots((prev) => [...prev, optimistic]);
            // eslint-disable-next-line no-await-in-loop
            await wrapSave(async () => {
                const res = await window.axios.post<Hotspot>(
                    route('admin.hotspots.store', tour.id),
                    {
                        title: h.title,
                        description: h.description,
                        position: h.position,
                        type: h.type,
                        color: optimistic.color,
                        display_order: optimistic.display_order,
                        is_visible: true,
                    },
                );
                setHotspots((prev) =>
                    prev.map((x) =>
                        x.id === optimistic.id ? res.data : x,
                    ),
                );
            });
        }
    };

    const captureDefaultCamera = () => {
        const cam = sceneRef.current?.captureCamera();
        if (!cam) return;
        wrapSave(() =>
            window.axios.post(route('admin.tours.default-camera', tour.id), cam),
        );
    };

    /**
     * Keyboard shortcuts. We deliberately ignore the events when the user is
     * typing in a form field so renaming a waypoint with "w" doesn't switch
     * modes.
     */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (
                t &&
                (t.tagName === 'INPUT' ||
                    t.tagName === 'TEXTAREA' ||
                    t.tagName === 'SELECT' ||
                    t.isContentEditable)
            ) {
                return;
            }

            // Modal open? ignore (Escape handled by HotspotForm)
            if (draftHotspot) return;

            if (e.key === 'v' || e.key === 'V') setMode('view');
            else if (e.key === 'w' || e.key === 'W') setMode('addWaypoint');
            else if (e.key === 'h' || e.key === 'H') setMode('addHotspot');
            else if (e.key === 'e' || e.key === 'E') setMode('edit');
            else if (e.key === 'Escape') setSelectedId(null);
            else if (e.key === '?') setShortcutsOpen((s) => !s);
            else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (!selectedId) return;
                if (selectedId.startsWith('wp-')) {
                    e.preventDefault();
                    deleteWaypoint(Number(selectedId.slice(3)));
                } else if (selectedId.startsWith('hs-')) {
                    e.preventDefault();
                    deleteHotspot(Number(selectedId.slice(3)));
                }
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                if (waypoints.length === 0) return;
                e.preventDefault();
                const cur =
                    selectedId?.startsWith('wp-')
                        ? waypoints.findIndex(
                              (w) => w.id === Number(selectedId.slice(3)),
                          )
                        : -1;
                const next =
                    e.key === 'ArrowRight'
                        ? (cur + 1) % waypoints.length
                        : (cur - 1 + waypoints.length) % waypoints.length;
                selectWaypoint(waypoints[next].id);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, waypoints, hotspots, draftHotspot]);

    /** Resolve the inspector's selection from selectedId. */
    const selection = (() => {
        if (!selectedId) return null;
        if (selectedId.startsWith('wp-')) {
            const id = Number(selectedId.slice(3));
            const idx = waypoints.findIndex((w) => w.id === id);
            if (idx < 0) return null;
            return { kind: 'waypoint' as const, data: waypoints[idx], index: idx };
        }
        if (selectedId.startsWith('hs-')) {
            const id = Number(selectedId.slice(3));
            const idx = hotspots.findIndex((h) => h.id === id);
            if (idx < 0) return null;
            return { kind: 'hotspot' as const, data: hotspots[idx], index: idx };
        }
        return null;
    })();

    const publicUrl = `${window.location.origin}/t/${tour.custom_slug ?? tour.public_slug}`;

    return (
        <AdminLayout
            header={
                <div className="-mx-4 -my-6 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950 px-4 py-5 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    <div className="min-w-0 flex-1">
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                            EDITOR · TOUR.{String(tour.id).padStart(3, '0')}
                        </div>
                        <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">
                            {tour.name}
                        </h1>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShortcutsOpen((s) => !s)}
                            title="Keyboard shortcuts (?)"
                            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white/70 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200"
                        >
                            ⌨︎ Shortcuts
                        </button>
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-100 hover:bg-cyan-400/20"
                            style={{
                                boxShadow:
                                    '0 0 16px rgba(34,211,238,0.25)',
                            }}
                        >
                            Public viewer ↗
                        </a>
                        <Link
                            href={route('admin.tours.edit', tour.id)}
                            className="rounded-md border border-white/10 bg-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white/70 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200"
                        >
                            Settings
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Editor · ${tour.name}`} />

            <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8">
                <Toolbar
                    mode={mode}
                    onModeChange={(m) => {
                        if (autoTour) setAutoTour(false);
                        setMode(m);
                    }}
                    onResetView={() => sceneRef.current?.resetView()}
                    onSetDefaultCamera={captureDefaultCamera}
                    saveStatus={saveStatus}
                    autoTourEnabled={autoTour}
                    onToggleAutoTour={() => setAutoTour((s) => !s)}
                    canAutoTour={waypoints.length >= 2}
                    aiAvailable={aiAvailable}
                    onSuggest={runSuggest}
                />
                <div className="flex h-[calc(100vh-176px)]">
                    <Sidebar
                        waypoints={waypoints}
                        hotspots={hotspots}
                        selectedId={selectedId}
                        onSelectWaypoint={selectWaypoint}
                        onSelectHotspot={(id) => {
                            setSelectedId(`hs-${id}`);
                        }}
                        onDeleteWaypoint={deleteWaypoint}
                        onDeleteHotspot={deleteHotspot}
                        onEditHotspot={editHotspot}
                        onRenameWaypoint={(id, label) =>
                            updateWaypoint(id, { label })
                        }
                        onReorderWaypoints={reorderWaypoints}
                        onToggleHotspotVisibility={toggleHotspotVisibility}
                    />
                    <div
                        className="relative flex-1"
                        style={{
                            background:
                                'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
                        }}
                    >
                        {mode !== 'view' && mode !== 'edit' && (
                            <div
                                className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-cyan-400/40 bg-slate-950/80 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan-100 backdrop-blur"
                                style={{
                                    boxShadow:
                                        '0 0 20px rgba(34,211,238,0.3)',
                                }}
                            >
                                {mode === 'addWaypoint'
                                    ? '→ Click the floor to place a waypoint'
                                    : '→ Click any surface to place a hotspot'}
                            </div>
                        )}
                        <SceneErrorBoundary fallbackTitle="Couldn't load this 3D model">
                            <Scene
                                sceneRef={sceneRef}
                                modelUrl={tour.model_url!}
                                waypoints={waypoints}
                                hotspots={hotspots}
                                mode={mode}
                                selectedId={selectedId}
                                initialCamera={tour.default_camera ?? null}
                                onModelClick={onModelClick}
                                onSelectWaypoint={selectWaypoint}
                                onSelectHotspot={(id) => {
                                    setSelectedId(`hs-${id}`);
                                }}
                                onWaypointDragEnd={onWaypointDragEnd}
                                onHotspotDragEnd={onHotspotDragEnd}
                            />
                        </SceneErrorBoundary>
                    </div>

                    <Inspector
                        selection={selection}
                        onClose={() => setSelectedId(null)}
                        onUpdateWaypoint={updateWaypoint}
                        onDeleteWaypoint={deleteWaypoint}
                        onRecaptureWaypoint={recaptureWaypoint}
                        onEditHotspot={editHotspot}
                        onToggleHotspotVisibility={toggleHotspotVisibility}
                        onDeleteHotspot={deleteHotspot}
                    />
                </div>
            </div>

            <HotspotForm
                initial={draftHotspot}
                open={draftHotspot !== null}
                onSave={saveHotspot}
                onCancel={() => {
                    setDraftHotspot(null);
                    if (mode === 'addHotspot') setMode('view');
                }}
                onDelete={
                    draftHotspot && draftHotspot.id >= 0
                        ? () => deleteHotspot(draftHotspot.id)
                        : undefined
                }
            />

            <ShortcutsPopover
                open={shortcutsOpen}
                onClose={() => setShortcutsOpen(false)}
            />

            <SuggestionsModal
                open={suggestOpen}
                loading={suggestLoading}
                error={suggestError}
                result={suggestResult}
                onClose={() => setSuggestOpen(false)}
                onAccept={acceptSuggestions}
                onRetry={runSuggest}
            />
        </AdminLayout>
    );
}

function ShortcutsPopover({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 text-white backdrop-blur-2xl"
                onClick={(e) => e.stopPropagation()}
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
                <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                                Reference
                            </div>
                            <h2 className="mt-1 text-base font-semibold">
                                Keyboard shortcuts
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="-m-2 p-2 text-white/40 hover:text-white"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                    <dl className="space-y-1.5 text-sm">
                        <Row k="V" v="View mode" />
                        <Row k="W" v="Add waypoint mode" />
                        <Row k="H" v="Add hotspot mode" />
                        <Row k="E" v="Edit mode" />
                        <Row k="←  →" v="Cycle waypoints" />
                        <Row k="Del" v="Delete selected" />
                        <Row k="Esc" v="Deselect" />
                        <Row k="?" v="Show this dialog" />
                    </dl>
                </div>
            </div>
        </div>
    );
}

function Row({ k, v }: { k: string; v: string }) {
    return (
        <div className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0">
            <span className="text-white/70">{v}</span>
            <kbd className="rounded border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cyan-200">
                {k}
            </kbd>
        </div>
    );
}

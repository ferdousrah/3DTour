import { SceneErrorBoundary } from '@/Components/SceneErrorBoundary';
import { HotspotPanel } from '@/Components/Viewer/HotspotPanel';
import { TopBar } from '@/Components/Viewer/TopBar';
import { TourScene, ViewerSceneHandle } from '@/Components/Viewer/TourScene';
import { ViewerHotspot, ViewerTour, ViewerWaypoint } from '@/Components/Viewer/types';
import { useViewerTracking } from '@/Components/Viewer/useViewerTracking';
import { WaypointList } from '@/Components/Viewer/WaypointList';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function TourViewer({
    tour,
    embed,
}: {
    tour: ViewerTour;
    embed: boolean;
}) {
    const sceneRef = useRef<ViewerSceneHandle>(null);
    const [activeWaypointId, setActiveWaypointId] = useState<number | null>(
        null,
    );
    const [activeHotspot, setActiveHotspot] = useState<ViewerHotspot | null>(
        null,
    );
    const [autoTour, setAutoTour] = useState(false);

    const slug = tour.custom_slug ?? tour.public_slug;

    const handleGotoFromHost = useCallback(
        (waypointId: number) => {
            const w = tour.waypoints.find((x) => x.id === waypointId);
            if (w) handleSelectWaypoint(w);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tour.waypoints],
    );

    const { recordWaypoint, recordHotspot } = useViewerTracking({
        slug,
        embed,
        onGotoWaypoint: handleGotoFromHost,
    });

    /** Keyboard nav: Arrow keys cycle waypoints (FR-041). */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) {
                return;
            }
            if (tour.waypoints.length === 0) return;
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

            const idx =
                activeWaypointId === null
                    ? -1
                    : tour.waypoints.findIndex((w) => w.id === activeWaypointId);
            const next =
                e.key === 'ArrowRight'
                    ? (idx + 1) % tour.waypoints.length
                    : (idx - 1 + tour.waypoints.length) % tour.waypoints.length;
            const target = tour.waypoints[next];
            handleSelectWaypoint(target);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWaypointId, tour.waypoints]);

    /**
     * Auto-tour: cycle through waypoints with a dwell at each. Triggered by
     * the "Auto tour" button in the TopBar. Each tick re-runs this effect
     * (because activeWaypointId changes) and schedules the next.
     */
    const AUTO_TOUR_DWELL_MS = 4500;
    useEffect(() => {
        if (!autoTour || tour.waypoints.length === 0) return;

        const currentIdx =
            activeWaypointId !== null
                ? tour.waypoints.findIndex((w) => w.id === activeWaypointId)
                : -1;

        // First tick: jump to the first waypoint.
        if (currentIdx < 0) {
            handleSelectWaypoint(tour.waypoints[0]);
            return;
        }

        const current = tour.waypoints[currentIdx];
        const next =
            tour.waypoints[(currentIdx + 1) % tour.waypoints.length];
        const wait = (current.transition_ms || 1500) + AUTO_TOUR_DWELL_MS;

        const timer = window.setTimeout(() => {
            handleSelectWaypoint(next);
        }, wait);

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoTour, activeWaypointId, tour.waypoints]);

    /** Deep link: hash #h/{id} opens hotspot, #w/{id} flies to waypoint. */
    useEffect(() => {
        const applyHash = () => {
            const m = window.location.hash.match(/^#(h|w)\/(\d+)$/);
            if (!m) return;
            const id = Number(m[2]);
            if (m[1] === 'h') {
                const h = tour.hotspots.find((x) => x.id === id);
                if (h) setActiveHotspot(h);
            } else {
                const w = tour.waypoints.find((x) => x.id === id);
                if (w) handleSelectWaypoint(w);
            }
        };
        applyHash();
        window.addEventListener('hashchange', applyHash);
        return () => window.removeEventListener('hashchange', applyHash);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectWaypoint = (w: ViewerWaypoint) => {
        setActiveWaypointId(w.id);
        sceneRef.current?.flyTo(w.position, w.look_at, w.transition_ms);
        // FR-075 SR announcement
        announce(`Now viewing: ${w.label}`);
        // FR-100 / FR-111
        recordWaypoint(w.id, w.label);
    };

    const handleSelectHotspot = (h: ViewerHotspot) => {
        setActiveHotspot(h);
        // FR-052 deep link
        history.replaceState(null, '', `#h/${h.id}`);
        // FR-100 / FR-111
        recordHotspot(h.id, h.title);
    };

    const closeHotspot = () => {
        setActiveHotspot(null);
        if (window.location.hash.startsWith('#h/')) {
            history.replaceState(null, '', window.location.pathname);
        }
    };

    return (
        <div className="relative flex h-[100dvh] w-screen overflow-hidden bg-gray-100">
            <Head>
                <title>{tour.og_title}</title>
                <meta name="description" content={tour.og_description ?? ''} />
                <meta property="og:title" content={tour.og_title} />
                <meta
                    property="og:description"
                    content={tour.og_description ?? ''}
                />
                {tour.og_image_url && (
                    <meta property="og:image" content={tour.og_image_url} />
                )}
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                {tour.visibility === 'unlisted' && (
                    <meta name="robots" content="noindex" />
                )}
            </Head>

            {!embed && (
                <WaypointList
                    waypoints={tour.waypoints}
                    onSelect={handleSelectWaypoint}
                    activeId={activeWaypointId}
                />
            )}

            <main className="relative flex-1">
                {tour.model_url ? (
                    <SceneErrorBoundary>
                        <TourScene
                            sceneRef={sceneRef}
                            modelUrl={tour.model_url}
                            modelFileSize={tour.model_file_size}
                            waypoints={tour.waypoints}
                            hotspots={tour.hotspots}
                            initialCamera={tour.default_camera}
                            onSelectHotspot={handleSelectHotspot}
                        />
                    </SceneErrorBoundary>
                ) : (
                    <div className="flex h-full items-center justify-center bg-gray-200 text-sm text-gray-700">
                        This tour has no 3D model yet.
                    </div>
                )}

                <TopBar
                    tour={tour}
                    embed={embed}
                    onFullscreen={() => sceneRef.current?.enterFullscreen()}
                    autoTourEnabled={autoTour}
                    onToggleAutoTour={() => setAutoTour((s) => !s)}
                    canAutoTour={tour.waypoints.length >= 2}
                />
            </main>

            <HotspotPanel hotspot={activeHotspot} onClose={closeHotspot} />

            {!embed && (
                <footer className="absolute inset-x-0 bottom-0 z-10 hidden items-center justify-between gap-2 bg-gradient-to-t from-black/40 to-transparent px-4 py-2 text-xs text-white sm:flex">
                    <span className="truncate">
                        {tour.branding.company_name}
                    </span>
                    <span className="opacity-70">Powered by Technocrats</span>
                </footer>
            )}

            <SrAnnouncer />
        </div>
    );
}

let announceTarget: HTMLDivElement | null = null;

function announce(message: string) {
    if (!announceTarget) return;
    announceTarget.textContent = '';
    window.setTimeout(() => {
        if (announceTarget) announceTarget.textContent = message;
    }, 50);
}

function SrAnnouncer() {
    return (
        <div
            ref={(el) => {
                announceTarget = el;
            }}
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
        />
    );
}

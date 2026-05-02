import { Html, OrbitControls, useProgress } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HotspotPin } from './HotspotPin';
import { ModelLoader } from './ModelLoader';
import { WaypointMarker } from './WaypointMarker';
import { EditorMode, Hotspot, Vec3, Waypoint } from './types';

export type SceneHandle = {
    flyTo: (position: Vec3, target: Vec3, durationMs?: number) => void;
    captureCamera: () => { position: Vec3; target: Vec3 } | null;
    resetView: () => void;
    frameAll: () => void;
};

type Tween = {
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    startedAt: number;
    durationMs: number;
};

type Props = {
    sceneRef?: React.Ref<SceneHandle>;
    modelUrl: string;
    waypoints: Waypoint[];
    hotspots: Hotspot[];
    mode: EditorMode;
    selectedId: string | null;
    initialCamera?: { position: Vec3; target: Vec3 } | null;
    onModelClick: (point: Vec3, normal: Vec3 | null) => void;
    onSelectWaypoint: (id: number) => void;
    onSelectHotspot: (id: number) => void;
    onWaypointDragEnd?: (id: number, markerPos: Vec3) => void;
    onHotspotDragEnd?: (id: number, newPos: Vec3) => void;
};

export function Scene({
    sceneRef,
    modelUrl,
    waypoints,
    hotspots,
    mode,
    selectedId,
    initialCamera,
    onModelClick,
    onSelectWaypoint,
    onSelectHotspot,
    onWaypointDragEnd,
    onHotspotDragEnd,
}: Props) {
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<{
        target: THREE.Vector3;
        update: () => void;
        enabled: boolean;
    } | null>(null);
    const initialFrame = useRef(false);
    const modelBox = useRef<THREE.Box3 | null>(null);
    const tween = useRef<Tween | null>(null);

    const reducedMotion = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    const frameBox = (box: THREE.Box3) => {
        const cam = cameraRef.current;
        const ctrl = controlsRef.current;
        if (!cam || !ctrl) return;

        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);
        const radius = Math.max(size.x, size.y, size.z) || 5;

        cam.near = Math.max(radius * 0.001, 0.01);
        cam.far = Math.max(radius * 100, 1000);
        cam.updateProjectionMatrix();

        cam.position.set(
            center.x + radius * 1.2,
            center.y + radius * 0.8,
            center.z + radius * 1.2,
        );
        ctrl.target.copy(center);
        ctrl.update();
    };

    useImperativeHandle(
        sceneRef,
        () => ({
            flyTo: (position, target, durationMs = 1200) => {
                const cam = cameraRef.current;
                const ctrl = controlsRef.current;
                if (!cam || !ctrl) return;

                if (reducedMotion || durationMs <= 0) {
                    cam.position.set(position.x, position.y, position.z);
                    ctrl.target.set(target.x, target.y, target.z);
                    ctrl.update();
                    return;
                }

                tween.current = {
                    startPos: cam.position.clone(),
                    endPos: new THREE.Vector3(position.x, position.y, position.z),
                    startTarget: ctrl.target.clone(),
                    endTarget: new THREE.Vector3(target.x, target.y, target.z),
                    startedAt: performance.now(),
                    durationMs,
                };
                ctrl.enabled = false;
            },
            captureCamera: () => {
                const cam = cameraRef.current;
                const ctrl = controlsRef.current;
                if (!cam || !ctrl) return null;
                return {
                    position: {
                        x: cam.position.x,
                        y: cam.position.y,
                        z: cam.position.z,
                    },
                    target: {
                        x: ctrl.target.x,
                        y: ctrl.target.y,
                        z: ctrl.target.z,
                    },
                };
            },
            resetView: () => {
                if (modelBox.current) frameBox(modelBox.current);
            },
            frameAll: () => {
                if (modelBox.current) frameBox(modelBox.current);
            },
        }),
        [reducedMotion],
    );

    return (
        <Canvas
            shadows
            camera={{ position: [5, 3, 5], fov: 50, near: 0.05, far: 1000 }}
            onCreated={({ camera }) => {
                cameraRef.current = camera as THREE.PerspectiveCamera;
            }}
            // Mode-specific cursor in canvas
            style={{
                cursor:
                    mode === 'addWaypoint' ||
                    mode === 'addHotspot' ||
                    (mode === 'edit' && selectedId)
                        ? 'crosshair'
                        : 'default',
            }}
        >
            <ambientLight intensity={0.6} />
            <hemisphereLight
                args={['#ffffff', '#444444', 0.6]}
                position={[0, 10, 0]}
            />
            <directionalLight position={[5, 10, 5]} intensity={0.7} />

            <Suspense fallback={<EditorLoadingOverlay />}>
                <ModelLoader
                    key={modelUrl}
                    url={modelUrl}
                    onClick={(point, normal) => {
                        // View = orbit only. Edit forwards too so that clicking
                        // a surface while a waypoint/hotspot is selected can
                        // reposition it (Editor decides what to do).
                        if (mode === 'view') return;
                        onModelClick(
                            { x: point.x, y: point.y, z: point.z },
                            normal
                                ? { x: normal.x, y: normal.y, z: normal.z }
                                : null,
                        );
                    }}
                    onReady={(box) => {
                        modelBox.current = box.clone();
                        if (initialFrame.current) return;
                        initialFrame.current = true;

                        const cam = cameraRef.current;
                        const ctrl = controlsRef.current;
                        if (!cam || !ctrl) return;

                        const center = new THREE.Vector3();
                        const size = new THREE.Vector3();
                        box.getCenter(center);
                        box.getSize(size);
                        const radius = Math.max(size.x, size.y, size.z) || 5;

                        cam.near = Math.max(radius * 0.001, 0.01);
                        cam.far = Math.max(radius * 100, 1000);
                        cam.updateProjectionMatrix();

                        if (initialCamera) {
                            cam.position.set(
                                initialCamera.position.x,
                                initialCamera.position.y,
                                initialCamera.position.z,
                            );
                            ctrl.target.set(
                                initialCamera.target.x,
                                initialCamera.target.y,
                                initialCamera.target.z,
                            );
                        } else {
                            cam.position.set(
                                center.x + radius * 1.2,
                                center.y + radius * 0.8,
                                center.z + radius * 1.2,
                            );
                            ctrl.target.copy(center);
                        }
                        ctrl.update();
                    }}
                />
            </Suspense>

            {waypoints.map((w, i) => (
                <WaypointMarker
                    key={w.id}
                    waypoint={w}
                    index={i}
                    selected={selectedId === `wp-${w.id}`}
                    editable={mode === 'edit'}
                    onClick={() => onSelectWaypoint(w.id)}
                    onDragEnd={(p) => onWaypointDragEnd?.(w.id, p)}
                />
            ))}

            {hotspots.map((h, i) => (
                <HotspotPin
                    key={h.id}
                    hotspot={h}
                    index={i}
                    selected={selectedId === `hs-${h.id}`}
                    editable={mode === 'edit'}
                    onClick={() => onSelectHotspot(h.id)}
                    onDragEnd={(p) => onHotspotDragEnd?.(h.id, p)}
                />
            ))}

            <OrbitControls
                ref={(r) => {
                    controlsRef.current = r as unknown as {
                        target: THREE.Vector3;
                        update: () => void;
                        enabled: boolean;
                    };
                }}
                makeDefault
                enableDamping
            />

            <TweenDriver
                tween={tween}
                cameraRef={cameraRef}
                controlsRef={controlsRef}
            />
        </Canvas>
    );
}

/**
 * In-canvas loading splash. drei's `useProgress` aggregates loaders
 * (GLTFLoader, TextureLoader, etc.) and exposes overall progress 0-100.
 * Lives inside <Suspense fallback> so it shows while the GLB streams in
 * and unmounts automatically once the model is parsed.
 */
function EditorLoadingOverlay() {
    const { progress, active, item } = useProgress();
    const pct = Math.min(100, Math.max(0, progress));
    const filename = (() => {
        try {
            const u = new URL(item, window.location.href);
            return u.pathname.split('/').pop() || item;
        } catch {
            return item;
        }
    })();

    return (
        <Html center zIndexRange={[100, 0]}>
            <div
                className="pointer-events-none w-72 rounded-xl border border-white/10 bg-slate-950/85 p-5 text-white backdrop-blur-2xl"
                style={{
                    boxShadow:
                        '0 0 0 1px rgba(34,211,238,0.15), 0 30px 60px -20px rgba(0,0,0,0.6), 0 0 80px -20px rgba(34,211,238,0.3)',
                }}
            >
                {/* Top accent line */}
                <div
                    aria-hidden
                    className="-mx-5 -mt-5 mb-4 h-px"
                    style={{
                        background:
                            'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)',
                        boxShadow: '0 0 12px rgba(34,211,238,0.5)',
                    }}
                />

                <div className="flex items-center gap-2">
                    <span
                        className="inline-block h-2 w-2 animate-pulse rounded-full"
                        style={{
                            background: '#22d3ee',
                            boxShadow:
                                '0 0 8px #22d3ee, 0 0 4px #22d3ee',
                        }}
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                        {active ? 'Loading model' : 'Preparing scene'}
                    </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                    <span className="font-mono text-3xl font-semibold tabular-nums">
                        {pct.toFixed(0)}
                    </span>
                    <span className="font-mono text-xs text-white/40">%</span>
                </div>

                <div className="mt-3 h-1 overflow-hidden rounded bg-white/10">
                    <div
                        className="h-full transition-[width] duration-150 ease-out"
                        style={{
                            width: `${pct}%`,
                            background:
                                'linear-gradient(90deg, #22d3ee, #67e8f9)',
                            boxShadow: '0 0 8px #22d3ee',
                        }}
                    />
                </div>

                {filename && (
                    <div
                        className="mt-3 truncate font-mono text-[10px] text-white/40"
                        title={item}
                    >
                        {filename}
                    </div>
                )}
            </div>
        </Html>
    );
}

/** Eased lerp of camera position + orbit target, runs each frame. */
function TweenDriver({
    tween,
    cameraRef,
    controlsRef,
}: {
    tween: React.MutableRefObject<Tween | null>;
    cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
    controlsRef: React.MutableRefObject<{
        target: THREE.Vector3;
        update: () => void;
        enabled: boolean;
    } | null>;
}) {
    useFrame(() => {
        const t = tween.current;
        if (!t) return;
        const cam = cameraRef.current;
        const ctrl = controlsRef.current;
        if (!cam || !ctrl) return;

        const elapsed = performance.now() - t.startedAt;
        const u = Math.min(1, elapsed / t.durationMs);
        // Cubic ease-in-out
        const k = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;

        cam.position.lerpVectors(t.startPos, t.endPos, k);
        ctrl.target.lerpVectors(t.startTarget, t.endTarget, k);
        ctrl.update();

        if (u >= 1) {
            tween.current = null;
            ctrl.enabled = true;
        }
    });
    return null;
}

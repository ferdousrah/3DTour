import { Html, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Controllers, Interactive, useXR, XR } from '@react-three/xr';
import {
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
} from 'react';
import * as THREE from 'three';
import { useGLBLoader } from '../Editor/useGLBLoader';
import { Vec3, ViewerHotspot, ViewerWaypoint } from './types';

export type ViewerSceneHandle = {
    flyTo: (position: Vec3, target: Vec3, durationMs: number) => void;
    enterFullscreen: () => void;
};

type Props = {
    sceneRef?: React.Ref<ViewerSceneHandle>;
    modelUrl: string;
    modelFileSize?: number | null;
    waypoints: ViewerWaypoint[];
    hotspots: ViewerHotspot[];
    initialCamera: { position: Vec3; target: Vec3 } | null;
    onSelectHotspot: (hotspot: ViewerHotspot) => void;
};

const Model = ({
    url,
    expectedSize,
    onReady,
}: {
    url: string;
    expectedSize?: number | null;
    onReady: (box: THREE.Box3) => void;
}) => {
    const state = useGLBLoader(url, expectedSize);
    const scene = state.kind === 'ready' ? state.scene : null;

    useEffect(() => {
        if (!scene) return;
        // Force DoubleSide so interior waypoints can see walls whose
        // outward-facing faces would otherwise be culled.
        scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh && obj.material) {
                const apply = (m: THREE.Material) => {
                    m.side = THREE.DoubleSide;
                    m.needsUpdate = true;
                };
                Array.isArray(obj.material)
                    ? obj.material.forEach(apply)
                    : apply(obj.material);
            }
        });

        onReady(new THREE.Box3().setFromObject(scene));
    }, [scene]);

    if (state.kind === 'error') throw new Error(state.message);
    if (state.kind !== 'ready') return <ViewerLoadingOverlay state={state} />;
    return <primitive object={state.scene} />;
};

export function TourScene({
    sceneRef,
    modelUrl,
    modelFileSize,
    waypoints,
    hotspots,
    initialCamera,
    onSelectHotspot,
}: Props) {
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<{
        target: THREE.Vector3;
        update: () => void;
        enabled: boolean;
    } | null>(null);
    const initialFrame = useRef(false);
    const reducedMotion = usePrefersReducedMotion();

    /** Active tween state. Read in useFrame inside <TweenDriver/>. */
    const tween = useRef<{
        startPos: THREE.Vector3;
        endPos: THREE.Vector3;
        startTarget: THREE.Vector3;
        endTarget: THREE.Vector3;
        startedAt: number;
        durationMs: number;
    } | null>(null);

    useImperativeHandle(
        sceneRef,
        () => ({
            flyTo: (position, target, durationMs) => {
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
                ctrl.enabled = false; // FR-041: lock UI during transition
            },
            enterFullscreen: () => {
                const el = document.documentElement;
                if (document.fullscreenElement) {
                    document.exitFullscreen?.();
                } else {
                    el.requestFullscreen?.();
                }
            },
        }),
        [reducedMotion],
    );

    return (
        <Canvas
            shadows
            camera={{ position: [5, 3, 5], fov: 50, near: 0.05, far: 1000 }}
            onCreated={({ camera, gl }) => {
                cameraRef.current = camera as THREE.PerspectiveCamera;
                // Enable WebXR on the underlying renderer (no-op until a
                // session is started by the user via the VR button).
                gl.xr.enabled = true;
                // Stash the renderer on window so the (DOM-rendered) VR
                // button can hand the session over.
                (window as unknown as { __tourGl: typeof gl }).__tourGl = gl;
            }}
        >
            <XR>
                <Controllers rayMaterial={{ color: '#22d3ee' }} />
                <XrControlsGate controlsRef={controlsRef} />
            <ambientLight intensity={0.6} />
            <hemisphereLight
                args={['#ffffff', '#444444', 0.6]}
                position={[0, 10, 0]}
            />
            <directionalLight position={[5, 10, 5]} intensity={0.7} />

            <Model
                url={modelUrl}
                expectedSize={modelFileSize}
                onReady={(box) => {
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

                    // Adapt clip planes to model scale — same logic as
                    // the editor's Scene; see comment there.
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

            {waypoints.map((w, i) => (
                <ViewerWaypointMarker
                    key={w.id}
                    waypoint={w}
                    index={i}
                    onClick={() => {
                        if (sceneRef && 'current' in sceneRef && sceneRef.current) {
                            sceneRef.current.flyTo(
                                w.position,
                                w.look_at,
                                w.transition_ms,
                            );
                        }
                    }}
                />
            ))}

            {hotspots.map((h, i) => (
                <ViewerHotspotPin
                    key={h.id}
                    hotspot={h}
                    index={i}
                    onClick={() => onSelectHotspot(h)}
                />
            ))}
            </XR>

            <OrbitControls
                ref={(r) => {
                    controlsRef.current = r as unknown as typeof controlsRef.current;
                }}
                makeDefault
                enableDamping
                enablePan={false}
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
 * Disables OrbitControls when an XR session is active — the headset takes
 * over the camera, so user-driven orbit/zoom would fight the XR pose every
 * frame.
 */
function XrControlsGate({
    controlsRef,
}: {
    controlsRef: React.MutableRefObject<{
        target: THREE.Vector3;
        update: () => void;
        enabled: boolean;
    } | null>;
}) {
    const { isPresenting } = useXR();
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.enabled = !isPresenting;
        }
    }, [isPresenting, controlsRef]);
    return null;
}

/** useFrame-driven tween that lerps cam.position + controls.target. */
function TweenDriver({
    tween,
    cameraRef,
    controlsRef,
}: {
    tween: React.MutableRefObject<
        | {
              startPos: THREE.Vector3;
              endPos: THREE.Vector3;
              startTarget: THREE.Vector3;
              endTarget: THREE.Vector3;
              startedAt: number;
              durationMs: number;
          }
        | null
    >;
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
        // ease-in-out cubic
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

function ViewerWaypointMarker({
    waypoint,
    index,
    onClick,
}: {
    waypoint: ViewerWaypoint;
    index: number;
    onClick: () => void;
}) {
    const floorY = waypoint.position.y - 1.6 + 0.02;
    const { isPresenting, player } = useXR();

    /**
     * In VR, set the player rig position so the headset wearer is "standing"
     * at the waypoint's floor location. Outside VR, run the existing desktop
     * fly-to via the parent callback.
     */
    const handle = () => {
        if (isPresenting && player) {
            player.position.set(
                waypoint.position.x,
                waypoint.position.y - 1.6,
                waypoint.position.z,
            );
        } else {
            onClick();
        }
    };

    return (
        <Interactive onSelect={handle}>
        <group position={[waypoint.position.x, floorY, waypoint.position.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={999}>
                <ringGeometry args={[0.4, 0.55, 32]} />
                <meshBasicMaterial
                    color="#22d3ee"
                    transparent
                    opacity={0.9}
                    depthTest={false}
                />
            </mesh>
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.005, 0]}
                renderOrder={998}
            >
                <circleGeometry args={[0.4, 32]} />
                <meshBasicMaterial
                    color="#06b6d4"
                    transparent
                    opacity={0.25}
                    depthTest={false}
                />
            </mesh>
            <Html center zIndexRange={[100, 0]}>
                <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        handle();
                    }}
                    title={`Go to ${waypoint.label}`}
                    aria-label={`Go to waypoint ${index + 1}: ${waypoint.label}`}
                    className="group flex cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-full border border-cyan-400/60 bg-slate-950/70 px-3 py-1 text-xs font-medium text-white transition hover:scale-105 hover:border-cyan-300"
                    style={{
                        backdropFilter: 'blur(6px)',
                        boxShadow:
                            '0 0 0 3px rgba(34,211,238,0.15), 0 0 16px rgba(34,211,238,0.5)',
                    }}
                >
                    <span className="font-mono text-[10px] text-cyan-300">
                        {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-white/90">{waypoint.label}</span>
                </button>
            </Html>
        </group>
        </Interactive>
    );
}

function ViewerHotspotPin({
    hotspot,
    index,
    onClick,
}: {
    hotspot: ViewerHotspot;
    index: number;
    onClick: () => void;
}) {
    const accent = hotspot.color || '#22d3ee';
    return (
        <group
            position={[
                hotspot.position.x,
                hotspot.position.y,
                hotspot.position.z,
            ]}
        >
            <mesh renderOrder={999}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial color={accent} depthTest={false} transparent />
            </mesh>
            <Html center zIndexRange={[100, 0]}>
                <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                    title={hotspot.title}
                    aria-label={hotspot.title}
                    className="group relative flex h-9 w-9 cursor-pointer select-none items-center justify-center rounded-full font-mono text-sm font-semibold text-white transition hover:scale-110"
                    style={
                        {
                            background:
                                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(0,0,0,0.4))',
                            border: `1.5px solid ${accent}`,
                            backdropFilter: 'blur(6px)',
                            boxShadow: `0 0 0 4px ${accent}33, 0 0 20px ${accent}80, 0 2px 8px rgba(0,0,0,0.4)`,
                        } as React.CSSProperties
                    }
                >
                    <span className="relative z-10">{index + 1}</span>
                    {/* Pulse ring */}
                    <span
                        aria-hidden
                        className="absolute inset-0 rounded-full opacity-60"
                        style={{
                            border: `1px solid ${accent}`,
                            animation: 'tour-pin-pulse 2.4s ease-out infinite',
                        }}
                    />
                </button>
            </Html>
        </group>
    );
}

/** Loading splash inside the canvas while the GLB downloads + parses. */
function ViewerLoadingOverlay({
    state,
}: {
    state: Exclude<
        ReturnType<typeof useGLBLoader>,
        { kind: 'ready' } | { kind: 'error' }
    >;
}) {
    const determinate =
        state.kind === 'parsing' ||
        (state.kind === 'loading' && state.determinate);
    const pct = determinate
        ? Math.min(100, Math.max(0, state.progress * 100))
        : 0;
    const status =
        state.kind === 'parsing' ? 'Parsing model' : 'Downloading model';
    return (
        <Html center zIndexRange={[100, 0]}>
            <div
                className="pointer-events-none w-64 rounded-xl border border-white/10 bg-slate-950/85 p-4 text-white backdrop-blur-2xl"
                style={{
                    boxShadow:
                        '0 0 0 1px rgba(34,211,238,0.15), 0 0 60px -10px rgba(34,211,238,0.3)',
                }}
            >
                <div className="flex items-center gap-2">
                    <span
                        className="inline-block h-2 w-2 animate-pulse rounded-full"
                        style={{
                            background: '#22d3ee',
                            boxShadow: '0 0 8px #22d3ee',
                        }}
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                        {status}
                    </span>
                </div>
                {determinate ? (
                    <>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="font-mono text-2xl font-semibold tabular-nums">
                                {pct.toFixed(0)}
                            </span>
                            <span className="font-mono text-xs text-white/40">
                                %
                            </span>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded bg-white/10">
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
                    </>
                ) : (
                    <>
                        <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                            {state.kind === 'loading'
                                ? formatBytes(state.loaded)
                                : '—'}
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded bg-white/10">
                            <div
                                className="h-full"
                                style={{
                                    width: '100%',
                                    background:
                                        'repeating-linear-gradient(45deg, #22d3ee 0 8px, #67e8f9 8px 16px)',
                                    backgroundSize: '32px 100%',
                                    animation:
                                        'tour-loader-stripe 1s linear infinite',
                                    boxShadow: '0 0 8px #22d3ee',
                                }}
                            />
                        </div>
                    </>
                )}
                {state.kind === 'loading' && state.determinate && (
                    <div className="mt-2 font-mono text-[10px] text-white/40">
                        {formatBytes(state.loaded)} /{' '}
                        {formatBytes(state.total)}
                    </div>
                )}
            </div>
        </Html>
    );
}

function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function usePrefersReducedMotion(): boolean {
    const matches = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);
    return matches;
}

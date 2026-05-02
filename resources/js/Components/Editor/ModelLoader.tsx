import { Html } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLBLoader } from './useGLBLoader';

export function ModelLoader({
    url,
    expectedSize,
    onClick,
    onReady,
}: {
    url: string;
    expectedSize?: number | null;
    onClick?: (point: THREE.Vector3, normal: THREE.Vector3 | null) => void;
    onReady?: (boundingBox: THREE.Box3) => void;
}) {
    const state = useGLBLoader(url, expectedSize);

    const scene = state.kind === 'ready' ? state.scene : null;

    useEffect(() => {
        if (!scene) return;
        // Architectural models often ship with single-sided wall materials
        // (looks fine from outside, invisible from inside). Forcing
        // DoubleSide makes interior waypoints actually see the walls.
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

        const box = new THREE.Box3().setFromObject(scene);
        onReady?.(box);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene]);

    if (state.kind === 'error') {
        // Bubble up to the SceneErrorBoundary.
        throw new Error(state.message);
    }

    if (state.kind !== 'ready') {
        return <EditorLoadingOverlay state={state} url={url} />;
    }

    return (
        <primitive
            object={state.scene}
            onClick={(e: ThreeEvent<MouseEvent>) => {
                if (!onClick) return;
                e.stopPropagation();
                let worldNormal: THREE.Vector3 | null = null;
                if (e.face?.normal && e.object) {
                    worldNormal = e.face.normal
                        .clone()
                        .transformDirection(e.object.matrixWorld);
                }
                onClick(e.point.clone(), worldNormal);
            }}
        />
    );
}

function EditorLoadingOverlay({
    state,
    url,
}: {
    state: Exclude<
        ReturnType<typeof useGLBLoader>,
        { kind: 'ready' } | { kind: 'error' }
    >;
    url: string;
}) {
    const filename = useMemo(() => {
        try {
            const u = new URL(url, window.location.href);
            return u.pathname.split('/').pop() || url;
        } catch {
            return url;
        }
    }, [url]);

    const determinate =
        state.kind === 'parsing' ||
        (state.kind === 'loading' && state.determinate);

    const pct = determinate
        ? Math.min(100, Math.max(0, state.progress * 100))
        : 0;

    const status =
        state.kind === 'parsing'
            ? 'Parsing model'
            : state.kind === 'loading' && state.determinate
              ? 'Downloading model'
              : 'Downloading model';

    return (
        <Html center zIndexRange={[100, 0]}>
            <div
                className="pointer-events-none w-72 rounded-xl border border-white/10 bg-slate-950/85 p-5 text-white backdrop-blur-2xl"
                style={{
                    boxShadow:
                        '0 0 0 1px rgba(34,211,238,0.15), 0 30px 60px -20px rgba(0,0,0,0.6), 0 0 80px -20px rgba(34,211,238,0.3)',
                }}
            >
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
                            boxShadow: '0 0 8px #22d3ee, 0 0 4px #22d3ee',
                        }}
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                        {status}
                    </span>
                </div>

                {determinate ? (
                    <>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="font-mono text-3xl font-semibold tabular-nums">
                                {pct.toFixed(0)}
                            </span>
                            <span className="font-mono text-xs text-white/40">
                                %
                            </span>
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
                    </>
                ) : (
                    <>
                        <div className="mt-3 font-mono text-3xl font-semibold tabular-nums">
                            {state.kind === 'loading'
                                ? formatBytes(state.loaded)
                                : '—'}
                        </div>
                        <IndeterminateBar />
                    </>
                )}

                {state.kind === 'loading' && state.determinate && (
                    <div className="mt-2 font-mono text-[10px] text-white/40">
                        {formatBytes(state.loaded)} /{' '}
                        {formatBytes(state.total)}
                    </div>
                )}

                {filename && (
                    <div
                        className="mt-3 truncate font-mono text-[10px] text-white/40"
                        title={filename}
                    >
                        {filename}
                    </div>
                )}
            </div>
        </Html>
    );
}

/**
 * Animated barber-pole stripe used when we have no Content-Length.
 * Shows that work is happening without lying about percentage.
 */
function IndeterminateBar() {
    return (
        <div className="mt-3 h-1 overflow-hidden rounded bg-white/10">
            <div
                className="h-full"
                style={{
                    width: '100%',
                    background:
                        'repeating-linear-gradient(45deg, #22d3ee 0 8px, #67e8f9 8px 16px)',
                    backgroundSize: '32px 100%',
                    animation: 'tour-loader-stripe 1s linear infinite',
                    boxShadow: '0 0 8px #22d3ee',
                }}
            />
        </div>
    );
}

function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

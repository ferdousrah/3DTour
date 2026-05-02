import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type GLBLoadState =
    | {
          kind: 'loading';
          progress: number;
          loaded: number;
          total: number;
          determinate: boolean;
      }
    | { kind: 'parsing'; progress: number }
    | { kind: 'ready'; scene: THREE.Group }
    | { kind: 'error'; message: string };

/**
 * Stream the GLB ourselves so we can show byte-level progress.
 *
 * Why not `useGLTF` + `useProgress`: drei's progress hook is item-based
 * (1 file = 0% → 100% jump) and even three's own `onProgress` only fires
 * when `Content-Length` is set. Production proxies (FrankenPHP, Cloudflare
 * with brotli) often strip that header, so the bar would sit at 0% for the
 * entire download. Reading the response body via `getReader()` gives us real
 * byte progress regardless.
 */
export function useGLBLoader(url: string): GLBLoadState {
    const [state, setState] = useState<GLBLoadState>({
        kind: 'loading',
        progress: 0,
        loaded: 0,
        total: 0,
        determinate: false,
    });

    useEffect(() => {
        let cancelled = false;
        let fakeTimer: number | null = null;

        const run = async () => {
            try {
                const res = await fetch(url, { credentials: 'same-origin' });
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status} ${res.statusText}`);
                }

                const totalHeader = res.headers.get('content-length');
                const total = totalHeader ? parseInt(totalHeader, 10) : 0;
                const determinate = total > 0;

                const reader = res.body?.getReader();
                if (!reader) {
                    // Fallback: no streaming, just buffer the whole thing.
                    const buf = await res.arrayBuffer();
                    if (cancelled) return;
                    parse(buf);
                    return;
                }

                // Without Content-Length we tween a fake bar up to 90% so the
                // user sees something happening. Real bytes still drive it
                // when we know the total.
                let fakeProgress = 0;
                if (!determinate) {
                    fakeTimer = window.setInterval(() => {
                        if (cancelled) return;
                        fakeProgress = Math.min(0.9, fakeProgress + 0.025);
                        setState((s) =>
                            s.kind === 'loading'
                                ? {
                                      ...s,
                                      progress: fakeProgress,
                                  }
                                : s,
                        );
                    }, 250);
                }

                const chunks: Uint8Array[] = [];
                let loaded = 0;

                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const { done, value } = await reader.read();
                    if (cancelled) {
                        reader.cancel().catch(() => {});
                        return;
                    }
                    if (done) break;
                    if (value) {
                        chunks.push(value);
                        loaded += value.byteLength;
                        if (determinate) {
                            setState({
                                kind: 'loading',
                                progress: loaded / total,
                                loaded,
                                total,
                                determinate: true,
                            });
                        } else {
                            setState((s) =>
                                s.kind === 'loading'
                                    ? { ...s, loaded }
                                    : s,
                            );
                        }
                    }
                }

                if (fakeTimer) {
                    window.clearInterval(fakeTimer);
                    fakeTimer = null;
                }
                if (cancelled) return;

                // Concatenate chunks into one ArrayBuffer for GLTFLoader.parse.
                const merged = new Uint8Array(loaded);
                let offset = 0;
                for (const c of chunks) {
                    merged.set(c, offset);
                    offset += c.byteLength;
                }

                setState({ kind: 'parsing', progress: 0.97 });
                parse(merged.buffer);
            } catch (err) {
                if (cancelled) return;
                setState({
                    kind: 'error',
                    message: (err as Error).message || 'Failed to load model',
                });
            }
        };

        const parse = (buf: ArrayBuffer) => {
            const loader = new GLTFLoader();
            // resourcePath lets the loader resolve any external textures
            // referenced by name (rare for GLB but harmless).
            const resourcePath = new URL(url, window.location.href).href;
            loader.parse(
                buf,
                resourcePath,
                (gltf) => {
                    if (cancelled) return;
                    setState({ kind: 'ready', scene: gltf.scene });
                },
                (err) => {
                    if (cancelled) return;
                    const message =
                        err &&
                        typeof err === 'object' &&
                        'message' in err &&
                        typeof (err as { message: unknown }).message === 'string'
                            ? (err as { message: string }).message
                            : 'Failed to parse GLB / glTF';
                    setState({ kind: 'error', message });
                },
            );
        };

        run();

        return () => {
            cancelled = true;
            if (fakeTimer) window.clearInterval(fakeTimer);
        };
    }, [url]);

    return state;
}

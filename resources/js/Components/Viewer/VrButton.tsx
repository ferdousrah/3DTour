import { useEffect, useState } from 'react';

/**
 * WebXR entry button. Renders a styled button that requests an immersive-vr
 * session from the browser's `navigator.xr`. Only shown when:
 *   - `navigator.xr` exists (browser supports the WebXR Device API)
 *   - The runtime reports `immersive-vr` is supported (a headset is reachable)
 *
 * The actual WebXR session is plumbed into Three.js via `gl.xr.setSession`,
 * which we expose by stashing the renderer on `window.__tourGl` from the
 * Canvas's `onCreated`. (Tour-platform-internal global; not for general use.)
 */
declare global {
    interface Window {
        __tourGl?: { xr: { setSession: (s: XRSession | null) => Promise<void> } };
    }
}

export function VrButton() {
    const [supported, setSupported] = useState(false);
    const [presenting, setPresenting] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (typeof navigator === 'undefined') return;
        const xr = (navigator as unknown as { xr?: XRSystem }).xr;
        if (!xr) return;
        xr.isSessionSupported('immersive-vr')
            .then((s) => setSupported(s))
            .catch(() => setSupported(false));
    }, []);

    if (!supported) return null;

    const enter = async () => {
        if (busy || presenting) return;
        setBusy(true);
        try {
            const xr = (navigator as unknown as { xr: XRSystem }).xr;
            const session = await xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
            });
            session.addEventListener('end', () => setPresenting(false));
            await window.__tourGl?.xr.setSession(session);
            setPresenting(true);
        } catch (err) {
            console.error('Failed to start VR session:', err);
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            onClick={enter}
            disabled={busy || presenting}
            title={presenting ? 'In VR — remove headset to exit' : 'Enter VR'}
            className="flex items-center gap-1.5 rounded-md border border-violet-400/50 bg-violet-500/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-violet-100 backdrop-blur transition hover:bg-violet-500/25 disabled:opacity-60"
            style={{
                boxShadow: '0 0 16px rgba(167,139,250,0.35)',
            }}
        >
            <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
            >
                <path d="M2 8h20v8H2z" />
                <circle cx="7" cy="12" r="1.5" fill="currentColor" />
                <circle cx="17" cy="12" r="1.5" fill="currentColor" />
            </svg>
            {presenting ? 'In VR' : 'Enter VR'}
        </button>
    );
}

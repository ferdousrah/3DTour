import { useCallback, useEffect, useRef } from 'react';

declare global {
    interface Window {
        axios: import('axios').AxiosStatic;
    }
}

/**
 * Cookieless analytics tracking + iframe postMessage API.
 *
 * - Posts /view to start a session, then sendBeacon /view/end on unload
 *   (per FR-100; sendBeacon ensures delivery even when the tab is closing).
 * - Buffers waypoint/hotspot events locally; flushed in /view/end.
 * - When `embed=true` (FR-110), also emits postMessage events to the parent
 *   frame: `{type:'waypoint',id,label}` and `{type:'hotspot',id,title}`,
 *   and listens for `{action:'goto_waypoint',id}` from the host (FR-111).
 */
export function useViewerTracking({
    slug,
    embed,
    onGotoWaypoint,
}: {
    slug: string;
    embed: boolean;
    onGotoWaypoint?: (waypointId: number) => void;
}) {
    const sessionRef = useRef<string | null>(null);
    const startedAt = useRef<number>(performance.now());
    const waypointsRef = useRef<number[]>([]);
    const hotspotsRef = useRef<number[]>([]);
    const sentRef = useRef(false);

    /** Send the end-of-session payload reliably via sendBeacon. */
    const sendEnd = useCallback(() => {
        if (sentRef.current || !sessionRef.current) return;
        sentRef.current = true;
        const payload = JSON.stringify({
            session_id: sessionRef.current,
            duration: Math.round(
                (performance.now() - startedAt.current) / 1000,
            ),
            waypoints_visited: waypointsRef.current,
            hotspots_opened: hotspotsRef.current,
        });
        const blob = new Blob([payload], { type: 'application/json' });
        try {
            navigator.sendBeacon(`/api/public/tours/${slug}/view/end`, blob);
        } catch {
            /* sendBeacon refused — best-effort fallback to fetch keepalive */
            void fetch(`/api/public/tours/${slug}/view/end`, {
                method: 'POST',
                body: payload,
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
            }).catch(() => {});
        }
    }, [slug]);

    useEffect(() => {
        // Start session.
        window.axios
            .post<{ session_id: string }>(`/api/public/tours/${slug}/view`)
            .then((r) => {
                sessionRef.current = r.data.session_id;
            })
            .catch(() => {
                /* ingest is best-effort — don't surface to user */
            });

        const onVisibility = () => {
            if (document.visibilityState === 'hidden') sendEnd();
        };
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pagehide', sendEnd);

        // postMessage inbound — only set up when embedded.
        let onMessage: ((e: MessageEvent) => void) | null = null;
        if (embed && onGotoWaypoint) {
            onMessage = (e: MessageEvent) => {
                const data = e.data;
                if (!data || typeof data !== 'object') return;
                if (data.action === 'goto_waypoint' && typeof data.id === 'number') {
                    onGotoWaypoint(data.id);
                }
            };
            window.addEventListener('message', onMessage);
        }

        return () => {
            sendEnd();
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pagehide', sendEnd);
            if (onMessage) window.removeEventListener('message', onMessage);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug, embed]);

    /** Resolve the parent frame's origin from document.referrer for postMessage. */
    const targetOrigin = (() => {
        if (!embed || typeof window === 'undefined') return '';
        try {
            return new URL(document.referrer).origin;
        } catch {
            return '*';
        }
    })();

    const recordWaypoint = useCallback(
        (id: number, label: string) => {
            if (!waypointsRef.current.includes(id)) {
                waypointsRef.current.push(id);
            }
            if (embed && window.parent !== window) {
                window.parent.postMessage(
                    { type: 'waypoint', id, label },
                    targetOrigin,
                );
            }
        },
        [embed, targetOrigin],
    );

    const recordHotspot = useCallback(
        (id: number, title: string) => {
            if (!hotspotsRef.current.includes(id)) {
                hotspotsRef.current.push(id);
            }
            if (embed && window.parent !== window) {
                window.parent.postMessage(
                    { type: 'hotspot', id, title },
                    targetOrigin,
                );
            }
        },
        [embed, targetOrigin],
    );

    return { recordWaypoint, recordHotspot };
}

import { useState } from 'react';
import { ViewerTour } from './types';

export function TopBar({
    tour,
    embed,
    onFullscreen,
    autoTourEnabled,
    onToggleAutoTour,
    canAutoTour,
}: {
    tour: ViewerTour;
    embed: boolean;
    onFullscreen: () => void;
    autoTourEnabled: boolean;
    onToggleAutoTour: () => void;
    canAutoTour: boolean;
}) {
    const [shareOpen, setShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const url = typeof window !== 'undefined' ? window.location.href : '';

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unsupported */
        }
    };

    const nativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: tour.og_title,
                    text: tour.og_description ?? undefined,
                    url,
                });
            } catch {
                /* user cancelled */
            }
        } else {
            copyLink();
        }
    };

    return (
        <header
            className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/60 px-4 py-3 text-white backdrop-blur-xl"
            style={{
                boxShadow: '0 1px 0 0 rgba(34, 211, 238, 0.1)',
            }}
        >
            {/* Cyan scan line accent */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
                style={{
                    background:
                        'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)',
                }}
            />

            <div className="flex min-w-0 items-center gap-3">
                {tour.branding.logo_url ? (
                    <img
                        src={tour.branding.logo_url}
                        alt={tour.branding.company_name}
                        className="h-7 w-auto"
                    />
                ) : (
                    <div
                        aria-hidden
                        className="h-2 w-2 rounded-full bg-cyan-400"
                        style={{ boxShadow: '0 0 8px #22d3ee' }}
                    />
                )}
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold tracking-tight">
                        {tour.name}
                    </div>
                    {tour.client_name && (
                        <div className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                            {tour.client_name}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {canAutoTour && (
                    <button
                        type="button"
                        onClick={onToggleAutoTour}
                        title={
                            autoTourEnabled
                                ? 'Stop auto tour'
                                : 'Start auto tour'
                        }
                        className={`group flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition ${
                            autoTourEnabled
                                ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
                                : 'border-white/10 bg-white/5 text-white/80 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200'
                        }`}
                        style={
                            autoTourEnabled
                                ? {
                                      boxShadow: '0 0 16px rgba(251,191,36,0.4)',
                                  }
                                : undefined
                        }
                    >
                        {autoTourEnabled ? (
                            <>
                                <svg
                                    className="h-3 w-3"
                                    viewBox="0 0 12 12"
                                    fill="currentColor"
                                    aria-hidden
                                >
                                    <rect x="2" y="2" width="3" height="8" />
                                    <rect x="7" y="2" width="3" height="8" />
                                </svg>
                                Stop
                            </>
                        ) : (
                            <>
                                <svg
                                    className="h-3 w-3"
                                    viewBox="0 0 12 12"
                                    fill="currentColor"
                                    aria-hidden
                                >
                                    <path d="M2 1.5v9l8-4.5z" />
                                </svg>
                                Auto tour
                            </>
                        )}
                    </button>
                )}

                {!embed && (
                    <>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShareOpen((s) => !s)}
                                className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/80 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200"
                                aria-haspopup="menu"
                                aria-expanded={shareOpen}
                            >
                                Share
                            </button>
                            {shareOpen && (
                                <div
                                    className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-md border border-white/10 bg-slate-950/95 p-1 text-sm text-white/90 backdrop-blur-xl"
                                    onMouseLeave={() => setShareOpen(false)}
                                    style={{
                                        boxShadow:
                                            '0 0 0 1px rgba(34,211,238,0.15), 0 30px 60px -20px rgba(0,0,0,0.8)',
                                    }}
                                >
                                    <ShareItem onClick={copyLink}>
                                        {copied ? '✓ Copied' : 'Copy link'}
                                    </ShareItem>
                                    <ShareItem onClick={nativeShare}>
                                        Share via…
                                    </ShareItem>
                                    <div className="my-1 border-t border-white/5" />
                                    <ShareLink
                                        href={`https://wa.me/?text=${encodeURIComponent(url)}`}
                                    >
                                        WhatsApp
                                    </ShareLink>
                                    <ShareLink
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                                    >
                                        Facebook
                                    </ShareLink>
                                    <ShareLink
                                        href={`mailto:?subject=${encodeURIComponent(tour.og_title)}&body=${encodeURIComponent(url)}`}
                                    >
                                        Email
                                    </ShareLink>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onFullscreen}
                            title="Fullscreen"
                            aria-label="Toggle fullscreen"
                            className="rounded-md border border-white/10 bg-white/5 p-2 text-white/80 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4h6M4 4v6M20 20h-6M20 20v-6M20 4h-6M20 4v6M4 20h6M4 20v-6"
                                />
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </header>
    );
}

function ShareItem({
    onClick,
    children,
}: {
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="block w-full rounded px-2 py-1.5 text-left transition hover:bg-cyan-400/10 hover:text-cyan-200"
        >
            {children}
        </button>
    );
}

function ShareLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded px-2 py-1.5 transition hover:bg-cyan-400/10 hover:text-cyan-200"
        >
            {children}
        </a>
    );
}

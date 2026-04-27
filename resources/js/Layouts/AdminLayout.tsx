import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

type NavItem = {
    name: string;
    href: string;
    matches: string | string[];
    adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', matches: 'dashboard' },
    { name: 'Tours', href: '/admin/tours', matches: 'admin.tours.*' },
    { name: 'Media', href: '/admin/media', matches: 'admin.media.*' },
    { name: 'Users', href: '/admin/users', matches: 'admin.users.*', adminOnly: true },
    { name: 'Settings', href: '/admin/settings', matches: 'admin.settings.*', adminOnly: true },
];

export default function AdminLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const isAdmin = (user as { role?: string }).role === 'admin';
    const [mobileOpen, setMobileOpen] = useState(false);

    const visibleItems = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

    const isCurrent = (matches: string | string[]) => {
        try {
            // @ts-expect-error route() global type from Ziggy is loose
            return route().current(matches);
        } catch {
            return false;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <header
                className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 text-white backdrop-blur-xl"
                style={{ boxShadow: '0 1px 0 0 rgba(34, 211, 238, 0.15)' }}
            >
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
                    style={{
                        background:
                            'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)',
                    }}
                />
                <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            className="rounded-md p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
                            onClick={() => setMobileOpen((s) => !s)}
                            aria-label="Toggle navigation"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                        <Link
                            href="/"
                            className="flex items-center gap-2.5 transition hover:opacity-80"
                        >
                            <ApplicationLogo className="h-8 w-auto fill-current text-cyan-400" />
                            <div className="hidden sm:block">
                                <div className="text-sm font-semibold tracking-tight">
                                    3D Tour Platform
                                </div>
                                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300/60">
                                    Studio
                                </div>
                            </div>
                        </Link>
                    </div>

                    <Dropdown>
                        <Dropdown.Trigger>
                            <button
                                type="button"
                                className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:border-cyan-400/40 hover:bg-cyan-400/5 hover:text-white"
                            >
                                {user.name}
                                <span className="ms-2 rounded border border-cyan-400/40 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-cyan-200">
                                    {(user as { role?: string }).role}
                                </span>
                                <svg
                                    className="ms-2 h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content contentClasses="py-1 !bg-slate-950 border border-white/10">
                            <Dropdown.Link
                                href={route('profile.edit')}
                                className="!text-white/80 hover:!bg-white/5 hover:!text-white"
                            >
                                Profile
                            </Dropdown.Link>
                            <Dropdown.Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="!text-white/80 hover:!bg-white/5 hover:!text-white"
                            >
                                Log out
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={`${
                        mobileOpen ? 'block' : 'hidden'
                    } w-64 shrink-0 border-r border-white/10 bg-slate-950/95 text-white backdrop-blur-xl lg:block`}
                    style={{
                        boxShadow: 'inset -1px 0 0 0 rgba(34,211,238,0.1)',
                    }}
                >
                    <nav className="sticky top-16 space-y-0.5 p-3">
                        {visibleItems.map((item) => {
                            const active = isCurrent(item.matches);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`relative block rounded-md px-3 py-2 text-sm font-medium transition ${
                                        active
                                            ? 'bg-cyan-400/15 text-cyan-100'
                                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                                    style={
                                        active
                                            ? {
                                                  boxShadow:
                                                      'inset 0 0 0 1px rgba(34,211,238,0.3), 0 0 16px rgba(34,211,238,0.15)',
                                              }
                                            : undefined
                                    }
                                >
                                    {active && (
                                        <span
                                            aria-hidden
                                            className="absolute inset-y-2 left-0 w-0.5 rounded-r"
                                            style={{
                                                background: '#22d3ee',
                                                boxShadow: '0 0 8px #22d3ee',
                                            }}
                                        />
                                    )}
                                    <span className="ml-1.5">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main content — light by default; the editor overrides
                    locally with its own dark wrapper. */}
                <main className="min-w-0 flex-1">
                    {header && (
                        <div className="border-b border-gray-200 bg-white">
                            <div className="px-4 py-6 sm:px-6 lg:px-8">
                                {header}
                            </div>
                        </div>
                    )}
                    <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
                </main>
            </div>
        </div>
    );
}

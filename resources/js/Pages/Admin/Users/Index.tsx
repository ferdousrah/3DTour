import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type User = {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    tours_count: number;
    email_verified_at: string | null;
    created_at: string;
};

type Invitation = {
    id: number;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    expires_at: string;
    inviter: { name: string } | null;
};

const ROLE_BADGE: Record<User['role'], string> = {
    admin: 'border-rose-400/40 bg-rose-400/10 text-rose-200',
    editor: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
    viewer: 'border-white/15 bg-white/5 text-white/70',
};

export default function UsersIndex({
    users,
    invitations,
}: {
    users: User[];
    invitations: Invitation[];
}) {
    const page = usePage();
    const me = page.props.auth.user as { id: number };
    const pageErrors = (page.props.errors ?? {}) as Record<
        string,
        string | string[] | undefined
    >;

    const [inviteOpen, setInviteOpen] = useState(false);

    const onChangeRole = (user: User, role: User['role']) => {
        if (role === user.role) return;
        router.patch(
            route('admin.users.role', user.id),
            { role },
            { preserveScroll: true },
        );
    };

    const onDelete = (user: User) => {
        if (
            !confirm(
                `Remove ${user.name}? Their tours stay; the user is soft-deleted.`,
            )
        )
            return;
        router.delete(route('admin.users.destroy', user.id), {
            preserveScroll: true,
        });
    };

    const onResend = (inv: Invitation) => {
        router.post(
            route('invitations.resend', inv.id),
            {},
            { preserveScroll: true },
        );
    };

    const onRevoke = (inv: Invitation) => {
        if (!confirm(`Revoke invitation for ${inv.email}?`)) return;
        router.delete(route('invitations.destroy', inv.id), {
            preserveScroll: true,
        });
    };

    const flashError = pageErrors.role || pageErrors.user || pageErrors.email;

    return (
        <AdminLayout
            header={
                <div className="-mx-4 -my-6 border-b border-white/10 bg-slate-950 px-4 py-5 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                                Access
                            </div>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                                Users
                            </h1>
                        </div>
                        <button
                            type="button"
                            onClick={() => setInviteOpen(true)}
                            className="rounded-md border border-cyan-400/60 bg-cyan-400/15 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-400/25"
                            style={{
                                boxShadow: '0 0 16px rgba(34,211,238,0.25)',
                            }}
                        >
                            Invite user
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Users" />

            {flashError && (
                <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
                    {Array.isArray(flashError) ? flashError.join(' ') : flashError}
                </div>
            )}

            <section
                className="mb-6 rounded-xl border border-white/10 bg-slate-950 text-white"
                style={{
                    boxShadow: '0 0 0 1px rgba(34,211,238,0.08)',
                }}
            >
                <SectionHeader
                    title="Active users"
                    count={users.length}
                />
                {users.length === 0 ? (
                    <div className="px-4 py-8 text-center font-mono text-[11px] uppercase tracking-widest text-white/40">
                        No users yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3 text-right">
                                        Tours
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((u) => {
                                    const isMe = u.id === me.id;
                                    return (
                                        <tr
                                            key={u.id}
                                            className="hover:bg-white/5"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-white/90">
                                                    {u.name}
                                                </div>
                                                {isMe && (
                                                    <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-300/70">
                                                        You
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-white/60">
                                                {u.email}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) =>
                                                        onChangeRole(
                                                            u,
                                                            e.target
                                                                .value as User['role'],
                                                        )
                                                    }
                                                    className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-widest focus:ring-1 ${ROLE_BADGE[u.role]}`}
                                                >
                                                    <option
                                                        value="admin"
                                                        className="bg-slate-950"
                                                    >
                                                        admin
                                                    </option>
                                                    <option
                                                        value="editor"
                                                        className="bg-slate-950"
                                                    >
                                                        editor
                                                    </option>
                                                    <option
                                                        value="viewer"
                                                        className="bg-slate-950"
                                                    >
                                                        viewer
                                                    </option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono tabular-nums text-white/60">
                                                {u.tours_count}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onDelete(u)
                                                    }
                                                    disabled={isMe}
                                                    className="font-mono text-[10px] uppercase tracking-widest text-white/30 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-30"
                                                    title={
                                                        isMe
                                                            ? "You can't delete yourself"
                                                            : 'Remove user'
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section
                className="rounded-xl border border-white/10 bg-slate-950 text-white"
                style={{
                    boxShadow: '0 0 0 1px rgba(34,211,238,0.08)',
                }}
            >
                <SectionHeader
                    title="Pending invitations"
                    count={invitations.length}
                />
                {invitations.length === 0 ? (
                    <div className="px-4 py-8 text-center font-mono text-[11px] uppercase tracking-widest text-white/40">
                        No pending invitations
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                                <tr>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Expires</th>
                                    <th className="px-4 py-3">Invited by</th>
                                    <th className="px-4 py-3 text-right" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {invitations.map((inv) => (
                                    <tr
                                        key={inv.id}
                                        className="hover:bg-white/5"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs text-white/80">
                                            {inv.email}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${ROLE_BADGE[inv.role]}`}
                                            >
                                                {inv.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-white/60">
                                            {new Date(
                                                inv.expires_at,
                                            ).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-white/60">
                                            {inv.inviter?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => onResend(inv)}
                                                className="mr-3 font-mono text-[10px] uppercase tracking-widest text-cyan-300/80 hover:text-cyan-200"
                                            >
                                                Resend
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onRevoke(inv)}
                                                className="font-mono text-[10px] uppercase tracking-widest text-white/30 hover:text-rose-400"
                                            >
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <InviteModal
                open={inviteOpen}
                onClose={() => setInviteOpen(false)}
            />
        </AdminLayout>
    );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
    return (
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                {title}
            </span>
            <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/60">
                {String(count).padStart(2, '0')}
            </span>
        </div>
    );
}

function InviteModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        role: 'editor' as 'admin' | 'editor' | 'viewer',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('invitations.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <form
                onSubmit={submit}
                className="w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 text-white backdrop-blur-2xl"
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
                <div className="space-y-4 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                                Access
                            </div>
                            <h2 className="mt-1 text-lg font-semibold">
                                Invite user
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

                    <label className="block">
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300/60">
                            Email
                        </span>
                        <input
                            autoFocus
                            type="email"
                            required
                            value={data.email}
                            onChange={(e) =>
                                setData('email', e.target.value)
                            }
                            className="mt-1.5 block w-full rounded-md border-white/10 bg-white/5 text-sm text-white placeholder-white/30 focus:border-cyan-400/60 focus:ring-cyan-400/30"
                            placeholder="someone@example.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-rose-300">
                                {errors.email}
                            </p>
                        )}
                    </label>

                    <label className="block">
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300/60">
                            Role
                        </span>
                        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                            {(['admin', 'editor', 'viewer'] as const).map(
                                (r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setData('role', r)}
                                        className={`rounded-md border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition ${
                                            data.role === r
                                                ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100'
                                                : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ),
                            )}
                        </div>
                        {errors.role && (
                            <p className="mt-1 text-xs text-rose-300">
                                {errors.role}
                            </p>
                        )}
                    </label>

                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        A 72-hour single-use invite link is emailed.
                    </p>
                </div>

                <div className="flex justify-end gap-2 border-t border-white/5 bg-black/20 px-6 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-white/10 bg-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white/70 hover:bg-white/10"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md border border-cyan-400/60 bg-cyan-400/15 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
                        style={{
                            boxShadow: '0 0 16px rgba(34,211,238,0.3)',
                        }}
                    >
                        {processing ? 'Sending…' : 'Send invite'}
                    </button>
                </div>
            </form>
        </div>
    );
}

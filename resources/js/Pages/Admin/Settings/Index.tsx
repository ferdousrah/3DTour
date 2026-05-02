import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type Settings = {
    company_name: string;
    logo_url: string | null;
    favicon_url: string | null;
    primary_color: string;
    support_email: string | null;
    default_visibility: 'private' | 'unlisted' | 'public';
};

export default function SettingsIndex({ settings }: { settings: Settings }) {
    const { data, setData, post, processing, errors, recentlySuccessful } =
        useForm({
            company_name: settings.company_name,
            primary_color: settings.primary_color,
            support_email: settings.support_email ?? '',
            default_visibility: settings.default_visibility,
            logo: null as File | null,
            favicon: null as File | null,
            remove_logo: false as boolean,
            remove_favicon: false as boolean,
        });

    const [logoPreview, setLogoPreview] = useState<string | null>(
        settings.logo_url,
    );
    const [faviconPreview, setFaviconPreview] = useState<string | null>(
        settings.favicon_url,
    );

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setData((prev) => ({
                    ...prev,
                    logo: null,
                    favicon: null,
                    remove_logo: false,
                    remove_favicon: false,
                }));
            },
        });
    };

    return (
        <AdminLayout
            header={
                <div className="-mx-4 -my-6 border-b border-white/10 bg-slate-950 px-4 py-5 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                        Application
                    </div>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                        Branding & Settings
                    </h1>
                </div>
            }
        >
            <Head title="Branding & Settings" />

            {recentlySuccessful && (
                <div
                    className="mb-4 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-emerald-200"
                    style={{ boxShadow: '0 0 16px rgba(110,231,183,0.2)' }}
                >
                    ✓ Saved
                </div>
            )}

            <form
                onSubmit={submit}
                className="max-w-3xl space-y-8 rounded-xl border border-white/10 bg-slate-950 p-6 text-white"
                style={{
                    boxShadow:
                        '0 0 0 1px rgba(34,211,238,0.1), 0 30px 60px -20px rgba(0,0,0,0.5)',
                }}
            >
                {/* Company */}
                <Section title="Company">
                    <Field label="Company name" error={errors.company_name}>
                        <input
                            type="text"
                            value={data.company_name}
                            onChange={(e) =>
                                setData('company_name', e.target.value)
                            }
                            required
                            maxLength={150}
                            className="block w-full rounded-md border-white/10 bg-white/5 text-sm text-white placeholder-white/30 focus:border-cyan-400/60 focus:ring-cyan-400/30"
                        />
                    </Field>

                    <Field label="Support email" error={errors.support_email}>
                        <input
                            type="email"
                            value={data.support_email}
                            onChange={(e) =>
                                setData('support_email', e.target.value)
                            }
                            placeholder="support@example.com"
                            className="block w-full rounded-md border-white/10 bg-white/5 text-sm text-white placeholder-white/30 focus:border-cyan-400/60 focus:ring-cyan-400/30"
                        />
                    </Field>
                </Section>

                {/* Branding */}
                <Section title="Branding">
                    <Field label="Logo" error={errors.logo}>
                        <div className="flex items-start gap-4">
                            <div
                                className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/5"
                                style={{
                                    boxShadow:
                                        'inset 0 0 0 1px rgba(34,211,238,0.1)',
                                }}
                            >
                                {logoPreview ? (
                                    <img
                                        src={logoPreview}
                                        alt="Logo preview"
                                        className="max-h-full max-w-full"
                                    />
                                ) : (
                                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                                        No logo
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    type="file"
                                    accept=".png,.jpg,.jpeg,.webp,.svg"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] ?? null;
                                        setData('logo', f);
                                        setData('remove_logo', false);
                                        if (f) {
                                            const reader = new FileReader();
                                            reader.onload = () =>
                                                setLogoPreview(
                                                    reader.result as string,
                                                );
                                            reader.readAsDataURL(f);
                                        }
                                    }}
                                    className="block w-full text-xs text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-400/15 file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-widest file:text-cyan-100 hover:file:bg-cyan-400/25"
                                />
                                <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                                    PNG · JPG · WebP · SVG · Max 2 MB
                                </p>
                                {settings.logo_url && (
                                    <label className="flex items-center gap-2 text-xs text-white/70">
                                        <input
                                            type="checkbox"
                                            checked={data.remove_logo}
                                            onChange={(e) => {
                                                setData(
                                                    'remove_logo',
                                                    e.target.checked,
                                                );
                                                if (e.target.checked) {
                                                    setLogoPreview(null);
                                                    setData('logo', null);
                                                } else {
                                                    setLogoPreview(
                                                        settings.logo_url,
                                                    );
                                                }
                                            }}
                                            className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400/50"
                                        />
                                        Remove current logo
                                    </label>
                                )}
                            </div>
                        </div>
                    </Field>

                    <Field label="Favicon" error={errors.favicon}>
                        <div className="flex items-start gap-4">
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/5"
                            >
                                {faviconPreview ? (
                                    <img
                                        src={faviconPreview}
                                        alt="Favicon preview"
                                        className="max-h-full max-w-full"
                                    />
                                ) : (
                                    <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">
                                        ico
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    type="file"
                                    accept=".png,.ico,.svg"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] ?? null;
                                        setData('favicon', f);
                                        setData('remove_favicon', false);
                                        if (f) {
                                            const reader = new FileReader();
                                            reader.onload = () =>
                                                setFaviconPreview(
                                                    reader.result as string,
                                                );
                                            reader.readAsDataURL(f);
                                        }
                                    }}
                                    className="block w-full text-xs text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-400/15 file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-widest file:text-cyan-100 hover:file:bg-cyan-400/25"
                                />
                                <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                                    PNG · ICO · SVG · Max 512 KB
                                </p>
                                {settings.favicon_url && (
                                    <label className="flex items-center gap-2 text-xs text-white/70">
                                        <input
                                            type="checkbox"
                                            checked={data.remove_favicon}
                                            onChange={(e) => {
                                                setData(
                                                    'remove_favicon',
                                                    e.target.checked,
                                                );
                                                if (e.target.checked) {
                                                    setFaviconPreview(null);
                                                    setData('favicon', null);
                                                } else {
                                                    setFaviconPreview(
                                                        settings.favicon_url,
                                                    );
                                                }
                                            }}
                                            className="rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400/50"
                                        />
                                        Remove current favicon
                                    </label>
                                )}
                            </div>
                        </div>
                    </Field>

                    <Field label="Primary color" error={errors.primary_color}>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={data.primary_color}
                                onChange={(e) =>
                                    setData('primary_color', e.target.value)
                                }
                                className="h-10 w-20 cursor-pointer rounded-md border border-white/10 bg-transparent"
                            />
                            <input
                                type="text"
                                value={data.primary_color}
                                onChange={(e) =>
                                    setData('primary_color', e.target.value)
                                }
                                pattern="^#[0-9a-fA-F]{6}$"
                                maxLength={7}
                                className="block w-32 rounded-md border-white/10 bg-white/5 font-mono text-sm text-white focus:border-cyan-400/60 focus:ring-cyan-400/30"
                            />
                            <div
                                className="h-10 flex-1 rounded-md"
                                style={{
                                    background: `linear-gradient(90deg, ${data.primary_color}, transparent)`,
                                    boxShadow: `0 0 24px ${data.primary_color}66`,
                                }}
                            />
                        </div>
                    </Field>
                </Section>

                {/* Defaults */}
                <Section title="Defaults">
                    <Field
                        label="Default tour visibility"
                        error={errors.default_visibility}
                    >
                        <div className="grid grid-cols-3 gap-2">
                            {(['private', 'unlisted', 'public'] as const).map(
                                (v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() =>
                                            setData('default_visibility', v)
                                        }
                                        className={`rounded-md border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition ${
                                            data.default_visibility === v
                                                ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100'
                                                : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                                        }`}
                                    >
                                        {v}
                                    </button>
                                ),
                            )}
                        </div>
                    </Field>
                </Section>

                <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-5">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md border border-cyan-400/60 bg-cyan-400/15 px-5 py-2 font-mono text-[11px] uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-50"
                        style={{
                            boxShadow: '0 0 16px rgba(34,211,238,0.3)',
                        }}
                    >
                        {processing ? 'Saving…' : 'Save settings'}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
                {title}
            </div>
            <div className="space-y-4">{children}</div>
        </section>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300/60">
                {label}
            </span>
            <div className="mt-1.5">{children}</div>
            {error && (
                <p className="mt-1 text-xs text-rose-300">{error}</p>
            )}
        </label>
    );
}

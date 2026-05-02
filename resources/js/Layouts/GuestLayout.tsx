import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

type Branding = {
    company_name: string;
    logo_url: string | null;
    favicon_url: string | null;
    primary_color: string;
};

export default function Guest({ children }: PropsWithChildren) {
    const branding = (usePage().props.branding ?? {
        company_name: '3D Tour Platform',
        logo_url: null,
        favicon_url: null,
        primary_color: '#22d3ee',
    }) as Branding;

    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100 pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link
                    href="/"
                    className="flex flex-col items-center gap-2"
                >
                    {branding.logo_url ? (
                        <img
                            src={branding.logo_url}
                            alt={branding.company_name}
                            className="h-16 w-auto"
                        />
                    ) : (
                        <ApplicationLogo className="h-20 w-20 fill-current text-gray-500" />
                    )}
                    <span className="text-sm font-semibold text-gray-700">
                        {branding.company_name}
                    </span>
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}

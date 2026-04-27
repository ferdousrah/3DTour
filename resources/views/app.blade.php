<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ $ogMeta['title'] ?? config('app.name', 'Laravel') }}</title>

        @if (isset($ogMeta))
            @if ($ogMeta['noindex'] ?? false)
                <meta name="robots" content="noindex">
            @endif
            <meta name="description" content="{{ $ogMeta['description'] }}">
            <meta property="og:title" content="{{ $ogMeta['title'] }}">
            <meta property="og:description" content="{{ $ogMeta['description'] }}">
            @if ($ogMeta['image'])
                <meta property="og:image" content="{{ $ogMeta['image'] }}">
            @endif
            <meta property="og:url" content="{{ $ogMeta['url'] }}">
            <meta property="og:type" content="website">
            <meta name="twitter:card" content="summary_large_image">
        @endif

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>

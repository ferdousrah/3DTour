<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\HotspotController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\ModelUploadController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\SuggestController;
use App\Http\Controllers\Admin\TourController;
use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\Admin\WaypointController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Public\TourAnalyticsIngestController;
use App\Http\Controllers\Public\TourViewerController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Root: bounce straight to dashboard or login. We don't ship a marketing splash.
Route::get('/', function () {
    return redirect()->route(Auth::check() ? 'dashboard' : 'login');
})->name('home');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware('auth')->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::get('tours', [TourController::class, 'index'])->name('tours.index');
    Route::get('tours/create', [TourController::class, 'create'])->name('tours.create');
    Route::post('tours', [TourController::class, 'store'])->name('tours.store');
    Route::get('tours/{tour}/edit', [TourController::class, 'edit'])->name('tours.edit');
    Route::get('tours/{tour}/settings', [TourController::class, 'settings'])->name('tours.settings');
    Route::get('tours/{tour}/share', [TourController::class, 'share'])->name('tours.share');
    Route::get('tours/{tour}/analytics', [AnalyticsController::class, 'show'])->name('tours.analytics');
    Route::get('tours/{tour}/analytics.csv', [AnalyticsController::class, 'csv'])->name('tours.analytics.csv');
    Route::get('tours/{tour}/qrcode.svg', [TourController::class, 'qrcode'])->name('tours.qrcode');
    Route::patch('tours/{tour}', [TourController::class, 'update'])->name('tours.update');
    Route::delete('tours/{tour}', [TourController::class, 'destroy'])->name('tours.destroy');
    Route::post('tours/{tour}/duplicate', [TourController::class, 'duplicate'])->name('tours.duplicate');
    Route::post('tours/{tour}/publish', [TourController::class, 'publish'])->name('tours.publish');
    Route::post('tours/{tour}/unpublish', [TourController::class, 'unpublish'])->name('tours.unpublish');
    Route::get('tours/{tour}/editor', [TourController::class, 'editor'])->name('tours.editor');

    // AI suggestion endpoint — returns candidate waypoints + hotspots from
    // Gemini for the admin to review before committing.
    Route::post('tours/{tour}/suggest', [SuggestController::class, 'suggest'])
        ->name('tours.suggest');

    // FR-020 / FR-021 — 3D model upload + replace + remove
    Route::post('tours/{tour}/model', [ModelUploadController::class, 'store'])->name('tours.model.store');
    Route::delete('tours/{tour}/model', [ModelUploadController::class, 'destroy'])->name('tours.model.destroy');

    // FR-036 — set default camera for public viewer initial frame
    Route::post('tours/{tour}/default-camera', [TourController::class, 'setDefaultCamera'])
        ->name('tours.default-camera');

    // FR-040 / FR-050 — waypoint and hotspot CRUD called from the editor
    Route::post('tours/{tour}/waypoints', [WaypointController::class, 'store'])->name('waypoints.store');
    Route::post('tours/{tour}/waypoints/reorder', [WaypointController::class, 'reorder'])->name('waypoints.reorder');
    Route::patch('waypoints/{waypoint}', [WaypointController::class, 'update'])->name('waypoints.update');
    Route::delete('waypoints/{waypoint}', [WaypointController::class, 'destroy'])->name('waypoints.destroy');

    Route::post('tours/{tour}/hotspots', [HotspotController::class, 'store'])->name('hotspots.store');
    Route::patch('hotspots/{hotspot}', [HotspotController::class, 'update'])->name('hotspots.update');
    Route::delete('hotspots/{hotspot}', [HotspotController::class, 'destroy'])->name('hotspots.destroy');

    // FR-120 — application settings (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('settings', [SettingsController::class, 'edit'])->name('settings.edit');
        Route::post('settings', [SettingsController::class, 'update'])->name('settings.update');

        // FR-003 / FR-004 — user + invitation management
        Route::get('users', [UsersController::class, 'index'])->name('users.index');
        Route::patch('users/{user}/role', [UsersController::class, 'updateRole'])->name('users.role');
        Route::delete('users/{user}', [UsersController::class, 'destroy'])->name('users.destroy');
    });

    // FR-060 — media library (admin + editor)
    Route::get('media', [MediaController::class, 'index'])->name('media.index');
    Route::post('media', [MediaController::class, 'store'])->name('media.store');
    Route::delete('media/{medium}', [MediaController::class, 'destroy'])->name('media.destroy');
});

// Public viewer (FR-070 → FR-075). Slug-based routing, gated for visibility/expiry/password.
Route::get('/t/{slug}', [TourViewerController::class, 'show'])
    ->where('slug', '[a-z0-9-]{3,120}')
    ->middleware(\App\Http\Middleware\EmbedFrameAncestors::class)
    ->name('public.tour.show');
Route::post('/t/{slug}/unlock', [TourViewerController::class, 'unlock'])
    ->where('slug', '[a-z0-9-]{3,120}')
    ->name('public.tour.unlock');

// FR-100 — public analytics ingest. Cookieless, CSRF-exempt (see bootstrap/app.php).
Route::post('/api/public/tours/{slug}/view', [TourAnalyticsIngestController::class, 'start'])
    ->where('slug', '[a-z0-9-]{3,120}')
    ->name('public.tour.view.start');
Route::post('/api/public/tours/{slug}/view/end', [TourAnalyticsIngestController::class, 'end'])
    ->where('slug', '[a-z0-9-]{3,120}')
    ->name('public.tour.view.end');

require __DIR__.'/auth.php';

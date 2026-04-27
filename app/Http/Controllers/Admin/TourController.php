<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTourRequest;
use App\Http\Requests\UpdateTourRequest;
use App\Models\Tour;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TourController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Tour::class);

        $filters = $request->validate([
            'search'      => ['nullable', 'string', 'max:120'],
            'status'      => ['nullable', Rule::in(['draft', 'published', 'archived'])],
            'visibility'  => ['nullable', Rule::in(['private', 'unlisted', 'public'])],
            'client_name' => ['nullable', 'string', 'max:150'],
            'sort'        => ['nullable', Rule::in(['name', 'updated_at', 'created_at', 'view_count'])],
            'direction'   => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $sort      = $filters['sort'] ?? 'updated_at';
        $direction = $filters['direction'] ?? 'desc';

        $tours = Tour::query()
            ->when($filters['status'] ?? null,      fn ($q, $v) => $q->where('status', $v))
            ->when($filters['visibility'] ?? null,  fn ($q, $v) => $q->where('visibility', $v))
            ->when($filters['client_name'] ?? null, fn ($q, $v) => $q->where('client_name', 'like', "%{$v}%"))
            ->when($filters['search'] ?? null, function ($q, $term) {
                $q->where(function ($qq) use ($term) {
                    $qq->where('name', 'like', "%{$term}%")
                       ->orWhere('description', 'like', "%{$term}%")
                       ->orWhere('client_name', 'like', "%{$term}%");
                });
            })
            ->orderBy($sort, $direction)
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/Tours/Index', [
            'tours'   => $tours,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Tour::class);

        return Inertia::render('Admin/Tours/Create');
    }

    public function store(StoreTourRequest $request): RedirectResponse
    {
        $tour = Tour::create([
            ...$request->validated(),
            'created_by_user_id' => $request->user()->id,
            // public_slug auto-generated via Tour::booted creating hook
        ]);

        return redirect()
            ->route('admin.tours.editor', $tour)
            ->with('status', 'Tour created. Upload a 3D model to get started.');
    }

    public function edit(Tour $tour): Response
    {
        $this->authorize('update', $tour);

        return Inertia::render('Admin/Tours/Edit', [
            'tour' => $tour,
        ]);
    }

    public function update(UpdateTourRequest $request, Tour $tour): RedirectResponse
    {
        $oldSlug = $tour->custom_slug;
        $data = $request->validated();

        // FR-091 password: hash on write, clear via flag. Drop the raw fields.
        if ($request->boolean('clear_password')) {
            $data['password_hash'] = null;
        } elseif ($request->filled('password')) {
            $data['password_hash'] = \Illuminate\Support\Facades\Hash::make($request->string('password'));
        }
        unset($data['password'], $data['clear_password']);

        $tour->update($data);

        // FR-012/FR-081: slug change preserves old slug as redirect for 30 days.
        if ($request->filled('custom_slug') && $oldSlug && $oldSlug !== $tour->custom_slug) {
            \App\Models\SlugRedirect::create([
                'old_slug'   => $oldSlug,
                'tour_id'    => $tour->id,
                'expires_at' => now()->addDays(30),
                'created_at' => now(),
            ]);
        }

        // Redirect back to the page they came from when possible.
        return back()->with('status', 'Tour updated.');
    }

    public function destroy(Request $request, Tour $tour): RedirectResponse
    {
        $this->authorize('delete', $tour);

        // FR-013: require typing the tour name to confirm.
        $request->validate([
            'confirm_name' => ['required', 'string', Rule::in([$tour->name])],
        ], [
            'confirm_name.in' => 'The confirmation does not match the tour name.',
        ]);

        $tour->delete(); // cascades to waypoints/hotspots/views via FK ON DELETE CASCADE
                        // (soft-deletes the tour row; hard FK cascade hits when purge job
                        // force-deletes after 30 days — see Phase 2 work)

        return redirect()
            ->route('admin.tours.index')
            ->with('status', 'Tour moved to trash.');
    }

    public function duplicate(Tour $tour): RedirectResponse
    {
        $this->authorize('create', Tour::class);

        $copy = DB::transaction(function () use ($tour) {
            $copy = $tour->replicate(['public_slug', 'custom_slug', 'view_count', 'published_at']);
            $copy->name       = $tour->name . ' (Copy)';
            $copy->status     = 'draft';
            $copy->visibility = 'private';
            $copy->view_count = 0;
            // public_slug regenerated via Tour::booted creating hook
            $copy->save();

            // Copy waypoints
            foreach ($tour->waypoints()->get() as $w) {
                $copy->waypoints()->create($w->only(['label', 'position', 'look_at', 'display_order', 'transition_ms', 'thumbnail_url']));
            }

            // Copy hotspots + their media references (URL-only; media not cloned per FR-014)
            foreach ($tour->hotspots()->with('media')->get() as $h) {
                $newHotspot = $copy->hotspots()->create($h->only([
                    'title', 'description', 'position', 'normal', 'type',
                    'price_bdt', 'external_url', 'icon', 'color', 'display_order', 'is_visible',
                ]));
                foreach ($h->media as $m) {
                    $newHotspot->media()->create($m->only(['file_url', 'mime_type', 'alt_text', 'caption', 'display_order']));
                }
            }

            return $copy;
        });

        return redirect()
            ->route('admin.tours.edit', $copy)
            ->with('status', 'Tour duplicated.');
    }

    public function publish(Tour $tour): RedirectResponse
    {
        $this->authorize('publish', $tour);

        // FR-015: publish requires valid model + ≥1 waypoint + non-empty name.
        $errors = [];
        if (! $tour->model_url) {
            $errors[] = 'A 3D model is required before publishing.';
        }
        if ($tour->waypoints()->count() === 0) {
            $errors[] = 'At least one waypoint is required before publishing.';
        }
        if (trim((string) $tour->name) === '') {
            $errors[] = 'Tour name cannot be empty.';
        }

        if ($errors) {
            throw ValidationException::withMessages(['publish' => $errors]);
        }

        $tour->update([
            'status'       => 'published',
            'published_at' => $tour->published_at ?? now(),
        ]);

        return back()->with('status', 'Tour published.');
    }

    public function unpublish(Tour $tour): RedirectResponse
    {
        $this->authorize('publish', $tour);

        $tour->update(['status' => 'draft']);

        return back()->with('status', 'Tour unpublished.');
    }

    public function editor(Tour $tour): Response
    {
        $this->authorize('update', $tour);

        return Inertia::render('Admin/Tours/Editor', [
            'tour' => $tour->load(['waypoints', 'hotspots.media']),
        ]);
    }

    public function settings(Tour $tour): Response
    {
        $this->authorize('update', $tour);

        return Inertia::render('Admin/Tours/Settings', [
            'tour' => array_merge(
                $tour->only([
                    'id', 'name', 'public_slug', 'custom_slug', 'status',
                    'visibility', 'expires_at', 'allow_embed', 'embed_allowed_hosts',
                ]),
                ['has_password' => $tour->password_hash !== null],
            ),
        ]);
    }

    public function share(Tour $tour): Response
    {
        $this->authorize('update', $tour);

        return Inertia::render('Admin/Tours/Share', [
            'tour' => $tour->only([
                'id', 'name', 'public_slug', 'custom_slug', 'status', 'visibility', 'allow_embed',
            ]) + ['public_url' => $tour->public_url],
        ]);
    }

    public function qrcode(Tour $tour): \Illuminate\Http\Response
    {
        $this->authorize('update', $tour);

        $renderer = new \BaconQrCode\Renderer\ImageRenderer(
            new \BaconQrCode\Renderer\RendererStyle\RendererStyle(400, 1),
            new \BaconQrCode\Renderer\Image\SvgImageBackEnd(),
        );
        $writer = new \BaconQrCode\Writer($renderer);
        $svg = $writer->writeString($tour->public_url);

        return response($svg)
            ->header('Content-Type', 'image/svg+xml')
            ->header(
                'Content-Disposition',
                'inline; filename="' . $tour->public_slug . '-qr.svg"',
            );
    }

    public function setDefaultCamera(Request $request, Tour $tour): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $tour);

        $data = $request->validate([
            'position'   => ['required', 'array:x,y,z'],
            'position.*' => ['required', 'numeric'],
            'target'     => ['required', 'array:x,y,z'],
            'target.*'   => ['required', 'numeric'],
        ]);

        $tour->update(['default_camera' => $data]);

        return response()->json($tour->only(['id', 'default_camera']));
    }
}

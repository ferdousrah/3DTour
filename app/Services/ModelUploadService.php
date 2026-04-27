<?php

namespace App\Services;

use App\Models\Tour;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ModelUploadService
{
    public function __construct(private GltfValidator $validator) {}

    public const DISK = 'public';
    public const MAX_BYTES = 500 * 1024 * 1024; // 500 MB cap

    /**
     * Validate, store, and persist a GLB upload for a tour.
     *
     * Returns the updated Tour with model_url + model_metadata populated.
     * Replacing an existing model versions the old one to a `models/archive/` path
     * (FR-021: previous model retained 30 days).
     */
    public function store(Tour $tour, UploadedFile $file): Tour
    {
        if ($file->getSize() > self::MAX_BYTES) {
            throw new \RuntimeException(sprintf(
                'Model exceeds 500 MB cap (got %.1f MB).',
                $file->getSize() / (1024 * 1024),
            ));
        }

        // Validate + extract metadata. Throws on any structural failure.
        $metadata = $this->validator->validateAndExtract($file->getRealPath());

        // FR-021: archive the old model first.
        if ($tour->model_url) {
            $this->archive($tour);
        }

        // Preserve the source extension so the right loader picks it up.
        $ext = strtolower($file->getClientOriginalExtension()) === 'gltf' ? 'gltf' : 'glb';
        $diskPath = sprintf('tours/%d/models/%s.%s', $tour->id, Str::uuid(), $ext);
        Storage::disk(self::DISK)->putFileAs(
            dirname($diskPath),
            $file,
            basename($diskPath),
        );

        $tour->update([
            // Store as a path-relative URL so browsers resolve it against
            // whichever host the page was loaded from (127.0.0.1 vs localhost
            // vs custom domain). Avoids cross-origin fetch blocks in dev.
            'model_url'       => '/storage/' . $diskPath,
            'model_file_size' => $file->getSize(),
            'model_metadata'  => array_merge($metadata, [
                'storage_path' => $diskPath,
                'uploaded_at'  => now()->toIso8601String(),
            ]),
        ]);

        return $tour->fresh();
    }

    public function delete(Tour $tour): Tour
    {
        if ($tour->model_url) {
            $this->archive($tour);
        }

        $tour->update([
            'model_url'       => null,
            'model_file_size' => null,
            'model_metadata'  => null,
        ]);

        return $tour->fresh();
    }

    /**
     * Move the current model to an archive path, preserving the file for 30 days.
     * The actual purge is a Phase-2 scheduled job; for now archived files just
     * sit on disk under tours/{id}/models/archive/.
     */
    private function archive(Tour $tour): void
    {
        $currentPath = $tour->model_metadata['storage_path'] ?? null;
        if (! $currentPath) return;

        $disk = Storage::disk(self::DISK);
        if (! $disk->exists($currentPath)) return;

        $archivePath = sprintf(
            'tours/%d/models/archive/%s_%s',
            $tour->id,
            now()->format('Ymd_His'),
            basename($currentPath),
        );
        $disk->move($currentPath, $archivePath);
    }
}

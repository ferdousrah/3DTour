<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Services\ModelUploadService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ModelUploadController extends Controller
{
    public function __construct(private ModelUploadService $uploads) {}

    public function store(Request $request, Tour $tour): RedirectResponse
    {
        $this->authorize('update', $tour);

        $request->validate([
            // 512000 KB == 500 MB. We allow the broad MIME types because
            // browsers and OSes report glTF/GLB inconsistently; the extension
            // gate + GltfValidator enforce real format correctness.
            'model' => [
                'required', 'file',
                'mimetypes:model/gltf-binary,model/gltf+json,application/json,application/octet-stream,text/plain',
                'max:512000',
            ],
        ], [
            'model.max' => 'Model exceeds the 500 MB upload limit.',
        ]);

        $file = $request->file('model');
        $ext  = strtolower($file->getClientOriginalExtension());
        if (! $file->isValid() || ! in_array($ext, ['glb', 'gltf'], true)) {
            throw ValidationException::withMessages([
                'model' => 'Only .glb and .gltf files are accepted. .zip-bundled glTF + assets is planned.',
            ]);
        }

        try {
            $this->uploads->store($tour, $file);
        } catch (\RuntimeException $e) {
            throw ValidationException::withMessages(['model' => $e->getMessage()]);
        }

        return back()->with('status', 'Model uploaded successfully.');
    }

    public function destroy(Tour $tour): RedirectResponse
    {
        $this->authorize('update', $tour);

        $this->uploads->delete($tour);

        return back()->with('status', 'Model removed.');
    }
}

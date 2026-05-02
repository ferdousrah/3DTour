<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HotspotMedia;
use App\Models\MediaLibrary;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function index(Request $request): Response
    {
        $items = MediaLibrary::with('uploader:id,name')
            ->latest()
            ->paginate(48)
            ->withQueryString();

        return Inertia::render('Admin/Media/Index', [
            'items' => $items,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => [
                'required', 'file', 'image',
                'mimes:jpg,jpeg,png,webp,gif',
                'max:10240', // 10 MB per FR-060
            ],
        ], [
            'file.max' => 'File exceeds the 10 MB limit.',
        ]);

        $file = $request->file('file');
        $path = $file->store('media', 'public');
        $info = @getimagesize($file->getRealPath());

        MediaLibrary::create([
            'uploaded_by' => $request->user()->id,
            'file_name'   => $file->getClientOriginalName(),
            'file_url'    => '/storage/' . $path,
            'mime_type'   => $file->getMimeType() ?: 'image/octet-stream',
            'file_size'   => $file->getSize(),
            'width'       => $info[0] ?? null,
            'height'      => $info[1] ?? null,
        ]);

        return back()->with('status', 'Upload complete.');
    }

    public function destroy(MediaLibrary $medium): RedirectResponse
    {
        // FR-060: deletion blocked if referenced by any hotspot.
        $referenced = HotspotMedia::where('file_url', $medium->file_url)->exists();
        if ($referenced) {
            return back()->withErrors([
                'media' => 'Cannot delete — this file is in use by one or more hotspots.',
            ]);
        }

        // Remove the underlying file from disk.
        if (str_starts_with((string) $medium->file_url, '/storage/')) {
            $path = substr($medium->file_url, strlen('/storage/'));
            Storage::disk('public')->delete($path);
        }

        $medium->delete();

        return back()->with('status', 'Deleted.');
    }
}

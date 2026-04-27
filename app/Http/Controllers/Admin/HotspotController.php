<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\HotspotRequest;
use App\Models\Hotspot;
use App\Models\Tour;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HotspotController extends Controller
{
    public function store(HotspotRequest $request, Tour $tour): JsonResponse
    {
        $hotspot = $tour->hotspots()->create([
            ...$request->validated(),
            'display_order' => $request->integer('display_order', $tour->hotspots()->count()),
        ]);

        return response()->json($hotspot->load('media'), 201);
    }

    public function update(HotspotRequest $request, Hotspot $hotspot): JsonResponse
    {
        $hotspot->update($request->validated());
        return response()->json($hotspot->fresh()->load('media'));
    }

    public function destroy(Request $request, Hotspot $hotspot): JsonResponse
    {
        $request->user()->can('update', $hotspot->tour) ?: abort(403);
        $hotspot->delete();
        return response()->json(null, 204);
    }
}

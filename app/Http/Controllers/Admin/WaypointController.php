<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\WaypointRequest;
use App\Models\Tour;
use App\Models\Waypoint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WaypointController extends Controller
{
    public function store(WaypointRequest $request, Tour $tour): JsonResponse
    {
        $waypoint = $tour->waypoints()->create([
            ...$request->validated(),
            'display_order' => $request->integer('display_order', $tour->waypoints()->count()),
        ]);

        return response()->json($waypoint, 201);
    }

    public function update(WaypointRequest $request, Waypoint $waypoint): JsonResponse
    {
        $waypoint->update($request->validated());
        return response()->json($waypoint->fresh());
    }

    public function destroy(Request $request, Waypoint $waypoint): JsonResponse
    {
        $request->user()->can('update', $waypoint->tour) ?: abort(403);
        $waypoint->delete();
        return response()->json(null, 204);
    }

    public function reorder(Request $request, Tour $tour): JsonResponse
    {
        $request->user()->can('update', $tour) ?: abort(403);

        $data = $request->validate([
            'order'    => ['required', 'array'],
            'order.*'  => ['required', 'integer'],
        ]);

        DB::transaction(function () use ($tour, $data) {
            foreach ($data['order'] as $index => $waypointId) {
                $tour->waypoints()
                    ->whereKey($waypointId)
                    ->update(['display_order' => $index]);
            }
        });

        return response()->json($tour->waypoints()->get());
    }
}

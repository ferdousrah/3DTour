<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Services\AiWaypointSuggester;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class SuggestController extends Controller
{
    public function __construct(private AiWaypointSuggester $ai) {}

    public function suggest(Tour $tour): JsonResponse
    {
        $this->authorize('update', $tour);

        try {
            $result = $this->ai->suggest($tour);
            return response()->json($result);
        } catch (RuntimeException $e) {
            return response()->json(
                ['error' => $e->getMessage()],
                422,
            );
        }
    }
}

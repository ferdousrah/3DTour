<?php

namespace App\Services;

use App\Models\Tour;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class AiWaypointSuggester
{
    public const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    /** Cap how many named nodes we send to keep prompt size sane. */
    public const MAX_NODES = 200;

    public function __construct(private GltfValidator $validator) {}

    public function isAvailable(): bool
    {
        return ! empty($this->apiKey());
    }

    /**
     * Suggest waypoints + hotspots for a tour by sending its glTF metadata
     * to Gemini and asking for a structured tour proposal.
     *
     * @return array{
     *   waypoints: array,
     *   hotspots: array,
     *   axis_convention: string,
     *   context: array
     * }
     */
    public function suggest(Tour $tour): array
    {
        if (! $this->isAvailable()) {
            throw new RuntimeException(
                'GEMINI_API_KEY is not configured. Set it in your environment to enable AI suggestions.'
            );
        }

        $storagePath = $tour->model_metadata['storage_path'] ?? null;
        if (! $storagePath) {
            throw new RuntimeException('This tour has no 3D model uploaded yet.');
        }

        $diskPath = Storage::disk('public')->path($storagePath);
        if (! is_file($diskPath)) {
            throw new RuntimeException('Model file is missing from storage.');
        }

        $context = $this->validator->extractNodeTree($diskPath);

        // Truncate node list — even huge architectural models are usually
        // semantically described by their first 200 named nodes.
        $context['nodes'] = array_slice($context['nodes'], 0, self::MAX_NODES);

        $response = Http::timeout(60)
            ->post(self::ENDPOINT . '?key=' . $this->apiKey(), [
                'contents' => [
                    ['parts' => [['text' => $this->buildPrompt($context, $tour)]]],
                ],
                'generationConfig' => [
                    'temperature'        => 0.4,
                    'responseMimeType'   => 'application/json',
                    'responseSchema'     => $this->buildSchema(),
                ],
            ]);

        if (! $response->successful()) {
            $body = $response->body();
            // Surface Gemini's own error message if one was returned.
            $apiError = $response->json('error.message') ?? $body;
            throw new RuntimeException("Gemini API error: {$apiError}");
        }

        $text = $response->json('candidates.0.content.parts.0.text');
        if (! $text) {
            throw new RuntimeException('Gemini returned no content.');
        }

        $result = json_decode($text, true);
        if (! is_array($result)) {
            throw new RuntimeException('Could not parse Gemini response as JSON.');
        }

        return [
            'waypoints'       => $result['waypoints'] ?? [],
            'hotspots'        => $result['hotspots'] ?? [],
            'axis_convention' => $result['axis_convention'] ?? 'unknown',
            'context'         => [
                'mesh_count'       => $context['mesh_count'],
                'named_node_count' => $context['named_node_count'],
                'bounding_box'     => $context['bounding_box'],
            ],
        ];
    }

    private function apiKey(): ?string
    {
        return config('services.gemini.api_key');
    }

    private function buildPrompt(array $context, Tour $tour): string
    {
        $bbox = $context['bounding_box'];
        $nodes = $context['nodes'];

        $bboxText = $bbox
            ? sprintf(
                "min: [%.2f, %.2f, %.2f]\nmax: [%.2f, %.2f, %.2f]\nsize: [%.2f, %.2f, %.2f]",
                $bbox['min_x'], $bbox['min_y'], $bbox['min_z'],
                $bbox['max_x'], $bbox['max_y'], $bbox['max_z'],
                $bbox['max_x'] - $bbox['min_x'],
                $bbox['max_y'] - $bbox['min_y'],
                $bbox['max_z'] - $bbox['min_z'],
            )
            : 'unknown';

        $nodeLines = array_map(function ($n) {
            $pos = $n['position'];
            return sprintf(
                '  - %s%s @ [%.2f, %.2f, %.2f]',
                $n['name'],
                $n['has_mesh'] ? ' (mesh)' : '',
                $pos[0], $pos[1], $pos[2],
            );
        }, $nodes);
        $nodeList = implode("\n", $nodeLines) ?: '  (no named nodes — this model has no semantic info)';

        $tourInfo = $tour->client_name
            ? "Tour: \"{$tour->name}\" for client \"{$tour->client_name}\"."
            : "Tour: \"{$tour->name}\".";

        return <<<PROMPT
You are a 3D tour designer. You are given the metadata of an architectural / interior glTF model. Propose a virtual tour: 3–5 camera waypoints showing different rooms or vantage points, and 0–5 hotspots for noteworthy items.

{$tourInfo}

Bounding box (in the model's native units — could be meters or millimeters):
{$bboxText}

Named nodes (max 200 shown):
{$nodeList}

Total mesh count: {$context['mesh_count']}, of which {$context['named_node_count']} have meaningful names.

Rules:
1. Detect the axis convention. glTF default is Y-up. If the Y range is the smallest of the three axes, the model is likely Y-up. If Z range is small (~3–6 units for meters, ~3000–6000 for mm) and matches plausible building height, the model is likely Z-up.

2. **Use the actual node positions** above — they are real spatial centers of named meshes (computed from POSITION accessor AABB + parent transform), NOT placeholder zeros. Cluster nodes that are spatially close to identify rooms, then place each waypoint at one cluster centroid.

3. **Spread waypoints spatially.** No two waypoints should be within ~2 meters (or 2000 mm) of each other on the floor plane. If you can't find that many distinct clusters, return FEWER waypoints — 2 well-placed beats 5 stacked on top of each other.

4. Place waypoints at standing eye height. For Y-up: `position.y = min_y + 1.6`. For Z-up: `position.z = min_z + 1.6`. The other two axes come from the cluster centroid (not from min_x/min_z — those are wall corners).

5. `look_at` should be 1–2 units (1000–2000 mm) horizontally in front of the camera, at the same eye height — aim INTO the room, not at the nearest wall.

6. For hotspots, anchor each at a SPECIFIC named node's exact position from the list above (don't average or invent). `title` and `description` should reference the node's actual name.

7. Hotspot `type`:
   - "info" for architectural notes (e.g. "vaulted ceiling", "stained glass window")
   - "product" for furniture, decor, fixtures (sofa, lamp, table, cooktop)
   - "link" rare — only when the item warrants external reading

8. Be CONSERVATIVE. If named nodes are mostly generic, OR all node positions cluster within a few meters of each other (single-room model with no spatial diversity), return EMPTY arrays. The user can add manually. Better to suggest nothing than to stack 4 waypoints in one spot.

9. All positions are in the model's native coordinate space (same units AND origin as the bounding box and node positions above).

10. Each item must include a `reason` field — cite which named nodes informed the choice (e.g. "Centroid of Sofa_01, Lamp_02, Coffee_Table — likely the living area").

Return JSON matching the schema.
PROMPT;
    }

    /**
     * Schema enforced by Gemini's `responseSchema` — model literally cannot
     * return data that doesn't match this shape.
     */
    private function buildSchema(): array
    {
        $vec3 = [
            'type'       => 'object',
            'properties' => [
                'x' => ['type' => 'number'],
                'y' => ['type' => 'number'],
                'z' => ['type' => 'number'],
            ],
            'required'   => ['x', 'y', 'z'],
        ];

        return [
            'type'       => 'object',
            'properties' => [
                'axis_convention' => [
                    'type' => 'string',
                    'enum' => ['y_up', 'z_up', 'unknown'],
                ],
                'waypoints' => [
                    'type'  => 'array',
                    'items' => [
                        'type'       => 'object',
                        'properties' => [
                            'label'    => ['type' => 'string'],
                            'position' => $vec3,
                            'look_at'  => $vec3,
                            'reason'   => ['type' => 'string'],
                        ],
                        'required' => ['label', 'position', 'look_at', 'reason'],
                    ],
                ],
                'hotspots' => [
                    'type'  => 'array',
                    'items' => [
                        'type'       => 'object',
                        'properties' => [
                            'title'       => ['type' => 'string'],
                            'description' => ['type' => 'string'],
                            'position'    => $vec3,
                            'type'        => [
                                'type' => 'string',
                                'enum' => ['info', 'product', 'link'],
                            ],
                            'reason'      => ['type' => 'string'],
                        ],
                        'required' => ['title', 'description', 'position', 'type', 'reason'],
                    ],
                ],
            ],
            'required' => ['axis_convention', 'waypoints', 'hotspots'],
        ];
    }
}

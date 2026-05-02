<?php

namespace App\Services;

use RuntimeException;

class GltfValidator
{
    /** GLB magic number: ASCII "glTF" little-endian. */
    public const GLB_MAGIC = 0x46546C67;

    public const CHUNK_TYPE_JSON = 0x4E4F534A; // "JSON"
    public const CHUNK_TYPE_BIN  = 0x004E4942; // "BIN\0"

    /**
     * Validate a glTF/GLB file and extract metadata per FR-022.
     *
     * Auto-detects format by sniffing the magic bytes — GLB starts with `glTF`,
     * a plain glTF JSON starts with `{`. Both formats produce the same metadata
     * shape.
     *
     * @return array{
     *   gltf_version: string,
     *   mesh_count: int,
     *   material_count: int,
     *   texture_count: int,
     *   node_count: int,
     *   triangle_count: int,
     *   bounding_box: ?array{min_x:float,min_y:float,min_z:float,max_x:float,max_y:float,max_z:float}
     * }
     *
     * @throws RuntimeException on any validation failure.
     */
    public function validateAndExtract(string $path): array
    {
        $fp = @fopen($path, 'rb');
        if (! $fp) {
            throw new RuntimeException('Could not open file for validation.');
        }

        // Sniff the first 4 bytes to pick the parser.
        $sniff = fread($fp, 4);
        rewind($fp);

        try {
            $data = strlen($sniff) === 4 && unpack('V', $sniff)[1] === self::GLB_MAGIC
                ? $this->parseGlb($fp)
                : $this->parseGltfJson($fp);
        } finally {
            fclose($fp);
        }

        // FR-020: reject external URL references in images/buffers. Embedded
        // `data:` URIs are fine (self-contained). For .gltf with relative URI
        // refs, we'd need a sibling-file walk — defer to .zip support.
        foreach (['images', 'buffers'] as $kind) {
            foreach (($data[$kind] ?? []) as $entry) {
                $uri = $entry['uri'] ?? null;
                if ($uri === null) continue;
                if (preg_match('#^https?://#i', $uri)) {
                    throw new RuntimeException("External URL reference in {$kind} not allowed.");
                }
                if (! str_starts_with($uri, 'data:')) {
                    throw new RuntimeException(
                        "Relative-path reference in {$kind} ({$uri}) needs assets bundled. "
                        . 'Re-export as .glb (binary, all-in-one) or upload a .zip when supported.'
                    );
                }
            }
        }

        return [
            'gltf_version'   => $data['asset']['version'] ?? '2.0',
            'mesh_count'     => count($data['meshes'] ?? []),
            'material_count' => count($data['materials'] ?? []),
            'texture_count'  => count($data['textures'] ?? []),
            'node_count'     => count($data['nodes'] ?? []),
            'triangle_count' => $this->countTriangles($data),
            'bounding_box'   => $this->computeBoundingBox($data),
        ];
    }

    /**
     * Extract a flattened list of named nodes with world-space positions, plus
     * the model bounding box. Used as input to the AI suggestion flow — gives
     * an LLM enough context to propose waypoints/hotspots without sending the
     * entire mesh data.
     *
     * @return array{
     *   bounding_box: ?array<string,float>,
     *   nodes: array<int, array{name:string, position:array{0:float,1:float,2:float}, has_mesh:bool}>,
     *   mesh_count: int,
     *   named_node_count: int
     * }
     */
    public function extractNodeTree(string $path): array
    {
        $fp = @fopen($path, 'rb');
        if (! $fp) {
            throw new RuntimeException('Could not open file for node-tree extraction.');
        }

        $sniff = fread($fp, 4);
        rewind($fp);

        try {
            $data = strlen($sniff) === 4 && unpack('V', $sniff)[1] === self::GLB_MAGIC
                ? $this->parseGlb($fp)
                : $this->parseGltfJson($fp);
        } finally {
            fclose($fp);
        }

        $nodes = [];
        $sceneIdx = $data['scene'] ?? 0;
        $rootNodes = $data['scenes'][$sceneIdx]['nodes'] ?? [];

        foreach ($rootNodes as $rootIdx) {
            $this->walkNode($data, (int) $rootIdx, [0.0, 0.0, 0.0], $nodes);
        }

        // Drop generic auto-generated names that pollute the LLM input.
        $genericPattern = '/^(Object|Cube|Plane|Sphere|Cylinder|Mesh|Node|Group|Scene|Empty)[._]?\d*$/i';
        $named = array_values(array_filter($nodes, function ($n) use ($genericPattern) {
            $name = trim((string) ($n['name'] ?? ''));
            return $name !== '' && ! preg_match($genericPattern, $name);
        }));

        return [
            'bounding_box'     => $this->computeBoundingBox($data),
            'nodes'            => $named,
            'mesh_count'       => count($data['meshes'] ?? []),
            'named_node_count' => count($named),
        ];
    }

    /**
     * Recursively walk the glTF node hierarchy, accumulating translation only
     * (rotation/scale ignored — we only need rough world positions for the
     * LLM's mental map). Each named node is appended to $out.
     */
    private function walkNode(array $gltf, int $idx, array $parentPos, array &$out): void
    {
        $node = $gltf['nodes'][$idx] ?? null;
        if (! $node) return;

        $local = $node['translation'] ?? [0.0, 0.0, 0.0];
        $world = [
            $parentPos[0] + (float) ($local[0] ?? 0),
            $parentPos[1] + (float) ($local[1] ?? 0),
            $parentPos[2] + (float) ($local[2] ?? 0),
        ];

        $name = $node['name'] ?? null;
        if ($name) {
            $out[] = [
                'name'     => $name,
                'position' => $world,
                'has_mesh' => isset($node['mesh']),
            ];
        }

        foreach (($node['children'] ?? []) as $childIdx) {
            $this->walkNode($gltf, (int) $childIdx, $world, $out);
        }
    }

    /**
     * Parse a GLB binary stream. Reads the 12-byte header + first JSON chunk.
     *
     * @param resource $fp
     */
    private function parseGlb($fp): array
    {
        // Header: 12 bytes — magic (u32), version (u32), total length (u32).
        $headerBin = fread($fp, 12);
        if (strlen($headerBin) !== 12) {
            throw new RuntimeException('File too small to be a GLB.');
        }
        $header = unpack('Vmagic/Vversion/Vlength', $headerBin);
        if ($header['magic'] !== self::GLB_MAGIC) {
            throw new RuntimeException('Invalid GLB magic — file is not a glTF binary.');
        }
        if ($header['version'] !== 2) {
            throw new RuntimeException("Unsupported glTF version {$header['version']} (expected 2).");
        }

        // First chunk MUST be JSON per glTF 2.0 spec.
        $chunkHeaderBin = fread($fp, 8);
        if (strlen($chunkHeaderBin) !== 8) {
            throw new RuntimeException('Truncated GLB: missing JSON chunk header.');
        }
        $chunkHeader = unpack('VchunkLength/VchunkType', $chunkHeaderBin);
        if ($chunkHeader['chunkType'] !== self::CHUNK_TYPE_JSON) {
            throw new RuntimeException('First chunk must be JSON per glTF 2.0 spec.');
        }

        $jsonBin = fread($fp, $chunkHeader['chunkLength']);
        if (strlen($jsonBin) !== $chunkHeader['chunkLength']) {
            throw new RuntimeException('Truncated JSON chunk.');
        }

        $data = json_decode(rtrim($jsonBin), true);
        if (! is_array($data)) {
            throw new RuntimeException('GLB JSON chunk is not parseable.');
        }
        return $data;
    }

    /**
     * Parse a plain .gltf JSON file.
     *
     * @param resource $fp
     */
    private function parseGltfJson($fp): array
    {
        $contents = stream_get_contents($fp);
        if ($contents === false || $contents === '') {
            throw new RuntimeException('Could not read .gltf file.');
        }

        $data = json_decode($contents, true);
        if (! is_array($data)) {
            throw new RuntimeException('Invalid .gltf JSON: ' . (json_last_error_msg() ?: 'unknown'));
        }
        if (! isset($data['asset']['version'])) {
            throw new RuntimeException('Missing required asset.version field — not a valid glTF.');
        }
        if (! str_starts_with((string) $data['asset']['version'], '2.')) {
            throw new RuntimeException("Unsupported glTF version {$data['asset']['version']} (expected 2.x).");
        }
        return $data;
    }

    /**
     * Sum of `accessor.count / 3` over each primitive's `indices`. Approximate —
     * doesn't account for primitive.mode (assumes TRIANGLES) but good enough
     * for the "rough size" UI signal in FR-022.
     */
    private function countTriangles(array $gltf): int
    {
        $accessors = $gltf['accessors'] ?? [];
        $tris = 0;

        foreach ($gltf['meshes'] ?? [] as $mesh) {
            foreach ($mesh['primitives'] ?? [] as $prim) {
                if (isset($prim['indices'], $accessors[$prim['indices']]['count'])) {
                    $tris += (int) ($accessors[$prim['indices']]['count'] / 3);
                } elseif (isset($prim['attributes']['POSITION'], $accessors[$prim['attributes']['POSITION']]['count'])) {
                    // Non-indexed: every 3 positions = 1 triangle.
                    $tris += (int) ($accessors[$prim['attributes']['POSITION']]['count'] / 3);
                }
            }
        }

        return $tris;
    }

    /**
     * Union of POSITION accessor min/max across all primitives. This is a
     * mesh-local AABB — node transforms are not applied. Sufficient for the
     * editor's "auto-frame to model" use case.
     */
    private function computeBoundingBox(array $gltf): ?array
    {
        $accessors = $gltf['accessors'] ?? [];
        $minX = $minY = $minZ = INF;
        $maxX = $maxY = $maxZ = -INF;

        foreach ($gltf['meshes'] ?? [] as $mesh) {
            foreach ($mesh['primitives'] ?? [] as $prim) {
                $idx = $prim['attributes']['POSITION'] ?? null;
                if ($idx === null) continue;

                $acc = $accessors[$idx] ?? null;
                if (! $acc || ! isset($acc['min'], $acc['max'])) continue;
                if (count($acc['min']) !== 3 || count($acc['max']) !== 3) continue;

                $minX = min($minX, (float) $acc['min'][0]);
                $minY = min($minY, (float) $acc['min'][1]);
                $minZ = min($minZ, (float) $acc['min'][2]);
                $maxX = max($maxX, (float) $acc['max'][0]);
                $maxY = max($maxY, (float) $acc['max'][1]);
                $maxZ = max($maxZ, (float) $acc['max'][2]);
            }
        }

        if ($minX === INF) {
            return null;
        }

        return [
            'min_x' => $minX, 'min_y' => $minY, 'min_z' => $minZ,
            'max_x' => $maxX, 'max_y' => $maxY, 'max_z' => $maxZ,
        ];
    }
}

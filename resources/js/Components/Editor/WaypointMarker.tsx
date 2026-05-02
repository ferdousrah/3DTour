import { Html, TransformControls } from '@react-three/drei';
import { useState } from 'react';
import * as THREE from 'three';
import { Vec3, Waypoint } from './types';

export function WaypointMarker({
    waypoint,
    index,
    selected,
    editable,
    onClick,
    onDragEnd,
}: {
    waypoint: Waypoint;
    index: number;
    selected: boolean;
    editable: boolean;
    onClick?: () => void;
    onDragEnd?: (newMarkerPos: Vec3) => void;
}) {
    const [hovered, setHovered] = useState(false);
    const [groupNode, setGroupNode] = useState<THREE.Group | null>(null);
    const floorY = waypoint.position.y - 1.6 + 0.02;

    const accent = selected ? '#fbbf24' : hovered ? '#a5f3fc' : '#22d3ee';
    const fill = selected ? '#fde68a' : hovered ? '#67e8f9' : '#06b6d4';

    const draggable = editable && selected;

    return (
        <>
            <group
                ref={setGroupNode}
                position={[waypoint.position.x, floorY, waypoint.position.z]}
            >
                {selected && (
                    <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, -0.001, 0]}
                        renderOrder={997}
                    >
                        <ringGeometry args={[0.55, 0.7, 48]} />
                        <meshBasicMaterial
                            color={accent}
                            transparent
                            opacity={0.5}
                            depthTest={false}
                        />
                    </mesh>
                )}
                <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={999}>
                    <ringGeometry args={[0.4, 0.55, 32]} />
                    <meshBasicMaterial
                        color={accent}
                        transparent
                        opacity={0.9}
                        depthTest={false}
                    />
                </mesh>
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 0.005, 0]}
                    renderOrder={998}
                >
                    <circleGeometry args={[0.4, 32]} />
                    <meshBasicMaterial
                        color={fill}
                        transparent
                        opacity={0.25}
                        depthTest={false}
                    />
                </mesh>
                <Html center zIndexRange={[100, 0]}>
                    <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.();
                        }}
                        title={waypoint.label}
                        aria-label={`Waypoint ${index + 1}: ${waypoint.label}`}
                        className={`flex cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 font-mono text-xs transition hover:scale-110 ${
                            selected
                                ? 'border-amber-400/60 bg-amber-400/15 text-amber-100'
                                : 'border-cyan-400/60 bg-slate-950/70 text-white'
                        }`}
                        style={{
                            backdropFilter: 'blur(6px)',
                            boxShadow: selected
                                ? '0 0 0 3px rgba(251,191,36,0.3), 0 0 16px rgba(251,191,36,0.6)'
                                : '0 0 0 3px rgba(34,211,238,0.15), 0 0 16px rgba(34,211,238,0.5)',
                        }}
                    >
                        <span
                            className={`text-[10px] ${selected ? 'text-amber-200' : 'text-cyan-300'}`}
                        >
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-white/90">{waypoint.label}</span>
                    </button>
                </Html>
            </group>

            {/* Drag gizmo — only in Edit mode while this point is selected.
                Y axis is hidden because waypoints live on the floor plane;
                vertical position is derived from camera eye-height. */}
            {draggable && groupNode && (
                <TransformControls
                    object={groupNode}
                    mode="translate"
                    showY={false}
                    size={0.8}
                    onMouseUp={() => {
                        if (!groupNode) return;
                        onDragEnd?.({
                            x: groupNode.position.x,
                            y: groupNode.position.y,
                            z: groupNode.position.z,
                        });
                    }}
                />
            )}
        </>
    );
}

import { Html } from '@react-three/drei';
import { useState } from 'react';
import { Hotspot } from './types';

export function HotspotPin({
    hotspot,
    index,
    selected,
    onClick,
}: {
    hotspot: Hotspot;
    index: number;
    selected: boolean;
    onClick?: () => void;
}) {
    const [hovered, setHovered] = useState(false);
    const accent = selected
        ? '#fbbf24'
        : hovered
          ? '#22d3ee'
          : hotspot.color || '#22d3ee';

    return (
        <group
            position={[
                hotspot.position.x,
                hotspot.position.y,
                hotspot.position.z,
            ]}
        >
            <mesh renderOrder={999}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial
                    color={accent}
                    depthTest={false}
                    transparent
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
                    title={hotspot.title}
                    aria-label={hotspot.title}
                    className="relative flex h-9 w-9 cursor-pointer select-none items-center justify-center rounded-full font-mono text-sm font-semibold text-white transition hover:scale-110"
                    style={
                        {
                            background:
                                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(0,0,0,0.4))',
                            border: `1.5px solid ${accent}`,
                            backdropFilter: 'blur(6px)',
                            boxShadow: selected
                                ? `0 0 0 4px ${accent}55, 0 0 24px ${accent}, 0 2px 8px rgba(0,0,0,0.4)`
                                : `0 0 0 4px ${accent}33, 0 0 18px ${accent}80, 0 2px 8px rgba(0,0,0,0.4)`,
                        } as React.CSSProperties
                    }
                >
                    <span className="relative z-10">{index + 1}</span>
                    {selected && (
                        <span
                            aria-hidden
                            className="absolute inset-0 rounded-full"
                            style={{
                                border: `1px solid ${accent}`,
                                animation:
                                    'tour-pin-pulse 1.6s ease-out infinite',
                            }}
                        />
                    )}
                </button>
            </Html>
        </group>
    );
}

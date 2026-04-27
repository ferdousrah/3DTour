import { useGLTF } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';

export function ModelLoader({
    url,
    onClick,
    onReady,
}: {
    url: string;
    onClick?: (point: THREE.Vector3, normal: THREE.Vector3 | null) => void;
    onReady?: (boundingBox: THREE.Box3) => void;
}) {
    const { scene } = useGLTF(url);

    useEffect(() => {
        // Architectural models often ship with single-sided wall materials
        // (looks fine from outside, invisible from inside). Forcing
        // DoubleSide makes interior waypoints actually see the walls.
        scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh && obj.material) {
                const apply = (m: THREE.Material) => {
                    m.side = THREE.DoubleSide;
                    m.needsUpdate = true;
                };
                Array.isArray(obj.material)
                    ? obj.material.forEach(apply)
                    : apply(obj.material);
            }
        });

        const box = new THREE.Box3().setFromObject(scene);
        onReady?.(box);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene]);

    return (
        <primitive
            object={scene}
            onClick={(e: ThreeEvent<MouseEvent>) => {
                if (!onClick) return;
                e.stopPropagation();
                let worldNormal: THREE.Vector3 | null = null;
                if (e.face?.normal && e.object) {
                    worldNormal = e.face.normal
                        .clone()
                        .transformDirection(e.object.matrixWorld);
                }
                onClick(e.point.clone(), worldNormal);
            }}
        />
    );
}

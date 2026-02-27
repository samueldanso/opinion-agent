"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 800;

function Particles() {
  const meshRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.elapsedTime * 0.02;
    meshRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.01) * 0.1;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FF6B35"
        size={0.03}
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
}

function Grid() {
  const ref = useRef<THREE.GridHelper>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.z = (clock.elapsedTime * 0.3) % 2;
  });

  return (
    <gridHelper
      ref={ref}
      args={[40, 40, "#FF6B35", "#FF6B35"]}
      position={[0, -5, 0]}
      rotation={[0, 0, 0]}
      material-opacity={0.04}
      material-transparent
    />
  );
}

export function ParticleBg() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Particles />
        <Grid />
      </Canvas>
    </div>
  );
}

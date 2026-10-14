'use client';
import { useGLTF } from '@react-three/drei';
import { useStore } from '../store';
import { useEffect } from 'react';

export function Phone() {
  // This automatically loads the model we put in the public folder
  const { scene, materials } = useGLTF('/phone.glb');
  const frameColor = useStore((state) => state.frameColor);

  useEffect(() => {
    // Target your exact material slots from your 3D modeling program
    if (materials.BackMaterial) {
      materials.BackMaterial.color.set(frameColor);
    }
    if (materials.FrameMaterial) {
      materials.FrameMaterial.color.set(frameColor);
    }
    // ScreenMaterial remains untouched so your screen display doesn't change color
  }, [materials, frameColor]);

  return <primitive object={scene} scale={2} position={[0, -1, 0]} />;
}

// Pre-load the model into the user's browser memory so there is zero delay
useGLTF.preload('/phone.glb');
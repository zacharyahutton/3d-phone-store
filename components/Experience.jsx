'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useGLTF, Environment, PresentationControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const COLORABLE_MATERIALS = new Set([
  'Plastic',
  'Rim_Buttons',
  'Screen_Rim',
  'Material.005',
  'Material.004',
  'Material.003',
  'Glass_Camera_Logo',
]);

export function Experience() {
  const modelStaticRef      = useRef(null);
  const modelInteractiveRef = useRef(null);
  const userScaleRef        = useRef(null);
  const phone2IdleRef       = useRef(null);
  const illusionReplicaRef  = useRef(null);

  const modelScaleModifier = useStore((state) => state.modelScale || 1);
  const frameColor         = useStore((state) => state.frameColor);

  const { scene: phone1 } = useGLTF('/phone.glb');
  const { scene: phone2 } = useGLTF('/phone_2.glb');

  const phone2Replica    = useMemo(() => phone2.clone(), [phone2]);
  const phone1Materials  = useRef([]);
  const autoSpinAngle    = useRef(0);
  const specsHasCaptured = useRef(false);
  const colorableMaterials = useRef([]);
  const originalMaterialColors = useRef(new Map());

  // Programmatic smooth-easing tracking references
  const targets = useRef({
    staticPos: new THREE.Vector3(0, 0, 0),
    staticScale: new THREE.Vector3(0.38, 0.38, 0.38),
    interactivePos: new THREE.Vector3(0, 0, 0),
    interactiveScale: new THREE.Vector3(0, 0, 0),
    interactiveRotY: -Math.PI * 2.5
  });

  useEffect(() => {
    colorableMaterials.current = [];
    originalMaterialColors.current = new Map();

    phone2.traverse((child) => {
      if (child.isMesh && child.material) {
        const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
        const nextMaterials = sourceMaterials.map((mat) => {
          if (COLORABLE_MATERIALS.has(mat.name)) {
            const clonedMaterial = mat.clone();
            originalMaterialColors.current.set(clonedMaterial.uuid, clonedMaterial.color.clone());
            colorableMaterials.current.push(clonedMaterial);
            return clonedMaterial;
          }

          return mat;
        });

        child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0];
      } 
    });
  }, [phone2]);

  useEffect(() => {
    if (colorableMaterials.current.length === 0) return;
    if (frameColor) {
      const targetColor = new THREE.Color(frameColor);
      colorableMaterials.current.forEach((mat) => {
        mat.color.copy(targetColor);
        mat.needsUpdate = true;
      });
    } else {
      colorableMaterials.current.forEach((mat) => {
        const originalColor = originalMaterialColors.current.get(mat.uuid);
        if (originalColor) {
          mat.color.copy(originalColor);
        }
        mat.needsUpdate = true;
      });
    }
  }, [frameColor]);

  // Handle continuous rotation and mathematical loop interpolation
  useFrame((state, delta) => {
    const scroll = ScrollTrigger.getById('heroTrigger');
    const progress = scroll ? scroll.progress : 0;

    const easeAmount = 1 - Math.exp(-delta * 9.5);
    const rotationEase = 1 - Math.exp(-delta * 8.0);

    if (modelStaticRef.current) {
      modelStaticRef.current.position.lerp(targets.current.staticPos, easeAmount);
      modelStaticRef.current.scale.lerp(targets.current.staticScale, easeAmount);

      if (progress < 0.45) {
        autoSpinAngle.current += delta * 0.85;
        const scrollRotationFactor = (Math.min(progress, 0.35) / 0.35) * Math.PI;
        const targetRotY = autoSpinAngle.current + scrollRotationFactor;
        modelStaticRef.current.rotation.y = THREE.MathUtils.lerp(modelStaticRef.current.rotation.y, targetRotY, rotationEase);
      }
    }

    if (modelInteractiveRef.current) {
      modelInteractiveRef.current.position.lerp(targets.current.interactivePos, easeAmount);
      modelInteractiveRef.current.scale.lerp(targets.current.interactiveScale, easeAmount);
      
      // Interpolate explicit Y rotation thresholds without conflicting with manual control containers
      modelInteractiveRef.current.rotation.y = THREE.MathUtils.lerp(modelInteractiveRef.current.rotation.y, targets.current.interactiveRotY, rotationEase);
    }

    if (userScaleRef.current) {
      const labReturn = THREE.MathUtils.smoothstep((progress - 0.70) / 0.1, 0, 1);
      const specsScaleFactor = THREE.MathUtils.lerp(0.85, 1, labReturn);
      const targetUserScale = modelScaleModifier * (progress >= 0.24 && progress < 0.82 ? specsScaleFactor : 1);
      const nextScale = THREE.MathUtils.damp(userScaleRef.current.scale.x, targetUserScale, 7.5, delta);
      userScaleRef.current.scale.setScalar(nextScale);
    }

    if (phone2IdleRef.current) {
      if (progress >= 0.38 && progress < 0.74) {
        specsHasCaptured.current = true;

        const rearDiagonalRotY = Math.PI * 1.14;
        phone2IdleRef.current.rotation.y = THREE.MathUtils.lerp(phone2IdleRef.current.rotation.y, rearDiagonalRotY, rotationEase);
      } else if (progress >= 0.74 && progress < 0.94) {
        specsHasCaptured.current = false;
        phone2IdleRef.current.rotation.y += delta * 0.95;
      } else if (progress >= 0.94) {
        phone2IdleRef.current.rotation.y += delta * 1.35;
      } else {
        specsHasCaptured.current = false;
      }
    }
  });

  useEffect(() => {
    if (!modelStaticRef.current || !modelInteractiveRef.current || !illusionReplicaRef.current) return;

    phone1Materials.current = [];
    phone1.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material             = child.material.clone();
        child.material.transparent = true;
        child.material.opacity     = 1;
        child.material.depthWrite  = true;
        child.material.depthTest   = true;
        phone1Materials.current.push(child.material);
      }
    });

    illusionReplicaRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material             = child.material.clone();
        child.material.transparent = true;
        child.material.opacity     = 0;
      }
    });

    modelStaticRef.current.visible      = true;
    modelInteractiveRef.current.visible = true;

    // Establish non-jittering default baseline coordinates
    targets.current.staticScale.set(0.38, 0.38, 0.38);
    targets.current.staticPos.set(0, 0, 0);
    targets.current.interactivePos.set(0, 0, 0);
    targets.current.interactiveRotY = -Math.PI * 2.5;
    targets.current.interactiveScale.set(0, 0, 0);

    phone1Materials.current.forEach(m => { m.opacity = 1; });

    // GSAP Timeline driving matrix coordinate variables, bypassing direct component mutations
    const tl = gsap.timeline({
      id: 'heroTrigger',
      scrollTrigger: {
        trigger: '#main-scroll-container',
        endTrigger: '#section-customizer',
        start:   'top top',
        end:     'bottom bottom',
        scrub:   true, // Simple tracking state
        invalidateOnRefresh: true,
      },
    });

    // Stage 0: Shrink and shoot past camera view
    tl.to(targets.current.staticPos,
      { x: 0, y: -0.22, z: 4.5, ease: 'none', duration: 0.35 }, 0
    )
    .to(targets.current.staticScale,
      { x: 4.8, y: 4.8, z: 4.8, ease: 'none', duration: 0.35 }, 0
    )
    .to(phone1Materials.current,
      { opacity: 0, stagger: 0, duration: 0.32, ease: 'none' }, 0
    )
    // Stage 1: Bring phone into Specs showcase.
    .to(targets.current.interactiveScale,
      {
        x: 0.52,
        y: 0.52,
        z: 0.52,
        ease: 'none', duration: 0.45,
      }, 0.18
    )
    .to(targets.current,
      { interactiveRotY: 0, ease: 'none', duration: 0.45 }, 0.18
    )
    .to(targets.current.interactivePos,
      { x: 0, y: 0.02, z: 1.02, ease: 'none', duration: 0.38 }, 0.3
    )
    
    // Stage 2: Transition from specs into the Lab customizer layout.
    .to(targets.current.interactivePos, {
      x: -0.45, 
      y: 0, 
      z: 0, 
      ease: 'none',
      duration: 0.3
    }, 0.74)
    .to(targets.current.interactiveScale, {
      x: 0.42, 
      y: 0.42,
      z: 0.42,
      ease: 'none',
      duration: 0.3
    }, 0.74);

    return () => {
      const activeTrigger = ScrollTrigger.getById('heroTrigger');
      if (activeTrigger) activeTrigger.kill();
    };
  }, [phone1, phone2]);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[10, 10, 10]}  intensity={1.5} />
      <directionalLight position={[-8, 5, -5]}   intensity={0.6} />
      <directionalLight position={[0, -10, 5]}   intensity={0.3} />
      <Environment preset="studio" />

      <group ref={modelStaticRef}>
        <primitive object={phone1} />
        <group ref={illusionReplicaRef}>
          <primitive object={phone2Replica} />
        </group>
      </group>

      <group ref={modelInteractiveRef}>
        <group ref={userScaleRef}>
          <PresentationControls global={false} snap={true} speed={1.5}>
            <group ref={phone2IdleRef}>
              <primitive object={phone2} />
            </group>
          </PresentationControls>
        </group>
      </group>
    </>
  );
}

useGLTF.preload('/phone.glb');
useGLTF.preload('/phone_2.glb');

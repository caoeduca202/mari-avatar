"use client";
import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export function Avatar({ isSpeaking, ...props }) {
  const group = useRef();
  const { scene, animations } = useGLTF('/avatar.glb');
  const { actions } = useAnimations(animations, group);
  
  // Head bone ref
  const headBone = useRef();

  useEffect(() => {
    // Traverse the scene to find the head bone
    scene.traverse((child) => {
      if (child.isBone && child.name.toLowerCase().includes('head')) {
        headBone.current = child;
      }
    });

    if (actions && Object.keys(actions).length > 0) {
      const animName = Object.keys(actions)[0];
      actions[animName].play();
    }
  }, [actions, scene]);

  useFrame((state) => {
    // Sincronia Labial (Balanço de Cabeça simulado)
    if (isSpeaking && headBone.current) {
      headBone.current.rotation.x = Math.sin(state.clock.elapsedTime * 15) * 0.1;
    } else if (headBone.current) {
      headBone.current.rotation.x = 0;
    }
    
    // Mouse tracking for the entire model
    if (group.current) {
      const mouseX = (state.pointer.x * Math.PI) / 4;
      group.current.rotation.y += (mouseX - group.current.rotation.y) * 0.1;
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/avatar.glb');

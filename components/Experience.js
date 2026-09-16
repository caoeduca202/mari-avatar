"use client";
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import { Avatar } from './Avatar';
import { Suspense } from 'react';

export function Experience({ isSpeaking }) {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      <Canvas shadows camera={{ position: [0, 0.5, 4.0], fov: 40 }} style={{ pointerEvents: 'auto' }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 5, 3]} intensity={1.2} />
        
        <Environment preset="city" />
        
        <Suspense fallback={null}>
          <Avatar 
            isSpeaking={isSpeaking} 
            position={[0, -0.2, 0]} 
            scale={2.4} 
          />
          <ContactShadows position={[0, -0.2, 0]} opacity={0.4} scale={5} blur={2.5} />
        </Suspense>

        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          target={[0, 0.2, 0]}
        />
      </Canvas>
    </div>
  );
}

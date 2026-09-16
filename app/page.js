"use client";
import { useState } from 'react';
import { Experience } from '../components/Experience';
import { MicUI } from '../components/MicUI';

export default function Home() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  return (
    <main className="w-screen h-screen overflow-hidden relative">
      {/* Background elements */}
      <div className="bg-mesh pointer-events-none">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div id="ground-glow"></div>

      {/* Header */}
      <header className="absolute top-[30px] left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none header-glass rounded-[24px] px-[36px] py-[16px] max-w-[90%] w-max">
        <h1 className="text-[clamp(1rem,2vw,1.4rem)] font-[800] tracking-[0.05em] text-gradient">
          Santa Maria
        </h1>
        <p className="text-[clamp(0.75rem,1.2vw,0.9rem)] text-slate-400 mt-1 font-[400] tracking-[0.02em]">
          Assistente Virtual Mari
        </p>
      </header>

      {/* 3D Scene */}
      <Experience isSpeaking={isSpeaking} />
      
      {/* Mic UI Controls */}
      <MicUI onSpeakStatusChange={setIsSpeaking} />
    </main>
  );
}

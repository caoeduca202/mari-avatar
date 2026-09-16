"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Loader2, Volume2, Square } from 'lucide-react';

export function MicUI({ onSpeakStatusChange }) {
  const [status, setStatus] = useState('idle'); // idle, listening, thinking, speaking
  const [statusText, setStatusText] = useState('Falar com a Mari');
  const [conversation, setConversation] = useState([]);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setStatus('listening');
        setStatusText('Ouvindo...');
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setStatus('thinking');
        setStatusText('Pensando...');
        await processVoiceInput(transcript);
      };

      recognition.onerror = (e) => {
        console.error("Speech Recognition Error:", e);
        resetMic();
      };

      recognition.onend = () => {
        // Only reset if we were just listening and didn't transition to thinking
        setStatus((prev) => {
          if (prev === 'listening') {
            setStatusText('Falar com a Mari');
            return 'idle';
          }
          return prev;
        });
      };

      recognitionRef.current = recognition;
    }
  }, [conversation]);

  const resetMic = () => {
    setStatus('idle');
    setStatusText('Falar com a Mari');
    onSpeakStatusChange(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const processVoiceInput = async (text) => {
    try {
      const userMessage = { role: 'user', content: text };
      const currentConversation = [...conversation, userMessage];
      setConversation(currentConversation);

      // Groq
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentConversation })
      });
      
      const chatData = await chatRes.json();
      if (!chatRes.ok) throw new Error(chatData.error || 'Erro no chat');

      const assistantMessage = { role: 'assistant', content: chatData.reply };
      setConversation([...currentConversation, assistantMessage]);

      setStatus('speaking');
      setStatusText('Falando...');

      // TTS
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chatData.reply })
      });

      if (!ttsRes.ok) throw new Error('Erro na geração de áudio');

      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.onplay = () => onSpeakStatusChange(true);
      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resetMic();
      };

      audioRef.current.play();
    } catch (error) {
      console.error(error);
      resetMic();
    }
  };

  const toggleMic = () => {
    if (status === 'speaking' || status === 'thinking') {
      // Stop speaking or cancel request
      resetMic();
    } else if (status === 'listening') {
      recognitionRef.current?.stop();
    } else {
      // Start listening
      if (!recognitionRef.current) {
        alert("O seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome.");
        return;
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Styles based on status
  let btnClass = "bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(91,156,255,0.5)]";
  let statusColor = "text-slate-200";
  let borderClass = "border-white/10";
  let Icon = Mic;

  if (status === 'listening') {
    btnClass = "bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse";
    statusColor = "text-red-300";
    borderClass = "border-red-500/40";
    Icon = Mic;
  } else if (status === 'thinking') {
    btnClass = "bg-gradient-to-br from-amber-500 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.5)]";
    statusColor = "text-amber-300";
    borderClass = "border-amber-500/40";
    Icon = Loader2;
  } else if (status === 'speaking') {
    btnClass = "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-[pulse_2s_infinite]";
    statusColor = "text-emerald-300";
    borderClass = "border-emerald-500/40";
    Icon = Volume2; // ou um ícone de parar (Square)
  }

  return (
    <div className={`fixed bottom-[30px] left-1/2 -translate-x-1/2 z-40 flex items-center gap-5 header-glass rounded-[100px] py-[10px] pl-[30px] pr-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.4)] transition-colors duration-300 ${borderClass}`}>
      <div className={`font-semibold text-lg whitespace-nowrap transition-colors duration-300 ${statusColor}`}>
        {statusText}
      </div>
      
      <button 
        onClick={toggleMic}
        className={`w-[60px] h-[60px] border-none rounded-full flex items-center justify-center text-white cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 ${btnClass}`}
      >
        <Icon className={`w-7 h-7 ${status === 'thinking' ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}

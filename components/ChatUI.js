"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Volume2, VolumeX } from 'lucide-react';

export function ChatUI({ onSpeakStatusChange }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Olá! Eu sou a Mari, como posso ajudar você na Santa Maria hoje?' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  
  const audioRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });
      
      const chatData = await chatRes.json();
      if (!chatRes.ok) throw new Error(chatData.error || 'Erro no chat');

      const assistantMessage = { role: 'assistant', content: chatData.reply };
      setMessages((prev) => [...prev, assistantMessage]);

      if (soundEnabled) {
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
          onSpeakStatusChange(false);
          URL.revokeObjectURL(audioUrl);
        };

        audioRef.current.play();
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua solicitação.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-8 z-10">
      <div className="flex justify-between items-start pointer-events-auto w-full max-w-7xl mx-auto">
        <h1 className="text-white font-bold text-3xl drop-shadow-lg tracking-wide">SANTA MARIA</h1>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 p-3 rounded-full text-white transition-all shadow-lg"
        >
          {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>

      <div className="w-full sm:w-[420px] h-[500px] bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl flex flex-col overflow-hidden pointer-events-auto shadow-2xl ml-auto">
        {/* Header */}
        <div className="bg-white/5 p-4 border-b border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-white/20">
            M
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Mari</h2>
            <p className="text-cyan-200 text-sm">Assistente Virtual</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3.5 text-[15px] shadow-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-sm' 
                  : 'bg-white/20 text-white rounded-bl-sm backdrop-blur-md'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/20 backdrop-blur-md text-white rounded-2xl rounded-bl-sm p-3.5 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Pensando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-white/5 border-t border-white/10 flex items-center gap-3">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..." 
            className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

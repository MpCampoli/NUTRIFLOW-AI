

import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse } from '../services/geminiService';
import { MessageSquare, Send, X, Bot } from './icons/ChatIcons';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Como posso ajudar com suas dúvidas sobre dieta e nutrição?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;
    
    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    try {
        const responseText = await getChatbotResponse(history, input);
        const modelMessage: Message = { role: 'model', text: responseText };
        setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
        const errorMessage: Message = { role: 'model', text: 'Desculpe, algo deu errado. Tente novamente.' };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform transition-transform hover:scale-110 focus:outline-none"
        aria-label="Toggle chatbot"
      >
        {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-full max-h-[600px] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col animate-fade-in-up">
          <header className="p-4 bg-slate-900/50 rounded-t-2xl border-b border-slate-700 flex items-center gap-3">
             <div className="p-2 bg-cyan-500 rounded-full">
                <Bot className="w-6 h-6 text-slate-900" />
            </div>
            <h3 className="text-lg font-bold text-white">Assistente IA</h3>
          </header>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center"><Bot className="w-5 h-5 text-cyan-400"/></div>}
                <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-br-lg' : 'bg-slate-700 text-slate-200 rounded-bl-lg'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center"><Bot className="w-5 h-5 text-cyan-400"/></div>
                  <div className="px-4 py-2 rounded-2xl bg-slate-700 text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                    </div>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-b-2xl">
            <div className="flex items-center gap-2 bg-slate-700 rounded-lg">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte algo..."
                className="w-full bg-transparent p-3 text-slate-200 focus:outline-none disabled:cursor-not-allowed"
                disabled={isLoading}
              />
              <button onClick={handleSend} className="p-3 text-cyan-400 hover:text-cyan-300 disabled:text-slate-500" disabled={isLoading}>
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
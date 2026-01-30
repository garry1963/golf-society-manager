
import React, { useState, useRef, useEffect } from 'react';
import { getGolfAdvice } from '../services/geminiService';
import { Send, Bot, User, Loader2, Sparkles, MessageSquare } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIPro: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm 'The Society Pro'. Need help with tournament pairings, handicap analysis, or maybe a quick tip for that pesky slice? Ask away!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await getGolfAdvice(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error communicating with the Pro. Check your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in zoom-in-95 duration-500">
      <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col overflow-hidden relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold">The Society Pro</h3>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest">AI Performance Expert</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100 text-emerald-600">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 text-slate-800 border border-slate-100 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span className="text-xs font-medium italic">Pro is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        {messages.length < 3 && !isLoading && (
          <div className="px-6 pb-4 flex flex-wrap gap-2">
            <button 
              onClick={() => setInput("How should I pair players for a competitive tournament?")}
              className="text-xs font-bold px-3 py-2 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors"
            >
              Pairing advice?
            </button>
            <button 
              onClick={() => setInput("Explain the Stableford scoring system.")}
              className="text-xs font-bold px-3 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
            >
              Stableford rules?
            </button>
            <button 
              onClick={() => setInput("How do I improve my bunker play?")}
              className="text-xs font-bold px-3 py-2 bg-amber-50 text-amber-700 rounded-full hover:bg-amber-100 transition-colors"
            >
              Bunker tips?
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <div className="relative flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Ask the Pro anything about golf..."
              className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3 pr-12 text-sm outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
            Powered by Gemini AI • Golf expertise at your fingertips
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIPro;

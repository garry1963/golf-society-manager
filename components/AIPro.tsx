
import React, { useState, useRef, useEffect } from 'react';
import { getGolfAdvice } from '../services/geminiService';
import { ChatMessage, GroundingSource } from '../types';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  Globe, 
  Link as LinkIcon, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

const AIPro: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: "Hello! I'm 'The Society Pro'. Need help with tournament pairings, handicap analysis, or maybe a quick tip for that pesky slice? Ask away!" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
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
      const { text, sources } = await getGolfAdvice(userMsg, useSearch);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: text,
        sources: sources.length > 0 ? sources : undefined
      }]);
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
        <div className="p-6 border-b border-slate-100 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black italic tracking-tight">The Society Pro</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest">Grounded Knowledge Engine</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setUseSearch(!useSearch)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              useSearch 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
              : 'bg-white/5 border-white/10 text-white/40'
            }`}
          >
            <Globe className={`w-3.5 h-3.5 ${useSearch ? 'animate-spin-slow' : ''}`} />
            {useSearch ? 'Search Grounding Active' : 'Search Offline'}
          </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/30"
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div className="space-y-3 flex-1">
                  <div className={`p-6 rounded-3xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}>
                    {msg.content}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Verified Intelligence Sources</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((source, sIdx) => (
                          <a 
                            key={sIdx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-100 rounded-lg text-[10px] font-bold text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-all group"
                          >
                            <LinkIcon className="w-3 h-3 text-emerald-400 group-hover:rotate-12 transition-transform" />
                            <span className="truncate max-w-[120px]">{source.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[80%]">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-emerald-100 text-emerald-600">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-6 rounded-3xl bg-white text-slate-800 border border-slate-100 shadow-sm flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span className="text-xs font-bold italic text-slate-500">
                    {useSearch ? 'Consulting the global golf network...' : 'The Pro is formulating advice...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          <div className="relative flex items-center gap-3 max-w-5xl mx-auto">
            <input 
              type="text" 
              placeholder={useSearch ? "Search live golf info or ask for advice..." : "Ask the Pro for advice..."}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 pr-16 text-sm font-medium outline-none focus:ring-4 ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-3 p-4 bg-emerald-600 text-white rounded-[1.5rem] hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              WHS Certified Advice
            </p>
            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-blue-500" />
              Real-time Web Grounding
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPro;

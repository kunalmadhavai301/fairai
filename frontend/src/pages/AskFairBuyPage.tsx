import React, { useState } from 'react';
import { MessageSquareText, Send, Sparkles, ShieldCheck, HelpCircle } from 'lucide-react';
import { ProductAnalysisFull, LocationInfo, AskFairBuyMessage } from '../types';
import { apiClient } from '../services/api';

interface AskFairBuyPageProps {
  location: LocationInfo;
  activeAnalysis?: ProductAnalysisFull;
}

export const AskFairBuyPage: React.FC<AskFairBuyPageProps> = ({ location, activeAnalysis }) => {
  const [messages, setMessages] = useState<AskFairBuyMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: activeAnalysis
        ? `Namaste! I am Ask FairBuy AI. I have full context on your scan of **${activeAnalysis.product.name}** (Quoted ₹${activeAnalysis.quotedPrice}, Fair Range ₹${activeAnalysis.priceIntelligence.fairPriceMin}–₹${activeAnalysis.priceIntelligence.fairPriceMax}). Ask me why the price is higher, whether variances are legitimate, or how transport costs affect your overall purchase!`
        : `Namaste! I am Ask FairBuy AI. Ask me any question about price fairness, market signals, legitimate price variances, or transport costs in ${location.city}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const userMsg: AskFairBuyMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const answer = await apiClient.sendChatMessage(userText, activeAnalysis?.id);
      const aiMsg: AskFairBuyMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "Why is the fair price estimated at ₹190–₹220?",
    "Why might the shopkeeper be charging ₹250?",
    "Should I travel 5 km to buy it ₹20 cheaper?",
    "What extra transport or hidden costs should I consider?",
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-emerald-900/40 shadow-md space-y-2 shrink-0">
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <MessageSquareText className="w-4 h-4 text-emerald-400" />
          <span>Conversational Price Intelligence</span>
        </div>
        <h1 className="text-2xl font-black text-white">Ask FairBuy AI Assistant</h1>
        <p className="text-xs text-slate-300">
          Educating consumers on market evidence, legitimate price variances, and effective transport costs in {location.city}.
        </p>
      </div>

      {/* Suggested Questions */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setInput(q)}
            className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors"
          >
            💡 {q}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed space-y-1 ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white font-semibold rounded-br-none'
                  : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none font-medium'
              }`}
            >
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/10">
                <span className="font-extrabold text-[10px] uppercase">
                  {m.sender === 'user' ? 'You' : '🤖 Ask FairBuy AI'}
                </span>
                <span className="text-[9px] opacity-75">{m.timestamp}</span>
              </div>
              <p className="pt-1">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic p-3 bg-slate-50 rounded-2xl max-w-xs border border-slate-200">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
            <span>Analyzing market evidence & transport trade-offs...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask FairBuy about prices, market evidence, or transport costs..."
          className="flex-1 px-4 py-3 bg-white text-xs font-semibold border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md disabled:opacity-50 flex items-center gap-2 shrink-0 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Ask AI</span>
        </button>
      </form>
    </div>
  );
};

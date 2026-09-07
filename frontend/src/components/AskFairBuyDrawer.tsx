import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, User, HelpCircle } from 'lucide-react';
import { ProductAnalysisFull } from '../types';
import { apiClient } from '../services/api';

interface AskFairBuyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeAnalysis?: ProductAnalysisFull;
}

export const AskFairBuyDrawer: React.FC<AskFairBuyDrawerProps> = ({
  isOpen,
  onClose,
  activeAnalysis,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: activeAnalysis
        ? `Hello! I'm FairBuy AI. I have analyzed ${activeAnalysis.product.name} quoted at ₹${activeAnalysis.quotedPrice.toLocaleString()}. Ask me anything about price fairness, specs, or alternatives!`
        : `Hello! I'm FairBuy AI, your smart shopping assistant. Ask me any price or buying decision question!`,
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = [
    `Is this worth ₹${activeAnalysis ? activeAnalysis.quotedPrice.toLocaleString() : '1,200'}?`,
    'Why is this product expensive?',
    'Is there a cheaper alternative?',
    'What should I inspect before buying?',
    'Is this good for outdoor travel?',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    if (!textToSend) setInputQuery('');
    setLoading(true);

    try {
      const responseText = await apiClient.sendChatMessage(query, activeAnalysis?.id);
      setMessages((prev) => [...prev, { sender: 'ai', text: responseText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'I could not process your query right now. Please verify your connection or settings.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Ask FairBuy AI</h3>
            <p className="text-[11px] text-slate-300">Price Intelligence & Decision Assistant</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                m.sender === 'user'
                  ? 'bg-slate-800 text-white'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
              }`}
            >
              {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-xs'
                  : 'bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-tl-xs'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200 max-w-[80%]">
            <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
            <span>Analyzing market signals...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-white border-t border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-400" />
          <span>Quick Questions</span>
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask FairBuy about this product..."
          className="flex-1 text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-40 transition-colors shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

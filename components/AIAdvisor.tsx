
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { getChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useAIProcessor } from '../hooks/useAIProcessor';

const AIAdvisor: React.FC = () => {
  const { sales, customers, purchases, vouchers, categories, suppliers, exchangeRates, navigate, theme } = useApp();
  // Fixed: Destructured setErrorInfo from useAIProcessor
  const { 
    pendingAction, setPendingAction, ambiguityMatches, setAmbiguityMatches, 
    debtWarning, errorInfo, setErrorInfo, validateToolCall, executeAction 
  } = useAIProcessor();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome', role: 'model',
        text: 'أهلاً يا مدير. أنا محاسبك الخارق وجاهز لإدارة كل شيء: (بيع، شراء، ديون، حذف، تعديل، مراسلة، أو نسخ احتياطي). كيف أخدمك؟',
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping, pendingAction, ambiguityMatches, errorInfo]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const aiResponse = await getChatResponse(input, messages, { sales, customers, purchases, vouchers, categories, suppliers, rates: exchangeRates });
      
      if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
        const tool = aiResponse.toolCalls[0];
        if (validateToolCall(tool.name, tool.args)) {
          setPendingAction(tool);
        }
      }

      const modelMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), role: 'model', 
        text: aiResponse.text || "أبشر يا مدير، جاري التنفيذ...", 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: 'عذراً، حصل خلل فني في الاتصال السحابي. حاول ثانية.', timestamp: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <PageLayout title="المحاسب الذكي Gemini" onBack={() => navigate('dashboard')}>
      <div className="flex flex-col h-[75vh] max-w-4xl mx-auto gap-6 px-1">
        
        <div ref={scrollRef} className={`flex-1 rounded-[3rem] p-6 lg:p-10 overflow-y-auto no-scrollbar space-y-8 backdrop-blur-xl shadow-inner border ${
          theme === 'dark' ? 'bg-slate-950/40 border-white/5' : 'bg-white/40 border-slate-100 shadow-sky-900/5'
        }`}>
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-6 lg:p-8 rounded-[2.5rem] shadow-xl ${
                m.role === 'user' 
                  ? (theme === 'dark' ? 'bg-slate-800 text-white rounded-bl-none border border-white/5' : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200')
                  : 'bg-indigo-600 text-white rounded-br-none shadow-indigo-500/20'
              }`}>
                <p className="font-bold text-sm lg:text-xl leading-relaxed whitespace-pre-line">{m.text}</p>
                <span className="text-[8px] opacity-40 mt-3 block text-left font-black tabular-nums">
                  {new Date(m.timestamp).toLocaleTimeString('ar-YE', {hour:'2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-end p-4">
               <div className="bg-indigo-600/20 px-6 py-3 rounded-full flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
               </div>
            </div>
          )}
        </div>

        {/* Action Confirmation Modals */}
        {(pendingAction || errorInfo || ambiguityMatches.length > 0) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl">
            <div className={`w-full max-w-lg rounded-[3.5rem] p-10 shadow-3xl border-2 animate-in zoom-in-95 duration-300 ${
              theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'
            }`}>
              
              {errorInfo ? (
                <div className="text-center space-y-8">
                  <span className="text-8xl">⚠️</span>
                  <h3 className="text-2xl font-black text-rose-600">عذراً يا مدير</h3>
                  <p className="font-bold text-slate-500 text-lg leading-relaxed">{errorInfo}</p>
                  <button onClick={() => {setPendingAction(null); setAmbiguityMatches([]); setErrorInfo(null);}} className="w-full bg-slate-100 dark:bg-slate-800 py-6 rounded-3xl font-black text-xl active:scale-95 transition-all">فهمت</button>
                </div>
              ) : pendingAction ? (
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-5xl shadow-2xl">⚡</div>
                    <div className="text-right">
                      <h4 className="font-black text-2xl text-slate-900 dark:text-white">تأكيد القيد السحابي</h4>
                      <p className="text-[10px] lg:text-sm font-black text-indigo-500 uppercase tracking-widest mt-1">AI Audit Verification</p>
                    </div>
                  </div>

                  {debtWarning && <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 p-6 rounded-3xl text-sm font-black text-center border-2 border-dashed border-rose-200">⚠️ تنبيه: العميل لديه ديون سابقة بقيمة {debtWarning.toLocaleString()} YER</div>}

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-8 rounded-[2.5rem] space-y-4 border border-slate-100 dark:border-white/5 shadow-inner">
                    {Object.entries(pendingAction.args).map(([k, v]: any) => (
                      <div key={k} className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{k}</span>
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg">{String(v)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => executeAction()} className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white py-8 rounded-3xl font-black text-2xl shadow-2xl shadow-indigo-500/40 active:scale-95 transition-all border-b-8 border-indigo-800">تأكيد القيد الآن ✅</button>
                    <button onClick={() => {setPendingAction(null); setAmbiguityMatches([]);}} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 py-8 rounded-3xl font-black text-xl hover:bg-rose-500 hover:text-white transition-all">إلغاء</button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="relative group">
          <input 
            type="text" 
            className={`w-full rounded-[3rem] p-6 lg:p-10 pr-10 lg:pr-14 pl-28 lg:pl-40 font-black text-lg lg:text-3xl shadow-2xl outline-none transition-all border-4 ${
              theme === 'dark' ? 'bg-slate-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-100 text-slate-900 focus:border-indigo-400'
            }`} 
            value={input} onChange={e => setInput(e.target.value)} 
            placeholder="اطلب أي شيء (بيع، حذف، ميزانية)..." 
          />
          <button type="submit" disabled={isTyping} className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16 lg:w-24 lg:h-24 bg-indigo-600 text-white rounded-full shadow-2xl active:scale-90 transition-all flex items-center justify-center text-2xl lg:text-5xl border-4 border-white dark:border-slate-800 group-hover:scale-110">
            🚀
          </button>
        </form>
      </div>
    </PageLayout>
  );
};

export default AIAdvisor;

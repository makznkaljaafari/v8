import React, { useState, useRef, useEffect, memo } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';
import { useUI } from '../context/UIContext';
import { useData } from '../context/DataContext';
import { aiTools, SYSTEM_INSTRUCTION } from '../services/geminiService';
import { useAIProcessor } from '../hooks/useAIProcessor';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

const VoiceAssistant: React.FC = () => {
  const { customers, suppliers, categories } = useData();
  const { 
    pendingAction, setPendingAction, ambiguityMatches, 
    debtWarning, validateToolCall, executeAction 
  } = useAIProcessor();
  
  const [isActive, setIsActive] = useState(false);
  const [statusText, setStatusText] = useState('جاهز لسماعك يا مدير...');
  const [isListening, setIsListening] = useState(false);
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const stopSession = () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        try { session.close(); } catch(e) {}
      }).catch(() => {});
      sessionPromiseRef.current = null;
    }
    
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    setIsListening(false);
    setPendingAction(null);
    setStatusText('جاهز لسماعك يا مدير...');
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (!inputAudioContextRef.current) {
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      // Resume audio contexts as required by browser policies
      if (inputAudioContextRef.current.state === 'suspended') await inputAudioContextRef.current.resume();
      if (outputAudioContextRef.current.state === 'suspended') await outputAudioContextRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const ctxString = `البيانات: عملاء(${customers.length}), موردين(${suppliers.length}), أصناف(${categories.length})`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            // CRITICAL: Verify both mic stream and audio context are valid before creating source
            if (!micStreamRef.current || !inputAudioContextRef.current) {
              console.warn("Audio components not ready for createMediaStreamSource");
              return;
            }
            
            setStatusText('أسمعك الآن، تفضل...');
            setIsListening(true);
            
            try {
              const source = inputAudioContextRef.current.createMediaStreamSource(micStreamRef.current);
              const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              scriptProcessorRef.current = scriptProcessor;
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                
                const pcmBlob: Blob = { 
                  data: encode(new Uint8Array(int16.buffer)), 
                  mimeType: 'audio/pcm;rate=16000' 
                };
                
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                }).catch(() => {});
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContextRef.current.destination);
            } catch (audioErr) {
              console.error("Audio pipeline initialization failed:", audioErr);
              setStatusText("خطأ في معالجة الصوت");
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              for (const call of message.toolCall.functionCalls) {
                if (validateToolCall(call.name, call.args)) {
                  setPendingAction(call);
                }
                sessionPromise.then(s => s.sendToolResponse({
                  functionResponses: { id: call.id, name: call.name, response: { result: "ok" } }
                })).catch(() => {});
              }
            }
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
          },
          onerror: (e) => {
            console.error("Live AI Error:", e);
            setStatusText("حدث خطأ في الاتصال");
            setIsListening(false);
          },
          onclose: () => setIsActive(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          tools: [{ functionDeclarations: aiTools }],
          systemInstruction: SYSTEM_INSTRUCTION + "\n" + ctxString
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) { 
      console.error("Voice assistant start error:", err);
      setStatusText("تعذر تشغيل المساعد (تأكد من الميكروفون)");
      setIsActive(false); 
    }
  };

  useEffect(() => {
    if (isActive) startSession();
    else stopSession();
    return () => stopSession();
  }, [isActive]);

  return (
    <>
      <div className="fixed bottom-32 right-8 z-[60] flex flex-col items-center gap-1 group">
        <button 
          onClick={() => setIsActive(!isActive)} 
          className={`w-14 h-14 lg:w-18 lg:h-18 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 border-4 border-white/20 active:scale-90 ${isActive ? 'bg-rose-600 rotate-90' : 'bg-indigo-600'}`}
        >
          <span className="text-white text-3xl">{isActive ? '✕' : '🎙️'}</span>
        </button>
        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black text-white shadow-lg border border-white/10 ${isActive ? 'bg-rose-600' : 'bg-indigo-600'}`}>المساعد</span>
      </div>

      {isActive && (
        <div className="fixed inset-0 z-[55] flex flex-col items-center justify-center p-8 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in">
          <div className="w-full max-w-md flex flex-col items-center gap-10 text-center">
            
            {(pendingAction || ambiguityMatches.length > 0) ? (
              <div className="w-full bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border-4 border-indigo-600">
                {ambiguityMatches.length > 0 ? (
                   <div className="space-y-4 text-right">
                     <h3 className="text-xl font-black">أي شخص تقصد؟</h3>
                     <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                        {ambiguityMatches.map(m => (
                          <button key={m.id} onClick={() => executeAction(m.id)} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-black text-right border-2 border-transparent hover:border-indigo-500 transition-all">{m.name}</button>
                        ))}
                     </div>
                   </div>
                ) : (
                  <>
                    <h3 className="text-xl font-black mb-6">تأكيد القيد الصوتي</h3>
                    {debtWarning && <div className="bg-rose-100 text-rose-600 p-3 rounded-xl text-xs font-black mb-4">⚠️ ديون سابقة: {debtWarning.toLocaleString()}</div>}
                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl mb-10 text-right space-y-3">
                      {pendingAction.args && Object.entries(pendingAction.args).map(([k, v]: any) => (
                        <div key={k} className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-2">
                          <span className="text-[10px] font-black text-slate-400">{k}</span>
                          <span className="font-black text-indigo-600 text-sm">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => executeAction()} className="flex-[2] bg-indigo-600 text-white py-6 rounded-2xl font-black shadow-xl">تأكيد ✅</button>
                      <button onClick={() => setPendingAction(null)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-600 py-6 rounded-2xl font-black">إلغاء</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="relative flex flex-col items-center">
                <div className="w-56 h-56 bg-indigo-600 rounded-full flex items-center justify-center text-8xl shadow-[0_0_80px_rgba(79,70,229,0.5)] animate-pulse">
                  🎙️
                </div>
                <h2 className="text-2xl font-black text-white mt-12">{statusText}</h2>
              </div>
            )}
            
            <button onClick={() => setIsActive(false)} className="bg-white/10 text-white px-10 py-4 rounded-full font-black mt-8">إغلاق</button>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(VoiceAssistant);
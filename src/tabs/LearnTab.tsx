/**
 * @file LearnTab.tsx
 * @description Core flashcard learning interface implementing the visual SRS sequence and generative AI tools (hooks, chat, and contexts).
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { WordData, getExamFrequency, frequencyLabel } from '../data/words';
import { motion, AnimatePresence } from 'framer-motion';
import { generateMnemonic, explainInContext, createDoubtChat } from '../services/aiService';
import { usePremium } from '../context/PremiumContext';
import AiUsageIndicator from '../components/AiUsageIndicator';
import UpgradeModal from '../components/UpgradeModal';
import { playCorrect, playIncorrect, playFlip } from '../utils/sound';
import { detectSessionFatigue } from '../utils/analytics';
import { Volume2, ChevronRight, MessageCircle, AlertCircle, RefreshCw, X, Frown, Meh, Smile, SmilePlus, BookOpen, PartyPopper, Umbrella, Sparkles, Coffee } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

/**
 * Controller containing the interactive queue mechanism where individual WordData nodes are tested implicitly against user brains.
 */
export default function LearnTab() {
  const { getDueCards, getNewCards, recordReview, settings, gainXp } = useApp();
  const { canUseAi, recordAiUsage } = usePremium();

  // Learning Sequence States
  const [queue, setQueue] = useState<WordData[]>([]); // Current session array
  const [currentIndex, setCurrentIndex] = useState(0); // Pointer traversing the queue array
  const [isFlipped, setIsFlipped] = useState(false); // Controls display of definition (back of card)
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Auxiliary Generative Feature States: Mnemonics
  const [aiHook, setAiHook] = useState<string | null>(null);
  const [loadingHook, setLoadingHook] = useState(false);

  // Auxiliary Generative Feature States: Contexts
  const [contextExplanation, setContextExplanation] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  // AI Tutor / Doubt resolution chat flows
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatQ, setChatQ] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [chatSession, setChatSession] = useState<ReturnType<typeof createDoubtChat> | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);

  // AI upgrade gating
  const [showAiUpgrade, setShowAiUpgrade] = useState(false);

  // LocII Tier 1.2 — session fatigue: track per-session quality scores
  // and surface a non-blocking "take a break" prompt when late-window
  // accuracy drops noticeably below early-window. Resets per session.
  const [qualityHistory, setQualityHistory] = useState<number[]>([]);
  const [fatigueDismissed, setFatigueDismissed] = useState(false);
  const fatigueSignal = detectSessionFatigue(qualityHistory);

  // LocII Tier 2.1 — response time as quality signal. Capture the moment
  // a card is first shown; subtract from Date.now() at rating time to get
  // the total response latency in ms. The latency is forwarded to
  // recordReview, where it compounds with the category + difficulty
  // factors inside calculateAdaptiveMultiplier.
  const cardShownAtRef = useRef<number>(Date.now());

  /** Build initial learning sequence fetching explicitly due cards bounded by hard constraint thresholds. */
  useEffect(() => {
    // initialize session
    const due = getDueCards();
    const newCards = getNewCards(10); // Throttle incoming new words mathematically
    const sessionQueue = [...due, ...newCards].slice(0, 40); // Hard cap: max 40 reviews per session
    setQueue(sessionQueue);
  }, []);

  const currentCard = queue[currentIndex];

  /** Sweeps state cleanup sequentially per word transition preventing ghost memory leaks across cards. */
  useEffect(() => {
    // Reset AI states on next card
    setAiHook(currentCard?.aiMnemonic || null);
    setContextExplanation(null);
    setChatMessages([]);
    setChatQ('');
    setChatSession(null);
    setAiChatOpen(false);
    // Reset the response-time clock on every card transition.
    cardShownAtRef.current = Date.now();
  }, [currentIndex, currentCard]);

  /** Triggers browser-native OS TTS parsing constrained explicitly to generic en-IN metrics for accuracy. */
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentCard && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentCard.word);
      utterance.lang = 'en-IN'; // Changed to Indian English for better local pronunciation
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      if (settings.soundEffects) playFlip();
    }
  };

  /** Processes user feedback score determining SRS intervals via central context. */
  const handleRate = async (quality: number) => {
    if (!currentCard) return;
    
    // Generate AI hook if user struggles (quality <= 3)
    if (quality <= 3 && !aiHook) {
      // Just record they struggled, we could pre-fetch it here
    }

    const responseTimeMs = Date.now() - cardShownAtRef.current;
    recordReview(currentCard.id, quality, responseTimeMs);
    setQualityHistory(h => [...h, quality]);
    if (settings.soundEffects) {
      quality >= 3 ? playCorrect() : playIncorrect();
    }
    gainXp(10);

    if (currentIndex < queue.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(c => c + 1);
    } else {
      setSessionCompleted(true);
      canvasConfetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#FBBF24', '#10B981']
      });
      gainXp(50); // Bonus for finishing session
    }
  };

  /** Invokes centralized external API generating memory hooks explicitly for the specific card scope. */
  const requestAiMnemonic = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard || loadingHook) return;
    if (!canUseAi()) { setShowAiUpgrade(true); return; }
    setLoadingHook(true);
    const hook = await generateMnemonic(currentCard.word, currentCard.meaning);
    setAiHook(hook);
    recordAiUsage();
    setLoadingHook(false);
  };

  /** Generates localized context strings parsing explicitly to current settings preferences. */
  const requestContext = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard || loadingContext) return;
    if (!canUseAi()) { setShowAiUpgrade(true); return; }
    setLoadingContext(true);
    const explanation = await explainInContext(currentCard.word, settings.examTarget);
    setContextExplanation(explanation);
    recordAiUsage();
    setLoadingContext(false);
  };

  /** Multi-turn session initialization handling isolated chat components mapped generically to explicit term focus. */
  const submitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQ.trim() || !currentCard || loadingChat) return;
    if (!canUseAi()) { setShowAiUpgrade(true); return; }

    let session = chatSession;
    if (!session) {
      session = createDoubtChat(currentCard.word);
      setChatSession(session);
    }

    const questionText = chatQ.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: questionText }]);
    setChatQ('');
    setLoadingChat(true);

    try {
      const response = await session.sendMessage({ message: questionText });
      const answerText = response.text || "Could not generate answer.";
      setChatMessages(prev => [...prev, { role: 'ai', text: answerText }]);
      recordAiUsage();
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setLoadingChat(false);
    }
  };

  if (sessionCompleted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto mt-20">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
          <PartyPopper size={48} />
        </div>
        <h2 className="text-3xl font-black mb-4">Session Complete!</h2>
        <p className="text-slate-500 mb-8">You've successfully reviewed {queue.length} words. Take a break or do some practice quizzes!</p>
        <button
          onClick={() => {
            const due = getDueCards();
            const newCards = getNewCards(10);
            const sessionQueue = [...due, ...newCards].slice(0, 40);
            setQueue(sessionQueue);
            setCurrentIndex(0);
            setIsFlipped(false);
            setSessionCompleted(false);
            setQualityHistory([]);
            setFatigueDismissed(false);
          }}
          className="bg-[#4F46E5] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-transform"
        >
          Check for More Cards
        </button>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto mt-20">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
          <Umbrella size={48} />
        </div>
        <h2 className="text-3xl font-black mb-4">You're all caught up!</h2>
        <p className="text-slate-500 mb-8">No words due for review right now. Come back later or try a mock quiz.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 flex flex-col max-w-5xl w-full mx-auto min-h-[calc(100vh-160px)]">

      {/* LocII session-fatigue banner — non-blocking, dismissible per session */}
      {fatigueSignal.fatigued && !fatigueDismissed && (
        <div
          data-testid="fatigue-banner"
          className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shrink-0"
        >
          <div className="bg-amber-100 text-amber-700 p-2 rounded-xl shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">
              Accuracy dipped {Math.round(fatigueSignal.dropPercent)} points this session
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              You started at {Math.round(fatigueSignal.earlyAccuracy * 100)}% and you're at{' '}
              {Math.round(fatigueSignal.recentAccuracy * 100)}% now. Take a break and come back
              fresh — LocII will reschedule weaker cards for you.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setSessionCompleted(true)}
                className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
              >
                End session
              </button>
              <button
                onClick={() => setFatigueDismissed(true)}
                className="text-amber-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Keep going
              </button>
            </div>
          </div>
          <button
            onClick={() => setFatigueDismissed(true)}
            className="text-amber-700 hover:text-amber-900 p-1 -mr-1 -mt-1 shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Bar inside Learn */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="text-sm font-bold text-slate-500">
          Card {currentIndex + 1} of {queue.length}
        </div>
        <div className="flex items-center gap-2">
          <AiUsageIndicator compact />
          {!isFlipped && (
            <button
              onClick={() => setAiChatOpen(true)}
              className="text-[#4F46E5] text-sm font-bold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full"
            >
              <MessageCircle className="w-4 h-4" /> Got a doubt?
            </button>
          )}
        </div>
      </div>

      {/* Card Container */}
      <div className="relative flex-1 flex flex-col perspective-1000 max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            <motion.div
              key={`front-${currentIndex}`}
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (Math.abs(info.offset.x) > 50) {
                  handleFlip();
                }
              }}
              onClick={handleFlip}
              className="bg-white rounded-[32px] border border-slate-200 shadow-sm flex-1 flex flex-col items-center justify-center p-8 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-colors relative touch-pan-y"
            >
              <div className="absolute top-6 flex w-full px-8 justify-between">
                {(() => {
                  const examScore = getExamFrequency(currentCard, settings.examTarget);
                  const examLabel = frequencyLabel(examScore);
                  return (
                    <span className={`text-[10px] font-bold uppercase py-1 px-2 rounded-full ${
                      examLabel === 'Very High' ? 'bg-red-50 text-red-600' :
                      examLabel === 'High' ? 'bg-orange-50 text-orange-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {examLabel} in {settings.examTarget}
                    </span>
                  );
                })()}
                <span className="text-[10px] font-bold uppercase py-1 px-2 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                  {currentCard.category}
                </span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-center mb-6 break-words tracking-tight mt-4">{currentCard.word}</h2>
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={handleSpeak}
                  className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center hover:bg-indigo-100 transition-colors"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center gap-1 opacity-50 mt-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#4F46E5] bg-indigo-50 px-4 py-2 rounded-full shadow-sm animate-pulse">
                    Tap to reveal
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`back-${currentIndex}`}
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.x > 80) {
                  handleRate(4); // Swipe Right -> Good
                } else if (info.offset.x < -80) {
                  handleRate(0); // Swipe Left -> Again
                }
              }}
              className="bg-white rounded-[32px] border border-slate-200 shadow-sm flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto touch-pan-y"
            >
              <div className="mb-4">
                {(() => {
                  const examScore = getExamFrequency(currentCard, settings.examTarget);
                  const label = examScore >= 8 ? `Very high frequency in ${settings.examTarget}` :
                                examScore >= 6 ? `High frequency in ${settings.examTarget}` :
                                examScore >= 4 ? `Moderate frequency in ${settings.examTarget}` :
                                `General vocabulary`;
                  return (
                    <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
                      <span>📊</span>
                      <span>{label} (score: {examScore}/10)</span>
                    </div>
                  );
                })()}
                <div className="flex items-start justify-between pb-6 border-b border-slate-100">
                  <div className="flex-1">
                    <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
                      {currentCard.word}
                      <button onClick={handleSpeak} className="text-[#4F46E5] hover:text-indigo-600">
                        <Volume2 className="w-6 h-6" />
                      </button>
                    </h2>
                    {settings.showHindi && (
                      <p className="text-indigo-600 font-bold mb-2">{currentCard.hindiTranslation}</p>
                    )}
                    <p className="text-lg text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="font-bold block mb-1 text-slate-400 uppercase text-[10px] tracking-wider">Meaning</span>
                      {currentCard.meaning}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div>
                  <span className="font-bold block mb-2 text-slate-400 uppercase text-[10px] tracking-wider">Example</span>
                  <p className="text-slate-600 italic border-l-2 border-indigo-200 pl-4 py-1">
                    "{currentCard.exampleSentence}"
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentCard.synonyms.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="font-bold block mb-2 text-slate-400 uppercase text-[10px] tracking-wider">Synonyms</span>
                      <div className="flex flex-wrap gap-2">
                        {currentCard.synonyms.map(s => (
                          <span key={s} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentCard.antonyms.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="font-bold block mb-2 text-slate-400 uppercase text-[10px] tracking-wider">Antonyms</span>
                      <div className="flex flex-wrap gap-2">
                        {currentCard.antonyms.map(a => (
                          <span key={a} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* AI Explain in Context Section */}
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl col-span-1 sm:col-span-2 relative overflow-hidden">
                    <span className="font-bold block mb-2 text-indigo-700 uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <BookOpen size={12} /> Explain in {settings.examTarget} Context
                    </span>
                    {contextExplanation ? (
                      <p className="text-indigo-900 font-medium text-sm whitespace-pre-line">{contextExplanation}</p>
                    ) : (
                      <button 
                        onClick={requestContext}
                        disabled={loadingContext}
                        className="text-indigo-700 text-sm font-bold flex items-center gap-2 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors w-full justify-center border border-dashed border-indigo-300"
                      >
                        {loadingContext ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {loadingContext ? 'Analyzing Exam Context...' : 'How is this asked in exams?'}
                      </button>
                    )}
                  </div>

                  {/* AI Mnemonic Section */}
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl col-span-1 sm:col-span-2 relative overflow-hidden">
                    <span className="font-bold block mb-2 text-amber-700 uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <Sparkles size={12} /> AI Memory Hook
                    </span>
                    {aiHook ? (
                      <p className="text-amber-900 font-medium text-sm">{aiHook}</p>
                    ) : (
                      <button 
                        onClick={requestAiMnemonic}
                        disabled={loadingHook}
                        className="text-amber-700 text-sm font-bold flex items-center gap-2 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors w-full justify-center border border-dashed border-amber-300"
                      >
                        {loadingHook ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                        {loadingHook ? 'Generating Hook...' : 'Generate Mnemonic to help remember'}
                      </button>
                    )}
                  </div>
                </div>

                {currentCard.etymology && (
                  <div className="text-sm text-slate-500">
                    <span className="font-bold block mb-1 text-slate-400 uppercase text-[10px] tracking-wider">Etymology</span>
                    {currentCard.etymology}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Chat Modal Overlay */}
        <AnimatePresence>
          {aiChatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-x-0 bottom-0 top-1/4 bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-t-[32px] p-6 z-20 flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black flex items-center gap-2"><MessageCircle className="w-5 h-5 text-[#4F46E5]" /> AI Tutor</h3>
                <button onClick={() => setAiChatOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto mb-4 text-sm text-slate-700 space-y-3">
                <p className="bg-slate-100 p-3 rounded-xl">Ask me anything about "{currentCard?.word}". Confused about a synonym? Exam usage?</p>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`p-3 rounded-xl max-w-[90%] w-max ${msg.role === 'user' ? 'bg-slate-800 text-white ml-auto' : 'bg-indigo-50 border border-indigo-100 text-indigo-900 font-medium mr-auto'}`}>
                    {msg.text}
                  </div>
                ))}
                {loadingChat && (
                   <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl max-w-[90%] mr-auto text-indigo-900 font-medium animate-pulse">
                     Thinking...
                   </div>
                )}
              </div>
              <form onSubmit={submitDoubt} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatQ}
                  onChange={e => setChatQ(e.target.value)}
                  placeholder="Type your doubt..."
                  className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                />
                <button 
                  type="submit"
                  disabled={loadingChat || !chatQ.trim()}
                  className="bg-[#4F46E5] text-white p-2 rounded-xl disabled:opacity-50"
                >
                  {loadingChat ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="mt-6 shrink-0 h-20">
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            <div className="h-16 flex items-center justify-center text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">
              {/* Optional secondary helper text could go here, replacing the redundant button */}
            </div>
          ) : (
            <motion.div
              key="rate-btns"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-4 gap-2 lg:gap-4 h-16"
            >
              <button onClick={() => handleRate(0)} className="bg-red-50 text-red-600 rounded-[20px] font-black flex flex-col items-center justify-center hover:bg-red-100 active:scale-95 transition-all border border-red-100">
                <span className="text-xl leading-none flex items-center justify-center"><Frown size={24} /></span>
                <span className="text-[10px] uppercase tracking-wider mt-1">Again</span>
              </button>
              <button onClick={() => handleRate(3)} className="bg-orange-50 text-orange-600 rounded-[20px] font-black flex flex-col items-center justify-center hover:bg-orange-100 active:scale-95 transition-all border border-orange-100">
                <span className="text-xl leading-none flex items-center justify-center"><Meh size={24} /></span>
                <span className="text-[10px] uppercase tracking-wider mt-1">Hard</span>
              </button>
              <button onClick={() => handleRate(4)} className="bg-emerald-50 text-emerald-600 rounded-[20px] font-black flex flex-col items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all border border-emerald-100">
                <span className="text-xl leading-none flex items-center justify-center"><Smile size={24} /></span>
                <span className="text-[10px] uppercase tracking-wider mt-1">Good</span>
              </button>
              <button onClick={() => handleRate(5)} className="bg-[#4F46E5] text-white rounded-[20px] font-black flex flex-col items-center justify-center hover:bg-indigo-600 active:scale-95 transition-all shadow-lg shadow-indigo-200">
                <span className="text-xl leading-none flex items-center justify-center"><SmilePlus size={24} /></span>
                <span className="text-[10px] uppercase tracking-wider mt-1">Easy</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <UpgradeModal
        open={showAiUpgrade}
        onClose={() => setShowAiUpgrade(false)}
        feature="AI calls"
      />
    </div>
  );
}

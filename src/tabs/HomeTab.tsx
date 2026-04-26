/**
 * @file HomeTab.tsx
 * @description Dashboard view displaying aggregate overview of user metrics, daily progress rings, and quick actions.
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle, Gift, Lightbulb, Languages } from 'lucide-react';

/**
 * Controller mapped to the default '/' route rendering top-level statistics and daily engagement constraints.
 */
export default function HomeTab() {
  const { stats, settings, userWords, words } = useApp();
  const navigate = useNavigate();

  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState<'Vocab' | 'Idiom' | 'Phrase'>('Vocab');

  const wordsKnown = Object.keys(userWords).length;
  const mastered = Object.values(userWords).filter(w => w.status === 'mastered').length;
  const learning = wordsKnown - mastered;
  
  const { vocabWord, idiomWord, phraseWord } = useMemo(() => {
    const idioms = words.filter(w => w.category === 'Idioms');
    const phrasalVerbs = words.filter(w => w.category === 'Phrasal Verbs');
    const vocab = words.filter(w => ['Vocabulary', 'One-word Substitutions'].includes(w.category));
    
    // Very simplistic "word of the day" logic based on date to ensure it changes daily
    const todayIndex = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
    
    return {
      vocabWord: vocab.length ? vocab[todayIndex % vocab.length] : words[0],
      idiomWord: idioms.length ? idioms[todayIndex % idioms.length] : words[0],
      phraseWord: phrasalVerbs.length ? phrasalVerbs[todayIndex % phrasalVerbs.length] : words[0],
    };
  }, [words]);

  const currentKnowledgeWord = activeKnowledgeTab === 'Idiom' ? idiomWord : activeKnowledgeTab === 'Phrase' ? phraseWord : vocabWord;

  const goalProgress = stats.wordsLearnedToday + stats.reviewsCompletedToday;
  const goalTarget = settings.dailyGoal;
  const goalPercentage = Math.min(100, Math.round((goalProgress / goalTarget) * 100));
  
  // Circumference for the circle progress (r=70) -> 2*pi*70 = 439.8
  const dashOffset = 440 - (440 * goalPercentage) / 100;

  return (
    <div className="p-4 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 max-w-7xl mx-auto">
      <section className="col-span-1 md:col-span-7 flex flex-col gap-6">
        
        {/* Welcome Goal Card */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 w-2/3 lg:w-auto">
            <h2 className="text-2xl lg:text-3xl font-black mb-2 truncate">Namaste, {settings.userName}! 👋</h2>
            <p className="text-slate-500 mb-6 lg:mb-8 max-w-xs text-sm lg:text-base">
              {goalPercentage >= 100 
                ? "You've crushed your daily goal! Keep going if you feel like it." 
                : `You're ${goalPercentage}% through your daily goal. Smash it to keep the streak!`}
            </p>
            <button 
              onClick={() => navigate('/learn')}
              className="bg-[#4F46E5] text-white px-6 py-4 lg:px-8 lg:py-5 rounded-2xl font-bold text-lg lg:text-xl shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-transform flex items-center gap-3 w-max"
            >
              <span>{wordsKnown === 0 ? "Start First Session" : "Continue Learning"}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5 lg:w-6 lg:h-6"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
          
          {/* Progress Ring */}
          <div className="absolute right-4 top-4 lg:right-8 lg:top-8 w-32 h-32 lg:w-40 lg:h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="50%" cy="50%" r="40%" stroke="#F1F5F9" strokeWidth="12%" fill="transparent"/>
              <circle cx="50%" cy="50%" r="40%" stroke="#4F46E5" strokeWidth="12%" fill="transparent" strokeDasharray="440" strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-1000 ease-out"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl lg:text-3xl font-black text-[#4F46E5]">{goalProgress}/{goalTarget}</span>
              <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase">Words Today</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 lg:gap-4">
          <div className="bg-white p-4 lg:p-5 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center items-center lg:items-start text-center lg:text-left relative overflow-hidden">
            <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Words Known</span>
            <span className="text-xl lg:text-2xl font-black">{wordsKnown}</span>
            {wordsKnown === 0 && <span className="absolute bottom-0 inset-x-0 text-[10px] text-center bg-indigo-50 text-indigo-600 block leading-none py-1.5 font-bold">Start learning!</span>}
          </div>
          <div className="bg-white p-4 lg:p-5 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
            <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Learning</span>
            <span className="text-xl lg:text-2xl font-black text-[#4F46E5]">{learning}</span>
          </div>
          <div className="bg-white p-4 lg:p-5 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
            <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mastered</span>
            <span className="text-xl lg:text-2xl font-black text-emerald-500">{mastered}</span>
          </div>
        </div>

        {/* Daily Quests */}
        <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="bg-indigo-100 p-1.5 rounded-lg text-[#4F46E5] leading-none">
               <Target className="w-5 h-5" />
            </span> 
            Daily Quests
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span>Learn/Review Today's Goal</span>
                  <span className="text-indigo-600">{Math.min(goalProgress, goalTarget)}/{goalTarget}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4F46E5] rounded-full transition-all duration-1000" style={{ width: `${goalPercentage}%` }}></div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-slate-50 border border-slate-200">
                {goalPercentage >= 100 ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Gift className="w-5 h-5 text-slate-400" />}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span>Complete 1 Mock Quiz</span>
                  <span className="text-emerald-600">0/1</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden text-center">
                  <div className="h-full bg-emerald-400 rounded-full w-0 transition-all duration-1000"></div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-emerald-50 border border-emerald-200">
                <Gift className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

      </section>

      <section className="col-span-1 md:col-span-5 flex flex-col gap-6">
        
        {/* Daily Knowledge */}
        <div className="bg-[#4F46E5] rounded-[32px] p-6 lg:p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200 flex flex-col min-h-[340px]">
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none snap-x relative z-20">
              <button 
                onClick={() => setActiveKnowledgeTab('Vocab')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap snap-center transition-colors border ${activeKnowledgeTab === 'Vocab' ? 'bg-white text-indigo-700 border-white' : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'}`}
              >
                Word of the Day
              </button>
              <button 
                onClick={() => setActiveKnowledgeTab('Idiom')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap snap-center transition-colors border ${activeKnowledgeTab === 'Idiom' ? 'bg-white text-indigo-700 border-white' : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'}`}
              >
                Idiom of the Day
              </button>
              <button 
                onClick={() => setActiveKnowledgeTab('Phrase')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap snap-center transition-colors border ${activeKnowledgeTab === 'Phrase' ? 'bg-white text-indigo-700 border-white' : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'}`}
              >
                Phrase of the Day
              </button>
            </div>
            
            <h3 className="text-3xl lg:text-4xl font-black mb-2 tracking-tight break-words pr-8">{currentKnowledgeWord.word}</h3>
            <p className="text-indigo-100 italic mb-4 text-sm lg:text-base">— {currentKnowledgeWord.category}</p>
            
            <div className="bg-white/10 p-4 rounded-2xl mb-6 backdrop-blur-sm border border-white/10 mt-auto">
              <p className="text-sm lg:text-base leading-relaxed mb-2 font-medium">{currentKnowledgeWord.meaning}</p>
              <p className="text-xs lg:text-sm text-indigo-200 font-medium italic">"{currentKnowledgeWord.exampleSentence}"</p>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 relative z-20">
              {/* Dummy Mnemonic, ideally we generate or have one */}
              <div className="flex-1 bg-[#FBBF24] p-3 rounded-xl text-[#1E293B] flex items-center gap-3">
                <Lightbulb className="w-6 h-6 shrink-0" />
                <div className="leading-none flex flex-col overflow-hidden">
                  <span className="text-[10px] font-bold block uppercase opacity-70">Focus</span>
                  <span className="text-xs font-bold truncate">Learn it today!</span>
                </div>
              </div>
              {settings.showHindi && currentKnowledgeWord.hindiTranslation && currentKnowledgeWord.hindiTranslation.trim() !== '' && (
                <div className="flex-1 bg-white/10 p-3 rounded-xl flex items-center gap-3 border border-white/10">
                  <Languages className="w-6 h-6 shrink-0" />
                  <div className="leading-none flex flex-col overflow-hidden">
                    <span className="text-[10px] font-bold block uppercase opacity-70">Hindi</span>
                    <span className="text-xs font-bold truncate">{currentKnowledgeWord.hindiTranslation}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 lg:-right-12 lg:-bottom-12 w-40 h-40 lg:w-48 lg:h-48 bg-white/10 rounded-full blur-2xl lg:blur-3xl pointer-events-none"></div>
        </div>

        {/* Exam Focus Area */}
        <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex-1 flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
            <span>Exam Focus: {settings.examTarget}</span>
            <span onClick={() => navigate('/profile')} className="text-xs text-slate-400 font-normal underline cursor-pointer">Change Target</span>
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-bold">Accuracy</span>
              </div>
              <span className="text-sm font-black">N/A</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#FBBF24]"></div>
                <span className="text-sm font-bold">Vocabulary Range</span>
              </div>
              <span className="text-sm font-black text-slate-500">Developing</span>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#4F46E5]">
                <div className="w-2 h-2 rounded-full bg-[#4F46E5]"></div>
                <span className="text-sm font-bold">Exam Readiness</span>
              </div>
              <span className="text-sm font-black text-[#4F46E5]">{mastered > 10 ? 'Intermediate' : 'Beginner'}</span>
            </div>
          </div>
          
          <div className="mt-6 bg-slate-50 h-24 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-500 text-sm font-medium p-4 text-center">
            {wordsKnown === 0 ? (
              <>
                <span className="text-slate-600 font-bold mb-1">No data yet!</span>
                <span className="text-xs opacity-80">Complete a few sessions to unlock your performance chart.</span>
              </>
            ) : (
              <>
                <span className="text-slate-600 font-bold mb-1">Tracking your progress...</span>
                <span className="text-xs opacity-80">Detailed exam charts will appear here as you learn more.</span>
              </>
             )}
          </div>
        </div>
      </section>
    </div>
  );
}

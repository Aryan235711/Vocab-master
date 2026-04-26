/**
 * @file ProgressTab.tsx
 * @description Visualizations of performance metrics, streaks, and transparency views into the LocII (Locally Integrated Intelligence) engine.
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Star, Flame } from 'lucide-react';

/**
 * Centralized dashboard controller parsing raw accuracy and streak data into gamified UI components.
 */
export default function ProgressTab() {
  const { stats, userWords, words } = useApp();
  
  const wordsKnown = Object.keys(userWords).length;
  const mastered = Object.values(userWords).filter(w => w.status === 'mastered').length;
  const totalDb = words.length;

  const activeLearning = wordsKnown - mastered;
  const unseen = totalDb - wordsKnown;

  const masteredPct = (mastered / totalDb) * 100 || 0;
  const learningPct = (activeLearning / totalDb) * 100 || 0;
  const unseenPct = (unseen / totalDb) * 100 || 0;

  return (
    <div className="p-4 lg:p-8 max-w-5xl w-full mx-auto flex flex-col gap-6">
      <h2 className="text-3xl font-black mb-2">Your Progress</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8 mb-4">
        <div className="bg-[#4F46E5] text-white p-6 rounded-[32px] shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-80">Current Level</span>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-4xl font-black">{stats.level}</span>
              <span className="bg-indigo-300 text-indigo-900 text-[10px] px-2 py-1 rounded font-bold uppercase shadow-sm">
                {stats.level < 5 ? "Bronze" : stats.level < 15 ? "Silver" : "Gold"}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-bold mb-1 opacity-70">
                <span>XP Progress</span>
                <span>{stats.xp % 500} / 500 XP</span>
              </div>
              <div className="h-1.5 bg-indigo-900/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000" 
                  style={{ width: `${(stats.xp % 500) / 5}%` }}
                />
              </div>
            </div>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-20">
             <Star size={100} fill="currentColor" />
          </div>
        </div>
        
        <div className="bg-orange-50 text-orange-900 border border-orange-100 p-6 rounded-[32px] shadow-sm relative overflow-hidden">
          <div className="relative z-10">
             <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-60 text-orange-800">Streak</span>
             <span className="text-4xl font-black block mb-2 text-orange-600">{stats.streak}</span>
             <div className="flex items-center text-[10px] lg:text-sm font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded-full w-max mt-1 gap-1">
               {stats.streak === 0 ? "Start a streak! 🔥" : "Days Straight 🔥"}
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Vocabulary Distribution</h3>
        
        {/* Continuous Stacked Progress Bar */}
        <div className="h-5 w-full rounded-full overflow-hidden flex mb-6 bg-slate-100 shadow-inner">
          <div className="bg-emerald-400 h-full transition-all" style={{ width: `${masteredPct}%` }}></div>
          <div className="bg-[#4F46E5] h-full transition-all" style={{ width: `${learningPct}%` }}></div>
          <div className="bg-slate-200 h-full transition-all" style={{ width: `${unseenPct}%` }}></div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-bold text-emerald-600 mb-1 flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Mastered
            </div>
            <div className="font-medium text-slate-500">{mastered}</div>
          </div>
          <div>
            <div className="font-bold text-indigo-600 mb-1 flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#4F46E5]"></div> Learning
            </div>
            <div className="font-medium text-slate-500">{activeLearning}</div>
          </div>
          <div>
             <div className="font-bold text-slate-500 mb-1 flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-slate-300"></div> Unseen
            </div>
            <div className="font-medium text-slate-400">{unseen}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Activity Heatmap</h3>
        {stats.streak === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-sm font-medium border-dashed p-4">
            <p className="mb-1 text-center font-bold text-slate-600">No activity yet</p>
            <p className="text-xs text-slate-400 text-center">Start learning words to build your streak and light up this heatmap!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-sm font-medium border-dashed p-4">
            <p className="mb-1 text-center font-bold text-slate-600">You're maintaining a {stats.streak}-day streak! 🔥</p>
            <p className="text-xs text-slate-400 text-center">Detailed activity visualization charts are arriving in an upcoming update.</p>
          </div>
        )}
      </div>
      <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
          </span>
          LocII Engine
        </h3>
        
        <div className="space-y-4 relative z-10">
          <p className="text-sm text-slate-500 mb-2">VocabDost's LocII (Locally Integrated Intelligence) analyzes your performance across different categories to optimize your learning intervals.</p>
          
          {Object.keys(stats.categoryStats || {}).length === 0 ? (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center text-sm text-slate-500">
               Complete some reviews for LocII to analyze your strengths.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['Vocabulary', 'Idioms', 'Phrasal Verbs', 'One-word Substitutions'].map(cat => {
                const cStats = stats.categoryStats?.[cat];
                if (!cStats || cStats.total === 0) return null;
                const accuracy = cStats.correct / cStats.total;
                let status = "Balanced Spacing";
                let colorClass = "text-slate-600 bg-slate-100";
                let multiplier = 1.0;
                
                if (accuracy < 0.6) {
                  status = "Prioritized (Hard)";
                  colorClass = "text-rose-700 bg-rose-100";
                  multiplier = 0.8;
                } else if (accuracy > 0.85) { // Matches srs.ts threshold
                  status = "Reduced Frequency";
                  colorClass = "text-emerald-700 bg-emerald-100";
                  multiplier = 1.2;
                }

                return (
                  <div key={cat} className="flex flex-col p-3 rounded-2xl border border-slate-100 bg-slate-50 relative overflow-hidden">
                    <span className="font-semibold text-sm text-slate-800 mb-1">{cat}</span>
                    <span className="text-[10px] font-bold text-slate-400 absolute top-3 right-3 uppercase">x{multiplier.toFixed(1)} Multiplier</span>
                    <div className="flex justify-between items-end mt-4">
                      <span className="text-xs font-medium text-slate-500">
                        {Math.round(accuracy * 100)}% Accuracy
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${colorClass}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

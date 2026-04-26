import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, BookOpen, User, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default function Onboarding() {
  const { settings, updateSettings } = useApp();
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [exam, setExam] = useState('SSC CGL');
  const [goal, setGoal] = useState<number>(10);

  const completeOnboarding = () => {
    updateSettings({
      userName: name.trim() || 'Aspirant',
      examTarget: exam,
      dailyGoal: goal,
      hasCompletedOnboarding: true
    });
  };

  const steps = [
    // Step 0: Welcome
    <motion.div
      key="step0"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col items-center text-center h-full justify-center p-8 max-w-lg mx-auto"
    >
      <div className="w-24 h-24 bg-[#4F46E5] rounded-[32px] flex items-center justify-center shadow-xl shadow-indigo-200 mb-8 transform rotate-12">
        <BookOpen stroke="white" strokeWidth="2.5" className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-black mb-4 tracking-tight text-slate-900">VocabDost</h1>
      <p className="text-sm text-slate-400 font-semibold -mt-2 mb-4 italic">The friend who never lets you forget.</p>
      <p className="text-lg text-slate-500 mb-8 max-w-sm">Learn smarter, not harder. Master vocabulary for Indian Government exams using spaced repetition.</p>
      
      <button 
        onClick={() => setStep(1)}
        className="bg-[#4F46E5] text-white w-full py-4 rounded-2xl font-bold text-xl shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
      >
        <span>Get Started</span>
        <ArrowRight className="w-6 h-6" />
      </button>
    </motion.div>,

    // Step 1: Exam Target
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full justify-center p-8 max-w-lg mx-auto w-full"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-[#4F46E5]">
          <Target className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black">What are you preparing for?</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-3 mb-8 flex-1 content-center">
        {['SSC CGL', 'SSC CHSL', 'UPSC CSAT', 'Banking / IBPS'].map(e => (
          <button
            key={e}
            onClick={() => setExam(e)}
            className={`p-4 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between ${
              exam === e ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span>{e}</span>
            {exam === e && <CheckCircle2 className="w-6 h-6" />}
          </button>
        ))}
      </div>

      <button 
        onClick={() => setStep(2)}
        className="bg-[#4F46E5] text-white w-full py-4 rounded-2xl font-bold text-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
      >
        <span>Continue</span>
        <ArrowRight className="w-6 h-6" />
      </button>
    </motion.div>,

    // Step 2: Goal & Name
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full justify-center p-8 max-w-lg mx-auto w-full"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-[#4F46E5]">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black">Set your goal</h2>
      </div>
      
      <div className="flex-1 flex flex-col justify-center gap-8">
        <div>
          <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Your Name (Optional)</label>
          <input 
            type="text" 
            placeholder="Aspirant"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all text-lg"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Daily Goal</label>
            <span className="font-black text-2xl text-[#4F46E5]">{goal} <span className="text-sm font-bold text-slate-400">words/day</span></span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[5, 10, 20].map(g => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`p-4 rounded-2xl border-2 text-center font-bold flex flex-col items-center gap-1 transition-all ${
                  goal === g ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-xl">{g}</span>
                <span className="text-[10px] uppercase opacity-70">{g === 5 ? 'Casual' : g === 10 ? 'Regular' : 'Intense'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={completeOnboarding}
        className="bg-[#4F46E5] text-white w-full py-4 rounded-2xl font-bold text-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 mt-8"
      >
        <Zap className="w-6 h-6" />
        <span>Start Learning</span>
      </button>
    </motion.div>
  ];

  return (
    <div className="h-[100dvh] w-full bg-[#F8FAFC] flex flex-col overflow-hidden text-[#1E293B]">
      {/* Progress bar */}
      <div className="h-1 bg-slate-200 w-full shrink-0">
        <div 
          className="h-full bg-[#4F46E5] transition-all duration-500 rounded-r-full"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>
      
      <div className="flex-1 overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>
      </div>
    </div>
  );
}

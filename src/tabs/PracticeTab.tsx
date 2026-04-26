/**
 * @file PracticeTab.tsx
 * @description Gamified learning modules complementing the core SRS algorithm.
 * Free tier: Quick Quiz only. Other 3 modes show a 3-question demo, then upgrade modal.
 * Premium+: all 4 modes fully unlocked.
 */

import React, { useState } from 'react';
import { Timer, Activity, PenTool, GraduationCap, CheckCircle2, XCircle, Lock, Crown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { playCorrect, playIncorrect } from '../utils/sound';
import UpgradeModal from '../components/UpgradeModal';

interface QuizQuestion {
  word: string;
  correct: string;
  options: string[];
  title?: string;
}
import { motion } from 'framer-motion';

const DEMO_QUESTION_COUNT = 3;

export default function PracticeTab() {
  const { stats, settings, words, userWords, updateBestScore, gainXp } = useApp();
  const { isGameModeUnlocked, isPremiumFeature, softLaunch } = usePremium();

  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState('');

  // Quiz state
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);

  React.useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timerActive && timeLeft <= 0) {
      setQuizFinished(true);
      setTimerActive(false);
      updateBestScore(activeQuiz || '', score);
      gainXp(score * 10);
    }
  }, [timeLeft, timerActive, activeQuiz, score]);

  // ─── Quiz Generators ──────────────────────────────────────────

  const startQuickQuiz = () => {
    const encounteredWordIds = Object.keys(userWords);
    let pool = words.filter(w => encounteredWordIds.includes(w.id));
    if (pool.length < 10) pool = [...words];

    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);
    const qs = shuffled.map(w => {
      const options = [w.meaning];
      let attempts = 0;
      while (options.length < 4 && attempts < 50) {
        const randomW = words[Math.floor(Math.random() * words.length)];
        if (randomW.id !== w.id && !options.includes(randomW.meaning)) options.push(randomW.meaning);
        attempts++;
      }
      return { word: w.word, correct: w.meaning, options: options.sort(() => 0.5 - Math.random()) };
    });

    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setQuizFinished(false);
    setIsDemoMode(false);
    setActiveQuiz('quickQuiz');
  };

  const startSynonymSprint = (demo = false) => {
    let pool = words.filter(w => w.synonyms && w.synonyms.length > 0);
    if (pool.length < 10) pool = [...words];

    const limit = demo ? DEMO_QUESTION_COUNT : 30;
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, limit);
    const qs = shuffled.map(w => {
      const correctSynonym = w.synonyms && w.synonyms.length > 0 ? w.synonyms[0] : w.meaning;
      const options = [correctSynonym];
      let attempts = 0;
      while (options.length < 4 && attempts < 50) {
        const randomW = pool[Math.floor(Math.random() * pool.length)];
        if (randomW.id === w.id) { attempts++; continue; }
        const badOpt = randomW.synonyms && randomW.synonyms.length > 0 ? randomW.synonyms[0] : randomW.meaning;
        if (!options.includes(badOpt)) options.push(badOpt);
        attempts++;
      }
      return { word: w.word, correct: correctSynonym, options: options.sort(() => 0.5 - Math.random()), title: 'Select the synonym' };
    });

    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setQuizFinished(false);
    setIsDemoMode(demo);
    setActiveQuiz('synonymSprint');
    // No timer in demo mode
    if (!demo) {
      setTimeLeft(60);
      setTimerActive(true);
    } else {
      setTimeLeft(0);
      setTimerActive(false);
    }
  };

  const startSentenceFill = (demo = false) => {
    let pool = words.filter(w => w.exampleSentence);
    if (pool.length < 10) pool = [...words];

    const limit = demo ? DEMO_QUESTION_COUNT : 10;
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, limit);
    const qs = shuffled.map(w => {
      const regex = new RegExp(w.word, 'ig');
      const sentence = w.exampleSentence ? w.exampleSentence.replace(regex, '________') : `This is an example for ________.`;
      const options = [w.word];
      let attempts = 0;
      while (options.length < 4 && attempts < 50) {
        const randomW = words[Math.floor(Math.random() * words.length)];
        if (randomW.id !== w.id && !options.includes(randomW.word)) options.push(randomW.word);
        attempts++;
      }
      return { word: sentence, correct: w.word, options: options.sort(() => 0.5 - Math.random()), title: 'Fill the blank' };
    });

    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setQuizFinished(false);
    setIsDemoMode(demo);
    setActiveQuiz('sentenceFill');
    setTimeLeft(0);
    setTimerActive(false);
  };

  const startIdiomsMatch = (demo = false) => {
    let pool = words.filter(w => w.category === 'Idioms');
    if (pool.length < 10) pool = [...words];

    const limit = demo ? DEMO_QUESTION_COUNT : 10;
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, limit);
    const qs = shuffled.map(w => {
      const options = [w.meaning];
      let attempts = 0;
      while (options.length < 4 && attempts < 50) {
        const randomW = words[Math.floor(Math.random() * words.length)];
        if (randomW.id !== w.id && !options.includes(randomW.meaning)) options.push(randomW.meaning);
        attempts++;
      }
      return { word: w.word, correct: w.meaning, options: options.sort(() => 0.5 - Math.random()), title: 'What does this idiom mean?' };
    });

    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setQuizFinished(false);
    setIsDemoMode(demo);
    setActiveQuiz('idiomsMatch');
    setTimeLeft(0);
    setTimerActive(false);
  };

  // ─── Mode Click Handler ───────────────────────────────────────

  const handleModeClick = (modeId: string) => {
    if (modeId === 'quickQuiz') return startQuickQuiz();

    const unlocked = isGameModeUnlocked(modeId);

    if (unlocked) {
      if (modeId === 'synonymSprint') startSynonymSprint();
      else if (modeId === 'sentenceFill') startSentenceFill();
      else if (modeId === 'idiomsMatch') startIdiomsMatch();
    } else {
      // Locked: start 3-question demo
      if (modeId === 'synonymSprint') startSynonymSprint(true);
      else if (modeId === 'sentenceFill') startSentenceFill(true);
      else if (modeId === 'idiomsMatch') startIdiomsMatch(true);
    }
  };

  // ─── Answer Handler ───────────────────────────────────────────

  const handleAnswer = (opt: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(opt);

    const isCorrect = opt === questions[qIndex].correct;
    if (isCorrect) {
      setScore(s => s + 1);
      if (settings.soundEffects) playCorrect();
    } else {
      if (settings.soundEffects) playIncorrect();
    }

    setTimeout(() => {
      if (qIndex < questions.length - 1) {
        setQIndex(qIndex + 1);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
        if (activeQuiz === 'synonymSprint') setTimerActive(false);

        if (isDemoMode) {
          // Demo finished → show upgrade modal
          const modeTitle = modes.find(m => m.id === activeQuiz)?.title || 'this game mode';
          setUpgradeFeatureName(modeTitle);
          setShowUpgradeModal(true);
        } else {
          const finalScore = score + (isCorrect ? 1 : 0);
          updateBestScore(activeQuiz || '', finalScore);
          const earnedXp = finalScore * 20;
          if (earnedXp > 0) gainXp(earnedXp);
        }
      }
    }, 1500);
  };

  // ─── Mode Definitions ─────────────────────────────────────────

  const modes = [
    { id: 'quickQuiz', title: 'Quick Quiz', desc: '10 random multiple-choice questions', icon: <Timer size={36} />, color: 'bg-[#4F46E5]' },
    { id: 'synonymSprint', title: 'Synonym Sprint', desc: 'Pick the synonym, beat the 60s timer', icon: <Activity size={36} />, color: 'bg-[#FBBF24]', textDark: true },
    { id: 'sentenceFill', title: 'Sentence Fill', desc: 'Complete the sentence', icon: <PenTool size={36} />, color: 'bg-emerald-500' },
    { id: 'idiomsMatch', title: 'Idioms Match', desc: 'Match idioms to their meanings', icon: <GraduationCap size={36} />, color: 'bg-slate-800' },
  ];

  // ─── Quiz Active View ─────────────────────────────────────────

  if (activeQuiz) {
    if (quizFinished) {
      return (
        <div className="p-4 lg:p-8 flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center mt-20">
          <div className="w-24 h-24 bg-indigo-100 text-[#4F46E5] rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black mb-4">
            {isDemoMode ? 'Demo Complete!' : 'Quiz Complete!'}
          </h2>
          <p className="text-xl mb-2 font-bold text-slate-700">
            You scored {score}/{isDemoMode ? DEMO_QUESTION_COUNT : activeQuiz === 'synonymSprint' ? score : questions.length}
          </p>
          {isDemoMode ? (
            <p className="text-slate-500 mb-8">
              That was a taste! Upgrade to unlock the full game.
            </p>
          ) : (
            <p className="text-slate-500 mb-8">+ {score * 20} XP Earned</p>
          )}
          <button
            onClick={() => {
              setActiveQuiz(null);
              setTimerActive(false);
              setIsDemoMode(false);
            }}
            className="w-full bg-[#4F46E5] text-white py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-indigo-600 transition-colors active:scale-95 transition-transform"
          >
            Back to Practice
          </button>

          <UpgradeModal
            open={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            feature={upgradeFeatureName}
          />
        </div>
      );
    }

    const currentQ = questions[qIndex];

    return (
      <div className="p-4 lg:p-8 max-w-5xl w-full mx-auto flex flex-col min-h-[calc(100vh-160px)]">
        <div className="flex justify-between items-center mb-8 shrink-0">
          <button
            onClick={() => { setActiveQuiz(null); setTimerActive(false); setIsDemoMode(false); }}
            className="text-slate-400 font-bold hover:text-slate-600 border border-slate-200 px-4 py-2 rounded-xl active:scale-95 transition-transform"
          >
            Quit
          </button>

          <div className="flex items-center gap-2">
            {isDemoMode && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                Demo
              </span>
            )}
            {activeQuiz === 'synonymSprint' && !isDemoMode ? (
              <span className={`font-bold px-4 py-2 rounded-full ${timeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                Time: {timeLeft}s
              </span>
            ) : (
              <span className="font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
                Question {qIndex + 1}/{questions.length}
              </span>
            )}
          </div>

          <span className="font-black text-[#4F46E5] text-xl">Score: {score}</span>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
          <motion.div
            key={qIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-6 lg:p-10 border border-slate-200 shadow-sm w-full"
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-6 bg-slate-50 w-max mx-auto px-4 py-1.5 rounded-full border border-slate-100">
              {currentQ.title || 'Select the meaning'}
            </h3>
            <h2 className={`font-black text-center mb-10 text-indigo-900 tracking-tight ${activeQuiz === 'sentenceFill' || activeQuiz === 'idiomsMatch' ? 'text-3xl' : 'text-4xl lg:text-5xl'}`}>
              {currentQ.word}
            </h2>

            <div className="flex flex-col gap-3">
              {currentQ.options.map((opt: string, i: number) => {
                let statusClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50';
                if (selectedAnswer) {
                  if (opt === currentQ.correct) {
                    statusClass = 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-md shadow-emerald-100';
                  } else if (opt === selectedAnswer) {
                    statusClass = 'bg-red-50 border-red-500 text-red-800 shadow-md shadow-red-100';
                  } else {
                    statusClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
                  }
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    disabled={!!selectedAnswer}
                    className={`p-4 border-2 rounded-2xl font-bold text-left transition-all flex items-center justify-between active:scale-[0.98] ${statusClass}`}
                  >
                    <span>{opt}</span>
                    {selectedAnswer && opt === currentQ.correct && <CheckCircle2 className="text-emerald-500 w-6 h-6 shrink-0 ml-4" />}
                    {selectedAnswer === opt && opt !== currentQ.correct && <XCircle className="text-red-500 w-6 h-6 shrink-0 ml-4" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Mode Selection Grid ──────────────────────────────────────

  return (
    <div className="p-4 lg:p-8 max-w-5xl w-full mx-auto flex flex-col gap-6">
      <h2 className="text-3xl font-black mb-2">Practice Arena</h2>
      <p className="text-slate-500 mb-4">Test your knowledge and earn extra XP.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modes.map((mode, i) => {
          const unlocked = isGameModeUnlocked(mode.id);
          const premium = isPremiumFeature(mode.id);

          return (
            <button
              key={i}
              onClick={() => handleModeClick(mode.id)}
              className={`${mode.color} rounded-[32px] p-6 text-left relative overflow-hidden shadow-sm transition-transform border border-transparent hover:border-white/20 hover:scale-[1.02] active:scale-95`}
            >
              <div className="relative z-10 w-full">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-4xl block">{mode.icon}</span>
                  <div className="flex items-center gap-2">
                    {/* Premium badge (always shown for premium features) */}
                    {premium && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        mode.textDark
                          ? 'bg-black/10 text-slate-800 border border-black/10'
                          : 'bg-white/20 text-white border border-white/20'
                      }`}>
                        <Crown className="w-3 h-3" />
                        {softLaunch ? 'Premium Soon' : !unlocked ? 'Premium' : 'Premium'}
                      </span>
                    )}
                    {/* Lock icon when actually locked */}
                    {!unlocked && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        mode.textDark ? 'bg-black/10' : 'bg-white/20'
                      }`}>
                        <Lock className={`w-4 h-4 ${mode.textDark ? 'text-slate-800' : 'text-white'}`} />
                      </div>
                    )}
                    {/* Best score */}
                    {stats.bestScores?.[mode.id] > 0 && (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                        mode.textDark
                          ? 'bg-black/10 text-slate-800 border-black/10'
                          : 'bg-white/20 text-white border-white/20'
                      }`}>
                        Best: {stats.bestScores[mode.id]} {mode.id === 'synonymSprint' ? 'pts' : '/ 10'}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className={`text-xl font-black mb-2 tracking-tight ${mode.textDark ? 'text-slate-900' : 'text-white'}`}>
                  {mode.title}
                </h3>
                <p className={`text-sm font-medium ${mode.textDark ? 'text-slate-700' : 'text-white/80'}`}>
                  {!unlocked ? 'Tap to try 3 free demo questions' : mode.desc}
                </p>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </button>
          );
        })}
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeatureName}
      />
    </div>
  );
}

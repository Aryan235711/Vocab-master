import React, { useEffect, useState, createContext, useContext } from 'react';
import { X, Download, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { stats } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallToast, setShowInstallToast] = useState(false);
  const [offlineToastTimer, setOfflineToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showOfflineAIToast, setShowOfflineAIToast] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    // Only show if user has actually done a session
    if (stats.wordsLearnedToday > 0 || stats.reviewsCompletedToday > 0) {
      if (deferredPrompt && !localStorage.getItem('vocabdost_install_dismissed')) {
        setShowInstallToast(true);
      }
    }
  }, [stats.wordsLearnedToday, stats.reviewsCompletedToday, deferredPrompt]);

  useEffect(() => {
    const handleOfflineAI = () => {
      setShowOfflineAIToast(true);
      if (offlineToastTimer) clearTimeout(offlineToastTimer);
      setOfflineToastTimer(setTimeout(() => setShowOfflineAIToast(false), 5000));
    };

    window.addEventListener('vocabdost:offline-ai', handleOfflineAI);
    return () => window.removeEventListener('vocabdost:offline-ai', handleOfflineAI);
  }, [offlineToastTimer]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowInstallToast(false);
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
  };

  const dismissInstall = () => {
    setShowInstallToast(false);
    // Remember dismissal for 7 days
    const expiration = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('vocabdost_install_dismissed', expiration.toString());
  };

  // Check and clear expired dismissal
  useEffect(() => {
    const dismissedTime = localStorage.getItem('vocabdost_install_dismissed');
    if (dismissedTime && new Date().getTime() > parseInt(dismissedTime)) {
      localStorage.removeItem('vocabdost_install_dismissed');
    }
  }, []);

  return (
    <>
      {children}
      
      {/* Install Prompt Toast */}
      {showInstallToast && (
        <div className="fixed bottom-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-96 bg-[#4F46E5] text-white p-4 rounded-2xl shadow-2xl z-[100] flex flex-col gap-3">
          <button onClick={dismissInstall} className="absolute top-2 right-2 p-1 text-indigo-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="pr-6 font-semibold flex items-start gap-2">
            <span className="text-xl">📲</span>
            <span>Install for offline access + faster experience</span>
          </div>
          <button 
            onClick={handleInstall}
            className="bg-white text-[#4F46E5] font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Install VocabDost
          </button>
        </div>
      )}

      {/* Offline AI Toast */}
      {showOfflineAIToast && (
        <div className="fixed top-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-max bg-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl z-[100] flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-4">
          <WifiOff className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed max-w-[280px]">
            🌐 You're offline. AI features need internet — but your SRS, quizzes, and progress all still work!
          </p>
          <button onClick={() => setShowOfflineAIToast(false)} className="shrink-0 p-1 -mr-1 -mt-1 text-slate-400 hover:text-white">
             <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};

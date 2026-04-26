/**
 * @file App.tsx
 * @description Main application shell, routing definitions, navigation bars, and layout composition.
 * 
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { PremiumProvider } from './context/PremiumContext';
import { PWAProvider } from './components/PWAProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Flame, Coins, User, Home, BookOpen, Target, TrendingUp, Settings } from 'lucide-react';

// View Tabs
import HomeTab from './tabs/HomeTab';
import LearnTab from './tabs/LearnTab';
import PracticeTab from './tabs/PracticeTab';
import ProgressTab from './tabs/ProgressTab';
import ProfileTab from './tabs/ProfileTab';
import PricingTab from './tabs/PricingTab';

import Onboarding from './components/Onboarding';

/**
 * Top header component rendering the app logo and key user stats (streak, XP).
 */
const Header = () => {
  const { stats, settings } = useApp();
  
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
      {/* Brand / Logo Area */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#4F46E5] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <BookOpen stroke="white" strokeWidth="2.5" className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-extrabold tracking-tight text-[#4F46E5]">VocabDost</h1>
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hidden sm:block">Govt Exam Specialist</span>
        </div>
      </div>

      {/* User Stats/Status Badges */}
      <div className="flex items-center gap-2 lg:gap-6">
        <div className={`flex items-center px-3 py-1.5 lg:px-4 lg:py-2 rounded-full border ${stats.streak > 0 ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
          <Flame className={`w-4 h-4 lg:w-5 lg:h-5 mr-1.5 ${stats.streak > 0 ? 'text-orange-600' : 'text-slate-400'}`} />
          <span className="text-sm lg:text-base font-bold">
            {stats.streak > 0 ? `${stats.streak} Day${stats.streak !== 1 ? 's' : ''}` : 'Start Streak!'}
          </span>
        </div>
        <div className="flex items-center bg-yellow-50 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full border border-yellow-200 hidden sm:flex">
          <Coins className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600 mr-1.5" />
          <span className="text-sm lg:text-base font-bold text-yellow-700">{stats.xp} XP</span>
        </div>
        <div className="w-10 h-10 bg-slate-100 rounded-full border-2 border-white flex items-center justify-center text-sm font-bold text-slate-600 shadow-sm sm:flex">
          <User className="w-5 h-5 text-slate-500" />
        </div>
      </div>
    </header>
  );
};

/**
 * Bottom navigation bar for quickly switching between major app sections.
 * Automatically highlights the active tab based on router location.
 */
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'home', label: 'Home', path: '/home', icon: Home },
    { id: 'learn', label: 'Learn', path: '/learn', icon: BookOpen },
    { id: 'practice', label: 'Practice', path: '/practice', icon: Target },
    { id: 'progress', label: 'Progress', path: '/progress', icon: TrendingUp },
    { id: 'profile', label: 'Profile', path: '/profile', icon: Settings },
  ];

  return (
    <nav className="h-16 lg:h-20 bg-white border-t border-slate-200 flex items-center justify-around xl:justify-center xl:gap-20 shrink-0 px-2 lg:px-8 pb-safe z-50 fixed bottom-0 left-0 right-0 lg:relative">
      {tabs.map((tab) => {
        const isActive = location.pathname.startsWith(tab.path);
        const Icon = tab.icon;
        return (
          <div 
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-1 group cursor-pointer ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'} transition-opacity p-2`}
          >
            <div className={isActive ? 'text-[#4F46E5]' : 'text-slate-600'}>
              <Icon className="w-6 h-6" strokeWidth={isActive ? 3 : 2} />
            </div>
            <span className={`text-[10px] font-black uppercase ${isActive ? 'text-[#4F46E5]' : 'text-slate-500'}`}>{tab.label}</span>
          </div>
        )
      })}
    </nav>
  );
};

/**
 * Shared layout wrapper ensuring navigation scaffolding surrounds content.
 * 
 * @param children - The specific tab content to render within the scrollable main area.
 */
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-[100dvh] w-full bg-[#F8FAFC] font-sans flex flex-col overflow-hidden text-[#1E293B]">
      <Header />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0 relative">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

/**
 * Central routing and view resolution logic.
 * Enforces the primary layout or the onboarding screen depending on initialization state.
 */
const AppContent = () => {
  const { settings } = useApp();

  // Guard routing; force user through initialization process if incomplete
  if (!settings.hasCompletedOnboarding) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomeTab />} />
          <Route path="/learn" element={<LearnTab />} />
          <Route path="/practice" element={<PracticeTab />} />
          <Route path="/progress" element={<ProgressTab />} />
          <Route path="/profile" element={<ProfileTab />} />
          <Route path="/pricing" element={<PricingTab />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

/**
 * Application root component.
 * Wraps the app in the global context provider.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <PremiumProvider>
          <PWAProvider>
            <AppContent />
          </PWAProvider>
        </PremiumProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}


/**
 * @file UpgradeModal.tsx
 * @description Reusable modal shown when a free user hits a premium feature gate.
 * In soft launch: collects waitlist email.
 * After launch: navigates to /pricing.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, Mail } from 'lucide-react';
import { usePremium } from '../context/PremiumContext';
import { useNavigate } from 'react-router-dom';
import { submitWaitlistEmail } from '../services/firestoreService';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
}

export default function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  const { softLaunch } = usePremium();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(
    () => !!localStorage.getItem('vocabdost_waitlist_email')
  );
  const [submitting, setSubmitting] = useState(false);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    const ok = await submitWaitlistEmail(email.trim());
    if (ok) {
      setSubmitted(true);
      localStorage.setItem('vocabdost_waitlist_email', email.trim());
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-[32px] p-6 lg:p-8 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-[#4F46E5]" />
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <h3 className="text-2xl font-black mb-2">
              {softLaunch ? 'Premium Coming Soon' : `Unlock ${feature}`}
            </h3>
            <p className="text-slate-500 mb-6">
              {softLaunch
                ? `${feature} will be available with Premium. Join the waitlist to get early access and launch pricing.`
                : `${feature} is a Premium feature. Upgrade to unlock it and supercharge your exam prep.`}
            </p>

            {softLaunch ? (
              submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <Sparkles className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-emerald-800">You're on the list!</p>
                  <p className="text-sm text-emerald-600 mt-1">We'll notify you when Premium launches.</p>
                </div>
              ) : (
                <form onSubmit={handleWaitlist} className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-[#4F46E5] text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 disabled:opacity-50 whitespace-nowrap"
                    >
                      {submitting ? 'Joining...' : 'Join Waitlist'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">No spam. We'll only email about the launch.</p>
                </form>
              )
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => { onClose(); navigate('/pricing'); }}
                  className="w-full bg-[#4F46E5] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-600 transition-colors"
                >
                  View Plans
                </button>
                <button onClick={onClose} className="w-full text-slate-500 py-2 text-sm font-medium">
                  Maybe later
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

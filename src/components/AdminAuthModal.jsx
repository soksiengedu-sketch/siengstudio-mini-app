import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Shield, Lock, X } from 'lucide-react';
import { haptic } from '../services/telegram';

export default function AdminAuthModal() {
  const {
    t,
    lang,
    isAdminAuthModalOpen,
    setIsAdminAuthModalOpen,
    setAuthenticatedAdminPin,
    pendingAdminTargetTab,
    setAdminInitialTab,
    setActiveTab
  } = useApp();

  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isAdminAuthModalOpen) return null;

  const handleAdminAuth = async (e) => {
    if (e) e.preventDefault();
    if (!adminPin) return;
    setIsVerifying(true);
    setPinError(false);
    const res = await api.verifyAdminPin(adminPin);
    setIsVerifying(false);

    if (res.success) {
      haptic.success();
      setAuthenticatedAdminPin(adminPin);
      setIsAdminAuthModalOpen(false);
      setAdminPin('');
      setAdminInitialTab(pendingAdminTargetTab || 'manage');
      setActiveTab('admin');
    } else {
      haptic.error();
      setPinError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-xs bg-[#151624] border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center relative">
        <button
          onClick={() => {
            setIsAdminAuthModalOpen(false);
            setPinError(false);
            setAdminPin('');
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500/30 to-purple-500/30 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/30 shadow-lg">
          <Lock size={22} />
        </div>

        <h3 className="text-base font-black text-white">{t('adminPanel')}</h3>
        <p className="text-xs text-gray-300 mt-1">
          {pendingAdminTargetTab === 'addDrama'
            ? (lang === 'km' ? 'សូមបញ្ចូលកូដ PIN ដើម្បីបន្ថែមរឿងថ្មី' : 'Enter Admin PIN to add a new drama')
            : t('adminPinPrompt')}
        </p>

        <form onSubmit={handleAdminAuth} className="w-full mt-4">
          <input
            type="password"
            autoFocus
            value={adminPin}
            onChange={(e) => {
              setAdminPin(e.target.value);
              setPinError(false);
            }}
            placeholder="••••••••"
            className="w-full py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-lg tracking-widest outline-none focus:border-rose-500"
          />

          {pinError && (
            <p className="text-[11px] text-rose-400 font-semibold mt-1.5">
              {lang === 'km' ? 'លេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ!' : 'Incorrect Admin PIN!'}
            </p>
          )}

          <div className="flex gap-2 w-full mt-4">
            <button
              type="button"
              onClick={() => {
                setIsAdminAuthModalOpen(false);
                setPinError(false);
                setAdminPin('');
              }}
              className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 text-xs font-bold"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-bold shadow-md shadow-rose-900/40 active:scale-95 transition-transform"
            >
              {isVerifying ? '...' : t('confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

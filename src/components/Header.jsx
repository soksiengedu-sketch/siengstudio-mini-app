import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Coins,
  Gift,
  Crown,
  Globe,
  Plus
} from 'lucide-react';
import { haptic } from '../services/telegram';

export default function Header() {
  const {
    t,
    lang,
    switchLanguage,
    coins,
    isVip,
    setIsCoinModalOpen,
    setIsDailyModalOpen,
    hasCheckedInToday,
    setActiveTab,
    openAdmin,
    isAdmin,
    setIsAdminAuthModalOpen
  } = useApp();

  const logoTapCountRef = useRef(0);
  const logoTapTimerRef = useRef(null);

  const handleLogoClick = () => {
    haptic.light();
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Stealth Admin Trigger: Tap logo 5 times in 2.5 seconds to open PIN modal
    logoTapCountRef.current += 1;
    if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);
    logoTapTimerRef.current = setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 2500);

    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0;
      haptic.heavy();
      setIsAdminAuthModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0b0c13]/95 backdrop-blur-xl border-b border-white/5 px-3 sm:px-6 py-2.5 transition-all">
      <div className="w-full max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div 
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform shrink-0 select-none"
          onClick={handleLogoClick}
        >
          <div className="relative w-9 h-9 rounded-2xl overflow-hidden shadow-lg shadow-red-950/40 ring-1.5 ring-red-500/30 flex-shrink-0 bg-black">
            <img
              src="/logo.png"
              alt="SiengStudio Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                Sieng<span className="text-red-500">Studio</span>
              </span>
              {isVip && (
                <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[9px] font-black text-black uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                  <Crown size={9} className="fill-black" /> VIP
                </span>
              )}
            </div>
            <p className="text-[10px] text-red-400 font-semibold -mt-0.5 tracking-normal">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Right Actions: Daily Gift, Coins, Language, Admin */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Daily Check-in */}
          <button
            onClick={() => {
              haptic.light();
              setIsDailyModalOpen(true);
            }}
            className={`relative p-2 rounded-xl transition-all ${
              !hasCheckedInToday
                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30'
                : 'bg-white/5 text-gray-400 hover:text-white'
            } active:scale-90`}
            title={t('dailyCheckIn')}
          >
            <Gift size={16} className={!hasCheckedInToday ? 'animate-bounce' : ''} />
            {!hasCheckedInToday && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full border-2 border-[#0b0c13]" />
            )}
          </button>

          {/* Coins Wallet Badge */}
          <button
            onClick={() => {
              haptic.light();
              setIsCoinModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 text-amber-300 font-semibold text-xs active:scale-95 transition-transform shadow-sm"
            title="បញ្ចូលកាក់"
          >
            <Coins size={13} className="text-amber-400 animate-pulse fill-amber-400/20" />
            <span className="font-mono font-bold text-[11px]">{coins.toLocaleString()}</span>
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500/30 text-amber-200 flex items-center justify-center text-[9px] font-black ml-0.5">
              +
            </span>
          </button>

          {/* Language Switch */}
          <button
            onClick={() => switchLanguage(lang === 'km' ? 'en' : 'km')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-white font-medium active:scale-90 transition-all"
            title="ប្តូរភាសា"
          >
            <Globe size={13} className="text-gray-400" />
            <span className="text-[10px] font-bold uppercase">{lang === 'km' ? 'KM' : 'EN'}</span>
          </button>

          {/* Quick + Add Drama / Admin Button (Only visible to authorized Admin) */}
          {isAdmin && (
            <button
              onClick={() => {
                haptic.medium();
                openAdmin('addDrama');
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs active:scale-95 transition-transform shadow-md shadow-purple-900/40"
              title="Admin"
            >
              <Plus size={13} />
              <span className="text-[10px] font-bold">{lang === 'km' ? 'រឿង' : 'Add'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

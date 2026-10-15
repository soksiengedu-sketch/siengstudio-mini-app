import React from 'react';
import { useApp } from '../context/AppContext';
import { Coins, Gift, Crown, Globe } from 'lucide-react';
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
    setActiveTab
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-[#0b0c13]/90 backdrop-blur-md border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
      {/* Brand */}
      <div 
        className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
        onClick={() => {
          haptic.light();
          setActiveTab('home');
        }}
      >
        <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-lg shadow-red-950/40 ring-1.5 ring-red-500/30 flex-shrink-0 bg-black">
          <img
            src="/logo.png"
            alt="SiengStudio Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
              Sieng<span className="text-red-500 font-black">Studio</span>
            </span>
            {isVip && (
              <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[10px] font-bold text-black uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                <Crown size={10} className="fill-black" /> VIP
              </span>
            )}
          </div>
          <p className="text-[10.5px] text-red-400 font-semibold -mt-0.5 tracking-normal">
            {t('tagline')}
          </p>
        </div>
      </div>

      {/* Right Actions: Daily Gift, Coins, Language */}
      <div className="flex items-center gap-2">
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
          <Gift size={18} className={!hasCheckedInToday ? 'animate-bounce' : ''} />
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
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 text-amber-300 font-semibold text-xs active:scale-95 transition-transform shadow-sm"
        >
          <Coins size={14} className="text-amber-400 animate-pulse fill-amber-400/20" />
          <span>{coins.toLocaleString()}</span>
          <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-200 flex items-center justify-center text-[10px] font-bold ml-0.5">
            +
          </span>
        </button>

        {/* Language Switch */}
        <button
          onClick={() => switchLanguage(lang === 'km' ? 'en' : 'km')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-white font-medium active:scale-90 transition-all"
        >
          <Globe size={13} className="text-gray-400" />
          <span className="text-[11px] font-bold uppercase">{lang === 'km' ? 'KM' : 'EN'}</span>
        </button>
      </div>
    </header>
  );
}

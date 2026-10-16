import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Coins,
  Gift,
  Crown,
  Globe,
  Plus,
  Search as SearchIcon,
  Home,
  Bookmark,
  Wallet,
  User,
  Maximize2,
  Minimize2,
  Compass,
  Film
} from 'lucide-react';
import { haptic } from '../services/telegram';

export default function Header() {
  const {
    t,
    lang,
    switchLanguage,
    coins,
    isVip,
    user,
    setIsCoinModalOpen,
    setIsDailyModalOpen,
    hasCheckedInToday,
    activeTab,
    setActiveTab,
    openAdmin,
    screenMode,
    toggleScreenMode
  } = useApp();

  const [desktopSearch, setDesktopSearch] = useState('');

  const navLinks = [
    { id: 'home', label: lang === 'km' ? 'ទំព័រដើម' : 'Home', icon: Home },
    { id: 'search', label: lang === 'km' ? 'ស្វែងរករឿង' : 'Explore', icon: Compass },
    { id: 'library', label: lang === 'km' ? 'បណ្ណាល័យ' : 'Library', icon: Bookmark },
    { id: 'wallet', label: lang === 'km' ? 'កញ្ចប់ VIP & កាក់' : 'VIP & Coins', icon: Wallet },
  ];

  const handleDesktopSearchSubmit = (e) => {
    e.preventDefault();
    if (desktopSearch.trim()) {
      setActiveTab('search');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b0c13]/95 backdrop-blur-xl border-b border-white/5 px-3 sm:px-6 py-2.5 transition-all">
      <div className={`w-full ${screenMode === 'compact' ? 'max-w-md' : 'max-w-7xl'} mx-auto flex items-center justify-between gap-4`}>
        {/* Left Side: Brand Logo & Desktop Navigation */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform shrink-0"
            onClick={() => {
              haptic.light();
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden shadow-lg shadow-red-950/40 ring-1.5 ring-red-500/30 flex-shrink-0 bg-black">
              <img
                src="/logo.png"
                alt="SiengStudio Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                  Sieng<span className="text-red-500">Studio</span>
                </span>
                {isVip && (
                  <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[9px] font-black text-black uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                    <Crown size={9} className="fill-black" /> VIP
                  </span>
                )}
              </div>
              <p className="text-[10px] text-red-400 font-semibold -mt-0.5 tracking-normal hidden xs:block">
                {t('tagline')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links (hidden in mobile / compact phone mode) */}
          {screenMode !== 'compact' && (
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      haptic.select();
                      setActiveTab(item.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs lg:text-sm font-bold flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-white/10 text-white shadow-inner font-extrabold text-purple-300'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={15} className={isActive ? 'text-purple-400' : 'text-gray-400'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Center: Desktop Header Search Bar */}
        {screenMode !== 'compact' && (
          <form 
            onSubmit={handleDesktopSearchSubmit}
            className="hidden lg:flex items-center flex-1 max-w-xs relative"
          >
            <SearchIcon size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={desktopSearch}
              onChange={(e) => setDesktopSearch(e.target.value)}
              onFocus={() => {
                if (activeTab !== 'search') setActiveTab('search');
              }}
              placeholder={lang === 'km' ? 'ស្វែងរករឿងភាគ...' : 'Search dramas...'}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
            />
          </form>
        )}

        {/* Right Actions: Daily Gift, Coins, Language, Screen Toggle, Admin & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 text-amber-300 font-semibold text-xs active:scale-95 transition-transform shadow-sm"
            title="បញ្ចូលកាក់តាម Bakong KHQR"
          >
            <Coins size={14} className="text-amber-400 animate-pulse fill-amber-400/20" />
            <span className="font-mono font-bold">{coins.toLocaleString()}</span>
            <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-200 flex items-center justify-center text-[10px] font-bold ml-0.5">
              +
            </span>
          </button>

          {/* Language Switch */}
          <button
            onClick={() => switchLanguage(lang === 'km' ? 'en' : 'km')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-white font-medium active:scale-90 transition-all"
            title="ប្តូរភាសា / Switch Language"
          >
            <Globe size={13} className="text-gray-400" />
            <span className="text-[11px] font-bold uppercase">{lang === 'km' ? 'KM' : 'EN'}</span>
          </button>

          {/* Screen Resolution Toggle: Minimize / Maximize */}
          <button
            onClick={toggleScreenMode}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold active:scale-90 transition-all ${
              screenMode === 'full'
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25 shadow-sm'
                : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 shadow-sm'
            }`}
            title={screenMode === 'full' ? t('screenMinimize') : t('screenMaximize')}
            aria-label={screenMode === 'full' ? t('screenMinimize') : t('screenMaximize')}
          >
            {screenMode === 'full' ? (
              <>
                <Minimize2 size={13} className="text-purple-400 flex-shrink-0" />
                <span className="hidden xl:inline text-[10.5px]">
                  {t('compactScreen')}
                </span>
              </>
            ) : (
              <>
                <Maximize2 size={13} className="text-cyan-400 flex-shrink-0" />
                <span className="hidden xl:inline text-[10.5px]">
                  {t('fullScreen')}
                </span>
              </>
            )}
          </button>

          {/* Quick + Add Drama Button */}
          <button
            onClick={() => {
              haptic.medium();
              openAdmin('addDrama');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs active:scale-95 transition-transform shadow-md shadow-purple-900/40"
            title="ផ្ទាំងគ្រប់គ្រង Admin / បន្ថែមរឿងថ្មី"
          >
            <Plus size={13} />
            <span className="text-[11px] font-bold hidden sm:inline">{lang === 'km' ? '+ រឿងថ្មី' : '+ Drama'}</span>
          </button>

          {/* Desktop User Profile Pill */}
          <button
            onClick={() => {
              haptic.light();
              setActiveTab('profile');
            }}
            className={`hidden md:flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl border transition-all ${
              activeTab === 'profile'
                ? 'bg-white/10 border-purple-500/50 text-white'
                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="គណនីរបស់ខ្ញុំ"
          >
            <div className="w-6 h-6 rounded-lg overflow-hidden bg-purple-900/60 flex items-center justify-center text-purple-200 font-bold text-[10px] shrink-0">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={13} />
              )}
            </div>
            <span className="text-xs font-bold truncate max-w-[80px]">
              {user?.first_name || 'គណនី'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

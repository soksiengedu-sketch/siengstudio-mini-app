import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Compass, Bookmark, Wallet, User } from 'lucide-react';
import { haptic } from '../services/telegram';

export default function BottomNav() {
  const { activeTab, setActiveTab, t, screenMode } = useApp();

  const tabs = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'search', label: t('search'), icon: Compass },
    { id: 'library', label: t('library'), icon: Bookmark },
    { id: 'wallet', label: t('wallet'), icon: Wallet },
    { id: 'profile', label: t('profile'), icon: User }
  ];

  // Don't display bottom nav if in full-screen watch mode
  if (activeTab === 'watch') return null;

  const isCompact = screenMode === 'compact';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0d16]/95 backdrop-blur-xl border-t border-white/5 pb-safe transition-all duration-300 md:bottom-4 md:bg-transparent md:border-0 md:pointer-events-none">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto px-3 py-1.5 md:py-2 md:rounded-2xl md:border md:border-white/10 md:bg-[#0c0d16]/90 md:backdrop-blur-2xl md:shadow-2xl md:shadow-purple-950/40 md:pointer-events-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                haptic.select();
                setActiveTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? 'text-purple-400 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              } active:scale-90`}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

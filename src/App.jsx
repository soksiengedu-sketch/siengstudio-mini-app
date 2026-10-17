import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import DramaDetail from './pages/DramaDetail';
import ReelPlayer from './components/ReelPlayer';
import Search from './pages/Search';
import Library from './pages/Library';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import CoinModal from './components/CoinModal';
import DailyCheckInModal from './components/DailyCheckInModal';
import ShareModal from './components/ShareModal';
import AdminAuthModal from './components/AdminAuthModal';
import { api } from './services/api';
import {
  initTelegramApp,
  setupTelegramBackButton,
  hideTelegramBackButton,
  haptic
} from './services/telegram';

function MainApp() {
  const {
    activeTab,
    setActiveTab,
    currentDramaId,
    currentEpisodeId,
    screenMode,
    isAdmin
  } = useApp();

  const [currentDrama, setCurrentDrama] = useState(null);

  // Security Guard: Prevent unauthorized users from viewing admin tab
  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('home');
    }
  }, [activeTab, isAdmin]);

  // Initialize Telegram WebApp features
  useEffect(() => {
    initTelegramApp();
  }, []);

  // Native Telegram Back Button lifecycle sync
  useEffect(() => {
    if (activeTab === 'home') {
      hideTelegramBackButton();
    } else if (activeTab === 'watch') {
      setupTelegramBackButton(() => {
        haptic.light();
        setActiveTab('detail');
      });
    } else if (activeTab === 'detail') {
      setupTelegramBackButton(() => {
        haptic.light();
        setActiveTab('home');
      });
    } else {
      setupTelegramBackButton(() => {
        haptic.light();
        setActiveTab('home');
      });
    }
    return () => {
      hideTelegramBackButton();
    };
  }, [activeTab]);

  useEffect(() => {
    if (currentDramaId) {
      api.getDrama(currentDramaId).then((d) => {
        if (d) setCurrentDrama(d);
      });
    }
  }, [currentDramaId]);

  const isCompact = screenMode === 'compact';

  return (
    <div
      className={`min-h-screen min-h-[100dvh] w-full text-gray-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white transition-colors duration-300 ${
        isCompact
          ? 'bg-[#050608] md:py-4 items-center justify-start'
          : 'bg-[#0b0c13]'
      }`}
    >
      <div
        className={`w-full flex flex-col transition-all duration-300 ${
          isCompact
            ? 'max-w-md mx-auto bg-[#0b0c13] min-h-screen md:min-h-[850px] md:rounded-[32px] md:border md:border-white/10 md:shadow-[0_0_60px_rgba(168,85,247,0.2)] overflow-x-hidden relative'
            : 'w-full max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto min-h-screen bg-[#0b0c13] overflow-x-hidden relative flex-1'
        }`}
      >
        {/* Top Header (hidden when watching full-screen reel player) */}
        {activeTab !== 'watch' && activeTab !== 'admin' && <Header />}

        {/* Main Content Area - Optimized for Telegram Mini App viewport */}
        <main className="flex-1 w-full px-0">
          {activeTab === 'home' && <Home />}
          {activeTab === 'detail' && (
            <DramaDetail
              dramaId={currentDramaId}
              onBack={() => setActiveTab('home')}
            />
          )}
          {activeTab === 'watch' && currentDrama && (
            <ReelPlayer
              drama={currentDrama}
              initialEpId={currentEpisodeId}
              onBack={() => setActiveTab('detail')}
            />
          )}
          {activeTab === 'search' && <Search />}
          {activeTab === 'library' && <Library />}
          {activeTab === 'wallet' && <Wallet />}
          {activeTab === 'profile' && <Profile />}
          {activeTab === 'admin' && <Admin />}
        </main>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>

      {/* Global Modals */}
      <CoinModal />
      <DailyCheckInModal />
      <ShareModal />
      <AdminAuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

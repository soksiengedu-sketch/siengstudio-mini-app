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

function MainApp() {
  const {
    activeTab,
    setActiveTab,
    currentDramaId,
    currentEpisodeId
  } = useApp();

  const [currentDrama, setCurrentDrama] = useState(null);

  useEffect(() => {
    if (currentDramaId) {
      api.getDrama(currentDramaId).then((d) => {
        if (d) setCurrentDrama(d);
      });
    }
  }, [currentDramaId]);

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#0b0c13] text-gray-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Header (hidden when watching full-screen reel player) */}
      {activeTab !== 'watch' && activeTab !== 'admin' && <Header />}

      {/* Main Content Area - Full screen width on Mobile & Wide resolution on PC */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-0 sm:px-4 md:px-6">
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

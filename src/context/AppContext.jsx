import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en';
import km from '../locales/km';
import { getTelegramUser, initTelegramApp, haptic, isTelegramWebApp } from '../services/telegram';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState('km'); // Default to Khmer
  const [activeTab, setActiveTab] = useState('home'); // home, search, library, wallet, profile, admin
  const [currentDramaId, setCurrentDramaId] = useState(null);
  const [currentEpisodeId, setCurrentEpisodeId] = useState(null);
  const [playerMode, setPlayerMode] = useState('reel'); // 'reel' or 'cinema'

  // Screen Resolution Mode: 'full' (Wide/Full-screen) or 'compact' (Phone Simulator)
  const [screenMode, setScreenMode] = useState(() => {
    try {
      return localStorage.getItem('siengstudio_screen_mode') || 'full';
    } catch (e) {
      return 'full';
    }
  });

  const [isFullscreen, setIsFullscreen] = useState(() => {
    return Boolean(
      (typeof document !== 'undefined' && document.fullscreenElement) ||
      (typeof window !== 'undefined' && window.Telegram?.WebApp?.isFullscreen)
    );
  });

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(
        Boolean(
          document.fullscreenElement ||
          window.Telegram?.WebApp?.isFullscreen
        )
      );
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleScreenMode = async () => {
    haptic.medium();
    const nextMode = screenMode === 'full' ? 'compact' : 'full';
    setScreenMode(nextMode);
    try {
      localStorage.setItem('siengstudio_screen_mode', nextMode);
    } catch (e) {}

    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

    if (nextMode === 'full') {
      if (tg && typeof tg.requestFullscreen === 'function') {
        try { tg.requestFullscreen(); } catch (e) {}
      } else if (tg && typeof tg.expand === 'function') {
        try { tg.expand(); } catch (e) {}
      }
      if (typeof document !== 'undefined' && !document.fullscreenElement && document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (e) {}
      }
    } else {
      if (tg && typeof tg.exitFullscreen === 'function') {
        try { tg.exitFullscreen(); } catch (e) {}
      }
      if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch (e) {}
      }
    }
  };

  // User State
  const [user, setUser] = useState(() => getTelegramUser());
  const [coins, setCoins] = useState(150); // Initial welcome bonus coins
  const [isVip, setIsVip] = useState(false);
  const [vipTier, setVipTier] = useState(null); // 'lite', 'weekly', 'monthly'
  const [unlockedEpisodes, setUnlockedEpisodes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [checkInStreak, setCheckInStreak] = useState(1);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [rewardsSchedule, setRewardsSchedule] = useState([10, 15, 20, 25, 35, 50, 100]);

  // Referral State
  const [referralsCount, setReferralsCount] = useState(0);
  const [referralCoinsEarned, setReferralCoinsEarned] = useState(0);
  const [referralsList, setReferralsList] = useState([]);

  const refreshReferrals = async () => {
    if (user?.id) {
      const res = await api.getReferralStats(user.id);
      if (res && res.success) {
        setReferralsCount(res.referralsCount || 0);
        setReferralCoinsEarned(res.referralCoinsEarned || 0);
        setReferralsList(res.referrals || []);
      }
    }
  };

  // Telegram Admin Authorization Check
  const ADMIN_TELEGRAM_IDS = ['211223427'];
  const ADMIN_TELEGRAM_USERNAMES = ['chansoksieng'];

  const isTelegramAdmin = Boolean(
    user &&
    (
      ADMIN_TELEGRAM_IDS.includes(String(user.id)) ||
      (user.username && ADMIN_TELEGRAM_USERNAMES.includes(String(user.username).toLowerCase().replace(/^@/, '')))
    )
  );

  const [authenticatedAdminPin, setAuthenticatedAdminPinState] = useState(() => {
    try {
      return (
        sessionStorage.getItem('siengstudio_admin_pin') ||
        localStorage.getItem('siengstudio_admin_pin') ||
        ''
      );
    } catch (e) {
      return '';
    }
  });

  const setAuthenticatedAdminPin = (pin) => {
    setAuthenticatedAdminPinState(pin);
    try {
      if (pin) {
        sessionStorage.setItem('siengstudio_admin_pin', pin);
        localStorage.setItem('siengstudio_admin_pin', pin);
      } else {
        sessionStorage.removeItem('siengstudio_admin_pin');
        localStorage.removeItem('siengstudio_admin_pin');
      }
    } catch (e) {}
  };

  // Granted if user is verified Telegram Admin or has verified master PIN
  const isAdmin = isTelegramAdmin || Boolean(authenticatedAdminPin && authenticatedAdminPin.trim());

  useEffect(() => {
    if (isTelegramAdmin && !authenticatedAdminPin) {
      setAuthenticatedAdminPin('88@48*');
    }
  }, [isTelegramAdmin, authenticatedAdminPin]);

  const [adminInitialTab, setAdminInitialTab] = useState('manage');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [pendingAdminTargetTab, setPendingAdminTargetTab] = useState('manage');

  const openAdmin = (tab = 'manage') => {
    setAdminInitialTab(tab);
    if (isAdmin) {
      setActiveTab('admin');
    } else {
      setPendingAdminTargetTab(tab);
      setIsAdminAuthModalOpen(true);
    }
  };

  // Modals
  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Translations helper
  const translations = lang === 'km' ? km : en;
  const t = (key) => translations[key] || key;

  // Initialize Telegram WebApp
  useEffect(() => {
    initTelegramApp();
    const tgUser = getTelegramUser();
    setUser(tgUser);

    // Check deep links (referrals & dramas)
    let refParam = null;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const startParam =
        urlParams.get('tgWebAppStartParam') ||
        urlParams.get('startapp') ||
        urlParams.get('ref') ||
        (typeof window !== 'undefined' ? window.Telegram?.WebApp?.initDataUnsafe?.start_param : null);

      if (startParam) {
        if (startParam.startsWith('ref_')) {
          refParam = startParam;
        } else if (startParam.startsWith('drama_')) {
          const dId = startParam.replace('drama_', '');
          setCurrentDramaId(dId);
          setActiveTab('detail');
        }
      }
    } catch (e) {}

    // Sync with backend API
    if (tgUser?.id) {
      api.syncUser(tgUser, refParam).then((res) => {
        if (res && res.user) {
          setCoins(res.user.coins ?? 150);
          setIsVip(Boolean(res.user.isVip));
          setVipTier(res.user.vipTier || (res.user.isVip ? 'monthly' : null));
          setUnlockedEpisodes(res.user.unlockedEpisodes || []);
          setFavorites(res.user.favorites || []);
          setHistory(res.user.history || []);
          setCheckInStreak(res.user.checkInStreak || 1);
          setHasCheckedInToday(Boolean(res.user.hasCheckedInToday));
          setReferralsCount(res.user.referrals?.length || 0);
          setReferralCoinsEarned(res.user.referralCoinsEarned || 0);
          setReferralsList(res.user.referrals || []);
        }
      });
    }
  }, []);

  const switchLanguage = (newLang) => {
    haptic.select();
    setLang(newLang);
    document.documentElement.lang = newLang;
  };

  const openDrama = (dramaId, episodeId = null) => {
    haptic.light();
    setCurrentDramaId(dramaId);
    if (episodeId) {
      setCurrentEpisodeId(episodeId);
      setActiveTab('watch');
    } else {
      setActiveTab('detail');
    }
  };

  const startWatching = (dramaId, episodeId) => {
    haptic.medium();
    setCurrentDramaId(dramaId);
    setCurrentEpisodeId(episodeId);
    setActiveTab('watch');
  };

  const isEpisodeUnlocked = (dramaId, episode) => {
    if (isVip && vipTier !== 'lite') return true;
    if (episode.isFree) return true;
    const key = `${dramaId}:${episode.id}`;
    return unlockedEpisodes.includes(key);
  };

  const unlockEpisode = async (dramaId, episode) => {
    let cost = episode.coinPrice || 20;
    // Lite VIP gets 20% discount on unlocks
    if (isVip && vipTier === 'lite') {
      cost = Math.max(1, Math.round(cost * 0.8));
    }

    if (coins < cost) {
      haptic.error();
      setIsCoinModalOpen(true);
      return false;
    }

    haptic.success();
    // Optimistic UI update
    setCoins((prev) => prev - cost);
    const key = `${dramaId}:${episode.id}`;
    setUnlockedEpisodes((prev) => [...prev, key]);

    // Backend sync
    await api.unlockEpisode(user.id, dramaId, episode.id);
    return true;
  };

  const toggleFavorite = async (drama) => {
    haptic.light();
    const exists = favorites.some((f) => f.id === drama.id);
    let updated;
    if (exists) {
      updated = favorites.filter((f) => f.id !== drama.id);
    } else {
      updated = [...favorites, drama];
    }
    setFavorites(updated);
    await api.toggleFavorite(user.id, drama.id);
  };

  const recordHistory = async (dramaId, episodeId, progressSec = 0) => {
    const existingIndex = history.findIndex((h) => h.dramaId === dramaId);
    let updated = [...history];
    const item = { dramaId, episodeId, progressSec, updatedAt: new Date().toISOString() };
    if (existingIndex >= 0) {
      updated[existingIndex] = item;
    } else {
      updated.unshift(item);
    }
    setHistory(updated);
    await api.updateHistory(user.id, dramaId, episodeId, progressSec);
  };

  const clearHistory = () => {
    haptic.medium();
    setHistory([]);
  };

  const triggerDailyCheckIn = async () => {
    haptic.heavy();
    const res = await api.dailyCheckIn(user.id);
    if (res.success) {
      setCoins((prev) => prev + res.reward);
      setCheckInStreak(res.streak);
      setHasCheckedInToday(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      return { success: true, reward: res.reward, streak: res.streak };
    }
    return { success: false, message: res.message };
  };

  const topUpCoins = () => {
    setIsCoinModalOpen(true);
  };

  const upgradeVip = () => {
    setIsCoinModalOpen(true);
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        switchLanguage,
        t,
        activeTab,
        setActiveTab,
        currentDramaId,
        setCurrentDramaId,
        currentEpisodeId,
        setCurrentEpisodeId,
        playerMode,
        setPlayerMode,
        user,
        coins,
        setCoins,
        isVip,
        setIsVip,
        vipTier,
        setVipTier,
        unlockedEpisodes,
        favorites,
        history,
        checkInStreak,
        hasCheckedInToday,
        openDrama,
        startWatching,
        isEpisodeUnlocked,
        unlockEpisode,
        toggleFavorite,
        recordHistory,
        clearHistory,
        triggerDailyCheckIn,
        topUpCoins,
        upgradeVip,
        isCoinModalOpen,
        setIsCoinModalOpen,
        isDailyModalOpen,
        setIsDailyModalOpen,
        isShareModalOpen,
        setIsShareModalOpen,
        authenticatedAdminPin,
        setAuthenticatedAdminPin,
        adminInitialTab,
        setAdminInitialTab,
        isAdminAuthModalOpen,
        setIsAdminAuthModalOpen,
        pendingAdminTargetTab,
        openAdmin,
        isAdmin,
        isTelegramAdmin,
        screenMode,
        setScreenMode,
        toggleScreenMode,
        isFullscreen,
        referralsCount,
        referralCoinsEarned,
        referralsList,
        refreshReferrals,
        rewardsSchedule
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

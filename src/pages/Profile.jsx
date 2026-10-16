import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  User,
  Crown,
  Coins,
  Globe,
  Settings,
  Shield,
  Send,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Gift,
  Lock,
  Plus,
  Film
} from 'lucide-react';
import { haptic, shareToTelegram } from '../services/telegram';

export default function Profile() {
  const {
    t,
    lang,
    switchLanguage,
    user,
    coins,
    isVip,
    checkInStreak,
    setActiveTab,
    setIsCoinModalOpen,
    setIsDailyModalOpen,
    openAdmin
  } = useApp();

  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleAdminAuth = async () => {
    if (!adminPin) return;
    setIsVerifying(true);
    setPinError(false);
    const res = await api.verifyAdminPin(adminPin);
    setIsVerifying(false);

    if (res.success) {
      haptic.success();
      setAuthenticatedAdminPin(adminPin);
      setShowAdminPinModal(false);
      setActiveTab('admin');
    } else {
      haptic.error();
      setPinError(true);
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 space-y-4 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/5 p-5 flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-purple-900/40 border-2 border-purple-500/30 flex-shrink-0">
          {user?.photo_url ? (
            <img src={user.photo_url} alt={user.first_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-purple-300 font-black text-xl">
              {user?.first_name?.[0] || 'U'}
            </div>
          )}
          {isVip && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
              <Crown size={11} className="fill-black" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base sm:text-lg font-extrabold text-white truncate">
              {user?.first_name} {user?.last_name || ''}
            </h2>
            {isVip ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                VIP
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400 text-[10px] font-medium">
                Free
              </span>
            )}
          </div>
          {user?.username && (
            <p className="text-xs text-purple-400 font-medium">@{user.username}</p>
          )}
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
            {user?.username ? `Telegram ID: ${user?.id}` : `Member ID: #${user?.id || '887654321'}`}
          </p>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => {
            haptic.light();
            setIsCoinModalOpen(true);
          }}
          className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between cursor-pointer active:scale-95 transition-all"
        >
          <div>
            <p className="text-[10px] text-gray-400 font-medium">{t('myCoins')}</p>
            <h3 className="text-lg font-black text-amber-400 mt-0.5">{coins}</h3>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Coins size={16} />
          </div>
        </div>

        <div
          onClick={() => {
            haptic.light();
            setIsDailyModalOpen(true);
          }}
          className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between cursor-pointer active:scale-95 transition-all"
        >
          <div>
            <p className="text-[10px] text-gray-400 font-medium">{t('dailyCheckIn')}</p>
            <h3 className="text-lg font-black text-pink-400 mt-0.5">{checkInStreak} {t('days')}</h3>
          </div>
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
            <Gift size={16} />
          </div>
        </div>
      </div>

      {/* Settings & Links Section */}
      <div className="rounded-3xl bg-white/5 border border-white/5 overflow-hidden divide-y divide-white/5">
        {/* Language Switch */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Globe size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">ភាសា / Language</p>
              <p className="text-[10px] text-gray-400">Khmer / English</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl">
            <button
              onClick={() => switchLanguage('km')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                lang === 'km' ? 'bg-purple-600 text-white' : 'text-gray-400'
              }`}
            >
              ខ្មែរ
            </button>
            <button
              onClick={() => switchLanguage('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                lang === 'en' ? 'bg-purple-600 text-white' : 'text-gray-400'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Telegram Official Channel */}
        <div
          onClick={() => {
            haptic.light();
            const channelUrl = 'https://t.me/siengstudio_official';
            if (window.Telegram?.WebApp?.openTelegramLink) {
              window.Telegram.WebApp.openTelegramLink(channelUrl);
            } else {
              window.open(channelUrl, '_blank');
            }
          }}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Send size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Telegram Channel</p>
              <p className="text-[10px] text-gray-400">
                {lang === 'km' ? 'ចូលរួម Channel ផ្លូវការដើម្បីទទួលបានរឿងថ្មីៗ' : 'Join official channel for updates & new dramas'}
              </p>
            </div>
          </div>
          <ExternalLink size={16} className="text-gray-500" />
        </div>

        {/* Quick Add New Drama */}
        <div
          onClick={() => {
            haptic.medium();
            openAdmin('addDrama');
          }}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Plus size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">+ បន្ថែមរឿងថ្មី (Add New Drama)</p>
              <p className="text-[10px] text-purple-300">បញ្ចូលរឿងភាគ និងរូបភាព Poster ថ្មី</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-500" />
        </div>

        {/* Admin CMS Access */}
        <div
          onClick={() => {
            haptic.light();
            openAdmin('manage');
          }}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Shield size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{t('adminPanel')} (CMS)</p>
              <p className="text-[10px] text-gray-400">គ្រប់គ្រងរឿង និងភាគ (Manage dramas & episodes)</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-500" />
        </div>
      </div>
    </div>
  );
}

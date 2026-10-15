import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Users, Copy, Check, Send, Sparkles, Coins } from 'lucide-react';
import { haptic, shareToTelegram } from '../services/telegram';

export default function ShareModal() {
  const { isShareModalOpen, setIsShareModalOpen, t, lang, user } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isShareModalOpen) return null;

  const botUsername = 'SiengStudioBot';
  const referralLink = `https://t.me/${botUsername}?start=ref_${user?.id || '123'}`;
  const shareText = lang === 'km'
    ? '🎬 ចូលរួមទស្សនារឿងភាគខ្លីៗ និងរឿងសម្រាយពិសេសៗនៅលើ SiengStudio Mini App ឥឡូវនេះ!'
    : '🎬 Watch trending short dramas, series and audio stories on SiengStudio Mini App!';

  const handleCopy = () => {
    haptic.success();
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTelegramShare = () => {
    haptic.medium();
    shareToTelegram(shareText, referralLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[#12131e] rounded-3xl border border-white/10 p-5 shadow-2xl flex flex-col items-center text-center">
        <button
          onClick={() => {
            haptic.light();
            setIsShareModalOpen(false);
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-sky-900/30">
          <Users size={28} />
        </div>

        <h2 className="text-lg font-black text-white">{t('inviteFriends')}</h2>
        <p className="text-xs text-gray-300 mt-1 max-w-xs">{t('inviteDesc')}</p>

        {/* Reward Badge */}
        <div className="flex items-center gap-2 mt-4 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Coins size={14} className="fill-amber-400" />
          <span>+50 Coins per friend</span>
        </div>

        {/* Link Field */}
        <div className="w-full mt-4 flex items-center gap-2 p-2 bg-black/50 border border-white/10 rounded-xl">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 bg-transparent text-xs text-gray-300 outline-none truncate font-mono px-2"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? t('linkCopied') : t('copyLink')}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleTelegramShare}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold text-sm shadow-xl shadow-sky-900/40 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {t('shareTelegram')}
        </button>
      </div>
    </div>
  );
}

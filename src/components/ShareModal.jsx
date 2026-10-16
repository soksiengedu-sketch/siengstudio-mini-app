import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Users, Copy, Check, Send, Sparkles, Coins, Gift, Award } from 'lucide-react';
import { haptic, shareToTelegram } from '../services/telegram';

export default function ShareModal() {
  const {
    isShareModalOpen,
    setIsShareModalOpen,
    t,
    lang,
    user,
    referralsCount,
    referralCoinsEarned,
    referralsList,
    refreshReferrals
  } = useApp();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isShareModalOpen && refreshReferrals) {
      refreshReferrals();
    }
  }, [isShareModalOpen]);

  if (!isShareModalOpen) return null;

  const botUsername = 'SiengStudioBot';
  const referralLink = `https://t.me/${botUsername}?startapp=ref_${user?.id || '123'}`;
  const shareText = lang === 'km'
    ? `🎁 ចូលរួមទស្សនារឿងភាគខ្លីជាមួយខ្ញុំនៅលើ SiengStudio និងទទួលបាន 30 កាក់ឥតគិតថ្លៃភ្លាមៗ! 🎬`
    : `🎁 Join me on SiengStudio to watch trending short dramas and get +30 Free Welcome Coins! 🎬`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[#12131e] rounded-3xl border border-white/10 p-5 shadow-2xl flex flex-col items-center text-center max-h-[90vh] overflow-y-auto">
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
        <p className="text-xs text-gray-300 mt-1 max-w-xs">
          {lang === 'km'
            ? 'ណែនាំមិត្តភក្តិរបស់អ្នកមកកាន់ SiengStudio ដើម្បីទទួលបានកាក់មើលរឿងឥតគិតថ្លៃទាំងសងខាង!'
            : 'Invite your friends to SiengStudio and both of you get rewarded with free coins!'}
        </p>

        {/* Both Sides Reward Perks */}
        <div className="grid grid-cols-2 gap-2 w-full mt-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left">
            <span className="text-[10px] text-amber-300 font-bold block">អ្នកណែនាំ (You)</span>
            <span className="text-sm font-black text-amber-400 flex items-center gap-1 mt-0.5">
              <Coins size={14} className="fill-amber-400" /> +50 កាក់
            </span>
            <span className="text-[9px] text-gray-400">រាល់ការណែនាំ ១ នាក់</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left">
            <span className="text-[10px] text-emerald-300 font-bold block">មិត្តភក្តិ (Friend)</span>
            <span className="text-sm font-black text-emerald-400 flex items-center gap-1 mt-0.5">
              <Gift size={14} className="text-emerald-400" /> +30 កាក់
            </span>
            <span className="text-[9px] text-gray-400">Welcome Bonus</span>
          </div>
        </div>

        {/* Personal Referral Stats Card */}
        <div className="w-full mt-3 p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-around">
          <div>
            <p className="text-[10px] text-gray-400">មិត្តភក្តិបានណែនាំ</p>
            <p className="text-base font-black text-white">{referralsCount} <span className="text-xs font-normal text-gray-400">នាក់</span></p>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div>
            <p className="text-[10px] text-gray-400">កាក់ទទួលបានសរុប</p>
            <p className="text-base font-black text-amber-400">+{referralCoinsEarned} <span className="text-xs font-normal text-amber-400/80">កាក់</span></p>
          </div>
        </div>

        {/* Link Field */}
        <div className="w-full mt-3.5 flex items-center gap-2 p-2 bg-black/60 border border-white/10 rounded-xl">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 bg-transparent text-xs text-gray-300 outline-none truncate font-mono px-2"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all shrink-0"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? t('linkCopied') : t('copyLink')}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleTelegramShare}
          className="w-full mt-3.5 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-sky-900/40 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {t('shareTelegram')}
        </button>

        {/* Recent Referrals List */}
        {referralsList && referralsList.length > 0 && (
          <div className="w-full mt-4 text-left border-t border-white/5 pt-3">
            <p className="text-[11px] font-bold text-gray-400 mb-2">មិត្តភក្តិដែលបានចូលរួមថ្មីៗ:</p>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {referralsList.slice(0, 5).map((ref, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-white/5">
                  <span className="text-gray-300 font-medium">👤 {ref.name || 'Friend'}</span>
                  <span className="text-amber-400 font-bold">+50 កាក់</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

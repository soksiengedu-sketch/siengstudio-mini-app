import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Gift, Sparkles, Check, Coins, Calendar } from 'lucide-react';
import { haptic } from '../services/telegram';

export default function DailyCheckInModal() {
  const {
    isDailyModalOpen,
    setIsDailyModalOpen,
    t,
    lang,
    checkInStreak,
    hasCheckedInToday,
    triggerDailyCheckIn
  } = useApp();

  const [claimedReward, setClaimedReward] = useState(null);

  if (!isDailyModalOpen) return null;

  const rewards = [
    { day: 1, coins: 10 },
    { day: 2, coins: 15 },
    { day: 3, coins: 20 },
    { day: 4, coins: 25 },
    { day: 5, coins: 35 },
    { day: 6, coins: 50 },
    { day: 7, coins: 100, special: true }
  ];

  const handleClaim = async () => {
    haptic.heavy();
    const res = await triggerDailyCheckIn();
    if (res.success) {
      setClaimedReward(res.reward);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[#12131e] rounded-3xl border border-white/10 p-5 shadow-2xl flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={() => {
            haptic.light();
            setIsDailyModalOpen(false);
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Icon & Title */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-amber-400 text-white flex items-center justify-center mb-3 shadow-lg shadow-purple-900/40">
          <Gift size={28} />
        </div>

        <h2 className="text-lg font-black text-white">{t('dailyCheckIn')}</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {lang === 'km' ? 'ចូលរួមជារៀងរាល់ថ្ងៃ ដើម្បីទទួលបានកាក់ទស្សនារឿងឥតគិតថ្លៃ' : 'Check in daily to receive free coins for watching dramas'}
        </p>

        {/* Streak Badge */}
        <div className="mt-3 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
          <Calendar size={13} />
          <span>{checkInStreak} {t('streak')}</span>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-4 gap-2 w-full mt-4">
          {rewards.map((r) => {
            const isCompleted = r.day < checkInStreak || (r.day === checkInStreak && hasCheckedInToday);
            const isToday = r.day === checkInStreak && !hasCheckedInToday;

            return (
              <div
                key={r.day}
                className={`relative rounded-xl p-2.5 flex flex-col items-center justify-between border transition-all ${
                  r.special ? 'col-span-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-500/40' : ''
                } ${
                  isCompleted
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : isToday
                    ? 'bg-gradient-to-b from-purple-600/30 to-pink-600/20 border-purple-400 scale-105 shadow-md shadow-purple-900/30'
                    : 'bg-white/5 border-white/5 text-gray-400'
                }`}
              >
                <span className="text-[10px] font-bold text-gray-400">
                  {t('day')} {r.day}
                </span>

                <div className="my-1.5 flex items-center gap-1">
                  <Coins size={14} className={r.special ? 'fill-amber-400 text-amber-400' : 'text-amber-400'} />
                  <span className="text-xs font-black text-white">+{r.coins}</span>
                </div>

                {isCompleted ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[9px]">
                    <Check size={10} className="stroke-[3]" />
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-500">
                    {isToday ? 'Today' : 'Locked'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Claim Action */}
        <button
          onClick={handleClaim}
          disabled={hasCheckedInToday}
          className={`w-full mt-5 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
            hasCheckedInToday
              ? 'bg-white/10 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 via-purple-600 to-amber-500 text-white shadow-purple-900/40 active:scale-95'
          }`}
        >
          {hasCheckedInToday ? (
            <>
              <Check size={16} />
              {lang === 'km' ? 'បានទទួលរួចហើយថ្ងៃនេះ' : 'Claimed for Today'}
            </>
          ) : (
            <>
              <Sparkles size={16} />
              {lang === 'km' ? 'ចុចទទួលកាក់ឥឡូវនេះ' : 'Claim Today\'s Reward'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

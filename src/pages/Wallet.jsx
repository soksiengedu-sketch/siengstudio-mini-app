import React from 'react';
import { useApp } from '../context/AppContext';
import { Coins, Crown, Gift, Users, Sparkles, CheckCircle2, ShieldCheck, Zap, Star } from 'lucide-react';
import { haptic } from '../services/telegram';

export default function Wallet() {
  const {
    t,
    lang,
    coins,
    isVip,
    vipTier,
    setIsCoinModalOpen,
    setIsDailyModalOpen,
    setIsShareModalOpen,
    checkInStreak
  } = useApp();

  const coinPackages = [
    {
      id: 1,
      name: lang === 'km' ? 'កញ្ចប់សាកល្បង' : 'Starter',
      coins: 100,
      bonus: 100,
      totalCoins: 200,
      price: '$0.50',
      priceKhr: '2,000 ៛',
      perk: lang === 'km' ? 'មើលបាន 3-5 ភាគ' : '3-5 episodes',
      badge: lang === 'km' ? 'ថែម 100% 🎁' : '+100% BONUS'
    },
    {
      id: 2,
      name: lang === 'km' ? 'កញ្ចប់ពេញនិយម' : 'Popular',
      coins: 300,
      bonus: 45,
      totalCoins: 345,
      price: '$1.50',
      priceKhr: '6,000 ៛',
      perk: lang === 'km' ? 'មើលបាន 12-17 ភាគ' : '12-17 episodes',
      badge: 'HOT 🔥 (+15%)',
      popular: true
    },
    {
      id: 3,
      name: lang === 'km' ? 'កញ្ចប់បញ្ចប់ ១ រឿង' : 'Binge 1 Drama',
      coins: 800,
      bonus: 200,
      totalCoins: 1000,
      price: '$4.00',
      priceKhr: '16,000 ៛',
      perk: lang === 'km' ? 'មើលបាន 35-50 ភាគ' : '35-50 episodes',
      badge: 'BEST 💎 (+25%)',
      bestValue: true
    },
    {
      id: 4,
      name: lang === 'km' ? 'កញ្ចប់អ្នកគាំទ្រធំ' : 'Mega Fan',
      coins: 2000,
      bonus: 700,
      totalCoins: 2700,
      price: '$10.00',
      priceKhr: '40,000 ៛',
      perk: lang === 'km' ? 'មើលបាន 90-135 ភាគ' : '90-135 episodes',
      badge: 'MEGA 👑 (+35%)'
    }
  ];

  return (
    <div className="min-h-screen pb-24 px-4 pt-3 space-y-4">
      {/* Wallet Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#1f1b3c] via-[#2d1b46] to-[#401948] p-5 border border-purple-500/30 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30 shadow-inner">
              <Coins size={24} className="fill-amber-400" />
            </div>
            <div>
              <p className="text-xs text-purple-200 font-medium">{t('myCoins')}</p>
              <h2 className="text-2xl font-black text-white">{coins.toLocaleString()} <span className="text-xs font-normal text-amber-400">កាក់</span></h2>
            </div>
          </div>

          {isVip ? (
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black text-xs font-black uppercase flex items-center gap-1 shadow-lg">
              <Crown size={12} className="fill-black" />
              {vipTier === 'lite' ? 'LITE VIP' : 'ALL-ACCESS VIP'}
            </span>
          ) : (
            <button
              onClick={() => {
                haptic.medium();
                setIsCoinModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-extrabold text-xs shadow-md active:scale-95 transition-transform flex items-center gap-1"
            >
              + {t('topUp')}
            </button>
          )}
        </div>

        {/* Free Episodes Info */}
        <div className="mt-3.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px] text-gray-300">
          <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <ShieldCheck size={14} /> ភាគទី 1 - 10 មើលឥតគិតថ្លៃ (Free)
          </span>
          <span className="font-mono text-amber-300">20 - 30 កាក់/ភាគ</span>
        </div>

        {/* Quick Earn Cards Row */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => {
              haptic.light();
              setIsDailyModalOpen(true);
            }}
            className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2.5 text-left active:scale-95 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-pink-500/30 text-pink-300 flex items-center justify-center shrink-0">
              <Gift size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">{t('dailyCheckIn')}</p>
              <p className="text-[10px] text-pink-300">{checkInStreak} {t('days')}</p>
            </div>
          </button>

          <button
            onClick={() => {
              haptic.light();
              setIsShareModalOpen(true);
            }}
            className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2.5 text-left active:scale-95 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-500/30 text-sky-300 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">{t('inviteFriends')}</p>
              <p className="text-[10px] text-sky-300">+50 កាក់</p>
            </div>
          </button>
        </div>
      </div>

      {/* Coin Packages Showcase */}
      <div className="rounded-3xl bg-white/5 border border-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Coins size={14} className="text-amber-400" />
            {lang === 'km' ? 'កញ្ចប់កាក់ថ្មី (បន្ថែម Bonus)' : 'Coin Packages (With Bonus)'}
          </h4>
          <span className="text-[10px] text-rose-400 font-bold">Bakong KHQR</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {coinPackages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => {
                haptic.medium();
                setIsCoinModalOpen(true);
              }}
              className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/40 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-300">{pkg.name}</span>
                  {pkg.badge && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                      {pkg.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mt-1 text-amber-300 font-black text-sm">
                  <span>{pkg.totalCoins.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 font-normal">កាក់</span>
                </div>
                <p className="text-[9px] text-gray-400 mt-0.5">{pkg.perk}</p>
              </div>

              <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">{pkg.price}</span>
                  <span className="text-[9px] text-amber-400/80 ml-1">({pkg.priceKhr})</span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold">ទិញ</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VIP Membership Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-purple-500/15 to-pink-500/20 p-5 border border-amber-500/30 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Crown size={18} className="text-amber-400 fill-amber-400" />
              <h3 className="text-base font-black text-white">{t('vipPass')}</h3>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-xs leading-relaxed">
              {lang === 'km'
                ? 'ជម្រើស VIP សម្រាប់ទីផ្សារកម្ពុជា៖ Lite VIP ($2.50) & All-Access VIP ($6.99)'
                : 'Exclusive VIP passes: Lite VIP ($2.50) & All-Access VIP ($6.99)'}
            </p>
          </div>
          <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/40">
            ចាប់ពី $2.50
          </span>
        </div>

        <ul className="mt-4 space-y-1.5 text-xs text-gray-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span><strong>Lite VIP ($2.50 / 10,000 ៛)</strong>: បាន 200 កាក់ភ្លាម + 30 កាក់/ថ្ងៃ + បញ្ចុះតម្លៃ 20%</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span><strong>All-Access VIP ($6.99 / 28,000 ៛)</strong>: មើលគ្រប់រឿងឥតដែនកំណត់ គ្មានពាណិជ្ជកម្ម</span>
          </li>
        </ul>

        <button
          onClick={() => {
            haptic.medium();
            setIsCoinModalOpen(true);
          }}
          className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
        >
          <Sparkles size={14} />
          {isVip ? 'គ្រប់គ្រងសមាជិក VIP (Manage VIP)' : t('buyVip')}
        </button>
      </div>

      {/* Ways to Earn Coins */}
      <div className="rounded-3xl bg-white/5 border border-white/5 p-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Zap size={14} className="text-amber-400" />
          {lang === 'km' ? 'វិធីរកកាក់បន្ថែមដោយឥតគិតថ្លៃ' : 'Ways to Earn Free Coins'}
        </h4>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
            <div className="flex items-center gap-2.5">
              <Gift size={16} className="text-pink-400" />
              <div>
                <p className="text-xs font-bold text-white">{t('dailyCheckIn')}</p>
                <p className="text-[10px] text-gray-400">ទទួលបានរហូតដល់ 100 កាក់/ថ្ងៃ (Lite VIP +30 កាក់)</p>
              </div>
            </div>
            <button
              onClick={() => setIsDailyModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 text-xs font-bold"
            >
              Claim
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
            <div className="flex items-center gap-2.5">
              <Users size={16} className="text-sky-400" />
              <div>
                <p className="text-xs font-bold text-white">{t('inviteFriends')}</p>
                <p className="text-[10px] text-gray-400">+50 កាក់រាល់ការណែនាំម្នាក់</p>
              </div>
            </div>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 text-xs font-bold"
            >
              Invite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

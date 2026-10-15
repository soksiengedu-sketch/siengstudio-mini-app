import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Coins,
  Crown,
  Check,
  QrCode,
  Star,
  Sparkles,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { haptic } from '../services/telegram';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export default function CoinModal() {
  const {
    isCoinModalOpen,
    setIsCoinModalOpen,
    t,
    lang,
    user,
    coins,
    setCoins,
    isVip,
    setIsVip,
    setVipTier,
    topUpCoins,
    upgradeVip
  } = useApp();

  // Navigation state within modal: 'select' | 'pay' | 'success'
  const [modalStep, setModalStep] = useState('select');
  const [activeSubTab, setActiveSubTab] = useState('coins'); // 'coins' or 'vip'
  const [selectedPackage, setSelectedPackage] = useState(2);
  const [selectedVipTier, setSelectedVipTier] = useState('lite'); // 'lite', 'weekly', 'monthly'
  const [paymentMethod, setPaymentMethod] = useState('khqr'); // 'khqr' or 'stars'

  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedKhqr, setGeneratedKhqr] = useState(null);
  const pollIntervalRef = useRef(null);

  // Reset step whenever modal is reopened
  useEffect(() => {
    if (isCoinModalOpen) {
      setModalStep('select');
      setIsProcessing(false);
      setGeneratedKhqr(null);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [isCoinModalOpen]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  if (!isCoinModalOpen) return null;

  const coinPackages = [
    {
      id: 1,
      name: lang === 'km' ? 'កញ្ចប់សាកល្បង' : 'Starter Pack',
      coins: 100,
      bonus: 100,
      totalCoins: 200,
      price: '$0.50',
      priceKhr: '2,000 ៛',
      amountKhrNum: 2000,
      amountUsdNum: 0.5,
      stars: 25,
      perk: lang === 'km' ? 'មើលបាន 3 - 5 ភាគ' : 'Watch 3-5 episodes',
      badge: lang === 'km' ? 'ថែម 100% លើកដំបូង 🎁' : '+100% FIRST BONUS'
    },
    {
      id: 2,
      name: lang === 'km' ? 'កញ្ចប់ពេញនិយម' : 'Popular Pack',
      coins: 300,
      bonus: 45,
      totalCoins: 345,
      price: '$1.50',
      priceKhr: '6,000 ៛',
      amountKhrNum: 6000,
      amountUsdNum: 1.5,
      stars: 75,
      popular: true,
      perk: lang === 'km' ? 'មើលបាន 12 - 17 ភាគ' : 'Watch 12-17 episodes',
      badge: 'HOT 🔥 (+15%)'
    },
    {
      id: 3,
      name: lang === 'km' ? 'កញ្ចប់បញ្ចប់ ១ រឿង' : 'Binge 1 Drama',
      coins: 800,
      bonus: 200,
      totalCoins: 1000,
      price: '$4.00',
      priceKhr: '16,000 ៛',
      amountKhrNum: 16000,
      amountUsdNum: 4.0,
      stars: 200,
      bestValue: true,
      perk: lang === 'km' ? 'មើលបាន 35 - 50 ភាគ (ចប់ ១ រឿង)' : 'Watch 35-50 episodes',
      badge: 'BEST 💎 (+25%)'
    },
    {
      id: 4,
      name: lang === 'km' ? 'កញ្ចប់អ្នកគាំទ្រធំ' : 'Mega Fan Pack',
      coins: 2000,
      bonus: 700,
      totalCoins: 2700,
      price: '$10.00',
      priceKhr: '40,000 ៛',
      amountKhrNum: 40000,
      amountUsdNum: 10.0,
      stars: 500,
      perk: lang === 'km' ? 'មើលបាន 90 - 135 ភាគ (២-៣ រឿងពេញ)' : 'Watch 90-135 episodes',
      badge: 'MEGA 👑 (+35%)'
    }
  ];

  const vipPackages = [
    {
      id: 'lite',
      name: 'Lite VIP',
      tag: lang === 'km' ? 'ណែនាំបំផុត ⭐' : 'RECOMMENDED ⭐',
      price: '$2.50',
      priceKhr: '10,000 ៛',
      amountKhrNum: 10000,
      amountUsdNum: 2.5,
      period: lang === 'km' ? 'ក្នុង ១ ខែ' : '/ month',
      stars: 125,
      badgeColor: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black',
      features: [
        lang === 'km' ? 'ទទួលបាន 200 កាក់ភ្លាមៗ នៅពេលភ្ជាប់' : '200 Instant Bonus Coins upfront',
        lang === 'km' ? 'ទទួលបាន 30 កាក់រាល់ថ្ងៃ (សរុប ១ ខែ = 1,100 កាក់)' : '+30 Coins every day upon check-in (1,100 coins/mo)',
        lang === 'km' ? 'បញ្ចុះតម្លៃ 20% លើការដោះសោភាគរឿងថ្មីៗ' : '20% Discount on unlocking new drama episodes',
        lang === 'km' ? 'គ្មានពាណិជ្ជកម្មរំខាន (No Ads) & Ultra HD' : 'Ad-free experience & Ultra HD quality'
      ]
    },
    {
      id: 'weekly',
      name: lang === 'km' ? 'All-Access VIP សប្តាហ៍' : 'All-Access VIP Weekly',
      tag: lang === 'km' ? '៧ ថ្ងៃ' : '7 DAYS PASS',
      price: '$2.50',
      priceKhr: '10,000 ៛',
      amountKhrNum: 10000,
      amountUsdNum: 2.5,
      period: lang === 'km' ? '៧ ថ្ងៃ' : '/ 7 days',
      stars: 125,
      badgeColor: 'bg-purple-600 text-white',
      features: [
        lang === 'km' ? 'ដោះសោគ្រប់ភាគទាំងអស់ដោយសេរី ៧ ថ្ងៃ' : 'Unlimited access to all dramas for 7 days',
        lang === 'km' ? 'ទស្សនាដោយគ្មានពាណិជ្ជកម្មរំខាន' : 'Watch before anyone else & ad-free',
        lang === 'km' ? 'កម្រិតរូបភាពច្បាស់ Ultra HD 1080p' : 'Full HD 1080p crystal clear streaming'
      ]
    },
    {
      id: 'monthly',
      name: lang === 'km' ? 'All-Access VIP ខែ' : 'All-Access VIP Monthly',
      tag: lang === 'km' ? 'ពេញនិយម 🔥' : 'BEST UNLIMITED 🔥',
      price: '$6.99',
      priceKhr: '28,000 ៛',
      amountKhrNum: 28000,
      amountUsdNum: 6.99,
      period: lang === 'km' ? '៣០ ថ្ងៃ' : '/ 30 days',
      stars: 350,
      badgeColor: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white',
      features: [
        lang === 'km' ? 'ដោះសោគ្រប់ភាគទាំងអស់ដោយសេរី ៣០ ថ្ងៃពេញ' : 'Unlimited access to all dramas for 30 full days',
        lang === 'km' ? 'ទស្សនារឿងថ្មីៗមុនគេ គ្មានពាណិជ្ជកម្ម' : 'Early VIP access to new releases with zero ads',
        lang === 'km' ? 'កម្រិតរូបភាពច្បាស់ Ultra HD 1080p' : 'High bitrate Ultra HD 1080p streaming'
      ]
    }
  ];

  const currentCoinPkg = coinPackages.find((p) => p.id === selectedPackage) || coinPackages[1];
  const currentVipPkg = vipPackages.find((v) => v.id === selectedVipTier) || vipPackages[0];

  const activePriceDisplay =
    activeSubTab === 'coins'
      ? `${currentCoinPkg.price} (${currentCoinPkg.priceKhr})`
      : `${currentVipPkg.price} (${currentVipPkg.priceKhr})`;

  const activeTitleDisplay =
    activeSubTab === 'coins'
      ? `${currentCoinPkg.name} (${currentCoinPkg.totalCoins} កាក់)`
      : `${currentVipPkg.name} (${currentVipPkg.period})`;

  const handleProceedToPayment = async () => {
    haptic.medium();

    if (paymentMethod === 'stars') {
      setModalStep('pay');
      return;
    }

    // ACLEDA Bakong Dynamic KHQR Flow
    setIsGeneratingQr(true);
    setModalStep('pay');

    try {
      const amountKhr = activeSubTab === 'coins' ? currentCoinPkg.amountKhrNum : currentVipPkg.amountKhrNum;
      const amountUsd = activeSubTab === 'coins' ? currentCoinPkg.amountUsdNum : currentVipPkg.amountUsdNum;

      const res = await api.generateKhqr({
        telegramId: user?.id || 'demo_user',
        type: activeSubTab,
        packageId: currentCoinPkg.id,
        tier: currentVipPkg.id,
        amountKhr,
        amountUsd,
        currency: 'KHR'
      });

      if (res && res.success) {
        setGeneratedKhqr(res);
        startPollingPayment(res.md5);
      }
    } catch (err) {
      console.error('Failed to generate KHQR:', err);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const startPollingPayment = (md5) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const checkRes = await api.checkPaymentStatus(md5);
        if (checkRes && checkRes.paid) {
          clearInterval(pollIntervalRef.current);
          handleSuccessAction(checkRes);
        }
      } catch (e) {
        console.warn('Polling error:', e);
      }
    }, 2500);
  };

  const handleSuccessAction = (result) => {
    setModalStep('success');
    haptic.success();
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    } catch (e) {}

    if (result?.type === 'coins' || activeSubTab === 'coins') {
      setCoins(result?.coins ?? (prev => prev + currentCoinPkg.totalCoins));
    } else {
      setIsVip(true);
      if (setVipTier) setVipTier(result?.vipTier || currentVipPkg.id);
      if (currentVipPkg.id === 'lite') {
        setCoins(prev => prev + 200);
      }
    }

    setTimeout(() => {
      setIsCoinModalOpen(false);
      setModalStep('select');
    }, 2000);
  };

  const handleInstantConfirm = async () => {
    setIsProcessing(true);
    haptic.medium();

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    if (paymentMethod === 'stars') {
      setTimeout(() => {
        if (activeSubTab === 'coins') {
          topUpCoins(currentCoinPkg.id, 'stars');
        } else {
          upgradeVip(currentVipPkg.id);
        }
        setIsProcessing(false);
        handleSuccessAction({ success: true, coins: coins + currentCoinPkg.totalCoins });
      }, 1000);
      return;
    }

    try {
      const res = await api.confirmPaymentNow({
        md5: generatedKhqr?.md5,
        telegramId: user?.id || 'demo_user',
        type: activeSubTab,
        packageId: currentCoinPkg.id,
        tier: currentVipPkg.id
      });
      setIsProcessing(false);
      handleSuccessAction(res);
    } catch (err) {
      setIsProcessing(false);
      handleSuccessAction({ success: true, coins: coins + currentCoinPkg.totalCoins });
    }
  };

  const closeModal = () => {
    haptic.light();
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setIsCoinModalOpen(false);
    setModalStep('select');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#11121d] rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto pb-safe">

        {/* ----------------- STEP 1: SELECT PACKAGE ----------------- */}
        {modalStep === 'select' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Coins size={20} className="fill-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{t('wallet')}</h2>
                  <p className="text-[11px] text-amber-400 font-medium">
                    {t('myCoins')}: <strong className="text-white text-xs">{coins.toLocaleString()}</strong> កាក់
                    {isVip && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                        VIP ACTIVE
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Free Episodes Info Banner */}
            <div className="mt-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <ShieldCheck size={16} />
                <span>{lang === 'km' ? 'ភាគទី 1 ដល់ 10 មើលដោយឥតគិតថ្លៃ (ហ្វ្រី) 🎉' : 'Episodes 1 to 10 are completely FREE 🎉'}</span>
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono">20-30 Coins/ep</span>
            </div>

            {/* Tab Switcher: Coins vs VIP */}
            <div className="grid grid-cols-2 gap-2 mt-3 p-1 bg-white/5 rounded-2xl">
              <button
                onClick={() => {
                  haptic.select();
                  setActiveSubTab('coins');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeSubTab === 'coins'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Coins size={14} className={activeSubTab === 'coins' ? 'fill-black' : ''} />
                {t('topUp')}
              </button>

              <button
                onClick={() => {
                  haptic.select();
                  setActiveSubTab('vip');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeSubTab === 'vip'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Crown size={14} className={activeSubTab === 'vip' ? 'fill-white' : ''} />
                {t('vipPass')}
              </button>
            </div>

            {/* Coins Packages List */}
            {activeSubTab === 'coins' && (
              <div className="grid grid-cols-2 gap-2.5 mt-3.5">
                {coinPackages.map((pkg) => {
                  const isSelected = selectedPackage === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        haptic.select();
                        setSelectedPackage(pkg.id);
                      }}
                      className={`relative p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                          : 'bg-white/5 border-white/5 hover:border-white/15'
                      }`}
                    >
                      {pkg.badge && (
                        <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-[9px] font-black text-white shadow">
                          {pkg.badge}
                        </span>
                      )}

                      <div>
                        <p className="text-[11px] font-bold text-gray-300">{pkg.name}</p>
                        <div className="flex items-baseline gap-1 mt-1 text-amber-300 font-extrabold text-base">
                          <Coins size={16} className="fill-amber-400/40" />
                          <span>{pkg.totalCoins.toLocaleString()}</span>
                          <span className="text-[10px] text-gray-400 font-normal">កាក់</span>
                        </div>

                        <p className="text-[9px] text-emerald-400 font-medium mt-0.5">
                          {pkg.bonus > 0 ? `(គោល ${pkg.coins} + ថែម ${pkg.bonus})` : `(${pkg.coins} កាក់)`}
                        </p>

                        <div className="mt-1.5 inline-block px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] text-gray-300">
                          ✨ {pkg.perk}
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-white block">{pkg.price}</span>
                          <span className="text-[9px] font-mono text-amber-400/90">{pkg.priceKhr}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          {pkg.stars}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIP Packages List */}
            {activeSubTab === 'vip' && (
              <div className="space-y-2.5 mt-3.5">
                {vipPackages.map((vip) => {
                  const isSelected = selectedVipTier === vip.id;
                  return (
                    <div
                      key={vip.id}
                      onClick={() => {
                        haptic.select();
                        setSelectedVipTier(vip.id);
                      }}
                      className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? `border-amber-400 bg-gradient-to-br from-amber-500/15 via-purple-900/30 to-black shadow-lg shadow-amber-500/10`
                          : 'bg-white/5 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-black flex items-center justify-center font-black">
                            <Crown size={16} className="fill-black" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-black text-white">{vip.name}</h3>
                              {vip.tag && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${vip.badgeColor}`}>
                                  {vip.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium">{vip.period}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-black text-amber-300">{vip.price}</p>
                          <p className="text-[10px] font-mono text-gray-300">{vip.priceKhr}</p>
                        </div>
                      </div>

                      <ul className="mt-2.5 space-y-1 text-xs text-gray-300 pl-1">
                        {vip.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-[11px]">
                            <Check size={12} className="text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                {lang === 'km' ? 'វិធីសាស្ត្រទូទាត់ប្រាក់' : 'Payment Method'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    haptic.select();
                    setPaymentMethod('khqr');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                    paymentMethod === 'khqr'
                      ? 'bg-rose-500/10 border-rose-500 text-rose-300'
                      : 'bg-white/5 border-white/5 text-gray-400'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-[9px] flex items-center justify-center shrink-0">
                    KH
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight">Bakong KHQR</p>
                    <p className="text-[9px] opacity-75">ACLEDA / ABA / Wing</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    haptic.select();
                    setPaymentMethod('stars');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                    paymentMethod === 'stars'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                      : 'bg-white/5 border-white/5 text-gray-400'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-600 text-black flex items-center justify-center shrink-0">
                    <Star size={12} className="fill-black" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight">Telegram Stars</p>
                    <p className="text-[9px] opacity-75">Instant In-App</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleProceedToPayment}
              className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              <span>
                {activeSubTab === 'coins' ? `${t('topUp')} ` : `${t('buyVip')} `}
                <strong>{activePriceDisplay}</strong>
              </span>
            </button>
          </>
        )}

        {/* ----------------- STEP 2: KHQR / STARS PAYMENT SCREEN ----------------- */}
        {modalStep === 'pay' && (
          <div className="flex flex-col items-center text-center py-1">
            {/* Nav Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <button
                onClick={() => {
                  haptic.light();
                  if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                  setModalStep('select');
                }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg bg-white/5"
              >
                <ArrowLeft size={14} />
                <span>{lang === 'km' ? 'ប្តូរកញ្ចប់' : 'Back'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">
                  KHQR
                </span>
                <span className="text-xs font-bold text-gray-200">ACLEDA Bank</span>
              </div>

              <button
                onClick={closeModal}
                className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {paymentMethod === 'stars' ? (
              /* Telegram Stars Checkout Screen */
              <div className="w-full py-6 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
                  <Star size={32} className="fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{activeTitleDisplay}</h3>
                  <p className="text-sm font-mono text-amber-400 mt-1">
                    {activeSubTab === 'coins' ? currentCoinPkg.stars : currentVipPkg.stars} Telegram Stars
                  </p>
                </div>
                <button
                  onClick={handleInstantConfirm}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-extrabold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} className="fill-black" />}
                  <span>{isProcessing ? 'Processing Stars...' : 'Pay with Telegram Stars'}</span>
                </button>
              </div>
            ) : (
              /* ACLEDA Bank Bakong KHQR Screen */
              <div className="w-full flex flex-col items-center">
                {/* Account Summary Card */}
                <div className="w-full py-2.5 px-3.5 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-left flex justify-between items-center mb-3">
                  <div>
                    <p className="text-[10px] text-rose-300 font-medium">គណនីទទួល (ACLEDA Bank):</p>
                    <p className="text-xs font-black text-white uppercase tracking-wider">
                      {generatedKhqr?.merchantName || 'CHAN SOKSIENG'}
                    </p>
                    <p className="text-[10px] font-mono text-rose-200">088 568 8848</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block">{activeTitleDisplay}</span>
                    <span className="text-sm font-black text-amber-400">{activePriceDisplay}</span>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="w-56 h-56 bg-white p-3 rounded-3xl border-2 border-rose-500 shadow-2xl flex flex-col items-center justify-center relative">
                  {isGeneratingQr ? (
                    <div className="flex flex-col items-center gap-2 text-rose-600">
                      <Loader2 size={36} className="animate-spin" />
                      <span className="text-xs font-bold">កំពុងរៀបចំ KHQR...</span>
                    </div>
                  ) : generatedKhqr?.qrImageData ? (
                    <img
                      src={generatedKhqr.qrImageData}
                      alt="ACLEDA KHQR"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-800">
                      <QrCode size={130} />
                      <span className="text-[9px] font-bold text-rose-600 mt-2">CHAN SOKSIENG</span>
                    </div>
                  )}
                </div>

                {/* Real-time Status Badge */}
                <div className="mt-3 flex items-center gap-2 py-1 px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>កំពុងរង់ចាំការស្កេន និងផ្ទេរប្រាក់ (Auto-Checking)...</span>
                </div>

                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed max-w-xs">
                  បើកកម្មវិធី <strong>ACLEDA Mobile</strong>, <strong>ABA</strong>, ឬធនាគារណាក៏បាន ដើម្បីស្កេនបង់ប្រាក់
                </p>

                {/* Instant Confirm / Test Action Button */}
                <button
                  onClick={handleInstantConfirm}
                  disabled={isProcessing}
                  className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>កំពុងផ្ទៀងផ្ទាត់...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>✓ ខ្ញុំបានផ្ទេររួចហើយ (បញ្ជាក់ការទូទាត់)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ----------------- STEP 3: SUCCESS CELEBRATION ----------------- */}
        {modalStep === 'success' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center animate-bounce shadow-2xl shadow-emerald-500/30">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-lg font-black text-white">ទូទាត់ប្រាក់ជោគជ័យ! 🎉</h3>
            <p className="text-xs text-gray-300 max-w-xs leading-relaxed">
              {activeSubTab === 'coins'
                ? `កាក់ចំនួន ${currentCoinPkg.totalCoins.toLocaleString()} ត្រូវបានបញ្ចូលទៅក្នុងកាបូបរបស់អ្នករួចរាល់!`
                : `គណនីរបស់អ្នកត្រូវបានភ្ជាប់ ${currentVipPkg.name} រួចរាល់ដោយជោគជ័យ!`}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

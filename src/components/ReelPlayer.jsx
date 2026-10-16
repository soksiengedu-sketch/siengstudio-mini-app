import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  ListVideo,
  Lock,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Coins,
  Crown,
  Zap
} from 'lucide-react';
import { haptic, shareToTelegram } from '../services/telegram';
import EpisodeDrawer from './EpisodeDrawer';
import {
  saveEpisodeProgress,
  getEpisodeProgress,
  clearEpisodeProgress,
  formatDuration
} from '../utils/playback';

export default function ReelPlayer({ drama, initialEpId, onBack }) {
  const {
    t,
    lang,
    isEpisodeUnlocked,
    unlockEpisode,
    coins,
    isVip,
    recordHistory,
    toggleFavorite,
    favorites,
    setIsCoinModalOpen
  } = useApp();

  const episodes = drama?.episodes || [];
  const [currentEpIndex, setCurrentEpIndex] = useState(() => {
    const idx = episodes.findIndex((e) => e.id === initialEpId);
    return idx >= 0 ? idx : 0;
  });

  const currentEpisode = episodes[currentEpIndex] || episodes[0] || {};
  const nextEpData = episodes[currentEpIndex + 1];
  const isUnlocked = isEpisodeUnlocked(drama.id, currentEpisode);

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isCinema, setIsCinema] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(drama.likes || 1240);
  const [hearts, setHearts] = useState([]);
  const [showAutoNext, setShowAutoNext] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState(3);
  const autoNextIntervalRef = useRef(null);

  // Resume Playback states
  const [resumeToast, setResumeToast] = useState(null); // { seconds, timeString, show: true }
  const resumeToastTimeoutRef = useRef(null);
  const lastSavedTimeRef = useRef(0);
  const hasAppliedResumeRef = useRef(false);

  // Smart Preload states
  const [shouldPreloadNext, setShouldPreloadNext] = useState(false);
  const [isNextPreloaded, setIsNextPreloaded] = useState(false);

  // Swipe detection
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const isFav = favorites.some((f) => f.id === drama.id);

  // Clear auto-next interval and resume timeout on unmount
  useEffect(() => {
    return () => {
      if (autoNextIntervalRef.current) clearInterval(autoNextIntervalRef.current);
      if (resumeToastTimeoutRef.current) clearTimeout(resumeToastTimeoutRef.current);
    };
  }, []);

  // Sync episode change and clear timers
  useEffect(() => {
    if (autoNextIntervalRef.current) {
      clearInterval(autoNextIntervalRef.current);
      setShowAutoNext(false);
    }
    if (initialEpId) {
      const idx = episodes.findIndex((e) => e.id === initialEpId);
      if (idx >= 0) setCurrentEpIndex(idx);
    }
  }, [initialEpId]);

  // Handle Play/Pause and Resume Playback when current episode or unlock status changes
  useEffect(() => {
    hasAppliedResumeRef.current = false;
    setShouldPreloadNext(false);
    setIsNextPreloaded(false);
    if (resumeToastTimeoutRef.current) clearTimeout(resumeToastTimeoutRef.current);

    if (videoRef.current) {
      if (isUnlocked) {
        const saved = getEpisodeProgress(drama.id, currentEpisode.id);
        if (saved && saved.seconds >= 3) {
          videoRef.current.currentTime = saved.seconds;
          hasAppliedResumeRef.current = true;
          setResumeToast({ seconds: saved.seconds, timeString: saved.timeString, show: true });
          resumeToastTimeoutRef.current = setTimeout(() => {
            setResumeToast((prev) => (prev ? { ...prev, show: false } : null));
          }, 3500);
          recordHistory(drama.id, currentEpisode.id, saved.seconds);
        } else {
          videoRef.current.currentTime = 0;
          setResumeToast(null);
          recordHistory(drama.id, currentEpisode.id, 0);
        }

        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setResumeToast(null);
      }
    }
  }, [currentEpIndex, isUnlocked]);

  // Save progress before unmounting or changing episode
  useEffect(() => {
    return () => {
      if (videoRef.current && drama?.id && currentEpisode?.id) {
        const cur = videoRef.current.currentTime;
        const dur = videoRef.current.duration || 0;
        if (cur >= 3) {
          saveEpisodeProgress(drama.id, currentEpisode.id, currentEpisode.episodeNumber, cur, dur);
          recordHistory(drama.id, currentEpisode.id, Math.floor(cur));
        }
      }
    };
  }, [currentEpIndex]);

  const togglePlay = () => {
    if (!isUnlocked) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
      haptic.light();
    }
  };

  const handleDoubleTap = (e) => {
    if (!isUnlocked) return;
    haptic.medium();
    setLiked(true);
    setLikeCount((c) => c + 1);

    // Spawn floating heart at tap location
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newHeart = { id: Date.now(), x, y };
    setHearts((prev) => [...prev, newHeart]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1000);
  };

  const nextEpisode = () => {
    if (currentEpIndex < episodes.length - 1) {
      haptic.medium();
      setCurrentEpIndex((prev) => prev + 1);
      setShowAutoNext(false);
    }
  };

  const prevEpisode = () => {
    if (currentEpIndex > 0) {
      haptic.medium();
      setCurrentEpIndex((prev) => prev - 1);
      setShowAutoNext(false);
    }
  };

  // PC / Desktop keyboard controls (ArrowUp, ArrowDown, Space, M, F, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        nextEpisode();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        prevEpisode();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(duration || 9999, videoRef.current.currentTime + 5);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        setIsCinema((prev) => !prev);
      } else if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentEpIndex, isPlaying, isMuted, isCinema, duration]);

  // Touch handlers for vertical reel swipe
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const diff = touchStartY.current - touchEndY.current;
    const threshold = 55; // minimum swipe distance
    if (diff > threshold) {
      // Swiped UP -> Next Episode
      nextEpisode();
    } else if (diff < -threshold) {
      // Swiped DOWN -> Prev Episode
      prevEpisode();
    }
  };

  const cycleSpeed = () => {
    haptic.light();
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setSpeed(newSpeed);
    if (videoRef.current) videoRef.current.playbackRate = newSpeed;
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      setDuration(dur);
      const saved = getEpisodeProgress(drama.id, currentEpisode.id);
      if (saved && saved.seconds >= 3 && isUnlocked && !hasAppliedResumeRef.current) {
        videoRef.current.currentTime = saved.seconds;
        hasAppliedResumeRef.current = true;
        setResumeToast({ seconds: saved.seconds, timeString: saved.timeString, show: true });
        if (resumeToastTimeoutRef.current) clearTimeout(resumeToastTimeoutRef.current);
        resumeToastTimeoutRef.current = setTimeout(() => {
          setResumeToast((prev) => (prev ? { ...prev, show: false } : null));
        }, 3500);
      }
    }
  };

  const handleRestartFromBeginning = () => {
    haptic.medium();
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      clearEpisodeProgress(drama.id, currentEpisode.id);
      recordHistory(drama.id, currentEpisode.id, 0);
    }
    setResumeToast(null);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      setCurrentTime(cur);
      if (dur > 0 && dur !== duration) setDuration(dur);

      // 1. Smart Preload Trigger for next episode (when >= 25% watched or within last 30s)
      if (!shouldPreloadNext && nextEpData && nextEpData.videoUrl) {
        if (cur >= 3 && (cur / (dur || 1) >= 0.25 || (dur > 0 && dur - cur <= 30))) {
          setShouldPreloadNext(true);
        }
      }

      // 2. Resume memory: save progress every 2 seconds
      if (Math.abs(cur - lastSavedTimeRef.current) >= 2) {
        lastSavedTimeRef.current = cur;
        saveEpisodeProgress(drama.id, currentEpisode.id, currentEpisode.episodeNumber, cur, dur);
        recordHistory(drama.id, currentEpisode.id, Math.floor(cur));
      }
    }
  };

  const handleVideoEnded = () => {
    clearEpisodeProgress(drama.id, currentEpisode.id);
    if (currentEpIndex < episodes.length - 1) {
      setShowAutoNext(true);
      setAutoNextCountdown(3);
      if (autoNextIntervalRef.current) clearInterval(autoNextIntervalRef.current);
      let count = 3;
      autoNextIntervalRef.current = setInterval(() => {
        count -= 1;
        setAutoNextCountdown(count);
        if (count <= 0) {
          if (autoNextIntervalRef.current) clearInterval(autoNextIntervalRef.current);
          nextEpisode();
        }
      }, 1000);
    }
  };

  const handleUnlockCurrent = async () => {
    haptic.medium();
    await unlockEpisode(drama.id, currentEpisode);
  };

  const dramaTitle = lang === 'km' && drama.titleKm ? drama.titleKm : drama.title;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Smart Preloader for Next Episode */}
      {shouldPreloadNext && nextEpData?.videoUrl && (
        <video
          key={`preload-ep-${nextEpData.id}-${nextEpData.videoUrl}`}
          src={nextEpData.videoUrl}
          preload="auto"
          muted
          playsInline
          className="hidden pointer-events-none"
          style={{ display: 'none', width: 0, height: 0, opacity: 0, position: 'absolute' }}
          onLoadedData={() => setIsNextPreloaded(true)}
          onCanPlayThrough={() => setIsNextPreloaded(true)}
        />
      )}

      {/* Ambient Blurred Backdrop for PC / Wide displays */}
      <div className="absolute inset-0 hidden md:block overflow-hidden pointer-events-none opacity-30 blur-3xl scale-125">
        <img
          src={drama.posterUrl}
          className="w-full h-full object-cover"
          alt=""
        />
      </div>

      {/* Video Element - Fullscreen on mobile, centered 9:16 reel on PC */}
      <div
        className={`relative w-full h-full max-w-lg mx-auto flex items-center justify-center bg-black ${
          isCinema ? 'max-w-none' : ''
        }`}
        onDoubleClick={handleDoubleTap}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={currentEpisode.videoUrl}
          poster={drama.posterUrl}
          playsInline
          loop={false}
          muted={isMuted}
          className={`w-full h-full ${
            isCinema ? 'object-contain' : 'object-cover'
          }`}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnded}
        />

        {/* Resume Playback Toast Indicator */}
        {resumeToast && resumeToast.show && isUnlocked && (
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-black/85 backdrop-blur-md border border-purple-500/50 text-white px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-2xl shadow-purple-950/60 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide">
              {lang === 'km' ? `បន្តពីនាទី ${resumeToast.timeString}` : `Resumed at ${resumeToast.timeString}`}
            </span>
            <button
              type="button"
              onClick={handleRestartFromBeginning}
              className="text-[10px] text-purple-300 hover:text-white font-bold ml-1 pl-1.5 border-l border-white/20 flex items-center gap-1 active:scale-90 transition-transform"
            >
              <RotateCcw size={11} />
              <span>{lang === 'km' ? 'ដើម' : 'Restart'}</span>
            </button>
          </div>
        )}

        {/* Floating Heart Animations */}
        {hearts.map((h) => (
          <div
            key={h.id}
            style={{ left: h.x - 20, top: h.y - 20 }}
            className="absolute pointer-events-none animate-ping text-pink-500"
          >
            <Heart size={44} className="fill-pink-500 drop-shadow-lg" />
          </div>
        ))}

        {/* Pause Overlay Indicator */}
        {!isPlaying && isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/90">
              <Play size={32} className="fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Locked Episode Gate Modal */}
        {!isUnlocked && (
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black mb-4 shadow-xl shadow-amber-500/20">
              <Lock size={30} />
            </div>

            <h3 className="text-xl font-black text-white">
              {t('coinsRequired')}
            </h3>
            <p className="text-xs text-gray-300 mt-1 max-w-xs">
              {lang === 'km'
                ? `ភាគទី ${currentEpisode.episodeNumber || currentEpIndex + 1} ត្រូវការ ${currentEpisode.coinPrice || 20} កាក់ ដើម្បីដោះសោទស្សនា`
                : `Episode ${currentEpisode.episodeNumber || currentEpIndex + 1} requires ${currentEpisode.coinPrice || 20} Coins to unlock`}
            </p>

            <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs text-amber-300">
              <Coins size={14} className="fill-amber-400" />
              <span>{t('myCoins')}: <strong>{coins}</strong></span>
            </div>

            <div className="flex flex-col gap-2.5 w-full max-w-xs mt-6">
              <button
                onClick={handleUnlockCurrent}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-transform"
              >
                <Lock size={15} />
                {t('unlockEpisode')} ({currentEpisode.coinPrice || 20} {lang === 'km' ? 'កាក់' : 'Coins'})
              </button>

              <button
                onClick={() => setIsCoinModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Crown size={14} className="text-amber-400" />
                {t('buyVip')}
              </button>
            </div>
          </div>
        )}

        {/* Auto Next Countdown Overlay */}
        {showAutoNext && (
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-purple-600/90 text-white text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md z-30 active:scale-95 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              nextEpisode();
            }}
          >
            {isNextPreloaded && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                <Zap size={10} className="fill-emerald-400" /> ⚡ Ready
              </span>
            )}
            <span>{t('autoPlayNext')} {autoNextCountdown}{t('seconds')}</span>
            <span className="underline ml-1 cursor-pointer">{t('playNext')}</span>
          </div>
        )}
      </div>

      {/* Top Header Controls */}
      <div className="absolute top-0 left-0 right-0 pt-safe px-4 py-3 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent z-30 pointer-events-auto">
        <button
          onClick={() => {
            haptic.light();
            onBack();
          }}
          className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Current Episode Title Indicator */}
        <div className="text-center px-2">
          <p className="text-xs font-bold text-white line-clamp-1 max-w-[200px]">
            {dramaTitle}
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-300">
            <span>
              {t('ep')} {currentEpisode.episodeNumber || currentEpIndex + 1} / {episodes.length}
            </span>
            {isNextPreloaded && nextEpData && (
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                • <Zap size={10} className="fill-emerald-400" /> {lang === 'km' ? 'ត្រៀមរួចរាល់' : 'Ep Ready'}
              </span>
            )}
          </div>
        </div>

        {/* Mute & Cinema Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 active:scale-90"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              haptic.light();
              const nextCinema = !isCinema;
              setIsCinema(nextCinema);
              try {
                const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
                if (nextCinema) {
                  if (tg?.requestFullscreen) tg.requestFullscreen();
                  else if (tg?.expand) tg.expand();
                  if (typeof document !== 'undefined' && !document.fullscreenElement && document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                  }
                } else {
                  if (tg?.exitFullscreen) tg.exitFullscreen();
                  if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
                    await document.exitFullscreen();
                  }
                }
              } catch (err) {}
            }}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 active:scale-90"
            title={isCinema ? t('screenMinimize') : t('screenMaximize')}
          >
            {isCinema ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Right Side Action Bar (TikTok / Reel Style) */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-30 pointer-events-auto">
        {/* Like */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.light();
            setLiked(!liked);
            setLikeCount((c) => (liked ? c - 1 : c + 1));
          }}
          className="flex flex-col items-center group active:scale-90 transition-transform"
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border ${
            liked
              ? 'bg-rose-500/80 border-rose-400 text-white'
              : 'bg-black/50 border-white/15 text-white'
          }`}>
            <Heart size={22} className={liked ? 'fill-white' : ''} />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">
            {likeCount}
          </span>
        </button>

        {/* Bookmark / Favorite */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(drama);
          }}
          className="flex flex-col items-center group active:scale-90 transition-transform"
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border ${
            isFav
              ? 'bg-amber-500/80 border-amber-400 text-black'
              : 'bg-black/50 border-white/15 text-white'
          }`}>
            <Bookmark size={20} className={isFav ? 'fill-black' : ''} />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">
            {isFav ? t('inFavorites') : t('favorites')}
          </span>
        </button>

        {/* Episode Drawer */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.light();
            setIsDrawerOpen(true);
          }}
          className="flex flex-col items-center group active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-purple-600/80 border border-purple-400/50 flex items-center justify-center text-white backdrop-blur-md shadow-lg shadow-purple-900/40">
            <ListVideo size={20} />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">
            {t('episodes')}
          </span>
        </button>

        {/* Speed */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            cycleSpeed();
          }}
          className="w-11 h-11 rounded-full bg-black/50 border border-white/15 flex items-center justify-center text-white text-xs font-bold backdrop-blur-md active:scale-90"
        >
          {speed}x
        </button>

        {/* Telegram Share */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.light();
            shareToTelegram(
              `🎬 Watching "${dramaTitle}" Ep ${currentEpIndex + 1} on SiengStudio! Join me now:`,
              `https://t.me/SiengStudioBot?startapp=drama_${drama.id}`
            );
          }}
          className="flex flex-col items-center group active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-sky-500/80 border border-sky-400/50 flex items-center justify-center text-white backdrop-blur-md">
            <Share2 size={20} />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">
            Share
          </span>
        </button>
      </div>

      {/* Bottom Progress & Video Information */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe bg-gradient-to-t from-black via-black/60 to-transparent z-30 pointer-events-auto">
        {/* Title & Episode info */}
        <div className="max-w-[70%] mb-2">
          <h2 className="text-sm font-extrabold text-white line-clamp-1 drop-shadow">
            {dramaTitle}
          </h2>
          <p className="text-[11px] text-gray-300 line-clamp-1 mt-0.5">
            {currentEpisode.title || `${t('ep')} ${currentEpIndex + 1}`}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-2">
          <div
            className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer relative"
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current && duration > 0) {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                videoRef.current.currentTime = pos * duration;
              }
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`
              }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Episode Drawer Modal */}
      <EpisodeDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        episodes={episodes}
        currentEpId={currentEpisode.id}
        onSelectEpisode={(epId) => {
          const idx = episodes.findIndex((e) => e.id === epId);
          if (idx >= 0) setCurrentEpIndex(idx);
        }}
        dramaId={drama.id}
      />
    </div>
  );
}

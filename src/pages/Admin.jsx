import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  ArrowLeft,
  Film,
  Plus,
  Tv,
  Users,
  Eye,
  CheckCircle,
  AlertCircle,
  Coins,
  ShieldAlert
} from 'lucide-react';
import { haptic } from '../services/telegram';

export default function Admin() {
  const { setActiveTab, authenticatedAdminPin } = useApp();
  const [dramas, setDramas] = useState([]);
  const [stats, setStats] = useState({ totalDramas: 0, totalEpisodes: 0, totalViews: 0 });
  const [activeTab, setActiveTabLocal] = useState('dramas'); // 'dramas' or 'addDrama' or 'addEpisode'
  const [selectedDramaId, setSelectedDramaId] = useState('');
  const [message, setMessage] = useState(null);

  // Form states
  const [newDrama, setNewDrama] = useState({
    title: '',
    titleKm: '',
    description: '',
    descriptionKm: '',
    posterUrl: '',
    bannerUrl: '',
    genres: 'Romance, CEO',
    rating: '9.8',
    isVipOnly: false,
    isFeatured: true
  });

  const [newEpisode, setNewEpisode] = useState({
    episodeNumber: 1,
    title: 'Episode 1',
    videoUrl: '',
    coinPrice: 20,
    isFree: true
  });

  const [batchData, setBatchData] = useState({
    startEp: 1,
    totalEp: 50,
    freeCount: 3,
    coinPrice: 20,
    urlPattern: 'https://sig-harris-superior-oak.trycloudflare.com/videos/ep{n}.mp4'
  });

  const loadData = () => {
    api.getDramas().then((data) => {
      setDramas(data || []);
      if (data && data.length > 0 && !selectedDramaId) {
        setSelectedDramaId(data[0].id);
      }
      const totalEp = data?.reduce((acc, d) => acc + (d.episodes?.length || 0), 0) || 0;
      setStats({
        totalDramas: data?.length || 0,
        totalEpisodes: totalEp,
        totalViews: '1.4M+'
      });
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDrama = async (e) => {
    e.preventDefault();
    haptic.medium();
    const dramaData = {
      ...newDrama,
      genres: newDrama.genres.split(',').map((g) => g.trim())
    };
    const res = await api.createDrama(dramaData, authenticatedAdminPin);
    if (res.success) {
      haptic.success();
      setMessage({ type: 'success', text: 'Drama created successfully!' });
      loadData();
      setActiveTabLocal('dramas');
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to create drama' });
    }
  };

  const handleAddEpisode = async (e) => {
    e.preventDefault();
    haptic.medium();
    const res = await api.addEpisode(selectedDramaId, newEpisode, authenticatedAdminPin);
    if (res.success) {
      haptic.success();
      setMessage({ type: 'success', text: 'Episode added successfully!' });
      loadData();
      setActiveTabLocal('dramas');
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to add episode' });
    }
  };

  const handleBatchAdd = async (e) => {
    e.preventDefault();
    haptic.medium();
    const episodes = [];
    const start = Number(batchData.startEp) || 1;
    const total = Number(batchData.totalEp) || 50;
    const freeUntil = Number(batchData.freeCount) || 3;
    const price = Number(batchData.coinPrice) || 20;

    for (let i = start; i <= total; i++) {
      const isFree = i <= freeUntil;
      const url = batchData.urlPattern.includes('{n}')
        ? batchData.urlPattern.replace('{n}', i)
        : `${batchData.urlPattern.replace(/\/$/, '')}/ep${i}.mp4`;

      episodes.push({
        episodeNumber: i,
        title: `ភាគ ${i}`,
        videoUrl: url,
        coinPrice: isFree ? 0 : price,
        isFree
      });
    }

    const res = await api.addEpisodesBatch(selectedDramaId, episodes, authenticatedAdminPin);
    if (res.success) {
      haptic.success();
      setMessage({
        type: 'success',
        text: `បានបន្ថែម ${episodes.length} ភាគដោយជោគជ័យ! (Added ${episodes.length} episodes!)`
      });
      loadData();
      setActiveTabLocal('dramas');
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to batch add episodes' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c13] pb-24 px-4 pt-3">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptic.light();
              setActiveTab('profile');
            }}
            className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-bold text-white flex items-center gap-1.5">
            <img src="/logo.png" alt="Logo" className="w-5 h-5 rounded-full object-cover" />
            SiengStudio CMS
          </h1>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] text-gray-400">Total Series</p>
          <h3 className="text-base font-black text-purple-400">{stats.totalDramas}</h3>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] text-gray-400">Episodes</p>
          <h3 className="text-base font-black text-pink-400">{stats.totalEpisodes}</h3>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] text-gray-400">Views</p>
          <h3 className="text-base font-black text-amber-400">{stats.totalViews}</h3>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex gap-2 mt-4 p-1 bg-white/5 rounded-2xl">
        <button
          onClick={() => setActiveTabLocal('dramas')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dramas' ? 'bg-purple-600 text-white' : 'text-gray-400'
          }`}
        >
          All Dramas
        </button>
        <button
          onClick={() => setActiveTabLocal('addDrama')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'addDrama' ? 'bg-purple-600 text-white' : 'text-gray-400'
          }`}
        >
          + Add Drama
        </button>
        <button
          onClick={() => setActiveTabLocal('addEpisode')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'addEpisode' ? 'bg-purple-600 text-white' : 'text-gray-400'
          }`}
        >
          + 1 Episode
        </button>
        <button
          onClick={() => setActiveTabLocal('batchAdd')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'batchAdd'
              ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md'
              : 'text-amber-400 hover:text-amber-300'
          }`}
        >
          ⚡ Batch Add
        </button>
      </div>

      {message && (
        <div
          className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab: Dramas List */}
      {activeTab === 'dramas' && (
        <div className="mt-4 space-y-3">
          {dramas.map((drama) => (
            <div
              key={drama.id}
              className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <img
                  src={drama.posterUrl}
                  alt={drama.title}
                  className="w-12 h-16 rounded-xl object-cover bg-gray-900"
                />
                <div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{drama.title}</h4>
                  <p className="text-[10px] text-purple-400">{drama.titleKm}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {drama.episodes?.length || 0} episodes • {drama.views}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Add Drama Form */}
      {activeTab === 'addDrama' && (
        <form onSubmit={handleCreateDrama} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-300">Title (English)</label>
            <input
              type="text"
              required
              value={newDrama.title}
              onChange={(e) => setNewDrama({ ...newDrama, title: e.target.value })}
              placeholder="The Billionaire's Secret Bride"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Title (Khmer ខ្មែរ)</label>
            <input
              type="text"
              required
              value={newDrama.titleKm}
              onChange={(e) => setNewDrama({ ...newDrama, titleKm: e.target.value })}
              placeholder="ភរិយាសម្ងាត់របស់មហាសេដ្ឋី"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Poster Image URL (Vertical 3:4)</label>
            <input
              type="url"
              required
              value={newDrama.posterUrl}
              onChange={(e) => setNewDrama({ ...newDrama, posterUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Banner Backdrop Image URL (16:9)</label>
            <input
              type="url"
              value={newDrama.bannerUrl}
              onChange={(e) => setNewDrama({ ...newDrama, bannerUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Description (Khmer)</label>
            <textarea
              rows={2}
              value={newDrama.descriptionKm}
              onChange={(e) => setNewDrama({ ...newDrama, descriptionKm: e.target.value })}
              placeholder="រឿងរ៉ាវស្នេហា និងការសងសឹក..."
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Genres (Comma separated)</label>
            <input
              type="text"
              value={newDrama.genres}
              onChange={(e) => setNewDrama({ ...newDrama, genres: e.target.value })}
              placeholder="Romance, CEO, Revenge"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-lg active:scale-95"
          >
            Save Drama Series
          </button>
        </form>
      )}

      {/* Tab: Add Episode Form */}
      {activeTab === 'addEpisode' && (
        <form onSubmit={handleAddEpisode} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-300">Select Drama Series</label>
            <select
              value={selectedDramaId}
              onChange={(e) => setSelectedDramaId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id} className="bg-gray-900">
                  {d.title} ({d.titleKm || ''})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-300">Episode Number</label>
              <input
                type="number"
                min={1}
                required
                value={newEpisode.episodeNumber}
                onChange={(e) =>
                  setNewEpisode({ ...newEpisode, episodeNumber: parseInt(e.target.value) || 1 })
                }
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300">Coin Price</label>
              <input
                type="number"
                min={0}
                value={newEpisode.coinPrice}
                onChange={(e) =>
                  setNewEpisode({ ...newEpisode, coinPrice: parseInt(e.target.value) || 0 })
                }
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Episode Title</label>
            <input
              type="text"
              value={newEpisode.title}
              onChange={(e) => setNewEpisode({ ...newEpisode, title: e.target.value })}
              placeholder="Ep 1: The Unexpected Encounter"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Video Stream URL (MP4 / HLS m3u8)</label>
            <input
              type="url"
              required
              value={newEpisode.videoUrl}
              onChange={(e) => setNewEpisode({ ...newEpisode, videoUrl: e.target.value })}
              placeholder="https://commondatastorage.googleapis.com/.../video.mp4"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isFree"
              checked={newEpisode.isFree}
              onChange={(e) => setNewEpisode({ ...newEpisode, isFree: e.target.checked })}
              className="rounded text-purple-600"
            />
            <label htmlFor="isFree" className="text-xs text-gray-300">
              Is this episode free to watch?
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-lg active:scale-95"
          >
            Add Episode to Drama
          </button>
        </form>
      )}

      {/* Tab: Batch Add Episodes Form */}
      {activeTab === 'batchAdd' && (
        <form onSubmit={handleBatchAdd} className="mt-4 space-y-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            ⚡ <b>មុខងារបន្ថែមភាគច្រើនដោយស្វ័យប្រវត្តិ (Batch Add)</b>៖ បង្កើតចាប់ពីភាគ ១ ដល់ ភាគ ៥០ ឬ ១០០ ក្នុងពេលតែមួយដោយមិនបាច់ចុចម្តងមួយភាគឡើយ!
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">ជ្រើសរើសរឿង (Select Drama)</label>
            <select
              value={selectedDramaId}
              onChange={(e) => setSelectedDramaId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-red-500"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id} className="bg-gray-900">
                  {d.title} ({d.titleKm || ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">
              Video URL Pattern (ប្រើ <code>{`{n}`}</code> ជំនួសលេខភាគ)
            </label>
            <input
              type="text"
              required
              value={batchData.urlPattern}
              onChange={(e) => setBatchData({ ...batchData, urlPattern: e.target.value })}
              placeholder="https://pub-xxxx.r2.dev/ep{n}.mp4"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-red-500 font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">
              ឧទាហរណ៍៖ <code>https://pub-xxxx.r2.dev/ep{`{n}`}.mp4</code> វានឹងបង្កើត ep1.mp4, ep2.mp4, ep3.mp4... ដោយស្វ័យប្រវត្តិ។
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-300">ចាប់ផ្តើមពីភាគ (Start Ep)</label>
              <input
                type="number"
                min={1}
                required
                value={batchData.startEp}
                onChange={(e) => setBatchData({ ...batchData, startEp: parseInt(e.target.value) || 1 })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300">ដល់ភាគទី (End Ep)</label>
              <input
                type="number"
                min={1}
                required
                value={batchData.totalEp}
                onChange={(e) => setBatchData({ ...batchData, totalEp: parseInt(e.target.value) || 1 })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-300">ភាគឥតគិតថ្លៃ (Free Ep 1 to...)</label>
              <input
                type="number"
                min={0}
                value={batchData.freeCount}
                onChange={(e) => setBatchData({ ...batchData, freeCount: parseInt(e.target.value) || 0 })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300">តម្លៃកាក់ក្នុង ១ ភាគ (Coins/Ep)</label>
              <input
                type="number"
                min={0}
                value={batchData.coinPrice}
                onChange={(e) => setBatchData({ ...batchData, coinPrice: parseInt(e.target.value) || 0 })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-black text-xs shadow-lg active:scale-95 transition-transform"
          >
            ⚡ បញ្ចូលគ្រប់ភាគទាំងអស់ភ្លាមៗ ({batchData.totalEp} ភាគ)
          </button>
        </form>
      )}
    </div>
  );
}

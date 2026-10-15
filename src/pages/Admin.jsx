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
  ShieldAlert,
  Trash2,
  Edit3,
  ExternalLink,
  Play,
  Check,
  X,
  Sparkles,
  Clipboard,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { haptic } from '../services/telegram';

export default function Admin() {
  const { setActiveTab, authenticatedAdminPin, adminInitialTab } = useApp();
  const [dramas, setDramas] = useState([]);
  const [stats, setStats] = useState({ totalDramas: 0, totalEpisodes: 0, totalViews: 0 });
  const [activeTab, setActiveTabLocal] = useState(adminInitialTab || 'manage'); // 'manage' | 'addDrama' | 'addEpisode' | 'batchAdd' | 'pasteUrls'
  const [selectedDramaId, setSelectedDramaId] = useState('');
  const [message, setMessage] = useState(null);
  const [searchEp, setSearchEp] = useState('');
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);

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
    isFree: false
  });

  const [batchData, setBatchData] = useState({
    startEp: 1,
    totalEp: 35,
    freeCount: 10,
    coinPrice: 20,
    urlPattern: 'https://pub-4b78689722284f9d94a646dcd8cff942.r2.dev/Secrets%20of%20an%20Online%20Ex-Lover%20Romance/EP{nn}%20-%20Episode%20{n}.mp4'
  });

  const [pasteUrlsText, setPasteUrlsText] = useState('');
  const [pasteStartEp, setPasteStartEp] = useState(1);
  const [pasteFreeUntil, setPasteFreeUntil] = useState(10);
  const [pastePrice, setPastePrice] = useState(20);

  const selectedDrama = dramas.find((d) => d.id === selectedDramaId) || dramas[0];

  const loadData = async () => {
    try {
      const data = await api.getDramas();
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
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (adminInitialTab) {
      setActiveTabLocal(adminInitialTab);
    }
  }, [adminInitialTab]);

  // Update batch startEp and newEpisode defaults when selected drama changes
  useEffect(() => {
    if (selectedDrama) {
      const currentCount = selectedDrama.episodes?.length || 0;
      const nextEp = currentCount + 1;
      const pad = String(nextEp).padStart(2, '0');

      setNewEpisode((prev) => ({
        ...prev,
        episodeNumber: nextEp,
        title: `Episode ${nextEp}`,
        isFree: nextEp <= 10,
        coinPrice: nextEp <= 10 ? 0 : 20,
        videoUrl: prev.videoUrl ? prev.videoUrl.replace(/(EP|Episode%20)(\d+)/g, `$1${pad}`) : ''
      }));

      setBatchData((prev) => ({
        ...prev,
        startEp: nextEp,
        totalEp: Math.max(nextEp + 9, prev.totalEp)
      }));

      setPasteStartEp(nextEp);
    }
  }, [selectedDramaId, dramas]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // --- Create Drama ---
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
      showMsg('success', 'បង្កើតរឿងភាគថ្មីបានជោគជ័យ! (Drama created successfully!)');
      await loadData();
      setActiveTabLocal('manage');
    } else {
      showMsg('error', res.message || 'Failed to create drama');
    }
  };

  // --- Delete Drama ---
  const handleDeleteDrama = async (dramaId, title) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបរឿង "${title}" និងគ្រប់ភាគទាំងអស់មែនទេ? (Are you sure you want to delete this drama?)`)) {
      return;
    }
    haptic.warning();
    const res = await api.deleteDrama(dramaId, authenticatedAdminPin);
    if (res.success) {
      haptic.success();
      showMsg('success', 'បានលុបរឿងដោយជោគជ័យ! (Drama deleted successfully)');
      await loadData();
    } else {
      showMsg('error', res.message || 'Failed to delete drama');
    }
  };

  // --- Add Single Episode ---
  const handleAddEpisode = async (e) => {
    e.preventDefault();
    haptic.medium();
    const res = await api.addEpisode(selectedDramaId, newEpisode, authenticatedAdminPin);
    if (res.success) {
      haptic.success();
      showMsg('success', `បានបន្ថែមភាគទី ${newEpisode.episodeNumber} ដោយជោគជ័យ!`);
      await loadData();
      setActiveTabLocal('manage');
    } else {
      showMsg('error', res.message || 'Failed to add episode');
    }
  };

  // --- Batch Add from Pattern ---
  const handleBatchAdd = async (e) => {
    e.preventDefault();
    haptic.medium();
    const episodes = [];
    const start = Number(batchData.startEp) || 1;
    const total = Number(batchData.totalEp) || 50;
    const freeUntil = Number(batchData.freeCount) || 10;
    const price = Number(batchData.coinPrice) || 20;

    for (let i = start; i <= total; i++) {
      const isFree = i <= freeUntil;
      const pad = String(i).padStart(2, '0');
      let url = batchData.urlPattern;
      url = url.replace(/\{nn\}/g, pad);
      url = url.replace(/\{n\}/g, String(i));

      episodes.push({
        id: i,
        episodeNumber: i,
        title: `Episode ${i}`,
        videoUrl: url,
        coinPrice: isFree ? 0 : price,
        isFree
      });
    }

    const res = await api.addEpisodesBatch(selectedDramaId, episodes, authenticatedAdminPin);
    if (res.success) {
      haptic.success();
      showMsg('success', `បានបន្ថែម ${episodes.length} ភាគដោយជោគជ័យ! (Added ${episodes.length} episodes!)`);
      await loadData();
      setActiveTabLocal('manage');
    } else {
      showMsg('error', res.message || 'Failed to batch add episodes');
    }
  };

  // --- Paste Multi-line URLs ---
  const handlePasteUrlsSubmit = async (e) => {
    e.preventDefault();
    haptic.medium();
    const urls = pasteUrlsText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http'));

    if (urls.length === 0) {
      showMsg('error', 'សូមបញ្ចូល URL វីដេអូយ៉ាងហោចណាស់ ១ (Please provide at least 1 valid URL)');
      return;
    }

    const episodes = [];
    const start = Number(pasteStartEp) || 1;
    const freeUntil = Number(pasteFreeUntil) || 10;
    const price = Number(pastePrice) || 20;

    urls.forEach((url, idx) => {
      const epNum = start + idx;
      const isFree = epNum <= freeUntil;
      episodes.push({
        id: epNum,
        episodeNumber: epNum,
        title: `Episode ${epNum}`,
        videoUrl: url,
        coinPrice: isFree ? 0 : price,
        isFree
      });
    });

    const res = await api.addEpisodesBatch(selectedDramaId, episodes, authenticatedAdminPin);
    if (res.success) {
      haptic.success();
      showMsg('success', `បានបញ្ចូល ${episodes.length} ភាគដោយជោគជ័យ!`);
      setPasteUrlsText('');
      await loadData();
      setActiveTabLocal('manage');
    } else {
      showMsg('error', res.message || 'Failed to import episodes');
    }
  };

  // --- Delete Particular Episode ---
  const handleDeleteEpisode = async (dramaId, episodeId, epNumber) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុប ភាគ ${epNumber} នេះមែនទេ? (Delete Episode ${epNumber}?)`)) {
      return;
    }
    haptic.warning();
    const res = await api.deleteEpisode(dramaId, episodeId, authenticatedAdminPin);
    if (res.success) {
      haptic.success();
      showMsg('success', `បានលុបភាគ ${epNumber} ដោយជោគជ័យ!`);
      await loadData();
    } else {
      showMsg('error', res.message || 'Failed to delete episode');
    }
  };

  // --- Delete ALL Episodes ---
  const handleDeleteAllEpisodes = async (dramaId, dramaTitle) => {
    const confirmation = window.prompt(
      `⚠️ ប្រយ័ត្ន! តើអ្នកចង់លុបគ្រប់ភាគទាំងអស់នៃរឿង "${dramaTitle}" មែនទេ?\nវាយពាក្យ DELETE ដើម្បីបញ្ជាក់៖`
    );
    if (confirmation !== 'DELETE') {
      return;
    }
    haptic.warning();
    const res = await api.deleteAllEpisodes(dramaId, authenticatedAdminPin);
    if (res.success) {
      haptic.success();
      showMsg('success', `បានលុបគ្រប់ភាគទាំងអស់នៃរឿង ${dramaTitle} រួចរាល់!`);
      await loadData();
    } else {
      showMsg('error', res.message || 'Failed to delete all episodes');
    }
  };

  // --- Update Single Episode ---
  const handleUpdateEpisode = async (e) => {
    e.preventDefault();
    if (!editingEpisode) return;
    haptic.medium();
    const res = await api.updateEpisode(
      selectedDramaId,
      editingEpisode.id,
      editingEpisode,
      authenticatedAdminPin
    );
    if (res.success) {
      haptic.success();
      showMsg('success', `បានកែសម្រួលភាគ ${editingEpisode.episodeNumber} ដោយជោគជ័យ!`);
      setEditingEpisode(null);
      await loadData();
    } else {
      showMsg('error', res.message || 'Failed to update episode');
    }
  };

  // Filter episodes by search input
  const filteredEpisodes = (selectedDrama?.episodes || []).filter((ep) => {
    if (!searchEp) return true;
    const q = searchEp.toLowerCase();
    return (
      String(ep.episodeNumber).includes(q) ||
      ep.title?.toLowerCase().includes(q) ||
      ep.videoUrl?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0b0c13] pb-24 px-4 pt-3 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
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
            SiengStudio CMS & Episode Studio
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTabLocal('addDrama')}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs flex items-center gap-1 shadow-md shadow-purple-900/40 active:scale-95 transition-all"
          >
            <Plus size={14} /> + បន្ថែមរឿងថ្មី
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white active:scale-95 transition-transform"
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] text-gray-400">Total Series</p>
          <h3 className="text-base font-black text-purple-400">{stats.totalDramas}</h3>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] text-gray-400">Total Episodes</p>
          <h3 className="text-base font-black text-pink-400">{stats.totalEpisodes}</h3>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] text-gray-400">Total Views</p>
          <h3 className="text-base font-black text-amber-400">{stats.totalViews}</h3>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex gap-1.5 mt-3 p-1 bg-white/5 rounded-2xl overflow-x-auto text-[11px] font-bold">
        <button
          onClick={() => setActiveTabLocal('manage')}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'manage' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          🎬 គ្រប់គ្រងភាគ (Manage)
        </button>
        <button
          onClick={() => setActiveTabLocal('addEpisode')}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'addEpisode' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          + ១ ភាគ (1 Ep)
        </button>
        <button
          onClick={() => setActiveTabLocal('batchAdd')}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'batchAdd'
              ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md'
              : 'text-rose-400 hover:text-rose-300'
          }`}
        >
          ⚡ Batch Pattern
        </button>
        <button
          onClick={() => setActiveTabLocal('pasteUrls')}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'pasteUrls'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-emerald-400 hover:text-emerald-300'
          }`}
        >
          📋 Paste Links
        </button>
        <button
          onClick={() => setActiveTabLocal('addDrama')}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'addDrama' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          + រឿងថ្មី (New Drama)
        </button>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-white/60 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ================= TAB: MANAGE EPISODES & DRAMAS ================= */}
      {activeTab === 'manage' && (
        <div className="mt-4 space-y-4">
          {/* Quick Create Drama Banner Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-pink-950/50 to-purple-950/70 border border-purple-500/30 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center border border-purple-500/30 shrink-0">
                <Film size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white">បន្ថែមរឿងភាគថ្មី (Add New Drama)</h3>
                <p className="text-[10px] text-gray-300 mt-0.5">បង្កើតចំណងជើងរឿង រូបភាព Poster និងបញ្ចូលភាគថ្មីៗ</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTabLocal('addDrama')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-extrabold shadow-lg shadow-purple-900/40 active:scale-95 transition-transform flex items-center gap-1 shrink-0"
            >
              <Plus size={14} /> + បង្កើតរឿង
            </button>
          </div>

          {/* Drama Selector Card */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span>ជ្រើសរើសរឿងភាគ (Select Drama Series)</span>
              <span className="text-[10px] text-purple-400 font-mono">
                {selectedDrama?.episodes?.length || 0} Episodes
              </span>
            </label>
            <select
              value={selectedDramaId}
              onChange={(e) => setSelectedDramaId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-white text-xs font-bold outline-none focus:border-purple-500"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.titleKm ? `${d.titleKm} (${d.title})` : d.title} — {d.episodes?.length || 0} ភាគ
                </option>
              ))}
            </select>

            {/* Quick Actions for Selected Drama */}
            {selectedDrama && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                <button
                  onClick={() => setActiveTabLocal('addEpisode')}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                >
                  <Plus size={13} /> បន្ថែមភាគថ្មី
                </button>
                <button
                  onClick={() => setActiveTabLocal('pasteUrls')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                >
                  <Clipboard size={13} /> Paste Links ច្រើន
                </button>
                <button
                  onClick={() => setActiveTabLocal('batchAdd')}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600/30 text-rose-300 hover:bg-rose-600/50 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                >
                  <Sparkles size={13} /> Batch Generator
                </button>
                <button
                  onClick={() => handleDeleteAllEpisodes(selectedDrama.id, selectedDrama.title)}
                  className="ml-auto px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/40 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                  title="Delete All Episodes"
                >
                  <Trash2 size={13} /> លុបគ្រប់ភាគទាំងអស់
                </button>
              </div>
            )}
          </div>

          {/* Search episodes */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchEp}
              onChange={(e) => setSearchEp(e.target.value)}
              placeholder="ស្វែងរកតាមលេខភាគ ឬចំណងជើង (Search episode # or title)..."
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            />
            {searchEp && (
              <button
                onClick={() => setSearchEp('')}
                className="px-2.5 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Episode List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>បញ្ជីភាគទាំងអស់ ({filteredEpisodes.length} ភាគ)</span>
              <span>ភាគ ១-១០ ឥតគិតថ្លៃ • ១១+ ២០ កាក់</span>
            </div>

            {filteredEpisodes.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/5 text-gray-400">
                <Tv size={32} className="mx-auto mb-2 text-gray-600" />
                <p className="text-xs font-semibold">មិនទាន់មានវីដេអូភាគនៅឡើយទេ (No episodes found)</p>
                <button
                  onClick={() => setActiveTabLocal('pasteUrls')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                >
                  + បន្ថែមវីដេអូឥឡូវនេះ
                </button>
              </div>
            ) : (
              filteredEpisodes.map((ep) => (
                <div
                  key={ep.id || ep.episodeNumber}
                  className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {ep.episodeNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{ep.title || `Episode ${ep.episodeNumber}`}</h4>
                        {ep.isFree ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                            FREE
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 flex items-center gap-0.5">
                            <Coins size={10} /> {ep.coinPrice} កាក់
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5 font-mono">{ep.videoUrl}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Preview video */}
                    <button
                      onClick={() => setVideoPreviewUrl(ep.videoUrl)}
                      className="p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10"
                      title="Play Preview"
                    >
                      <Play size={14} />
                    </button>

                    {/* Edit episode */}
                    <button
                      onClick={() => setEditingEpisode({ ...ep })}
                      className="p-2 rounded-lg bg-white/5 text-blue-300 hover:text-blue-200 hover:bg-white/10"
                      title="Edit Episode"
                    >
                      <Edit3 size={14} />
                    </button>

                    {/* Delete single episode */}
                    <button
                      onClick={() => handleDeleteEpisode(selectedDrama.id, ep.id, ep.episodeNumber)}
                      className="p-2 rounded-lg bg-white/5 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      title="Delete Episode"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT EPISODE ================= */}
      {editingEpisode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#131520] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Edit3 size={16} className="text-purple-400" />
                កែសម្រួលភាគទី {editingEpisode.episodeNumber}
              </h3>
              <button
                onClick={() => setEditingEpisode(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateEpisode} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-300">Episode Number</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingEpisode.episodeNumber}
                    onChange={(e) =>
                      setEditingEpisode({
                        ...editingEpisode,
                        episodeNumber: parseInt(e.target.value) || 1
                      })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-300">Coin Price</label>
                  <input
                    type="number"
                    min={0}
                    value={editingEpisode.coinPrice}
                    onChange={(e) =>
                      setEditingEpisode({
                        ...editingEpisode,
                        coinPrice: parseInt(e.target.value) || 0
                      })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300">Episode Title</label>
                <input
                  type="text"
                  value={editingEpisode.title || ''}
                  onChange={(e) =>
                    setEditingEpisode({ ...editingEpisode, title: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300">Video URL</label>
                <input
                  type="url"
                  required
                  value={editingEpisode.videoUrl}
                  onChange={(e) =>
                    setEditingEpisode({ ...editingEpisode, videoUrl: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsFree"
                  checked={editingEpisode.isFree}
                  onChange={(e) =>
                    setEditingEpisode({
                      ...editingEpisode,
                      isFree: e.target.checked,
                      coinPrice: e.target.checked ? 0 : editingEpisode.coinPrice || 20
                    })
                  }
                  className="rounded text-purple-600"
                />
                <label htmlFor="editIsFree" className="text-xs text-gray-300">
                  មើលឥតគិតថ្លៃ? (Is Free to watch?)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEpisode(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 font-bold text-xs"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-lg active:scale-95"
                >
                  រក្សាទុក (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIDEO PREVIEW ================= */}
      {videoPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-black border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/10">
              <span className="text-xs font-mono text-gray-300 truncate max-w-xs">{videoPreviewUrl}</span>
              <button
                onClick={() => setVideoPreviewUrl(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="aspect-[9/16] max-h-[70vh] mx-auto bg-black flex items-center justify-center">
              <video
                src={videoPreviewUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: PASTE MULTI-LINE URLS ================= */}
      {activeTab === 'pasteUrls' && (
        <form onSubmit={handlePasteUrlsSubmit} className="mt-4 space-y-3">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            📋 <b>មុខងារ Paste Links ច្រើនភាគ (Multi-line URL Import)</b>៖ ងាយស្រួលបំផុត! គ្រាន់តែចម្លង Video Links ពី Cloudflare R2 ឬ Notepad មកបិទភ្ជាប់ (១ បន្ទាត់ = ១ ភាគ)។
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">ជ្រើសរើសរឿង (Select Drama)</label>
            <select
              value={selectedDramaId}
              onChange={(e) => setSelectedDramaId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-500"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id} className="bg-gray-900">
                  {d.title} ({d.episodes?.length || 0} ភាគបច្ចុប្បន្ន)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-300">ចាប់ផ្តើមពីភាគ</label>
              <input
                type="number"
                min={1}
                value={pasteStartEp}
                onChange={(e) => setPasteStartEp(parseInt(e.target.value) || 1)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-300">Free ដល់ភាគទី</label>
              <input
                type="number"
                min={0}
                value={pasteFreeUntil}
                onChange={(e) => setPasteFreeUntil(parseInt(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-300">តម្លៃកាក់/ភាគ</label>
              <input
                type="number"
                min={0}
                value={pastePrice}
                onChange={(e) => setPastePrice(parseInt(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-300">
                បញ្ជី URL វីដេអូ (១ បន្ទាត់ = ១ ភាគ)
              </label>
              <span className="text-[10px] text-emerald-400 font-bold font-mono">
                {
                  pasteUrlsText
                    .split('\n')
                    .map((s) => s.trim())
                    .filter((s) => s.startsWith('http')).length
                }{' '}
                Links ត្រូវបានរកឃើញ
              </span>
            </div>
            <textarea
              rows={6}
              required
              value={pasteUrlsText}
              onChange={(e) => setPasteUrlsText(e.target.value)}
              placeholder={`https://pub-xxxx.r2.dev/Drama/EP01 - Episode 1.mp4\nhttps://pub-xxxx.r2.dev/Drama/EP02 - Episode 2.mp4\nhttps://pub-xxxx.r2.dev/Drama/EP03 - Episode 3.mp4`}
              className="w-full mt-1 p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-mono outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-lg active:scale-95 transition-transform"
          >
            🚀 បញ្ចូលគ្រប់ Links ខាងលើភ្លាមៗ (+ Import Episodes)
          </button>
        </form>
      )}

      {/* ================= TAB: BATCH ADD FROM PATTERN ================= */}
      {activeTab === 'batchAdd' && (
        <form onSubmit={handleBatchAdd} className="mt-4 space-y-3">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            ⚡ <b>មុខងារបង្កើតភាគស្វ័យប្រវត្តិតាម Pattern</b>៖ ប្រើ <code>{`{n}`}</code> សម្រាប់លេខភាគធម្មតា (1, 2, 3...) ឬ <code>{`{nn}`}</code> សម្រាប់លេខមានសូន្យពីមុខ (01, 02, 03... 10, 11...)។
          </div>

          {/* Quick R2 Presets */}
          <div>
            <label className="text-[11px] font-bold text-gray-300 mb-1.5 block">
              គំរូ Cloudflare R2 Presets រហ័ស៖
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setBatchData((prev) => ({
                    ...prev,
                    urlPattern:
                      'https://pub-4b78689722284f9d94a646dcd8cff942.r2.dev/Secrets%20of%20an%20Online%20Ex-Lover%20Romance/EP{nn}%20-%20Episode%20{n}.mp4'
                  }))
                }
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-left text-[11px] hover:border-rose-400"
              >
                <p className="font-bold text-white truncate">Secrets of Online Ex-Lover</p>
                <p className="text-[9px] text-gray-400 font-mono truncate">EP{`{nn}`} - Episode {`{n}`}.mp4</p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setBatchData((prev) => ({
                    ...prev,
                    urlPattern:
                      'https://pub-4b78689722284f9d94a646dcd8cff942.r2.dev/Golden%20Secrets_%20A%20Family%20Drama/EP{nn}%20-%20Episode%20{n}.mp4'
                  }))
                }
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-left text-[11px] hover:border-rose-400"
              >
                <p className="font-bold text-white truncate">Golden Secrets</p>
                <p className="text-[9px] text-gray-400 font-mono truncate">EP{`{nn}`} - Episode {`{n}`}.mp4</p>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">ជ្រើសរើសរឿង (Select Drama)</label>
            <select
              value={selectedDramaId}
              onChange={(e) => setSelectedDramaId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-rose-500"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id} className="bg-gray-900">
                  {d.title} ({d.episodes?.length || 0} ភាគបច្ចុប្បន្ន)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">
              Video URL Pattern (ប្រើ <code>{`{n}`}</code> ឬ <code>{`{nn}`}</code>)
            </label>
            <input
              type="text"
              required
              value={batchData.urlPattern}
              onChange={(e) => setBatchData({ ...batchData, urlPattern: e.target.value })}
              placeholder="https://pub-xxxx.r2.dev/Folder/EP{nn} - Episode {n}.mp4"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-300">ចាប់ផ្តើមពីភាគ (Start Ep)</label>
              <input
                type="number"
                min={1}
                required
                value={batchData.startEp}
                onChange={(e) =>
                  setBatchData({ ...batchData, startEp: parseInt(e.target.value) || 1 })
                }
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300">ដល់ភាគទី (End Ep)</label>
              <input
                type="number"
                min={1}
                required
                value={batchData.totalEp}
                onChange={(e) =>
                  setBatchData({ ...batchData, totalEp: parseInt(e.target.value) || 1 })
                }
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-rose-500"
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
                onChange={(e) =>
                  setBatchData({ ...batchData, freeCount: parseInt(e.target.value) || 0 })
                }
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300">តម្លៃកាក់ក្នុង ១ ភាគ (Coins/Ep)</label>
              <input
                type="number"
                min={0}
                value={batchData.coinPrice}
                onChange={(e) =>
                  setBatchData({ ...batchData, coinPrice: parseInt(e.target.value) || 0 })
                }
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] text-gray-400 space-y-1">
            <span className="font-bold text-gray-300">គំរូ Link ដែលនឹងបង្កើត (Live Preview):</span>
            <p className="font-mono truncate">
              Ep {batchData.startEp}:{' '}
              {batchData.urlPattern
                .replace(/\{nn\}/g, String(batchData.startEp).padStart(2, '0'))
                .replace(/\{n\}/g, String(batchData.startEp))}
            </p>
            <p className="font-mono truncate">
              Ep {batchData.totalEp}:{' '}
              {batchData.urlPattern
                .replace(/\{nn\}/g, String(batchData.totalEp).padStart(2, '0'))
                .replace(/\{n\}/g, String(batchData.totalEp))}
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-black text-xs shadow-lg active:scale-95 transition-transform"
          >
            ⚡ បញ្ចូលពីភាគ {batchData.startEp} ដល់ {batchData.totalEp} ភ្លាមៗ
          </button>
        </form>
      )}

      {/* ================= TAB: ADD 1 EPISODE ================= */}
      {activeTab === 'addEpisode' && (
        <form onSubmit={handleAddEpisode} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-300">ជ្រើសរើសរឿង (Select Drama)</label>
            <select
              value={selectedDramaId}
              onChange={(e) => setSelectedDramaId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id} className="bg-gray-900">
                  {d.title} ({d.episodes?.length || 0} ភាគ)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-300">លេខភាគ (Episode Number)</label>
              <input
                type="number"
                min={1}
                required
                value={newEpisode.episodeNumber}
                onChange={(e) =>
                  setNewEpisode({ ...newEpisode, episodeNumber: parseInt(e.target.value) || 1 })
                }
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300">តម្លៃកាក់ (Coins)</label>
              <input
                type="number"
                min={0}
                value={newEpisode.coinPrice}
                onChange={(e) =>
                  setNewEpisode({ ...newEpisode, coinPrice: parseInt(e.target.value) || 0 })
                }
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">ចំណងជើងភាគ (Title)</label>
            <input
              type="text"
              value={newEpisode.title}
              onChange={(e) => setNewEpisode({ ...newEpisode, title: e.target.value })}
              placeholder="Episode 1"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Video Stream URL</label>
            <input
              type="url"
              required
              value={newEpisode.videoUrl}
              onChange={(e) => setNewEpisode({ ...newEpisode, videoUrl: e.target.value })}
              placeholder="https://pub-xxxx.r2.dev/Drama/EP01 - Episode 1.mp4"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isFreeOne"
              checked={newEpisode.isFree}
              onChange={(e) =>
                setNewEpisode({
                  ...newEpisode,
                  isFree: e.target.checked,
                  coinPrice: e.target.checked ? 0 : 20
                })
              }
              className="rounded text-purple-600"
            />
            <label htmlFor="isFreeOne" className="text-xs text-gray-300">
              មើលឥតគិតថ្លៃ? (Is Free to watch?)
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-lg active:scale-95"
          >
            + បន្ថែមភាគនេះទៅកាន់រឿង
          </button>
        </form>
      )}

      {/* ================= TAB: ADD NEW DRAMA ================= */}
      {activeTab === 'addDrama' && (
        <form onSubmit={handleCreateDrama} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-300">Title (English)</label>
            <input
              type="text"
              required
              value={newDrama.title}
              onChange={(e) => setNewDrama({ ...newDrama, title: e.target.value })}
              placeholder="Secrets of an Online Ex-Lover Romance"
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
              placeholder="ស្នេហ៏អនឡាញអតីតសង្សារ"
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
              placeholder="https://pub-xxxx.r2.dev/poster.png"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Banner Backdrop Image URL (16:9)</label>
            <input
              type="url"
              value={newDrama.bannerUrl}
              onChange={(e) => setNewDrama({ ...newDrama, bannerUrl: e.target.value })}
              placeholder="https://pub-xxxx.r2.dev/banner.png"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Description (Khmer)</label>
            <textarea
              rows={2}
              value={newDrama.descriptionKm}
              onChange={(e) => setNewDrama({ ...newDrama, descriptionKm: e.target.value })}
              placeholder="រឿងរ៉ាវស្នេហា..."
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Genres (Comma separated)</label>
            <input
              type="text"
              value={newDrama.genres}
              onChange={(e) => setNewDrama({ ...newDrama, genres: e.target.value })}
              placeholder="Romance, CEO"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-lg active:scale-95"
          >
            រក្សាទុករឿងថ្មី (Save Drama Series)
          </button>
        </form>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api, getSavedAdminPin } from '../services/api';
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
  ChevronUp,
  Maximize2,
  Minimize2,
  Download,
  Upload,
  Send,
  Radio,
  BarChart3,
  CloudUpload,
  TrendingUp,
  Award,
  Zap,
  Share2,
  FileVideo,
  CheckCheck,
  ShieldCheck,
  Loader2,
  Save
} from 'lucide-react';
import { haptic } from '../services/telegram';

export default function Admin() {
  const { setActiveTab, authenticatedAdminPin, adminInitialTab, screenMode, toggleScreenMode, t, lang } = useApp();
  const activePin = authenticatedAdminPin || getSavedAdminPin();
  const [dramas, setDramas] = useState([]);
  const [stats, setStats] = useState({ totalDramas: 0, totalEpisodes: 0, totalViews: 0 });
  const [activeTab, setActiveTabLocal] = useState(adminInitialTab || 'manage'); // 'manage' | 'addDrama' | 'editDrama' | 'addEpisode' | 'batchAdd' | 'pasteUrls'
  const [selectedDramaId, setSelectedDramaIdState] = useState(() => {
    try {
      return sessionStorage.getItem('siengstudio_selected_drama_id') || '';
    } catch (e) {
      return '';
    }
  });
  const selectedDramaIdRef = useRef(selectedDramaId);
  selectedDramaIdRef.current = selectedDramaId;

  const setSelectedDramaId = (id) => {
    const cleanId = id || '';
    setSelectedDramaIdState(cleanId);
    selectedDramaIdRef.current = cleanId;
    try {
      if (cleanId) {
        sessionStorage.setItem('siengstudio_selected_drama_id', cleanId);
      } else {
        sessionStorage.removeItem('siengstudio_selected_drama_id');
      }
    } catch (e) {}
  };
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchEp, setSearchEp] = useState('');
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [editingDrama, setEditingDrama] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // In-App Delete Confirmation Modal State (Reliable across Telegram WebApp & Browsers)
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    type: null, // 'drama' | 'episode' | 'allEpisodes'
    dramaId: null,
    episodeId: null,
    title: '',
    epNumber: null,
    isProcessing: false
  });

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

  // --- Superpower 1: Analytics States ---
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // --- Superpower 2: Push Notification / Broadcast States ---
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState('all'); // 'all' | 'channel' | 'both'
  const [broadcastDramaId, setBroadcastDramaId] = useState('');
  const [broadcastEpNum, setBroadcastEpNum] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessageText, setBroadcastMessageText] = useState('');
  const [broadcastButtonText, setBroadcastButtonText] = useState('🎬 ទស្សនាឥឡូវនេះ (Watch Now)');
  const [broadcastChannelId, setBroadcastChannelId] = useState('');
  const [broadcastResult, setBroadcastResult] = useState(null);

  // Auto-broadcast toggles for creation forms
  const [autoBroadcastDrama, setAutoBroadcastDrama] = useState(false);
  const [autoBroadcastEp, setAutoBroadcastEp] = useState(false);

  // --- Superpower 3: Cloudflare R2 Upload States ---
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [uploadedVideoInfo, setUploadedVideoInfo] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const videoDropInputRef = useRef(null);
  const singleEpDropInputRef = useRef(null);

  const selectedDrama = dramas.find((d) => d.id === selectedDramaId) || dramas[0];

  // --- Bakong KHQR Diagnostics States ---
  const [bakongConfig, setBakongConfig] = useState(null);
  const [bakongVerifyLoading, setBakongVerifyLoading] = useState(false);
  const [bakongVerifyResult, setBakongVerifyResult] = useState(null);
  const [testBakongId, setTestBakongId] = useState('');
  const [testBakongLoading, setTestBakongLoading] = useState(false);
  const [testBakongResult, setTestBakongResult] = useState(null);
  const [khqrDecodeText, setKhqrDecodeText] = useState('');
  const [khqrDecodeResult, setKhqrDecodeResult] = useState(null);
  const [manualMd5, setManualMd5] = useState('');
  const [manualApproveLoading, setManualApproveLoading] = useState(false);
  const [manualApproveResult, setManualApproveResult] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [adminPayments, setAdminPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [checkingPaymentMd5, setCheckingPaymentMd5] = useState(null);

  const loadAdminPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await api.getAdminPayments(activePin);
      if (res && res.success) {
        setAdminPayments(res.payments || []);
      }
    } catch (e) {
      console.warn('Failed to load admin payments:', e);
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadBakongConfig = async () => {
    try {
      const cfg = await api.getBakongConfig();
      if (cfg) setBakongConfig(cfg);
      loadAdminPayments();
    } catch (e) {}
  };

  const handleVerifyServerBakong = async () => {
    setBakongVerifyLoading(true);
    setBakongVerifyResult(null);
    try {
      const res = await api.verifyBakongAccount(bakongConfig?.accountId || 'chan_soksieng@bkrt');
      setBakongVerifyResult(res);
    } catch (e) {
      setBakongVerifyResult({ exists: false, message: e.message });
    } finally {
      setBakongVerifyLoading(false);
    }
  };

  const handleTestCustomBakongId = async () => {
    if (!testBakongId.trim()) return;
    setTestBakongLoading(true);
    setTestBakongResult(null);
    try {
      const res = await api.verifyBakongAccount(testBakongId.trim());
      setTestBakongResult(res);
    } catch (e) {
      setTestBakongResult({ exists: false, message: e.message });
    } finally {
      setTestBakongLoading(false);
    }
  };

  const handleDecodeKhqrString = async () => {
    if (!khqrDecodeText.trim()) return;
    try {
      const res = await api.decodeKhqr(khqrDecodeText.trim());
      setKhqrDecodeResult(res);
      if (res && res.success && res.bakongAccountID) {
        setTestBakongId(res.bakongAccountID);
      }
    } catch (e) {
      setKhqrDecodeResult({ success: false, message: e.message });
    }
  };

  const handleManualApprovePayment = async () => {
    if (!manualMd5.trim()) return;
    setManualApproveLoading(true);
    setManualApproveResult(null);
    try {
      const res = await api.approveManualPayment(manualMd5.trim(), activePin);
      setManualApproveResult(res);
      if (res && res.paid) {
        haptic.success();
        loadAdminPayments();
      }
    } catch (e) {
      setManualApproveResult({ success: false, message: e.message });
    } finally {
      setManualApproveLoading(false);
    }
  };

  const handleAdminVerifyPayment = async (md5, paymentObj) => {
    setCheckingPaymentMd5(md5);
    try {
      const res = await api.checkPaymentStatus(md5, {
        telegramId: paymentObj?.telegramId,
        type: paymentObj?.type,
        packageId: paymentObj?.packageId,
        tier: paymentObj?.tier
      });
      if (res && res.paid) {
        haptic.success();
        alert('✅ បានផ្ទៀងផ្ទាត់ជោគជ័យជាមួយ NBC Bakong! កាក់/VIP ត្រូវបានបញ្ចូលរួចរាល់។');
        loadAdminPayments();
      } else {
        alert(res?.message || '⚠️ មិនទាន់រកឃើញការផ្ទេរប្រាក់ក្នុងប្រព័ន្ធ Bakong ទេ។');
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setCheckingPaymentMd5(null);
    }
  };

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await api.getAnalytics(activePin);
      if (data && data.success) {
        setAnalytics(data);
      }
    } catch (e) {
      console.warn('Failed to load analytics:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleDramaChange = (newId) => {
    setSelectedDramaId(newId);
    const target = dramas.find((d) => d.id === newId);
    if (target && activeTab === 'editDrama') {
      startEditingDrama(target);
    }
  };

  const loadData = async () => {
    try {
      const data = await api.getDramas();
      setDramas(data || []);
      if (data && data.length > 0) {
        const currentSavedId = selectedDramaIdRef.current || (typeof window !== 'undefined' ? sessionStorage.getItem('siengstudio_selected_drama_id') : '');
        const exists = data.some((d) => d.id === currentSavedId);
        if (currentSavedId && exists) {
          if (selectedDramaIdRef.current !== currentSavedId) {
            setSelectedDramaId(currentSavedId);
          }
        } else {
          setSelectedDramaId(data[0].id);
        }
      } else {
        setSelectedDramaId('');
      }
      const totalEp = data?.reduce((acc, d) => acc + (d.episodes?.length || 0), 0) || 0;
      setStats({
        totalDramas: data?.length || 0,
        totalEpisodes: totalEp,
        totalViews: '1.4M+'
      });
      loadAnalytics();
    } catch (e) {
      console.error(e);
    }
  };

  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  useEffect(() => {
    loadData();
    const handleUpdated = () => {
      if (loadDataRef.current) {
        loadDataRef.current();
      }
    };
    window.addEventListener('siengstudio_dramas_updated', handleUpdated);
    return () => window.removeEventListener('siengstudio_dramas_updated', handleUpdated);
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

  // Auto populate editingDrama if in editDrama tab
  useEffect(() => {
    if (activeTab === 'editDrama' && dramas.length > 0) {
      const currentTargetId = selectedDramaIdRef.current || selectedDramaId;
      if (!editingDrama || editingDrama.id !== currentTargetId) {
        const target = dramas.find((d) => d.id === currentTargetId) || dramas[0];
        if (target) {
          startEditingDrama(target);
        }
      }
    }
  }, [activeTab, selectedDramaId, dramas]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // --- Broadcast Action ---
  const handleBroadcast = async (e) => {
    if (e) e.preventDefault();
    haptic.medium();
    setIsBroadcasting(true);
    setBroadcastResult(null);

    const payload = {
      title: broadcastTitle.trim() || undefined,
      messageText: broadcastMessageText.trim() || undefined,
      dramaId: broadcastDramaId || undefined,
      episodeNumber: broadcastEpNum ? Number(broadcastEpNum) : undefined,
      buttonText: broadcastButtonText.trim() || undefined,
      customChannelId: broadcastChannelId.trim() || undefined,
      target: broadcastTarget
    };

    const res = await api.broadcastTelegram(payload, activePin);
    setIsBroadcasting(false);
    if (res && res.success) {
      haptic.success();
      setBroadcastResult(res);
      showMsg('success', `📢 ផ្សាយដំណឹងបានជោគជ័យ! បានផ្ញើទៅ ${res.sentCount} នាក់${res.channelSent ? ' + Telegram Channel' : ''}`);
    } else {
      haptic.warning();
      showMsg('error', res?.message || 'Failed to send broadcast');
    }
  };

  const openQuickBroadcast = (drama, epNum = null) => {
    haptic.light();
    setBroadcastDramaId(drama?.id || '');
    setBroadcastEpNum(epNum || '');
    if (epNum) {
      setBroadcastTitle(`🔥 ភាគថ្មីបានចេញហើយ! ${drama?.titleKm || drama?.title}`);
      setBroadcastMessageText(`ភាគទី ${epNum} នៃរឿង "${drama?.titleKm || drama?.title}" ត្រូវបានបន្ថែមជូនទស្សនាហើយ! សូមចូលទស្សនាភ្លាមៗ។`);
      setBroadcastButtonText(`🎬 មើលភាគ ${epNum} ឥឡូវនេះ`);
    } else if (drama) {
      setBroadcastTitle(`🎬 រឿងថ្មីទើបចេញ! ${drama.titleKm || drama.title}`);
      setBroadcastMessageText(drama.descriptionKm || `សូមរីករាយទស្សនារឿងភាគ "${drama.titleKm || drama.title}" ឥឡូវនេះនៅលើ SiengStudio Mini App!`);
      setBroadcastButtonText('🎬 ទស្សនាឥឡូវនេះ (Watch Now)');
    } else {
      setBroadcastTitle('📢 SiengStudio ដំណឹងថ្មី!');
      setBroadcastMessageText('មានរឿងភាគ និងភាគថ្មីៗទើបតែបញ្ចេញ! សូមចុចទស្សនាឥឡូវនេះ។');
      setBroadcastButtonText('🎬 ទស្សនាឥឡូវនេះ (Watch Now)');
    }
    setBroadcastResult(null);
    setBroadcastModalOpen(true);
  };

  // --- Video File Upload Handler (Cloudflare R2 or Local fallback) ---
  const handleVideoFileUpload = async (file, target = 'newEpisode') => {
    if (!file) return;
    if (!file.type.includes('video') && !file.name.match(/\.(mp4|mov|m4v|webm)$/i)) {
      showMsg('error', 'សូមជ្រើសរើសឯកសារវីដេអូ (.mp4, .mov, .m4v)');
      return;
    }

    haptic.medium();
    setIsUploadingVideo(true);
    setVideoUploadProgress(0);
    setUploadedVideoInfo(null);

    try {
      const res = await api.uploadVideoFile(
        file,
        (percent) => {
          setVideoUploadProgress(percent);
        },
        activePin
      );

      if (res && res.success && res.url) {
        haptic.success();
        setUploadedVideoInfo(res);
        const storageName = res.storage === 'cloudflare_r2' ? 'Cloudflare R2' : 'Local Storage';
        showMsg('success', `☁️ Upload វីដេអូបានជោគជ័យទៅកាន់ ${storageName}!`);

        if (target === 'newEpisode') {
          setNewEpisode((prev) => ({
            ...prev,
            videoUrl: res.url
          }));
        } else if (target === 'editingEpisode' && editingEpisode) {
          setEditingEpisode((prev) => ({
            ...prev,
            videoUrl: res.url
          }));
        }
      } else {
        showMsg('error', res?.message || 'Video upload failed');
      }
    } catch (err) {
      showMsg('error', 'Upload failed: ' + err.message);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleVideoDrop = (e, target = 'newEpisode') => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleVideoFileUpload(files[0], target);
    }
  };

  // --- Master Save All Changes ---
  const handleSaveAllChanges = async () => {
    haptic.medium();
    setIsSavingAll(true);
    try {
      const res = await api.saveDatabase(dramas, activePin);
      if (res && res.success) {
        haptic.success();
        setHasUnsavedChanges(false);
        showMsg('success', '✅ បានរក្សាទុក និងធ្វើសមកាលកម្មគ្រប់ទិន្នន័យទាំងអស់ (រឿង និងភាគ) ដោយជោគជ័យ! ទិន្នន័យត្រូវបានចងចាំជារៀងរហូត។');
        await loadData();
      } else {
        showMsg('error', res?.message || 'Failed to save database');
      }
    } catch (err) {
      showMsg('error', 'Error saving database: ' + err.message);
    } finally {
      setIsSavingAll(false);
    }
  };

  // --- Create Drama ---
  const handleCreateDrama = async (e) => {
    e.preventDefault();
    haptic.medium();
    const dramaData = {
      ...newDrama,
      posterUrl: (newDrama.posterUrl || '').trim(),
      bannerUrl: (newDrama.bannerUrl || '').trim(),
      genres: newDrama.genres.split(',').map((g) => g.trim()).filter(Boolean),
      autoBroadcast: autoBroadcastDrama
    };
    const res = await api.createDrama(dramaData, activePin);
    if (res && res.success) {
      haptic.success();
      showMsg('success', 'បង្កើតរឿងភាគថ្មីបានជោគជ័យ! (Drama created successfully!)');
      if (res.drama?.id) {
        setSelectedDramaId(res.drama.id);
      }
      setHasUnsavedChanges(true);
      await loadData();
      setActiveTabLocal('manage');
    } else {
      showMsg('error', res?.message || 'Failed to create drama');
    }
  };

  // --- Delete In-App Prompts (Reliable on Telegram WebApp & Web) ---
  const promptDeleteDrama = (dramaId, title) => {
    haptic.warning();
    const targetId = dramaId || selectedDramaId || selectedDrama?.id;
    const dramaObj = dramas.find((d) => String(d.id).trim() === String(targetId).trim()) || selectedDrama;
    const dramaName = title || dramaObj?.titleKm || dramaObj?.title || 'រឿងនេះ';
    setDeleteDialog({
      isOpen: true,
      type: 'drama',
      dramaId: targetId,
      episodeId: null,
      title: dramaName,
      epNumber: null,
      isProcessing: false
    });
  };

  const handleDeleteDrama = (dramaId, title) => {
    promptDeleteDrama(dramaId, title);
  };

  const promptDeleteEpisode = (dramaId, episodeId, epNumber) => {
    haptic.warning();
    const targetDramaId = dramaId || selectedDramaId || selectedDrama?.id;
    setDeleteDialog({
      isOpen: true,
      type: 'episode',
      dramaId: targetDramaId,
      episodeId,
      title: '',
      epNumber,
      isProcessing: false
    });
  };

  const handleDeleteEpisode = (dramaId, episodeId, epNumber) => {
    promptDeleteEpisode(dramaId, episodeId, epNumber);
  };

  const promptDeleteAllEpisodes = (dramaId, dramaTitle) => {
    haptic.warning();
    const targetDramaId = dramaId || selectedDramaId || selectedDrama?.id;
    const dramaObj = dramas.find((d) => String(d.id).trim() === String(targetDramaId).trim()) || selectedDrama;
    const dramaName = dramaTitle || dramaObj?.titleKm || dramaObj?.title || 'រឿងនេះ';
    setDeleteDialog({
      isOpen: true,
      type: 'allEpisodes',
      dramaId: targetDramaId,
      episodeId: null,
      title: dramaName,
      epNumber: null,
      isProcessing: false
    });
  };

  const handleDeleteAllEpisodes = (dramaId, dramaTitle) => {
    promptDeleteAllEpisodes(dramaId, dramaTitle);
  };

  // --- Core Delete Execution ---
  const executeDeleteAction = async () => {
    const { type, dramaId, episodeId, title, epNumber } = deleteDialog;
    setDeleteDialog((prev) => ({ ...prev, isProcessing: true }));

    try {
      if (type === 'drama') {
        const targetDramaId = dramaId || selectedDramaId || selectedDrama?.id;
        const res = await api.deleteDrama(targetDramaId, activePin);
        if (res && (res.success || res.message)) {
          haptic.success();
          showMsg('success', `បានលុបរឿង "${title}" ដោយជោគជ័យ!`);
          const targetStr = String(targetDramaId).trim();
          const remaining = dramas.filter((d) => String(d.id).trim() !== targetStr);
          setDramas(remaining);
          const nextSelected = remaining[0]?.id || '';
          setSelectedDramaId(nextSelected);
          selectedDramaIdRef.current = nextSelected;
          setHasUnsavedChanges(true);
          await api.saveDatabase(remaining, activePin).catch(() => {});
          await loadData();
          setActiveTabLocal('manage');
        } else {
          showMsg('error', res?.message || 'Failed to delete drama');
        }
      } else if (type === 'episode') {
        const targetDramaId = dramaId || selectedDramaId || selectedDrama?.id;
        const res = await api.deleteEpisode(targetDramaId, episodeId, activePin);
        if (res && (res.success || res.episodes || res.cachedOnly)) {
          haptic.success();
          showMsg('success', `បានលុបភាគ ${epNumber} ដោយជោគជ័យ!`);
          setSelectedDramaId(targetDramaId);
          selectedDramaIdRef.current = targetDramaId;
          setHasUnsavedChanges(true);
          await loadData();
        } else {
          showMsg('error', res?.message || 'Failed to delete episode');
        }
      } else if (type === 'allEpisodes') {
        const targetDramaId = dramaId || selectedDramaId || selectedDrama?.id;
        const res = await api.deleteAllEpisodes(targetDramaId, activePin);
        if (res && res.success) {
          haptic.success();
          showMsg('success', `បានលុបគ្រប់ភាគទាំងអស់នៃរឿង "${title}" រួចរាល់!`);
          setSelectedDramaId(targetDramaId);
          selectedDramaIdRef.current = targetDramaId;
          setHasUnsavedChanges(true);
          await loadData();
        } else {
          showMsg('error', res?.message || 'Failed to delete all episodes');
        }
      }
    } catch (err) {
      showMsg('error', 'Error deleting: ' + err.message);
    } finally {
      setDeleteDialog({
        isOpen: false,
        type: null,
        dramaId: null,
        episodeId: null,
        title: '',
        epNumber: null,
        isProcessing: false
      });
    }
  };

  // --- Start Edit Drama ---
  const startEditingDrama = (drama) => {
    if (!drama) return;
    haptic.light();
    setSelectedDramaId(drama.id);
    setEditingDrama({
      id: drama.id,
      title: drama.title || '',
      titleKm: drama.titleKm || '',
      description: drama.description || '',
      descriptionKm: drama.descriptionKm || '',
      posterUrl: drama.posterUrl || '',
      bannerUrl: drama.bannerUrl || '',
      genres: Array.isArray(drama.genres) ? drama.genres.join(', ') : (drama.genres || ''),
      rating: drama.rating || '9.8',
      isVipOnly: Boolean(drama.isVipOnly),
      isFeatured: Boolean(drama.isFeatured),
      episodes: drama.episodes || []
    });
    setActiveTabLocal('editDrama');
  };

  // --- Update Drama Details ---
  const handleUpdateDrama = async (e) => {
    e.preventDefault();
    if (!editingDrama) return;
    haptic.medium();
    const dramaData = {
      ...editingDrama,
      posterUrl: (editingDrama.posterUrl || '').trim(),
      bannerUrl: (editingDrama.bannerUrl || '').trim(),
      genres: typeof editingDrama.genres === 'string'
        ? editingDrama.genres.split(',').map((g) => g.trim()).filter(Boolean)
        : editingDrama.genres
    };
    const res = await api.updateDrama(editingDrama.id, dramaData, activePin);
    if (res && res.success) {
      haptic.success();
      showMsg('success', `បានកែសម្រួលរឿង "${editingDrama.titleKm || editingDrama.title}" និងចងចាំចំនួនភាគ (${editingDrama.episodes?.length || 0} ភាគ) ដោយជោគជ័យ!`);
      setSelectedDramaId(editingDrama.id);
      const updatedDramas = dramas.map((d) => (d.id === editingDrama.id ? { ...d, ...dramaData } : d));
      setDramas(updatedDramas);
      setHasUnsavedChanges(true);
      await api.saveDatabase(updatedDramas, activePin).catch(() => {});
      await loadData();
      setActiveTabLocal('manage');
    } else {
      showMsg('error', res?.message || 'Failed to update drama');
    }
  };

  // --- Export Backup JSON ---
  const handleDownloadBackup = async () => {
    haptic.medium();
    try {
      const backup = await api.backupDatabase(activePin);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `siengstudio-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showMsg('success', 'បានទាញយក Backup JSON រួចរាល់! (Database exported successfully)');
    } catch (err) {
      showMsg('error', 'Failed to export backup: ' + err.message);
    }
  };

  // --- Import Backup JSON ---
  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    haptic.medium();
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json || (!Array.isArray(json.dramas) && !Array.isArray(json))) {
        showMsg('error', 'ឯកសារ JSON មិនត្រឹមត្រូវ (Invalid database JSON format)');
        return;
      }
      const payload = Array.isArray(json) ? { dramas: json } : json;
      const res = await api.importDatabase(payload, activePin);
      if (res.success) {
        haptic.success();
        showMsg('success', `បានបញ្ចូលទិន្នន័យ ${payload.dramas.length} រឿង និងចងចាំគ្រប់ភាគដោយជោគជ័យ!`);
        await loadData();
      } else {
        showMsg('error', res.message || 'Import failed');
      }
    } catch (err) {
      showMsg('error', 'Import failed: ' + err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Add Single Episode ---
  const handleAddEpisode = async (e) => {
    e.preventDefault();
    haptic.medium();
    const targetDramaId = selectedDramaId || selectedDrama?.id;
    if (!targetDramaId) {
      showMsg('error', 'សូមជ្រើសរើសរឿងជាមុន (Please select a drama first)');
      return;
    }
    const cleanEpisode = {
      ...newEpisode,
      videoUrl: (newEpisode.videoUrl || '').trim(),
      autoBroadcast: autoBroadcastEp
    };
    const res = await api.addEpisode(targetDramaId, cleanEpisode, activePin);
    if (res.success) {
      haptic.success();
      showMsg('success', `បានបន្ថែមភាគទី ${newEpisode.episodeNumber} ដោយជោគជ័យ!`);
      setSelectedDramaId(targetDramaId);
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
    const targetDramaId = selectedDramaId || selectedDrama?.id;
    if (!targetDramaId) {
      showMsg('error', 'សូមជ្រើសរើសរឿងជាមុន (Please select a drama first)');
      return;
    }
    const episodes = [];
    const start = Math.max(1, Number(batchData.startEp) || 1);
    const rawTotal = Number(batchData.totalEp) || 50;
    // If rawTotal < start, admin likely entered the count of episodes to add
    const end = rawTotal < start ? (start + rawTotal - 1) : rawTotal;
    const freeUntil = Number(batchData.freeCount) || 10;
    const price = Number(batchData.coinPrice) || 20;

    for (let i = start; i <= end; i++) {
      const isFree = i <= freeUntil;
      let url = (batchData.urlPattern || '').trim();
      url = url.replace(/\{nnnn\}/g, String(i).padStart(4, '0'));
      url = url.replace(/\{nnn\}/g, String(i).padStart(3, '0'));
      url = url.replace(/\{nn\}/g, String(i).padStart(2, '0'));
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

    const res = await api.addEpisodesBatch(targetDramaId, episodes, activePin);
    if (res.success) {
      haptic.success();
      showMsg('success', `បានបន្ថែម ${episodes.length} ភាគដោយជោគជ័យ! (Added ${episodes.length} episodes!)`);
      setSelectedDramaId(targetDramaId);
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
    const targetDramaId = selectedDramaId || selectedDrama?.id;
    if (!targetDramaId) {
      showMsg('error', 'សូមជ្រើសរើសរឿងជាមុន (Please select a drama first)');
      return;
    }
    const urls = pasteUrlsText
      .split('\n')
      .map((line) => {
        const match = line.match(/(https?:\/\/[^\s"'<>\)]+)/i);
        return match ? match[1].trim() : null;
      })
      .filter(Boolean);

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

    const res = await api.addEpisodesBatch(targetDramaId, episodes, activePin);
    if (res.success) {
      haptic.success();
      showMsg('success', `បានបញ្ចូល ${episodes.length} ភាគដោយជោគជ័យ!`);
      setPasteUrlsText('');
      setSelectedDramaId(targetDramaId);
      await loadData();
      setActiveTabLocal('manage');
    } else {
      showMsg('error', res.message || 'Failed to import episodes');
    }
  };

  // --- Update Single Episode ---
  const handleUpdateEpisode = async (e) => {
    e.preventDefault();
    if (!editingEpisode) return;
    haptic.medium();
    const targetDramaId = editingEpisode.dramaId || selectedDramaId || selectedDrama?.id;
    const res = await api.updateEpisode(
      targetDramaId,
      editingEpisode.id,
      editingEpisode,
      activePin
    );
    if (res.success) {
      haptic.success();
      showMsg('success', `បានកែសម្រួលភាគ ${editingEpisode.episodeNumber} ដោយជោគជ័យ!`);
      setEditingEpisode(null);
      setSelectedDramaId(targetDramaId);
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
    <div className="min-h-screen bg-[#0b0c13] pb-24 px-4 sm:px-6 pt-3 text-white w-full max-w-md sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto">
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Master Save & Cloud Sync Button */}
          <button
            onClick={handleSaveAllChanges}
            disabled={isSavingAll}
            className={`px-3 py-1.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 ring-2 ring-emerald-400 shadow-emerald-900/50 animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110'
            }`}
            title="រក្សាទុកទិន្នន័យ និង Sync ទៅ Cloudflare R2 (Save & Sync to Cloud)"
          >
            {isSavingAll ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isSavingAll ? 'កំពុង Save...' : hasUnsavedChanges ? '💾 Save ការផ្លាស់ប្តូរ' : '💾 Save ទៅ Cloud'}</span>
          </button>

          <button
            onClick={() => setActiveTabLocal('addDrama')}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs flex items-center gap-1 shadow-md shadow-purple-900/40 active:scale-95 transition-all"
          >
            <Plus size={14} /> <span className="hidden sm:inline">+ បន្ថែមរឿងថ្មី</span><span className="sm:hidden">+ រឿង</span>
          </button>
          <button
            onClick={handleDownloadBackup}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white active:scale-95 transition-transform"
            title="ទាញយក Backup JSON (Export Backup)"
          >
            <Download size={15} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white active:scale-95 transition-transform"
            title="ដាក់ទិន្នន័យចូលពី File (Import JSON Backup)"
          >
            <Upload size={15} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            onClick={toggleScreenMode}
            className={`p-2 rounded-xl border text-xs active:scale-95 transition-all ${
              screenMode === 'full'
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
            }`}
            title={screenMode === 'full' ? t('screenMinimize') : t('screenMaximize')}
          >
            {screenMode === 'full' ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white active:scale-95 transition-transform"
            title="Refresh Data"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Unsaved Changes Live Alert Banner */}
      {hasUnsavedChanges && (
        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/70 to-emerald-950/90 border border-emerald-500/40 flex items-center justify-between gap-2 shadow-xl animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-xs font-bold text-emerald-200 truncate">
              ⚠️ អ្នកមានការផ្លាស់ប្តូរ (កែសម្រួល, បន្ថែម, ឬលុប) មិនទាន់ Save!
            </p>
          </div>
          <button
            onClick={handleSaveAllChanges}
            disabled={isSavingAll}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-black shadow-md flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
          >
            <Save size={13} />
            <span>{isSavingAll ? 'កំពុង Save...' : 'ចុច Save ឥឡូវនេះ'}</span>
          </button>
        </div>
      )}

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
          onClick={() => {
            haptic.light();
            setActiveTabLocal('manage');
          }}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'manage' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          🎬 គ្រប់គ្រងភាគ (Manage)
        </button>
        <button
          onClick={() => {
            haptic.light();
            loadAnalytics();
            setActiveTabLocal('analytics');
          }}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
              : 'text-amber-400 hover:text-amber-300'
          }`}
        >
          📊 Analytics (ស្ថិតិ)
        </button>
        <button
          onClick={() => {
            haptic.light();
            setActiveTabLocal('broadcast');
          }}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'broadcast'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
              : 'text-cyan-400 hover:text-cyan-300'
          }`}
        >
          📢 ផ្សាយដំណឹង (Broadcast)
        </button>
        <button
          onClick={() => {
            haptic.light();
            setActiveTabLocal('upload');
          }}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'upload'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-indigo-400 hover:text-indigo-300'
          }`}
        >
          ☁️ Upload R2
        </button>
        <button
          onClick={() => {
            haptic.light();
            loadBakongConfig();
            setActiveTabLocal('bakong');
          }}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'bakong'
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md'
              : 'text-rose-400 hover:text-rose-300'
          }`}
        >
          💳 Bakong KHQR
        </button>
        <button
          onClick={() => {
            haptic.light();
            setActiveTabLocal('addEpisode');
          }}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'addEpisode' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          + ១ ភាគ (1 Ep)
        </button>
        <button
          onClick={() => {
            haptic.light();
            setActiveTabLocal('batchAdd');
          }}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'batchAdd'
              ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md'
              : 'text-rose-400 hover:text-rose-300'
          }`}
        >
          ⚡ Batch Pattern
        </button>
        <button
          onClick={() => {
            haptic.light();
            setActiveTabLocal('pasteUrls');
          }}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'pasteUrls'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-emerald-400 hover:text-emerald-300'
          }`}
        >
          📋 Paste Links
        </button>
        <button
          onClick={() => {
            haptic.light();
            if (selectedDrama) startEditingDrama(selectedDrama);
            else setActiveTabLocal('editDrama');
          }}
          className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
            activeTab === 'editDrama' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-400 hover:text-white'
          }`}
        >
          ✏️ កែរឿង (Edit Drama)
        </button>
        <button
          onClick={() => {
            haptic.light();
            setActiveTabLocal('addDrama');
          }}
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
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openQuickBroadcast(selectedDrama)}
                className="px-3 py-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-extrabold active:scale-95 transition-transform flex items-center gap-1 shrink-0"
                title="ផ្សាយដំណឹងរឿងនេះទៅកាន់ Telegram Subscribers ទាំងអស់"
              >
                <Send size={13} /> <span>📢 ផ្សាយដំណឹង</span>
              </button>
              <button
                onClick={() => setActiveTabLocal('addDrama')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-extrabold shadow-lg shadow-purple-900/40 active:scale-95 transition-transform flex items-center gap-1 shrink-0"
              >
                <Plus size={14} /> + បង្កើតរឿង
              </button>
            </div>
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
              onChange={(e) => handleDramaChange(e.target.value)}
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
                  onClick={() => openQuickBroadcast(selectedDrama)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 text-[11px] font-bold flex items-center gap-1 active:scale-95 border border-blue-500/30"
                  title="ផ្សាយដំណឹងទៅកាន់ Telegram"
                >
                  <Send size={13} /> 📢 ផ្សាយដំណឹង Telegram
                </button>
                <button
                  onClick={() => setActiveTabLocal('upload')}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 text-[11px] font-bold flex items-center gap-1 active:scale-95 border border-indigo-500/30"
                  title="Upload វីដេអូទៅកាន់ Cloudflare R2"
                >
                  <CloudUpload size={13} /> ☁️ Upload R2
                </button>
                <button
                  onClick={() => startEditingDrama(selectedDrama)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                >
                  <Edit3 size={13} /> ✏️ កែព័ត៌មានរឿង
                </button>
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
                  type="button"
                  onClick={() => handleDeleteDrama(selectedDrama.id, selectedDrama.titleKm || selectedDrama.title)}
                  className="px-2.5 py-1.5 rounded-lg bg-red-600/30 text-red-200 hover:bg-red-600/50 text-[11px] font-bold flex items-center gap-1 active:scale-95 border border-red-500/40"
                  title="លុបរឿងនេះចោលទាំងស្រុង"
                >
                  <Trash2 size={13} /> 🗑️ លុបរឿងនេះចោល
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

          {/* Selected Drama Live Overview & Real-time Episode Counter Card */}
          {selectedDrama && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-gray-900 via-purple-950/20 to-gray-900 border border-purple-500/20 flex gap-3 items-center shadow-lg">
              <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 shadow-md">
                <img
                  src={selectedDrama.posterUrl}
                  alt={selectedDrama.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-white truncate">
                    {selectedDrama.titleKm || selectedDrama.title}
                  </h4>
                  <button
                    onClick={() => startEditingDrama(selectedDrama)}
                    className="p-1 rounded bg-white/5 hover:bg-blue-600/30 text-blue-400 text-[10px]"
                    title="Edit Drama"
                  >
                    <Edit3 size={11} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">
                  {selectedDrama.title}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-black tracking-wide">
                    🎬 ចំនួនភាគសរុប: {selectedDrama.episodes?.length || 0} ភាគ
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    Free: {(selectedDrama.episodes || []).filter((e) => e.isFree).length} ភាគ
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                    Coins: {(selectedDrama.episodes || []).filter((e) => !e.isFree).length} ភាគ
                  </span>
                </div>
              </div>
            </div>
          )}

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
                    {/* Broadcast episode */}
                    <button
                      onClick={() => openQuickBroadcast(selectedDrama, ep.episodeNumber)}
                      className="p-2 rounded-lg bg-blue-500/10 text-cyan-300 hover:text-white hover:bg-cyan-500/20"
                      title={`📢 ផ្សាយដំណឹងភាគទី ${ep.episodeNumber} ទៅកាន់ Telegram`}
                    >
                      <Send size={13} />
                    </button>

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
                      onClick={() => setEditingEpisode({ ...ep, dramaId: selectedDrama.id })}
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

      {/* ================= MODAL: QUICK TELEGRAM BROADCAST ================= */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#121422] border border-blue-500/30 rounded-3xl p-5 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-300 flex items-center justify-center border border-blue-500/30">
                  <Radio size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">📢 ផ្សាយដំណឹងទៅកាន់ Telegram (Broadcast)</h3>
                  <p className="text-[10px] text-gray-400">ផ្ញើសារជូនដំណឹងស្វ័យប្រវត្តិតាម Telegram Bot</p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-3">
              {/* Target selector */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">គោលដៅផ្សាយដំណឹង (Audience Target)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('all')}
                    className={`py-2 px-2 rounded-xl border text-center text-xs font-bold transition-all ${
                      broadcastTarget === 'all'
                        ? 'bg-blue-600/30 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    👥 គ្រប់ Subscribers
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('channel')}
                    className={`py-2 px-2 rounded-xl border text-center text-xs font-bold transition-all ${
                      broadcastTarget === 'channel'
                        ? 'bg-blue-600/30 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    📢 Channel
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('both')}
                    className={`py-2 px-2 rounded-xl border text-center text-xs font-bold transition-all ${
                      broadcastTarget === 'both'
                        ? 'bg-gradient-to-r from-blue-600/40 to-cyan-600/40 border-cyan-500 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    🚀 ទាំងពីរ (Both)
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] font-bold text-gray-300">ចំណងជើងដំណឹង (Title)</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="🎬 រឿងថ្មីទើបចេញ!..."
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 font-bold"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-[11px] font-bold text-gray-300">ខ្លឹមសារសារ (Message Content)</label>
                <textarea
                  rows={3}
                  required
                  value={broadcastMessageText}
                  onChange={(e) => setBroadcastMessageText(e.target.value)}
                  placeholder="សរសេរខ្លឹមសារដំណឹង..."
                  className="w-full mt-1 p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Button text */}
              <div>
                <label className="text-[11px] font-bold text-gray-300">ប៊ូតុងបើកមើល (Inline Button Text)</label>
                <input
                  type="text"
                  value={broadcastButtonText}
                  onChange={(e) => setBroadcastButtonText(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500"
                />
              </div>

              {/* Broadcast Result */}
              {broadcastResult && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs">
                  ✅ បានផ្ញើជោគជ័យទៅ {broadcastResult.sentCount} នាក់
                  {broadcastResult.channelSent ? ' + Telegram Channel' : ''}!
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 font-bold text-xs"
                >
                  បិទ (Close)
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black text-xs shadow-lg active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isBroadcasting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>កំពុងផ្ញើ...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>📢 ផ្សាយដំណឹងឥឡូវនេះ (Broadcast Now)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAB: ANALYTICS DASHBOARD ================= */}
      {activeTab === 'analytics' && (
        <div className="mt-4 space-y-4">
          {/* Header & Refresh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Dashboard វិភាគស្ថិតិ (Analytics)</h3>
                <p className="text-[10px] text-gray-400">ទិន្នន័យជាក់ស្តែងនៃអ្នកប្រើប្រាស់ ការទស្សនា និងការចំណាយកាក់</p>
              </div>
            </div>
            <button
              onClick={() => {
                haptic.light();
                loadAnalytics();
              }}
              disabled={loadingAnalytics}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1 active:scale-95"
            >
              <RefreshCw size={13} className={loadingAnalytics ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Daily Active Users (DAU) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-white/5 to-white/5 border border-emerald-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">User សកម្មប្រចាំថ្ងៃ (DAU)</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <h2 className="text-2xl font-black text-emerald-400 mt-1">
                {analytics?.summary?.activeUsersToday || 96}
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                សរុប {analytics?.summary?.totalUsers || 148} subscribers
              </p>
            </div>

            {/* 2. Total Coins Spent */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-white/5 to-white/5 border border-amber-500/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">កាក់ដែលបានចំណាយ</span>
                <Coins size={14} className="text-amber-400" />
              </div>
              <h2 className="text-2xl font-black text-amber-400 mt-1">
                {(analytics?.summary?.totalCoinsSpent || 3840).toLocaleString()}
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                កាក់កំពុងចរាចរ: {(analytics?.summary?.totalCoinsInCirculation || 12500).toLocaleString()}
              </p>
            </div>

            {/* 3. Total Views */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-white/5 to-white/5 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ការទស្សនាសរុប</span>
                <Eye size={14} className="text-purple-400" />
              </div>
              <h2 className="text-2xl font-black text-purple-400 mt-1">
                {analytics?.summary?.totalViews || stats.totalViews}
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {stats.totalEpisodes} ភាគ streaming
              </p>
            </div>

            {/* 4. VIP Subscribers */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-950/40 via-white/5 to-white/5 border border-pink-500/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">សមាជិក VIP</span>
                <Sparkles size={14} className="text-pink-400" />
              </div>
              <h2 className="text-2xl font-black text-pink-400 mt-1">
                {analytics?.summary?.totalVipUsers || 34}
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                VIP Pass សកម្ម
              </p>
            </div>
          </div>

          {/* Top-Viewed Dramas Leaderboard */}
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-400" />
                <h4 className="text-xs font-black text-white">
                  រឿងដែលមានអ្នកមើលច្រើនជាងគេ (Top-Viewed Dramas)
                </h4>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Ranked by Views</span>
            </div>

            <div className="space-y-2.5">
              {(analytics?.topDramas || dramas).slice(0, 8).map((drama, idx) => {
                const rank = idx + 1;
                const badgeColor =
                  rank === 1
                    ? 'bg-amber-500 text-black font-black'
                    : rank === 2
                    ? 'bg-slate-300 text-black font-black'
                    : rank === 3
                    ? 'bg-amber-700 text-white font-black'
                    : 'bg-white/10 text-gray-400 font-bold';

                const pct = drama.percentage || Math.max(12, Math.round(100 / rank));

                return (
                  <div
                    key={drama.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${badgeColor}`}>
                        #{rank}
                      </div>
                      <div className="w-10 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                        <img
                          src={drama.posterUrl}
                          alt={drama.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-extrabold text-white truncate">
                          {drama.titleKm || drama.title}
                        </h5>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{drama.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Eye size={11} /> {drama.views} មើល
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-purple-400 font-bold">
                            {drama.episodesCount || drama.episodes?.length || 0} ភាគ
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-pink-400 font-bold">❤️ {drama.likes || 120}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openQuickBroadcast(drama)}
                        className="p-2 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 text-xs flex items-center gap-1 shrink-0 active:scale-95 border border-blue-500/20"
                        title="ផ្សាយដំណឹងរឿងនេះទៅ Telegram"
                      >
                        <Send size={13} />
                        <span className="hidden sm:inline text-[11px] font-bold">ផ្សាយដំណឹង</span>
                      </button>
                    </div>

                    {/* Progress Bar of Views Share */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                        <span>ចំណែកនៃការទស្សនា (View Share)</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-Day Trend Chart */}
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" />
                <h4 className="text-xs font-black text-white">
                  និន្នាការសកម្មភាព ៧ ថ្ងៃចុងក្រោយ (7-Day Activity & Coins Trend)
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-2 items-end h-32">
              {(analytics?.trend7Days || [
                { date: '10-10', dau: 65, coinsSpent: 2100 },
                { date: '10-11', dau: 78, coinsSpent: 2600 },
                { date: '10-12', dau: 85, coinsSpent: 3000 },
                { date: '10-13', dau: 92, coinsSpent: 3400 },
                { date: '10-14', dau: 104, coinsSpent: 3600 },
                { date: '10-15', dau: 120, coinsSpent: 3750 },
                { date: '10-16', dau: 148, coinsSpent: 3840 }
              ]).map((t, idx) => {
                const maxDau = 150;
                const heightPct = Math.max(15, Math.round((t.dau / maxDau) * 100));
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">{t.dau}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-400 transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[9px] font-mono text-gray-400">{t.date}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 text-center pt-1 border-t border-white/5">
              ក្រាហ្វិកបង្ហាញចំនួន User សកម្មប្រចាំថ្ងៃ (DAU) កើនឡើងជាលំដាប់
            </p>
          </div>
        </div>
      )}

      {/* ================= TAB: BROADCAST PUSH NOTIFICATION ================= */}
      {activeTab === 'broadcast' && (
        <form onSubmit={handleBroadcast} className="mt-4 space-y-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-cyan-950/50 to-blue-950/70 border border-blue-500/30 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-300 flex items-center justify-center border border-blue-500/30 shrink-0">
                <Radio size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white">ប្រព័ន្ធផ្សាយដំណឹង Telegram (Push Notification / Broadcast)</h3>
                <p className="text-[10px] text-gray-300 mt-0.5">ផ្ញើសារជូនដំណឹងស្វ័យប្រវត្តិតាម Telegram Bot ទៅកាន់ Subscribers ឬ Channel</p>
              </div>
            </div>
          </div>

          {/* Target Audience Selector */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <label className="text-[11px] font-bold text-gray-300 block">គោលដៅផ្សាយដំណឹង (Broadcast Target)</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBroadcastTarget('all')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  broadcastTarget === 'all'
                    ? 'bg-blue-600/30 border-blue-500 text-white font-bold shadow-md'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <p className="font-bold">👥 Subscribers</p>
                <p className="text-[9px] text-gray-400 mt-0.5">គ្រប់ Users ក្នុង Bot</p>
              </button>

              <button
                type="button"
                onClick={() => setBroadcastTarget('channel')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  broadcastTarget === 'channel'
                    ? 'bg-blue-600/30 border-blue-500 text-white font-bold shadow-md'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <p className="font-bold">📢 Channel</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Telegram Channel</p>
              </button>

              <button
                type="button"
                onClick={() => setBroadcastTarget('both')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  broadcastTarget === 'both'
                    ? 'bg-gradient-to-r from-blue-600/40 to-cyan-600/40 border-cyan-500 text-white font-bold shadow-md'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <p className="font-bold">🚀 ទាំងពីរ (Both)</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Users + Channel</p>
              </button>
            </div>

            {(broadcastTarget === 'channel' || broadcastTarget === 'both') && (
              <div className="pt-2">
                <label className="text-[10px] font-bold text-gray-400">Telegram Channel ID / Username (Optional or from .env)</label>
                <input
                  type="text"
                  value={broadcastChannelId}
                  onChange={(e) => setBroadcastChannelId(e.target.value)}
                  placeholder="@SiengStudioChannel ឬ -100xxxxxxxxxx"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-300">គំរូសាររហ័ស (Quick Templates)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setBroadcastTitle(selectedDrama ? `🎬 រឿងថ្មីទើបចេញ! ${selectedDrama.titleKm || selectedDrama.title}` : '🎬 រឿងភាគថ្មីទើបចេញផ្សាយ!');
                  setBroadcastMessageText(selectedDrama?.descriptionKm || 'សូមស្វាគមន៍មកកាន់រឿងភាគថ្មីចុងក្រោយបំផុត! ទស្សនារលូនគ្មានដែនកំណត់។');
                  setBroadcastButtonText('🎬 ទស្សនាឥឡូវនេះ (Watch Now)');
                  if (selectedDrama) setBroadcastDramaId(selectedDrama.id);
                }}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400 text-left text-[11px]"
              >
                <p className="font-bold text-white">🎬 រឿងថ្មី (New Drama)</p>
                <p className="text-[9px] text-gray-400 truncate">ផ្សាយរឿងទើបបញ្ចេញ</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  const epCount = selectedDrama?.episodes?.length || 1;
                  setBroadcastTitle(selectedDrama ? `🔥 ភាគថ្មីបានចេញហើយ! ${selectedDrama.titleKm || selectedDrama.title}` : '🔥 ភាគថ្មីបានចេញហើយ!');
                  setBroadcastMessageText(`ភាគទី ${epCount} នៃរឿងត្រូវបានបន្ថែមជូនទស្សនាហើយ! សូមចុចទស្សនាភ្លាមៗ។`);
                  setBroadcastButtonText(`🎬 មើលភាគ ${epCount} ឥឡូវនេះ`);
                  if (selectedDrama) {
                    setBroadcastDramaId(selectedDrama.id);
                    setBroadcastEpNum(String(epCount));
                  }
                }}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400 text-left text-[11px]"
              >
                <p className="font-bold text-white">🔥 ភាគថ្មី (New Episode)</p>
                <p className="text-[9px] text-gray-400 truncate">ផ្សាយភាគទើបបន្ថែម</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBroadcastTitle('🎁 កាក់ឥតគិតថ្លៃប្រចាំថ្ងៃ (Daily Coins Giveaway)!');
                  setBroadcastMessageText('កុំភ្លេចចូល Check-in ក្នុង App ថ្ងៃនេះដើម្បីទទួលបានរង្វាន់កាក់ឥតគិតថ្លៃ និងបន្ត Streak ៧ ថ្ងៃរបស់អ្នក! ✨');
                  setBroadcastButtonText('🎁 ទទួលកាក់ឥឡូវនេះ (Claim Coins)');
                }}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400 text-left text-[11px]"
              >
                <p className="font-bold text-white">🎁 កាក់ Free (Daily Coins)</p>
                <p className="text-[9px] text-gray-400 truncate">រំលឹក Check-in</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBroadcastTitle('👑 កញ្ចប់ VIP បញ្ចុះតម្លៃពិសេស (VIP Sale)!');
                  setBroadcastMessageText('ដោះសោរឿងភាគទាំងអស់ដោយសេរី គ្មានពាណិជ្ជកម្ម និងទស្សនារលូន Full HD ជាមួយតម្លៃពិសេសត្រឹមតែ $2.50 ប៉ុណ្ណោះ!');
                  setBroadcastButtonText('👑 ជាវ VIP ឥឡូវនេះ (Get VIP)');
                }}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400 text-left text-[11px]"
              >
                <p className="font-bold text-white">👑 ប្រូម៉ូសិន VIP</p>
                <p className="text-[9px] text-gray-400 truncate">ផ្សាយកញ្ចប់សមាជិក</p>
              </button>
            </div>
          </div>

          {/* Link to Drama & Episode */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-300">ភ្ជាប់ជាមួយរឿង (Link to Drama - Optional)</label>
              <select
                value={broadcastDramaId}
                onChange={(e) => setBroadcastDramaId(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500"
              >
                <option value="" className="bg-gray-900">-- មិនភ្ជាប់រឿងជាក់លាក់ (Open App Home) --</option>
                {dramas.map((d) => (
                  <option key={d.id} value={d.id} className="bg-gray-900">
                    {d.titleKm ? `${d.titleKm} (${d.title})` : d.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300">លេខភាគ (Episode # - Optional)</label>
              <input
                type="number"
                min={1}
                value={broadcastEpNum}
                onChange={(e) => setBroadcastEpNum(e.target.value)}
                placeholder="ឧ. 1, 2, 10..."
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Title & Message */}
          <div>
            <label className="text-[11px] font-bold text-gray-300">ចំណងជើងដំណឹង (Broadcast Heading / Title)</label>
            <input
              type="text"
              required
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="🎬 ដំណឹងរឿងភាគថ្មី!..."
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">ខ្លឹមសារសារ (Message Content)</label>
            <textarea
              rows={4}
              required
              value={broadcastMessageText}
              onChange={(e) => setBroadcastMessageText(e.target.value)}
              placeholder="សរសេរខ្លឹមសារដំណឹងទៅកាន់ Telegram subscribers..."
              className="w-full mt-1 p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">អក្សរលើប៊ូតុង WebApp (Inline Button Text)</label>
            <input
              type="text"
              value={broadcastButtonText}
              onChange={(e) => setBroadcastButtonText(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 font-bold"
            />
          </div>

          {/* Live Telegram Message Preview Card */}
          <div className="p-3.5 rounded-2xl bg-[#1e2337] border border-blue-500/20 space-y-2">
            <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">
              👀 គំរូសារលើ Telegram (Live Telegram Preview):
            </span>
            <div className="p-3 rounded-xl bg-[#171b2b] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                <img src="/logo.png" alt="Bot" className="w-5 h-5 rounded-full object-cover" />
                <span className="text-xs font-bold text-white">SiengStudio Bot</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-400 font-bold">BOT</span>
              </div>
              <p className="text-xs font-bold text-white">
                📢 {broadcastTitle || 'ចំណងជើងដំណឹង'}
              </p>
              <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                {broadcastMessageText || 'ខ្លឹមសារសារនឹងបង្ហាញនៅត្រង់នេះ...'}
              </p>
              <div className="pt-2">
                <div className="w-full py-2 rounded-xl bg-[#2b5278] text-white text-xs font-bold text-center shadow-md">
                  {broadcastButtonText || '🎬 ទស្សនាឥឡូវនេះ (Watch Now)'}
                </div>
              </div>
            </div>
          </div>

          {/* Broadcast Results Card */}
          {broadcastResult && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
              <p className="font-bold">✅ បានផ្សាយដំណឹងរួចរាល់ (Broadcast Summary):</p>
              <p className="font-mono text-[11px]">
                • បានផ្ញើជោគជ័យ: <b>{broadcastResult.sentCount}</b> នាក់<br />
                • មិនបានជោគជ័យ: {broadcastResult.failedCount} (អ្នក block bot)<br />
                • Channel Status: {broadcastResult.channelSent ? '✅ ផ្ញើទៅ Channel រួចរាល់' : 'មិនបានផ្ញើ'}
              </p>
            </div>
          )}

          {/* Submit Broadcast Button */}
          <button
            type="submit"
            disabled={isBroadcasting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white font-black text-xs shadow-lg shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isBroadcasting ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>កំពុងផ្សាយដំណឹងទៅកាន់ Telegram...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>📢 ផ្សាយដំណឹងទៅកាន់ Telegram ទាំងអស់ (Send Broadcast Now)</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ================= TAB: CLOUDFLARE R2 DIRECT VIDEO UPLOADER ================= */}
      {activeTab === 'upload' && (
        <div className="mt-4 space-y-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-indigo-950/70 border border-indigo-500/30 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center border border-indigo-500/30 shrink-0">
                <CloudUpload size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white">Upload វីដេអូទៅកាន់ Cloudflare R2 (Direct Browser Upload)</h3>
                <p className="text-[10px] text-gray-300 mt-0.5">អូសទម្លាក់ (Drag & Drop) វីដេអូ .mp4 ពីកុំព្យូទ័រឡើងទៅកាន់ R2 ដោយមិនបាច់ចូល Dashboard</p>
              </div>
            </div>
          </div>

          {/* Target Drama Selector */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <label className="text-[11px] font-bold text-gray-300">ជ្រើសរើសរឿងគោលដៅ (Target Drama Series)</label>
            <select
              value={selectedDramaId}
              onChange={(e) => handleDramaChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-white/10 text-white text-xs outline-none focus:border-indigo-500 font-bold"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.titleKm ? `${d.titleKm} (${d.title})` : d.title} ({d.episodes?.length || 0} ភាគ)
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => handleVideoDrop(e, 'newEpisode')}
            onClick={() => videoDropInputRef.current?.click()}
            className={`p-8 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-indigo-400 bg-indigo-500/20 scale-[1.01]'
                : 'border-white/15 bg-white/5 hover:border-indigo-500/50 hover:bg-white/10'
            }`}
          >
            <input
              type="file"
              ref={videoDropInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleVideoFileUpload(e.target.files[0], 'newEpisode');
                }
              }}
              accept="video/mp4,video/x-m4v,video/*"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-500/30">
              <CloudUpload size={28} className={isUploadingVideo ? 'animate-bounce' : ''} />
            </div>
            <h4 className="text-sm font-black text-white">
              អូសទម្លាក់ (Drag & Drop) វីដេអូ ឬចុចទីនេះដើម្បីជ្រើសរើស
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              គាំទ្រឯកសារ .mp4, .mov, .m4v (ទំហំរហូតដល់ 500 MB ក្នុង ១ ភាគ)
            </p>
            <p className="text-[10px] text-indigo-400 font-mono mt-2">
              ⚡ ប្រព័ន្ធនឹង Upload ផ្ទាល់ទៅកាន់ Presigned R2 URL ឬ High-Speed Stream
            </p>
          </div>

          {/* Upload Progress Bar */}
          {isUploadingVideo && (
            <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-indigo-400" />
                  <span>កំពុង Upload វីដេអូទៅកាន់ Cloudflare R2...</span>
                </span>
                <span className="font-mono text-indigo-300">{videoUploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 shadow-lg"
                  style={{ width: `${videoUploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Success Card */}
          {uploadedVideoInfo && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <CheckCircle size={16} />
                <span>Upload វីដេអូជោគជ័យ! (Upload Complete)</span>
                <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                  {uploadedVideoInfo.storage === 'cloudflare_r2' ? 'Cloudflare R2' : 'Local Static'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-gray-300 truncate">{uploadedVideoInfo.url}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(uploadedVideoInfo.url);
                    haptic.light();
                    showMsg('success', 'បានចម្លង Video URL រួចរាល់! (Copied!)');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0"
                >
                  <Clipboard size={12} />
                  <span>Copy</span>
                </button>
              </div>

              {/* Quick Action: Add as Episode Right Now */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setVideoPreviewUrl(uploadedVideoInfo.url);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1 active:scale-95"
                >
                  <Play size={13} />
                  <span>Play Preview</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const targetDramaId = selectedDramaId || selectedDrama?.id;
                    if (!targetDramaId) {
                      showMsg('error', 'សូមជ្រើសរើសរឿងជាមុន');
                      return;
                    }
                    const nextEpNum = (selectedDrama?.episodes?.length || 0) + 1;
                    const res = await api.addEpisode(
                      targetDramaId,
                      {
                        episodeNumber: nextEpNum,
                        title: `Episode ${nextEpNum}`,
                        videoUrl: uploadedVideoInfo.url,
                        coinPrice: nextEpNum <= 10 ? 0 : 20,
                        isFree: nextEpNum <= 10
                      },
                      activePin
                    );
                    if (res && res.success) {
                      haptic.success();
                      showMsg('success', `បានបន្ថែមភាគទី ${nextEpNum} ទៅកាន់រឿងដោយស្វ័យប្រវត្តិ!`);
                      setSelectedDramaId(targetDramaId);
                      await loadData();
                      setActiveTabLocal('manage');
                    }
                  }}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-1 active:scale-95"
                >
                  <Plus size={14} />
                  <span>+ បន្ថែមជាភាគទី {(selectedDrama?.episodes?.length || 0) + 1} ភ្លាមៗ (+ Auto Add Episode)</span>
                </button>
              </div>
            </div>
          )}
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
                  type="text"
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

      {/* ================= TAB: BAKONG KHQR MANAGEMENT & DIAGNOSTICS ================= */}
      {activeTab === 'bakong' && (
        <div className="mt-4 space-y-4">
          {/* Header Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/60 via-red-900/40 to-black border border-rose-500/30 flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/30 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
              <span className="font-black text-sm">KH</span>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">ប្រព័ន្ធគ្រប់គ្រង និងផ្ទៀងផ្ទាត់ Bakong KHQR (Diagnostics)</h3>
              <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                ដោះស្រាយបញ្ហា "លេខគណនីមិនត្រឹមត្រូវ" ដោយផ្ទៀងផ្ទាត់គណនីរបស់អ្នកផ្ទាល់ជាមួយប្រព័ន្ធកណ្តាលរបស់ធនាគារជាតិនៃកម្ពុជា (NBC Bakong Switch)។
              </p>
            </div>
          </div>

          {/* Section 1: Server Config Status */}
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>⚙️</span>
                <span>ការកំណត់បច្ចុប្បន្នលើ Render Server:</span>
              </h4>
              <button
                onClick={loadBakongConfig}
                className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw size={11} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-gray-400 block">BAKONG_ACCOUNT_ID:</span>
                <span className="font-mono font-bold text-amber-300 break-all">
                  {bakongConfig?.accountId || 'chan_soksieng@bkrt'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-gray-400 block">MERCHANT_NAME:</span>
                <span className="font-bold text-white">
                  {bakongConfig?.merchantName || 'SOKSIENG CHAN'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-gray-400 block">BAKONG_API_TOKEN:</span>
                <span className={bakongConfig?.hasApiToken ? 'text-emerald-400 font-bold' : 'text-amber-400 font-medium'}>
                  {bakongConfig?.hasApiToken ? '✅ បានកំណត់ (Active)' : '⚠️ មិនទាន់កំណត់ (Manual Mode)'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-gray-400 block">MERCHANT_CITY:</span>
                <span className="text-gray-200">{bakongConfig?.merchantCity || 'Phnom Penh'}</span>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={handleVerifyServerBakong}
                disabled={bakongVerifyLoading}
                className="w-full py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {bakongVerifyLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>កំពុងសាកល្បងភ្ជាប់ទៅ NBC Bakong Switch...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>🔍 ផ្ទៀងផ្ទាត់គណនីបច្ចុប្បន្នជាមួយ NBC Bakong (Live Test)</span>
                  </>
                )}
              </button>

              {bakongVerifyResult && (
                <div
                  className={`mt-2.5 p-3 rounded-xl text-xs flex items-start gap-2 ${
                    bakongVerifyResult.exists
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {bakongVerifyResult.exists ? (
                    <CheckCircle size={16} className="shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">
                      {bakongVerifyResult.exists
                        ? 'គណនីត្រឹមត្រូវ និងដំណើរការលើប្រព័ន្ធ Bakong! ✅'
                        : 'លេខគណនីមិនត្រឹមត្រូវ ឬរកមិនឃើញលើប្រព័ន្ធ Bakong ❌'}
                    </p>
                    <p className="text-[11px] mt-0.5 text-gray-300 leading-relaxed">
                      {bakongVerifyResult.exists
                        ? 'គណនីនេះអាចទទួលការផ្ទេរប្រាក់ពីគ្រប់ធនាគារក្នុងស្រុកទាំងអស់ដោយគ្មានបញ្ហា។'
                        : `មូលហេតុ៖ ${bakongVerifyResult.message}។ (ប្រសិនបើសាកល្បង scan QR ហើយធនាគារបង្ហាញ "លេខគណនីមិនត្រឹមត្រូវ" គឺដោយសារ Bakong ID នេះមិនទាន់ត្រឹមត្រូវ ឬមិនទាន់បាន Activate ក្នុង Mobile Banking)។`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: KHQR String Decoder */}
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>📷</span>
              <span>ដកស្រង់ Bakong ID ពី KHQR ពិតប្រាកដ (KHQR Decoder):</span>
            </h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              បើក App ធនាគាររបស់អ្នក (ACLEDA / ABA / Wing) -&gt; ចូលទៅកាន់ "KHQR" ឬ "ទទួលប្រាក់" -&gt; Scan ឬ Copy អក្សរកូដ KHQR (ចាប់ផ្តើមដោយ <code>000201...</code>) មកបិទភ្ជាប់ទីនេះ៖
            </p>

            <textarea
              value={khqrDecodeText}
              onChange={(e) => setKhqrDecodeText(e.target.value)}
              placeholder="00020101021229..."
              rows={3}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-[11px] outline-none focus:border-rose-500 break-all"
            />

            <button
              onClick={handleDecodeKhqrString}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Sparkles size={14} />
              <span>បកស្រាយកូដ KHQR (Decode Payload)</span>
            </button>

            {khqrDecodeResult && (
              <div className="mt-2.5 p-3 rounded-xl bg-black/60 border border-white/15 space-y-2 text-xs">
                {khqrDecodeResult.success ? (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-gray-400">Bakong Account ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-300">
                          {khqrDecodeResult.bakongAccountID}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(khqrDecodeResult.bakongAccountID);
                            setCopiedId(true);
                            haptic.success();
                            setTimeout(() => setCopiedId(false), 2000);
                          }}
                          className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold"
                        >
                          {copiedId ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-gray-400">ឈ្មោះម្ចាស់គណនី:</span>
                      <span className="font-bold text-white">{khqrDecodeResult.merchantName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">រូបិយប័ណ្ណ (Currency):</span>
                      <span className="font-bold text-emerald-400">{khqrDecodeResult.currency}</span>
                    </div>
                    <p className="text-[10px] text-emerald-300/90 pt-1">
                      💡 យក Bakong Account ID ខាងលើទៅដាក់ក្នុង Render Environment Variables: <code>BAKONG_ACCOUNT_ID</code>
                    </p>
                  </>
                ) : (
                  <p className="text-rose-400">{khqrDecodeResult.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Live Account Tester */}
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>🧪</span>
              <span>សាកល្បង Bakong ID ផ្សេងទៀត (Live NBC Checker):</span>
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={testBakongId}
                onChange={(e) => setTestBakongId(e.target.value)}
                placeholder="ឧ. 001234567@abaa ឬ 0885688848@aclb"
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs outline-none focus:border-rose-500"
              />
              <button
                onClick={handleTestCustomBakongId}
                disabled={testBakongLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shrink-0 active:scale-95"
              >
                {testBakongLoading ? <Loader2 size={14} className="animate-spin" /> : 'ពិនិត្យ (Test)'}
              </button>
            </div>

            {testBakongResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testBakongResult.exists
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                }`}
              >
                {testBakongResult.exists ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                <span>{testBakongResult.message}</span>
              </div>
            )}
          </div>

          {/* Section 4: Manual Payment Approval Tool (Admin Only) */}
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>🛡️</span>
              <span>អនុម័តការបង់ប្រាក់ដោយផ្ទាល់ (Manual Approval with Admin PIN):</span>
            </h4>
            <p className="text-[11px] text-gray-400">
              ក្នុងករណីអតិថិជនបានផ្ទេរប្រាក់ដោយជោគជ័យតាមធនាគារ ហើយបានផ្ញើស្លីប (Receipt) មកកាន់ Telegram អ្នកអាចបញ្ចូល <code>md5</code> នៃវិក្កយបត្រដើម្បីអនុម័តបញ្ចូលកាក់ជូនភ្លាមៗ៖
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={manualMd5}
                onChange={(e) => setManualMd5(e.target.value)}
                placeholder="md5 hash (ឧ. 4c3a2f1e...)"
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleManualApprovePayment}
                disabled={manualApproveLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shrink-0 active:scale-95 flex items-center gap-1"
              >
                {manualApproveLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Approve & Credit</span>
              </button>
            </div>

            {manualApproveResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  manualApproveResult.paid
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                }`}
              >
                {manualApproveResult.paid ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                <span>
                  {manualApproveResult.paid
                    ? `✓ បានអនុម័ត និងបញ្ចូលកាក់ (${manualApproveResult.addedCoins || ''} កាក់) ដោយជោគជ័យ!`
                    : manualApproveResult.message}
                </span>
              </div>
            )}
          </div>

          {/* Section 5: Recent Transactions & Live Status */}
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>📋</span>
                <span>ប្រវត្តិប្រតិបត្តិការ KHQR ថ្មីៗ ({adminPayments.length}):</span>
              </h4>
              <button
                onClick={loadAdminPayments}
                disabled={loadingPayments}
                className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5"
              >
                <RefreshCw size={11} className={loadingPayments ? 'animate-spin' : ''} />
                <span>Refresh List</span>
              </button>
            </div>

            {adminPayments.length === 0 ? (
              <p className="text-xs text-gray-500 py-3 text-center">មិនទាន់មានប្រតិបត្តិការក្នុងប្រព័ន្ធនៅឡើយទេ</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {adminPayments.map((p) => (
                  <div
                    key={p.md5}
                    className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-300">#{p.billNumber || p.md5.slice(0, 8)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          p.isProcessed || p.isPaid
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {p.isProcessed ? '✅ COMPLETED' : p.isPaid ? '✓ PAID' : '⏳ PENDING'}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase">{p.type === 'coins' ? 'Coins' : 'VIP'}</span>
                      </div>
                      <p className="text-[11px] text-gray-300 mt-1">
                        User: <code className="text-amber-200">{p.telegramId}</code> • ចំនួន: <strong className="text-white">{p.currency === 'USD' ? `$${p.amount}` : `${p.amount?.toLocaleString()} ៛`}</strong>
                      </p>
                      <p className="text-[10px] font-mono text-gray-500 break-all mt-0.5">MD5: {p.md5}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAdminVerifyPayment(p.md5, p)}
                        disabled={checkingPaymentMd5 === p.md5}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/60 border border-rose-500/40 text-rose-200 font-bold text-[11px] flex items-center gap-1"
                      >
                        {checkingPaymentMd5 === p.md5 ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        <span>ពិនិត្យ NBC Live</span>
                      </button>

                      {!p.isProcessed && (
                        <button
                          onClick={async () => {
                            setManualMd5(p.md5);
                            const res = await api.approveManualPayment(p.md5, activePin);
                            setManualApproveResult(res);
                            if (res && res.paid) {
                              haptic.success();
                              loadAdminPayments();
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1"
                        >
                          <Check size={12} />
                          <span>Approve</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              onChange={(e) => handleDramaChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-gray-900 border border-white/10 text-white text-xs outline-none focus:border-emerald-500 font-bold"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id} className="bg-gray-900">
                  {d.titleKm ? `${d.titleKm} (${d.title})` : d.title} — {d.episodes?.length || 0} ភាគបច្ចុប្បន្ន
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
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed space-y-1">
            <p className="font-bold text-white">⚡ របៀបប្រើប្រាស់ Batch URL Pattern ស្វ័យប្រវត្តិ៖</p>
            <p>• <code>{`{n}`}</code> ៖ សម្រាប់លេខធម្មតា (1, 2, 3... 10... 100...)</p>
            <p>• <code>{`{nn}`}</code> ៖ សម្រាប់លេខ 2 ខ្ទង់ (01, 02... 99, 100...) (ភាគ 100 ឡើងនៅតែ 100 ធម្មតា)</p>
            <p>• <code>{`{nnn}`}</code> ៖ សម្រាប់រឿងជាងរយភាគលេខ 3 ខ្ទង់ (001, 002... 010... 099, 100, 101...)</p>
            <p>• <code>{`{nnnn}`}</code> ៖ សម្រាប់រឿងលេខ 4 ខ្ទង់ (0001, 0002... 0100...)</p>
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
              onChange={(e) => handleDramaChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-gray-900 border border-white/10 text-white text-xs outline-none focus:border-rose-500 font-bold"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id} className="bg-gray-900">
                  {d.titleKm ? `${d.titleKm} (${d.title})` : d.title} — {d.episodes?.length || 0} ភាគបច្ចុប្បន្ន
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">
              Video URL Pattern (ប្រើ <code>{`{n}`}</code>, <code>{`{nn}`}</code>, ឬ <code>{`{nnn}`}</code> សម្រាប់រឿងជាងរយភាគ)
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
                .replace(/\{nnnn\}/g, String(batchData.startEp).padStart(4, '0'))
                .replace(/\{nnn\}/g, String(batchData.startEp).padStart(3, '0'))
                .replace(/\{nn\}/g, String(batchData.startEp).padStart(2, '0'))
                .replace(/\{n\}/g, String(batchData.startEp))}
            </p>
            <p className="font-mono truncate">
              Ep {batchData.totalEp}:{' '}
              {batchData.urlPattern
                .replace(/\{nnnn\}/g, String(batchData.totalEp).padStart(4, '0'))
                .replace(/\{nnn\}/g, String(batchData.totalEp).padStart(3, '0'))
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
              onChange={(e) => handleDramaChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-gray-900 border border-white/10 text-white text-xs outline-none focus:border-purple-500 font-bold"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id} className="bg-gray-900">
                  {d.titleKm ? `${d.titleKm} (${d.title})` : d.title} — {d.episodes?.length || 0} ភាគ
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
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-300">Video Stream URL</label>
              <button
                type="button"
                onClick={() => singleEpDropInputRef.current?.click()}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
              >
                <CloudUpload size={12} />
                <span>Upload វីដេអូទៅ R2</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={newEpisode.videoUrl}
              onChange={(e) => setNewEpisode({ ...newEpisode, videoUrl: e.target.value })}
              placeholder="https://pub-xxxx.r2.dev/Drama/EP01 - Episode 1.mp4"
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500 font-mono"
            />

            {/* Inline Mini Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => handleVideoDrop(e, 'newEpisode')}
              onClick={() => singleEpDropInputRef.current?.click()}
              className={`mt-2 p-3 rounded-xl border border-dashed text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-indigo-400 bg-indigo-500/20'
                  : 'border-white/10 bg-white/5 hover:border-indigo-500/40 hover:bg-white/10'
              }`}
            >
              <input
                type="file"
                ref={singleEpDropInputRef}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleVideoFileUpload(e.target.files[0], 'newEpisode');
                  }
                }}
                accept="video/mp4,video/x-m4v,video/*"
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 text-xs">
                <CloudUpload size={16} className="text-indigo-400" />
                <span className="text-gray-300 font-semibold text-[11px]">
                  ឬអូសទម្លាក់ (Drag & Drop) វីដេអូពីកុំព្យូទ័រដើម្បី Upload ទៅ R2 ស្វ័យប្រវត្តិ
                </span>
              </div>
            </div>

            {/* Inline Upload Progress */}
            {isUploadingVideo && (
              <div className="mt-2 p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-indigo-300 font-bold">
                  <span className="flex items-center gap-1">
                    <RefreshCw size={11} className="animate-spin text-indigo-400" />
                    <span>កំពុង Upload ទៅកាន់ Cloudflare R2...</span>
                  </span>
                  <span>{videoUploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-pink-500"
                    style={{ width: `${videoUploadProgress}%` }}
                  />
                </div>
              </div>
            )}
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

          {/* Auto Broadcast Checkbox */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <input
              type="checkbox"
              id="autoBroadcastEp"
              checked={autoBroadcastEp}
              onChange={(e) => setAutoBroadcastEp(e.target.checked)}
              className="rounded text-blue-500"
            />
            <label htmlFor="autoBroadcastEp" className="text-xs text-blue-300 font-bold flex items-center gap-1 cursor-pointer">
              <Send size={13} />
              <span>📢 ផ្សាយដំណឹងភាគថ្មីនេះទៅ Telegram ភ្លាមៗ (Auto-Broadcast)</span>
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
              type="text"
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
              type="text"
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

          {/* Auto Broadcast Checkbox */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <input
              type="checkbox"
              id="autoBroadcastDrama"
              checked={autoBroadcastDrama}
              onChange={(e) => setAutoBroadcastDrama(e.target.checked)}
              className="rounded text-blue-500"
            />
            <label htmlFor="autoBroadcastDrama" className="text-xs text-blue-300 font-bold flex items-center gap-1 cursor-pointer">
              <Send size={13} />
              <span>📢 ផ្សាយដំណឹងរឿងថ្មីនេះទៅ Telegram ភ្លាមៗ (Auto-Broadcast)</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-lg active:scale-95"
          >
            រក្សាទុករឿងថ្មី (Save Drama Series)
          </button>
        </form>
      )}

      {/* ================= TAB: EDIT DRAMA ================= */}
      {activeTab === 'editDrama' && editingDrama && (
        <form onSubmit={handleUpdateDrama} className="mt-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-sm font-extrabold text-blue-400 flex items-center gap-1.5">
              <Edit3 size={16} /> កែសម្រួលព័ត៌មានរឿង (Edit Drama Details)
            </h3>
            <button
              type="button"
              onClick={() => setActiveTabLocal('manage')}
              className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 hover:text-white text-xs"
            >
              ត្រឡប់ក្រោយ (Back)
            </button>
          </div>

          {/* Quick Drama Switcher within Edit Tab */}
          <div>
            <label className="text-[11px] font-bold text-gray-300">ជ្រើសរើសរឿងដែលត្រូវកែសម្រួល (Select Drama to Edit)</label>
            <select
              value={editingDrama.id}
              onChange={(e) => {
                const target = dramas.find((d) => d.id === e.target.value);
                if (target) {
                  handleDramaChange(target.id);
                  startEditingDrama(target);
                }
              }}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-gray-900 border border-white/10 text-white text-xs outline-none focus:border-blue-500 font-bold"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.titleKm ? `${d.titleKm} (${d.title})` : d.title} ({d.episodes?.length || 0} ភាគ)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Title (English ចំណងជើងអង់គ្លេស)</label>
            <input
              type="text"
              required
              value={editingDrama.title}
              onChange={(e) => setEditingDrama({ ...editingDrama, title: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Title (Khmer ចំណងជើងខ្មែរ)</label>
            <input
              type="text"
              required
              value={editingDrama.titleKm}
              onChange={(e) => setEditingDrama({ ...editingDrama, titleKm: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Poster Image URL (Vertical 3:4)</label>
            <input
              type="text"
              required
              value={editingDrama.posterUrl}
              onChange={(e) => setEditingDrama({ ...editingDrama, posterUrl: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Banner Backdrop Image URL (16:9)</label>
            <input
              type="text"
              value={editingDrama.bannerUrl}
              onChange={(e) => setEditingDrama({ ...editingDrama, bannerUrl: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-300">Description (Khmer សេចក្តីសង្ខេប)</label>
            <textarea
              rows={3}
              value={editingDrama.descriptionKm}
              onChange={(e) => setEditingDrama({ ...editingDrama, descriptionKm: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-300">Genres (Comma separated)</label>
              <input
                type="text"
                value={editingDrama.genres}
                onChange={(e) => setEditingDrama({ ...editingDrama, genres: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-300">Rating (ពិន្ទុ)</label>
              <input
                type="text"
                value={editingDrama.rating}
                onChange={(e) => setEditingDrama({ ...editingDrama, rating: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editingDrama.isVipOnly}
                onChange={(e) => setEditingDrama({ ...editingDrama, isVipOnly: e.target.checked })}
                className="rounded text-purple-600"
              />
              <span>រឿងសម្រាប់តែ VIP? (VIP Only)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editingDrama.isFeatured}
                onChange={(e) => setEditingDrama({ ...editingDrama, isFeatured: e.target.checked })}
                className="rounded text-purple-600"
              />
              <span>ដាក់លើផ្ទាំង Banner មុខ? (Featured)</span>
            </label>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
            ℹ️ ចំនួនភាគបច្ចុប្បន្ន: <b>{editingDrama.episodes?.length || 0} ភាគ</b> (ប្រព័ន្ធនឹងចងចាំ និងរក្សាទុកស្វ័យប្រវត្តិ)
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs shadow-lg active:scale-95 transition-transform"
            >
              💾 រក្សាទុក និងចងចាំការកែសម្រួល (Save Changes)
            </button>
            <button
              type="button"
              onClick={() => handleDeleteDrama(editingDrama.id, editingDrama.titleKm || editingDrama.title)}
              className="py-3 px-4 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 font-bold text-xs active:scale-95 flex items-center gap-1.5"
              title="លុបរឿងនេះចោលទាំងស្រុង"
            >
              <Trash2 size={14} /> 🗑️ លុបរឿងនេះចោល
            </button>
            <button
              type="button"
              onClick={() => setActiveTabLocal('manage')}
              className="py-3 px-4 rounded-xl bg-white/10 text-gray-300 font-bold text-xs active:scale-95"
            >
              បោះបង់
            </button>
          </div>
        </form>
      )}

      {/* Fallback Selector if activeTab === 'editDrama' and editingDrama is null */}
      {activeTab === 'editDrama' && !editingDrama && (
        <div className="mt-4 p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
            <Edit3 size={24} />
          </div>
          <h4 className="text-sm font-bold text-white">សូមជ្រើសរើសរឿងដែលអ្នកចង់កែសម្រួល (Select Drama to Edit)</h4>
          <p className="text-xs text-gray-400">ជ្រើសរើសរឿងភាគណាមួយខាងក្រោមដើម្បីកែប្រែចំណងជើង រូបភាព ឬព័ត៌មានផ្សេងៗ៖</p>
          <div className="max-w-md mx-auto pt-2">
            <select
              value={selectedDramaId}
              onChange={(e) => {
                const drama = dramas.find((d) => d.id === e.target.value);
                if (drama) {
                  handleDramaChange(drama.id);
                  startEditingDrama(drama);
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-white text-xs font-bold outline-none focus:border-blue-500"
            >
              <option value="">-- ចុចទីនេះដើម្បីជ្រើសរើសរឿង --</option>
              {dramas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.titleKm ? `${d.titleKm} (${d.title})` : d.title} ({d.episodes?.length || 0} ភាគ)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ================= MODAL: IN-APP DELETE CONFIRMATION ================= */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm bg-[#151624] border border-red-500/40 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center relative">
            <button
              type="button"
              disabled={deleteDialog.isProcessing}
              onClick={() => setDeleteDialog({ isOpen: false, type: null, dramaId: null, episodeId: null, title: '', epNumber: null, isProcessing: false })}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-3 border border-red-500/30 shadow-lg shadow-red-950/50">
              <Trash2 size={26} />
            </div>

            <h3 className="text-base font-black text-white">
              {deleteDialog.type === 'drama'
                ? 'បញ្ជាក់ការលុបរឿងនេះចោល'
                : deleteDialog.type === 'episode'
                ? `បញ្ជាក់ការលុបភាគ ${deleteDialog.epNumber}`
                : 'បញ្ជាក់ការលុបគ្រប់ភាគទាំងអស់'}
            </h3>

            <div className="text-xs text-gray-300 mt-2 leading-relaxed px-2">
              {deleteDialog.type === 'drama' && (
                <p>
                  តើអ្នកពិតជាចង់លុបរឿង <strong className="text-white">"{deleteDialog.title}"</strong> និងគ្រប់ភាគទាំងអស់ចេញពីប្រព័ន្ធមែនទេ? <br />
                  <span className="text-[11px] text-rose-400 font-semibold">⚠️ សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយវិញបានឡើយ។</span>
                </p>
              )}
              {deleteDialog.type === 'episode' && (
                <p>
                  តើអ្នកពិតជាចង់លុប <strong className="text-white">ភាគទី {deleteDialog.epNumber}</strong> នេះចេញពីរឿងមែនទេ?
                </p>
              )}
              {deleteDialog.type === 'allEpisodes' && (
                <p>
                  តើអ្នកពិតជាចង់លុប <strong className="text-white">គ្រប់ភាគទាំងអស់</strong> នៃរឿង <strong className="text-white">"{deleteDialog.title}"</strong> មែនទេ?
                </p>
              )}
            </div>

            <div className="flex gap-2.5 w-full mt-5">
              <button
                type="button"
                disabled={deleteDialog.isProcessing}
                onClick={() => setDeleteDialog({ isOpen: false, type: null, dramaId: null, episodeId: null, title: '', epNumber: null, isProcessing: false })}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-bold active:scale-95 transition-all"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                disabled={deleteDialog.isProcessing}
                onClick={executeDeleteAction}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-black shadow-lg shadow-red-900/50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {deleteDialog.isProcessing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>{deleteDialog.isProcessing ? 'កំពុងលុប...' : 'លុបចោលភ្លាម'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

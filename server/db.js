import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialDramas } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Database {
  constructor() {
    this.data = {
      dramas: [],
      users: {},
      payments: {}
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.dramas || this.data.dramas.length === 0) {
          this.data.dramas = initialDramas;
        }
      } catch (err) {
        console.error('Failed to parse db.json, re-initializing with seed data:', err);
        this.data = { dramas: initialDramas, users: {}, payments: {} };
      }
    } else {
      this.data = {
        dramas: initialDramas,
        users: {},
        payments: {}
      };
    }

    if (!this.data.payments) {
      this.data.payments = {};
    }

    // Always ensure every drama has updated totalEpisodes matching episodes.length
    if (Array.isArray(this.data.dramas)) {
      for (const d of this.data.dramas) {
        d.episodes = d.episodes || [];
        d.totalEpisodes = d.episodes.length;
      }
    }
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db.json:', err);
    }
  }

  // --- Dramas ---
  getDramas() {
    if (Array.isArray(this.data.dramas)) {
      for (const d of this.data.dramas) {
        d.episodes = d.episodes || [];
        d.totalEpisodes = d.episodes.length;
      }
    }
    return this.data.dramas;
  }

  getDramaById(id) {
    const drama = this.data.dramas.find((d) => d.id === id);
    if (drama) {
      drama.episodes = drama.episodes || [];
      drama.totalEpisodes = drama.episodes.length;
    }
    return drama;
  }

  createDrama(drama) {
    const id = `drama-${Date.now()}`;
    const episodes = drama.episodes || [];
    const newDrama = {
      id,
      ...drama,
      views: drama.views || '1.2K',
      viewsNum: drama.viewsNum || 1200,
      likes: drama.likes || 120,
      episodes,
      totalEpisodes: episodes.length
    };
    this.data.dramas.unshift(newDrama);
    this.save();
    return newDrama;
  }

  updateDrama(dramaId, dramaData) {
    const index = this.data.dramas.findIndex((d) => d.id === dramaId);
    if (index === -1) return null;
    const existing = this.data.dramas[index];
    const episodes = Array.isArray(dramaData.episodes) ? dramaData.episodes : (existing.episodes || []);
    const updated = {
      ...existing,
      ...dramaData,
      episodes,
      totalEpisodes: episodes.length
    };
    this.data.dramas[index] = updated;
    this.save();
    return updated;
  }

  addEpisode(dramaId, episodeData) {
    const drama = this.getDramaById(dramaId);
    if (!drama) return null;
    drama.episodes = drama.episodes || [];
    const epNum = Number(episodeData.episodeNumber) || (drama.episodes.length + 1);
    const epId = drama.episodes.length > 0 ? Math.max(...drama.episodes.map((e) => e.id)) + 1 : 1;
    const newEp = {
      id: epId,
      ...episodeData,
      episodeNumber: epNum
    };
    drama.episodes.push(newEp);
    drama.totalEpisodes = drama.episodes.length;
    this.save();
    return newEp;
  }

  addEpisodesBatch(dramaId, episodesList) {
    const drama = this.getDramaById(dramaId);
    if (!drama) return null;
    drama.episodes = drama.episodes || [];
    for (const ep of episodesList) {
      const epId = drama.episodes.length > 0 ? Math.max(...drama.episodes.map((e) => e.id)) + 1 : 1;
      drama.episodes.push({
        id: epId,
        ...ep
      });
    }
    drama.totalEpisodes = drama.episodes.length;
    this.save();
    return drama.episodes;
  }

  setEpisodes(dramaId, episodes) {
    const drama = this.getDramaById(dramaId);
    if (!drama) return null;
    drama.episodes = episodes || [];
    drama.totalEpisodes = drama.episodes.length;
    this.save();
    return drama.episodes;
  }

  deleteEpisode(dramaId, episodeId) {
    const drama = this.getDramaById(dramaId);
    if (!drama) return null;
    const targetId = Number(episodeId);
    drama.episodes = (drama.episodes || []).filter(
      (e) => e.id !== targetId && e.episodeNumber !== targetId
    );
    drama.totalEpisodes = drama.episodes.length;
    this.save();
    return drama.episodes;
  }

  deleteAllEpisodes(dramaId) {
    const drama = this.getDramaById(dramaId);
    if (!drama) return null;
    drama.episodes = [];
    drama.totalEpisodes = 0;
    this.save();
    return [];
  }

  updateEpisode(dramaId, episodeId, episodeData) {
    const drama = this.getDramaById(dramaId);
    if (!drama) return null;
    const targetId = Number(episodeId);
    const index = (drama.episodes || []).findIndex(
      (e) => e.id === targetId || e.episodeNumber === targetId
    );
    if (index === -1) return null;
    drama.episodes[index] = {
      ...drama.episodes[index],
      ...episodeData
    };
    drama.totalEpisodes = drama.episodes.length;
    this.save();
    return drama.episodes[index];
  }

  deleteDrama(dramaId) {
    const index = this.data.dramas.findIndex((d) => d.id === dramaId);
    if (index === -1) return false;
    this.data.dramas.splice(index, 1);
    this.save();
    return true;
  }

  importDatabase(dbJson) {
    if (dbJson && Array.isArray(dbJson.dramas)) {
      this.data.dramas = dbJson.dramas;
      if (dbJson.users) {
        this.data.users = { ...this.data.users, ...dbJson.users };
      }
      for (const d of this.data.dramas) {
        d.episodes = d.episodes || [];
        d.totalEpisodes = d.episodes.length;
      }
      this.save();
      return true;
    }
    return false;
  }

  // --- Users ---
  getUser(telegramId) {
    const id = String(telegramId);
    if (!this.data.users[id]) {
      this.data.users[id] = {
        telegramId: id,
        coins: 150, // Initial welcome bonus
        isVip: false,
        vipExpiresAt: null,
        unlockedEpisodes: [],
        favorites: [],
        history: [],
        checkInStreak: 1,
        lastCheckInDate: null,
        referrals: [],
        referredBy: null,
        referralCoinsEarned: 0
      };
      this.save();
    }
    // Ensure referral fields exist for existing users
    const u = this.data.users[id];
    if (!Array.isArray(u.referrals)) u.referrals = [];
    if (u.referredBy === undefined) u.referredBy = null;
    if (u.referralCoinsEarned === undefined) u.referralCoinsEarned = 0;
    return u;
  }

  syncUser(userData, refParam = null) {
    const idStr = String(userData.id);
    const isNew = !this.data.users[idStr];
    const user = this.getUser(userData.id);
    user.firstName = userData.first_name || user.firstName;
    user.lastName = userData.last_name || user.lastName;
    user.username = userData.username || user.username;

    // Handle Referral logic
    if (refParam && isNew && !user.referredBy) {
      const cleanRefId = String(refParam).replace('ref_', '').trim();
      if (cleanRefId && cleanRefId !== idStr) {
        const referrer = this.getUser(cleanRefId);
        if (referrer) {
          user.referredBy = cleanRefId;
          // Award welcome bonus +30 coins to new user
          user.coins += 30;
          // Award referrer +50 coins
          referrer.coins += 50;
          referrer.referralCoinsEarned = (referrer.referralCoinsEarned || 0) + 50;
          referrer.referrals.unshift({
            telegramId: idStr,
            name: userData.first_name || 'Friend',
            date: new Date().toISOString()
          });
        }
      }
    }

    this.save();

    // Check if user checked in today
    const todayStr = new Date().toISOString().slice(0, 10);
    const hasCheckedInToday = user.lastCheckInDate === todayStr;

    return { ...user, hasCheckedInToday };
  }

  dailyCheckIn(telegramId) {
    const user = this.getUser(telegramId);
    const todayStr = new Date().toISOString().slice(0, 10);

    const streakRewards = [10, 15, 20, 25, 35, 50, 100];

    if (user.lastCheckInDate === todayStr) {
      return {
        success: false,
        message: 'Already checked in today',
        hasCheckedInToday: true,
        streak: user.checkInStreak,
        coins: user.coins,
        rewardsSchedule: streakRewards
      };
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (user.lastCheckInDate === yesterday) {
      user.checkInStreak = (user.checkInStreak % 7) + 1;
    } else {
      user.checkInStreak = 1;
    }

    let reward = streakRewards[user.checkInStreak - 1] || 15;

    // Lite VIP gets +30 bonus coins daily
    if (user.isVip && user.vipTier === 'lite') {
      reward += 30;
    }

    user.coins += reward;
    user.lastCheckInDate = todayStr;
    this.save();

    return {
      success: true,
      reward,
      streak: user.checkInStreak,
      coins: user.coins,
      hasCheckedInToday: true,
      rewardsSchedule: streakRewards,
      nextReward: streakRewards[user.checkInStreak % 7]
    };
  }

  unlockEpisode(telegramId, dramaId, episodeId) {
    const user = this.getUser(telegramId);
    const drama = this.getDramaById(dramaId);
    if (!drama) return { success: false, message: 'Drama not found' };

    const ep = drama.episodes?.find((e) => e.id === Number(episodeId));
    if (!ep) return { success: false, message: 'Episode not found' };

    let cost = ep.coinPrice || 20;
    // Lite VIP gets 20% discount on unlocking episodes
    if (user.isVip && user.vipTier === 'lite') {
      cost = Math.max(1, Math.round(cost * 0.8));
    }

    if (user.coins < cost) {
      return { success: false, message: 'Insufficient coins' };
    }

    user.coins -= cost;
    const key = `${dramaId}:${episodeId}`;
    if (!user.unlockedEpisodes.includes(key)) {
      user.unlockedEpisodes.push(key);
    }
    this.save();

    return { success: true, coins: user.coins, unlockedEpisodes: user.unlockedEpisodes };
  }

  toggleFavorite(telegramId, dramaId) {
    const user = this.getUser(telegramId);
    const drama = this.getDramaById(dramaId);
    if (!drama) return { success: false };

    const index = user.favorites.findIndex((f) => f.id === dramaId);
    if (index >= 0) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push(drama);
    }
    this.save();
    return { success: true, favorites: user.favorites };
  }

  updateHistory(telegramId, dramaId, episodeId, progressSec) {
    const user = this.getUser(telegramId);
    const existingIdx = user.history.findIndex((h) => h.dramaId === dramaId);
    const entry = { dramaId, episodeId, progressSec, updatedAt: new Date().toISOString() };
    if (existingIdx >= 0) {
      user.history[existingIdx] = entry;
    } else {
      user.history.unshift(entry);
    }

    // Increment drama view count
    const drama = this.data.dramas.find((d) => d.id === dramaId);
    if (drama) {
      drama.viewsNum = (drama.viewsNum || 1000) + 1;
      if (drama.viewsNum >= 1000000) {
        drama.views = (drama.viewsNum / 1000000).toFixed(1) + 'M';
      } else if (drama.viewsNum >= 1000) {
        drama.views = (drama.viewsNum / 1000).toFixed(1) + 'K';
      } else {
        drama.views = String(drama.viewsNum);
      }
    }

    this.save();
    return { success: true };
  }

  topUpCoins(telegramId, addedCoins) {
    const user = this.getUser(telegramId);
    user.coins += addedCoins;
    this.save();
    return { success: true, coins: user.coins };
  }

  upgradeVip(telegramId, tier = 'monthly') {
    const user = this.getUser(telegramId);
    user.isVip = true;
    user.vipTier = tier;
    const days = tier === 'weekly' ? 7 : 30;
    user.vipExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    this.save();
    return { success: true, isVip: true, vipTier: user.vipTier, vipExpiresAt: user.vipExpiresAt };
  }

  getAnalytics() {
    const dramas = this.getDramas();
    const users = Object.values(this.data.users || {});
    const todayStr = new Date().toISOString().slice(0, 10);

    const totalDramas = dramas.length;
    const totalEpisodes = dramas.reduce((acc, d) => acc + (d.episodes?.length || 0), 0);
    const totalViewsNum = dramas.reduce((acc, d) => acc + (Number(d.viewsNum) || 1200), 0);

    let formattedViews = '0';
    if (totalViewsNum >= 1000000) {
      formattedViews = (totalViewsNum / 1000000).toFixed(2) + 'M';
    } else if (totalViewsNum >= 1000) {
      formattedViews = (totalViewsNum / 1000).toFixed(1) + 'K';
    } else {
      formattedViews = String(totalViewsNum);
    }

    const totalUsers = Math.max(users.length, 1);
    const activeUsersToday = users.filter((u) => {
      const checkedInToday = u.lastCheckInDate === todayStr;
      const historyToday = Array.isArray(u.history) && u.history.some((h) => h.updatedAt?.startsWith(todayStr));
      return checkedInToday || historyToday;
    }).length || Math.min(totalUsers, Math.max(1, Math.round(totalUsers * 0.65)));

    const totalCoinsSpent = users.reduce((acc, u) => acc + ((u.unlockedEpisodes?.length || 0) * 20), 0);
    const totalCoinsInCirculation = users.reduce((acc, u) => acc + (Number(u.coins) || 0), 0);
    const totalVipUsers = users.filter((u) => u.isVip).length;

    // Sort Top Dramas by viewsNum descending
    const sortedDramas = [...dramas].sort((a, b) => (Number(b.viewsNum) || 0) - (Number(a.viewsNum) || 0));
    const topDramas = sortedDramas.map((d, index) => {
      const views = Number(d.viewsNum) || 1000;
      const percentage = totalViewsNum > 0 ? Math.round((views / totalViewsNum) * 100) : 0;
      return {
        rank: index + 1,
        id: d.id,
        title: d.title,
        titleKm: d.titleKm || d.title,
        posterUrl: d.posterUrl,
        viewsNum: views,
        views: d.views || `${(views / 1000).toFixed(1)}K`,
        likes: d.likes || 120,
        episodesCount: d.episodes?.length || 0,
        percentage
      };
    });

    // 7-day trend (actual / projected)
    const trend7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateKey = d.toISOString().slice(5, 10); // MM-DD
      const dateFull = d.toISOString().slice(0, 10);
      const dau = users.filter((u) => u.lastCheckInDate === dateFull || (u.history || []).some((h) => h.updatedAt?.startsWith(dateFull))).length || Math.max(1, Math.round(activeUsersToday * (0.8 + (6 - i) * 0.04)));
      const spent = Math.round(totalCoinsSpent * (0.1 + (6 - i) * 0.02));
      trend7Days.push({
        date: dateKey,
        fullDate: dateFull,
        dau,
        coinsSpent: spent
      });
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalUsers,
        activeUsersToday,
        totalDramas,
        totalEpisodes,
        totalViewsNum,
        totalViews: formattedViews,
        totalCoinsSpent,
        totalCoinsInCirculation,
        totalVipUsers
      },
      topDramas,
      trend7Days
    };
  }

  // --- Bakong / Payment Management ---
  savePendingPayment(md5, paymentData) {
    if (!this.data.payments) this.data.payments = {};
    this.data.payments[md5] = {
      ...paymentData,
      isPaid: paymentData.isPaid || false,
      isProcessed: paymentData.isProcessed || false,
      createdAt: paymentData.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    this.save();
    return this.data.payments[md5];
  }

  getPayment(md5) {
    if (!this.data.payments) this.data.payments = {};
    return this.data.payments[md5] || null;
  }

  markPaymentPaid(md5, transactionData = null) {
    if (!this.data.payments) this.data.payments = {};
    const payment = this.data.payments[md5];
    if (payment) {
      payment.isPaid = true;
      payment.paidAt = Date.now();
      if (transactionData) payment.transactionData = transactionData;
      this.save();
      return payment;
    }
    return null;
  }

  markPaymentProcessed(md5) {
    if (!this.data.payments) this.data.payments = {};
    const payment = this.data.payments[md5];
    if (payment) {
      payment.isProcessed = true;
      payment.processedAt = Date.now();
      this.save();
      return payment;
    }
    return null;
  }

  getAllPayments() {
    if (!this.data.payments) this.data.payments = {};
    return Object.entries(this.data.payments).map(([md5, data]) => ({
      md5,
      ...data
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
}

export const db = new Database();

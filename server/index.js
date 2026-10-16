import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { setupTelegramBot, createStarsInvoice } from './bot.js';
import { generatePaymentQR, checkPaymentStatus, markPaymentCompleted } from './services/bakong.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const WEB_APP_URL = process.env.WEB_APP_URL || `http://localhost:5173`;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---

// Get all dramas
app.get('/api/dramas', (req, res) => {
  const dramas = db.getDramas();
  res.json(dramas);
});

// Get single drama
app.get('/api/dramas/:id', (req, res) => {
  const drama = db.getDramaById(req.params.id);
  if (!drama) return res.status(404).json({ error: 'Drama not found' });
  res.json(drama);
});

// Sync user profile (with referral code support)
app.post('/api/user/sync', (req, res) => {
  const { ref, ...userData } = req.body;
  if (!userData?.id) return res.status(400).json({ error: 'User ID is required' });
  const user = db.syncUser(userData, ref);
  res.json({ success: true, user });
});

// Get user referral statistics & friends list
app.get('/api/user/referral-stats', (req, res) => {
  const { telegramId } = req.query;
  if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });
  const user = db.getUser(telegramId);
  res.json({
    success: true,
    telegramId,
    referredBy: user.referredBy,
    referralsCount: user.referrals?.length || 0,
    referrals: user.referrals || [],
    referralCoinsEarned: user.referralCoinsEarned || 0
  });
});

// Get user daily check-in status
app.get('/api/user/checkin-status', (req, res) => {
  const { telegramId } = req.query;
  if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });
  const user = db.getUser(telegramId);
  const todayStr = new Date().toISOString().slice(0, 10);
  const hasCheckedInToday = user.lastCheckInDate === todayStr;
  const streakRewards = [10, 15, 20, 25, 35, 50, 100];
  res.json({
    success: true,
    hasCheckedInToday,
    streak: user.checkInStreak || 1,
    rewardsSchedule: streakRewards,
    todayReward: streakRewards[(user.checkInStreak - 1) % 7]
  });
});

// Daily check-in
app.post('/api/user/checkin', (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });
  const result = db.dailyCheckIn(telegramId);
  res.json(result);
});

// Unlock episode with coins
app.post('/api/episodes/unlock', (req, res) => {
  const { telegramId, dramaId, episodeId } = req.body;
  if (!telegramId || !dramaId || !episodeId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  const result = db.unlockEpisode(telegramId, dramaId, episodeId);
  res.json(result);
});

// Toggle favorite
app.post('/api/user/favorite', (req, res) => {
  const { telegramId, dramaId } = req.body;
  if (!telegramId || !dramaId) return res.status(400).json({ error: 'Missing parameters' });
  const result = db.toggleFavorite(telegramId, dramaId);
  res.json(result);
});

// Update watch history
app.post('/api/user/history', (req, res) => {
  const { telegramId, dramaId, episodeId, progressSec } = req.body;
  if (!telegramId || !dramaId) return res.status(400).json({ error: 'Missing parameters' });
  const result = db.updateHistory(telegramId, dramaId, episodeId, progressSec);
  res.json(result);
});

// Top up coins (Simulated Bakong KHQR or Stars)
app.post('/api/user/topup', (req, res) => {
  const { telegramId, packageId, method } = req.body;
  if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });

  const packageCoinsMap = {
    1: 200, // 100 base + 100 first bonus
    2: 345, // 300 + 45 bonus (+15%)
    3: 1000, // 800 + 200 bonus (+25%)
    4: 2700 // 2000 + 700 bonus (+35%)
  };

  const addedCoins = packageCoinsMap[packageId] || 345;
  const result = db.topUpCoins(telegramId, addedCoins);
  res.json({ success: true, addedCoins, coins: result.coins });
});

// Upgrade VIP
app.post('/api/user/vip', (req, res) => {
  const { telegramId, tier } = req.body;
  if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });
  const result = db.upgradeVip(telegramId, tier || 'monthly');
  if (tier === 'lite') {
    db.topUpCoins(telegramId, 200); // 200 instant coins for Lite VIP
  }
  res.json(result);
});

// --- ACLEDA Bank Bakong KHQR Routes ---

// 1. Generate Real Dynamic KHQR
app.post('/api/payment/generate-khqr', async (req, res) => {
  try {
    const { telegramId, type, packageId, tier, amountKhr, amountUsd, currency } = req.body;
    const result = await generatePaymentQR({
      telegramId,
      type,
      packageId,
      tier,
      amountKhr,
      amountUsd,
      currency
    });
    res.json(result);
  } catch (err) {
    console.error('Error generating KHQR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Real-time Payment Status Checker (Polling / Webhook)
app.post('/api/payment/check-status', async (req, res) => {
  try {
    const { md5 } = req.body;
    const status = await checkPaymentStatus(md5);

    if (status.paid && status.payment && !status.payment.isProcessed) {
      status.payment.isProcessed = true;
      const { telegramId, type, packageId, tier } = status.payment;
      if (type === 'coins') {
        const packageCoinsMap = { 1: 200, 2: 345, 3: 1000, 4: 2700 };
        const addedCoins = packageCoinsMap[packageId] || 345;
        const updated = db.topUpCoins(telegramId, addedCoins);
        return res.json({ success: true, paid: true, coins: updated.coins, addedCoins, type });
      } else if (type === 'vip') {
        const vipResult = db.upgradeVip(telegramId, tier || 'monthly');
        if (tier === 'lite') {
          db.topUpCoins(telegramId, 200);
        }
        const updatedUser = db.getUser(telegramId);
        return res.json({ success: true, paid: true, isVip: true, vipTier: vipResult.vipTier, coins: updatedUser.coins, type });
      }
    }

    res.json(status);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Confirm / Instant Credit Payment
app.post('/api/payment/confirm-now', async (req, res) => {
  try {
    const { md5, telegramId, type, packageId, tier } = req.body;
    markPaymentCompleted(md5);

    if (type === 'coins') {
      const packageCoinsMap = { 1: 200, 2: 345, 3: 1000, 4: 2700 };
      const addedCoins = packageCoinsMap[packageId] || 345;
      const updated = db.topUpCoins(telegramId, addedCoins);
      return res.json({ success: true, paid: true, coins: updated.coins, addedCoins, type });
    } else if (type === 'vip') {
      const vipResult = db.upgradeVip(telegramId, tier || 'monthly');
      if (tier === 'lite') {
        db.topUpCoins(telegramId, 200);
      }
      const updatedUser = db.getUser(telegramId);
      return res.json({ success: true, paid: true, isVip: true, vipTier: vipResult.vipTier, coins: updatedUser.coins, type });
    }

    res.json({ success: true, paid: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Telegram Stars Native Checkout Routes ---

// Create Telegram Stars Invoice Link
app.post('/api/stars/create-invoice', async (req, res) => {
  try {
    const { telegramId, type, packageId, tier, starsAmount, title, description } = req.body;
    const payload = { telegramId, type, packageId, tier };

    const packageCoinsMap = { 1: 200, 2: 345, 3: 1000, 4: 2700 };
    const defaultTitle = type === 'coins'
      ? `SiengStudio: ${packageCoinsMap[packageId] || 345} Coins`
      : `SiengStudio: ${tier === 'lite' ? 'Lite VIP' : 'All-Access VIP'} Membership`;

    const invoiceResult = await createStarsInvoice({
      title: title || defaultTitle,
      description: description || 'Digital currency on SiengStudio Telegram Mini App',
      payload,
      starsAmount: Number(starsAmount) || 25
    });

    res.json(invoiceResult);
  } catch (err) {
    console.error('Error creating Stars invoice:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Confirm / Credit Telegram Stars Payment (called when WebApp openInvoice returns status === 'paid')
app.post('/api/stars/confirm', (req, res) => {
  try {
    const { telegramId, type, packageId, tier } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });

    if (type === 'coins') {
      const packageCoinsMap = { 1: 200, 2: 345, 3: 1000, 4: 2700 };
      const addedCoins = packageCoinsMap[packageId] || 345;
      const updated = db.topUpCoins(telegramId, addedCoins);
      return res.json({ success: true, paid: true, coins: updated.coins, addedCoins, type });
    } else if (type === 'vip') {
      const vipResult = db.upgradeVip(telegramId, tier || 'monthly');
      if (tier === 'lite') {
        db.topUpCoins(telegramId, 200);
      }
      const updatedUser = db.getUser(telegramId);
      return res.json({
        success: true,
        paid: true,
        isVip: true,
        vipTier: vipResult.vipTier,
        coins: updatedUser.coins,
        type
      });
    }

    res.json({ success: true, paid: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin PIN Verification
app.post('/api/admin/verify-pin', (req, res) => {
  const { pin } = req.body;
  const configuredPin = process.env.ADMIN_PIN || '88@48*';
  if (pin && String(pin) === String(configuredPin)) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
});

// Admin Middleware Check
const checkAdminPin = (req, res, next) => {
  const pin = req.headers['x-admin-pin'] || req.body.adminPin;
  const configuredPin = process.env.ADMIN_PIN || '88@48*';
  if (!pin || String(pin) !== String(configuredPin)) {
    return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
  }
  next();
};

// Admin: Add Drama
app.post('/api/admin/dramas', checkAdminPin, (req, res) => {
  const dramaData = req.body;
  const created = db.createDrama(dramaData);
  res.json({ success: true, drama: created });
});

// Admin: Add Episode
app.post('/api/admin/episodes', checkAdminPin, (req, res) => {
  const { dramaId, ...episodeData } = req.body;
  if (!dramaId) return res.status(400).json({ error: 'dramaId is required' });
  const created = db.addEpisode(dramaId, episodeData);
  if (!created) return res.status(404).json({ error: 'Drama not found' });
  res.json({ success: true, episode: created });
});

// Admin: Add Batch Episodes
app.post('/api/admin/episodes/batch', checkAdminPin, (req, res) => {
  const { dramaId, episodes } = req.body;
  if (!dramaId || !episodes || !Array.isArray(episodes)) {
    return res.status(400).json({ error: 'dramaId and episodes array are required' });
  }
  const result = db.addEpisodesBatch(dramaId, episodes);
  if (!result) return res.status(404).json({ error: 'Drama not found' });
  res.json({ success: true, count: episodes.length, episodes: result });
});

// Admin: Set/Replace All Episodes of Drama
app.put('/api/admin/dramas/:id/episodes', checkAdminPin, (req, res) => {
  const { episodes } = req.body;
  if (!Array.isArray(episodes)) {
    return res.status(400).json({ error: 'episodes array is required' });
  }
  const result = db.setEpisodes(req.params.id, episodes);
  if (!result) return res.status(404).json({ error: 'Drama not found' });
  res.json({ success: true, count: episodes.length, episodes: result });
});

// Admin: Delete Particular Episode
app.delete('/api/admin/dramas/:dramaId/episodes/:episodeId', checkAdminPin, (req, res) => {
  const { dramaId, episodeId } = req.params;
  const result = db.deleteEpisode(dramaId, episodeId);
  if (!result) return res.status(404).json({ error: 'Drama not found' });
  res.json({ success: true, remainingCount: result.length, episodes: result });
});

// Admin: Delete All Episodes of Drama
app.delete('/api/admin/dramas/:dramaId/episodes', checkAdminPin, (req, res) => {
  const { dramaId } = req.params;
  const result = db.deleteAllEpisodes(dramaId);
  if (result === null) return res.status(404).json({ error: 'Drama not found' });
  res.json({ success: true, message: 'All episodes deleted successfully', count: 0 });
});

// Admin: Update Particular Episode
app.put('/api/admin/dramas/:dramaId/episodes/:episodeId', checkAdminPin, (req, res) => {
  const { dramaId, episodeId } = req.params;
  const updated = db.updateEpisode(dramaId, episodeId, req.body);
  if (!updated) return res.status(404).json({ error: 'Episode or Drama not found' });
  res.json({ success: true, episode: updated });
});

// Admin: Update Drama Details
app.put('/api/admin/dramas/:id', checkAdminPin, (req, res) => {
  const updated = db.updateDrama(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Drama not found' });
  res.json({ success: true, drama: updated });
});

// Admin: Delete Drama
app.delete('/api/admin/dramas/:dramaId', checkAdminPin, (req, res) => {
  const { dramaId } = req.params;
  const deleted = db.deleteDrama(dramaId);
  if (!deleted) return res.status(404).json({ error: 'Drama not found' });
  res.json({ success: true, message: 'Drama deleted' });
});

// Admin: Export Database Backup JSON
app.get('/api/admin/backup', checkAdminPin, (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="siengstudio-backup.json"');
  res.setHeader('Content-Type', 'application/json');
  res.json(db.data);
});

// Admin: Import Database JSON
app.post('/api/admin/import', checkAdminPin, (req, res) => {
  const success = db.importDatabase(req.body);
  if (!success) return res.status(400).json({ success: false, message: 'Invalid database payload' });
  res.json({ success: true, message: 'Database imported successfully', totalDramas: db.data.dramas.length });
});

// Admin: Stats
app.get('/api/admin/stats', checkAdminPin, (req, res) => {
  const dramas = db.getDramas();
  const totalEp = dramas.reduce((acc, d) => acc + (d.episodes?.length || 0), 0);
  res.json({
    success: true,
    totalDramas: dramas.length,
    totalEpisodes: totalEp,
    totalViews: '1.4M+'
  });
});

// Serve public videos and assets directly
const videosPath = path.join(__dirname, '../public/videos');
if (fs.existsSync(videosPath)) {
  app.use('/videos', express.static(videosPath));
}

const publicPath = path.join(__dirname, '../public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Serve frontend build if dist exists
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 SiengStudio Server listening on http://localhost:${PORT}`);
  console.log(`📡 Mini App Web URL: ${WEB_APP_URL}`);

  // Setup Telegram Bot
  setupTelegramBot(BOT_TOKEN, WEB_APP_URL);
});

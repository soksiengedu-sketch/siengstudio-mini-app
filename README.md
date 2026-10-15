# 🎬 SiengStudio (ស្ទូឌីយោសៀង) - Telegram Mini App & Bot
> A high-performance, mobile-first clone of **Phsar Roeung** (`@Phsar_Roeung_Mini_App_Bot`) built for streaming viral short dramas, vertical series, audio stories, and video recaps on Telegram.

---

## 🌟 Key Features

### 📱 1. Telegram Mini App (TMA Frontend)
* **Bilingual Support**: Instant toggle between **Khmer (ភាសាខ្មែរ)** and **English (EN)**.
* **Vertical Reel / Short Video Player**:
  * TikTok / ReelShort style vertical full-screen player with swipe up/down for Next/Previous episodes.
  * Double-tap to like with floating heart animations.
  * Side interaction bar: Likes counter, Favorite / Watchlist, Episode Drawer, Speed toggle (`1x`, `1.25x`, `1.5x`, `2x`), and Telegram Share.
  * Standard 16:9 Cinema mode toggle.
  * Auto-advance countdown timer to next episode.
* **Drama Catalog & Discovery**:
  * Hero banner carousel with top featured dramas.
  * "Continue Watching" row with saved playback timestamps and episode progress.
  * Categories: Romance (ស្នេហា), CEO / Billionaire (មហាសេដ្ឋី), Revenge (ការសងសឹក), Action (វាយប្រហារ), Comedy (កំប្លែង), Khmer Dubbed / Recaps (រឿងសម្រាយ).
  * Top Charts ranking list (1, 2, 3...) & New Releases.
* **Realtime Search & Filter**:
  * Instant filter by title (EN + Khmer), synopsis, actor, and genre tags.

### 💰 2. Monetization & Rewards Economy
* **Episode Lock System**: First few episodes free; subsequent episodes require coins or VIP access.
* **Daily Check-in Streak Calendar**: 7-day streak rewards (+10 to +100 bonus coins) with confetti celebrations.
* **Referral / Invite Friends**: Earn +50 coins for every friend who joins via Telegram deep link (`t.me/SiengStudioBot?start=ref_USERID`).
* **Wallet & Top-up**:
  * **Bakong KHQR / ABA Pay**: Simulated dynamic QR code modal familiar to Cambodian audiences.
  * **Telegram Stars (⭐)**: Native Telegram Stars checkout simulation.
* **VIP All-Access Pass**: Monthly / Lifetime VIP subscription unlocking all dramas with zero ads.

### 🤖 3. Telegram Bot (`server/bot.js`)
* Built with modern **Grammy** framework.
* `/start`: Welcomes user by name in Khmer & English, awards referral bonuses, and provides inline button to open the Mini App.
* Deep Linking: Supports `/start drama_1` (opens specific drama) and `/start ref_12345` (awards referral coins).
* `/daily`: Claim daily bonus coins directly in Telegram chat.
* `/vip`: Information on VIP membership.
* `/help`: Commands and user guide.

### 🛡️ 4. Admin CMS Dashboard
* Accessible via Profile -> Admin Panel (Default PIN: `8888`).
* View platform analytics: Total Series, Total Episodes, Total Views.
* Add new Drama series (Title in EN + Khmer, Poster URL, Banner URL, Synopsis, Genres).
* Add new Episodes to any drama (Episode number, Title, Video MP4 / HLS Stream URL, Coin Price, Free toggle).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* Node.js v18+ (tested on Node v24)
* npm v9+

### 2. Installation
```bash
# In the project directory:
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```ini
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_FROM_BOTFATHER
WEB_APP_URL=http://localhost:5173
PORT=3000
ADMIN_PIN=8888
```

> **Note**: Even without a `TELEGRAM_BOT_TOKEN`, the web application and all APIs work 100% out of the box with simulated Telegram user profiles for easy local testing!

### 4. Run Development Servers
```bash
# Run both Frontend (Vite) and Backend (Express API) concurrently:
npm run dev
```
* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:3000`

### 5. Production Build & Run
```bash
# Build frontend assets:
npm run build

# Start single-process server:
npm start
```
Open `http://localhost:3000` in any browser or Telegram Web client.

---

## 🤖 Connecting to Telegram with @BotFather

1. Open Telegram and search for **[@BotFather](https://t.me/BotFather)**.
2. Send `/newbot` and follow instructions:
   * Name: `SiengStudio`
   * Username: e.g. `SiengStudioBot` or your preferred username.
3. Copy the HTTP API token into your `.env`:
   ```ini
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
   ```
4. **Configure the Menu Button**:
   * Send `/setmenubutton` to `@BotFather`.
   * Select your bot.
   * Send your Mini App URL (e.g. your ngrok / Cloudflare Tunnel / production domain: `https://your-domain.com`).
   * Set button text: `🎬 SiengStudio`
5. **(Optional) Expose localhost to Telegram Mobile**:
   If testing on a smartphone, use Cloudflare Tunnel or ngrok:
   ```bash
   npx cloudflared tunnel --url http://localhost:5173
   # Or:
   ngrok http 5173
   ```
   Set the resulting HTTPS URL as `WEB_APP_URL` in `.env` and in BotFather.

---

## 📁 Project Architecture

```
Mini App/
├── package.json          # Dependencies and run scripts
├── vite.config.js        # Vite + Tailwind v4 + React config
├── index.html            # HTML shell with Telegram WebApp SDK
├── src/
│   ├── main.jsx          # React DOM entry
│   ├── App.jsx           # Tab routing and global modals
│   ├── index.css         # Tailwind v4 styles, safe area insets
│   ├── locales/
│   │   ├── km.js         # Khmer translations (ភាសាខ្មែរ)
│   │   └── en.js         # English translations
│   ├── services/
│   │   ├── api.js        # REST API client
│   │   └── telegram.js   # Telegram WebApp SDK & haptics wrapper
│   ├── context/
│   │   └── AppContext.jsx# State, wallet, user, and translation context
│   ├── components/
│   │   ├── Header.jsx    # Sticky navigation with coins & language
│   │   ├── BottomNav.jsx # Mobile tab bar
│   │   ├── HeroBanner.jsx# Featured dramas carousel
│   │   ├── DramaCard.jsx # 3:4 vertical poster cards
│   │   ├── ReelPlayer.jsx# Full-screen vertical swipe video player
│   │   ├── EpisodeDrawer.jsx # Episode selector bottom sheet
│   │   ├── CoinModal.jsx # KHQR & Stars top-up packages
│   │   ├── DailyCheckInModal.jsx # 7-day streak rewards
│   │   └── ShareModal.jsx# Referral sharing dialog
│   └── pages/
│       ├── Home.jsx      # Feed with categories, ranks & continue watching
│       ├── DramaDetail.jsx # Synopsis, backdrop, and episode list
│       ├── Search.jsx    # Realtime search & genre filter
│       ├── Library.jsx   # Favorites and Watch History
│       ├── Wallet.jsx    # Balance, VIP pass & earning methods
│       ├── Profile.jsx   # Telegram profile, settings, Admin entrance
│       └── Admin.jsx     # CMS to add dramas & upload episodes
├── server/
│   ├── index.js          # Express server & API endpoints
│   ├── db.js             # File-based JSON database engine
│   ├── bot.js            # Telegram Bot (Grammy) with commands
│   └── seedData.js       # Preloaded drama series with playable video streams
└── data/
    └── db.json           # Auto-generated persistent database
```

---

## 🔑 Default Credentials & Keys

* **Admin CMS PIN**: `8888` (Configurable in `.env`)
* **Default Welcome Coins**: 150 Coins granted automatically to each new user.
* **Standard Episode Cost**: 20 Coins (free for episodes 1-3).

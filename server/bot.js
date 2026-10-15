import { Bot, InlineKeyboard } from 'grammy';
import { db } from './db.js';

export function setupTelegramBot(token, webAppUrl) {
  if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    console.log('⚠️ TELEGRAM_BOT_TOKEN is not configured in .env. Bot polling is paused.');
    console.log('💡 To enable Telegram Bot integration, set TELEGRAM_BOT_TOKEN and WEB_APP_URL in .env');
    return null;
  }

  const bot = new Bot(token);

  // Handle both /start command and plain text 'start'
  const handleStart = async (ctx) => {
    try {
      const user = ctx.from;
      const startPayload = ctx.match?.[1] || ''; // e.g. "ref_12345" or "drama_1"

      // Sync user in database
      if (user?.id) {
        db.syncUser(user);

        // Handle referral bonus
        if (startPayload && startPayload.startsWith('ref_')) {
          const referrerId = startPayload.replace('ref_', '');
          if (referrerId !== String(user.id)) {
            db.topUpCoins(referrerId, 50);
            db.topUpCoins(user.id, 25);
            try {
              await ctx.api.sendMessage(
                referrerId,
                `🎉 មិត្តភក្តិម្នាក់បានចុះឈ្មោះតាមរយៈតំណភ្ជាប់របស់អ្នក! អ្នកទទួលបាន +50 កាក់ (A friend joined via your referral link! +50 Coins added)`
              );
            } catch (e) {}
          }
        }
      }

      const appUrl = startPayload ? `${webAppUrl}?startapp=${startPayload}` : webAppUrl;

      const keyboard = new InlineKeyboard();
      // Telegram requires HTTPS for WebApp buttons. If HTTP, fallback to URL button.
      if (appUrl.startsWith('https://')) {
        keyboard.webApp('🎬 បើក SiengStudio (Open Mini App)', appUrl);
      } else {
        keyboard.url('🎬 បើក SiengStudio (Open in Browser)', appUrl);
      }


      // Escape HTML entities to prevent crash on names with < > & _ etc
      const safeName = (user?.first_name || 'ប្រិយមិត្ត')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const welcomeMsg = `សួស្តី <b>${safeName}</b>! សូមស្វាគមន៍មកកាន់ <b>SiengStudio</b> (ស្ទូឌីយោសៀង) 🎬\n✨ <b>ទស្សនាគ្មានដែនកំណត់</b>\n\nWelcome to <b>SiengStudio Mini App</b> — The premier short drama & series streaming hub on Telegram!\n\n✨ <b>លក្ខណៈពិសេស / Highlights:</b>\n• 📺 រឿងភាគខ្លីៗ ស្នេហា មហាសេដ្ឋី សងសឹក និងរឿងសម្រាយខ្មែរ\n• 🎁 ចុះឈ្មោះប្រចាំថ្ងៃទទួលបានកាក់ឥតគិតថ្លៃ (Daily Check-in Coins)\n• 💎 កញ្ចប់ VIP មើលគ្រប់ភាគគ្មានដែនកំណត់\n• ⚡ ទស្សនារលូនកម្រិត Full HD ដោយមិនបាច់ដំឡើងកម្មវិធីផ្សេង!\n\n👉 ចុចប៊ូតុងខាងក្រោមដើម្បីចាប់ផ្តើមទស្សនាភ្លាមៗ!`;

      await ctx.reply(welcomeMsg, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } catch (err) {
      console.error('Error handling /start:', err);
      try {
        await ctx.reply('សួស្តី! សូមស្វាគមន៍មកកាន់ SiengStudio Mini App! 🎬');
      } catch (e) {}
    }
  };

  bot.command('start', handleStart);
  bot.hears(/^start$/i, handleStart);

  // Command: /daily
  bot.command('daily', async (ctx) => {
    const user = ctx.from;
    if (!user?.id) return;
    const res = db.dailyCheckIn(user.id);
    if (res.success) {
      await ctx.reply(
        `🎉 អបអរសាទរ! អ្នកទទួលបាន <b>+${res.reward} កាក់</b> សម្រាប់ថ្ងៃនេះ!\nStreak: ${res.streak} ថ្ងៃជាប់ៗគ្នា\nកាក់សរុប: ${res.coins} Coins`,
        { parse_mode: 'HTML' }
      );
    } else {
      await ctx.reply(`⚠️ អ្នកបានចុចទទួលកាក់ប្រចាំថ្ងៃរួចរាល់ហើយ! សូមត្រឡប់មកវិញនៅថ្ងៃស្អែក។`);
    }
  });

  // Command: /vip
  bot.command('vip', async (ctx) => {
    const vipUrl = `${webAppUrl}?tab=wallet`;
    const keyboard = new InlineKeyboard();
    if (vipUrl.startsWith('https://')) {
      keyboard.webApp('👑 ជាវសមាជិក VIP ឥឡូវនេះ', vipUrl);
    } else {
      keyboard.url('👑 ជាវសមាជិក VIP ឥឡូវនេះ', vipUrl);
    }

    await ctx.reply(
      `👑 <b>SiengStudio VIP All-Access Pass</b>\n\n` +
      `• ដោះសោរឿងភាគខ្លីៗទាំងអស់ដោយសេរី គ្មានដែនកំណត់\n` +
      `• គ្មានពាណិជ្ជកម្មរំខាន\n` +
      `• កម្រិតរូបភាពច្បាស់ Full HD 1080p\n` +
      `• <b>Lite VIP ($2.50 / 10,000 ៛)</b>: បាន 200 កាក់ភ្លាម + 30 កាក់/ថ្ងៃ + បញ្ចុះតម្លៃ 20%\n` +
      `• <b>All-Access VIP ($6.99 / 28,000 ៛)</b>: មើលគ្រប់រឿងគ្មានដែនកំណត់ គ្មានពាណិជ្ជកម្ម\n` +
      `• បង់ប្រាក់ងាយស្រួលតាម Bakong KHQR\n\n` +
      `ចុចប៊ូតុងខាងក្រោមដើម្បីចូលទៅកាន់ទំព័រជាវសមាជិក៖`,
      {
        parse_mode: 'HTML',
        reply_markup: keyboard
      }
    );
  });

  // Command: /help
  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📖 <b>របៀបប្រើប្រាស់ SiengStudio Bot:</b>\n\n` +
      `/start - ចាប់ផ្តើម និងបើក Mini App\n` +
      `/daily - ទទួលកាក់ឥតគិតថ្លៃប្រចាំថ្ងៃ\n` +
      `/vip - ព័ត៌មានកញ្ចប់សមាជិក VIP\n` +
      `/help - ជំនួយ និងការណែនាំ\n\n` +
      `📩 ទំនាក់ទំនងជំនួយបច្ចេកទេស៖ @SiengStudioSupport`,
      { parse_mode: 'HTML' }
    );
  });

  // Start Bot in Background
  bot.start({
    onStart: async (botInfo) => {
      console.log(`🤖 Telegram Bot @${botInfo.username} is running in polling mode!`);
      if (webAppUrl && webAppUrl.startsWith('https://')) {
        try {
          await bot.api.setChatMenuButton({
            menu_button: {
              type: 'web_app',
              text: '🎬 SiengStudio',
              web_app: { url: webAppUrl }
            }
          });
          console.log(`✅ Telegram Menu Button automatically updated to: ${webAppUrl}`);
        } catch (e) {
          console.warn('Could not auto-set menu button:', e.message);
        }
      }
    }
  }).catch((err) => {
    console.error('Telegram Bot start error:', err.message);
  });

  return bot;
}

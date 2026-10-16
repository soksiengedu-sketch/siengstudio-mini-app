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

  // Command: /admin - Connect or authenticate admin chat ID
  bot.command('admin', async (ctx) => {
    try {
      const text = (ctx.match || '').trim();
      const correctPin = (process.env.ADMIN_PIN || '88@48*').trim();
      const uid = String(ctx.from.id);
      const adminIds = getAdminChatIds();

      if (text === correctPin || adminIds.includes(uid)) {
        db.data.adminTelegramIds = db.data.adminTelegramIds || [];
        if (!db.data.adminTelegramIds.includes(uid)) {
          db.data.adminTelegramIds.push(uid);
          db.save();
        }
        await ctx.reply(
          `🛡️ <b>Admin Access Granted!</b>\n\n` +
          `គណនីរបស់អ្នក (<code>${uid}</code> - @${ctx.from.username || ctx.from.first_name || 'Admin'}) ត្រូវបានភ្ជាប់ជា Admin ទទួលសារផ្តល់ដំណឹង និងប៊ូតុង 1-Tap Approve ការទូទាត់រាល់ពេលមានអតិថិជនទិញកាក់/VIP! 🚀\n\n` +
          `💡 <i>រាល់ពេលមានការទូទាត់ ប្រព័ន្ធនឹងផ្ញើសារមកកាន់ Chat នេះជាមួយប៊ូតុង Approve ភ្លាមៗ។</i>`,
          { parse_mode: 'HTML' }
        );
      } else {
        await ctx.reply(
          `🔒 <b>ចូលប្រើប្រាស់មុខងារ Admin:</b>\n\n` +
          `សូមវាយបញ្ចូល PIN ដូចខាងក្រោម៖\n` +
          `<code>/admin 88@48*</code>`,
          { parse_mode: 'HTML' }
        );
      }
    } catch (err) {
      console.error('Error handling /admin command:', err);
    }
  });

  // Command: /removeadmin - Remove admin privilege
  bot.command('removeadmin', async (ctx) => {
    try {
      const parts = (ctx.match || '').trim().split(/\s+/);
      const pin = parts[0];
      const targetId = parts[1] || String(ctx.from.id);
      const correctPin = (process.env.ADMIN_PIN || '88@48*').trim();

      if (pin === correctPin) {
        db.data.adminTelegramIds = (db.data.adminTelegramIds || []).filter(
          (id) => String(id) !== String(targetId)
        );
        db.save();
        await ctx.reply(
          `✅ <b>បានដកសិទ្ធិ Admin សម្រាប់ ID: <code>${targetId}</code> រួចរាល់ហើយ!</b>`,
          { parse_mode: 'HTML' }
        );
      } else {
        await ctx.reply(
          `🔒 <b>របៀបដក Admin:</b>\n<code>/removeadmin 88@48* &lt;ID&gt;</code>`,
          { parse_mode: 'HTML' }
        );
      }
    } catch (err) {
      console.error('Error handling /removeadmin command:', err);
    }
  });

  // Callback query: 1-Tap Approve Payment
  bot.callbackQuery(/^approve_pay:(.+)$/, async (ctx) => {
    try {
      const md5 = ctx.match[1];
      const adminIds = getAdminChatIds();
      const callerId = String(ctx.from.id);

      if (!adminIds.includes(callerId)) {
        return ctx.answerCallbackQuery({
          text: '⛔ អ្នកគ្មានសិទ្ធិអនុម័តទេ! សូមផ្ញើ /admin 88@48* ជាមុនសិន',
          show_alert: true
        });
      }

      const { processPaymentApproval } = await import('./services/bakong.js');
      const approverName = ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || callerId);
      const result = processPaymentApproval(md5, approverName);

      if (!result.success) {
        return ctx.answerCallbackQuery({ text: `❌ ${result.message}`, show_alert: true });
      }

      const p = result.payment || {};
      const isCoins = p.type === 'coins';
      const pkgMap = { 1: '200 Coins', 2: '345 Coins', 3: '1,000 Coins', 4: '2,700 Coins' };
      const pkgLabel = isCoins ? (pkgMap[p.packageId] || 'Coins') : `VIP ${p.tier || 'Monthly'}`;
      const amountStr = p.currency === 'USD' ? `$${p.amount}` : `${p.amount?.toLocaleString()} ៛`;

      await ctx.answerCallbackQuery({ text: '✅ បានអនុម័ត និងបញ្ចូលកាក់ជូនអតិថិជនជោគជ័យ!' });

      try {
        await ctx.editMessageText(
          `✅ <b>បានអនុម័តដោយជោគជ័យ! (Approved)</b>\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `👤 <b>អតិថិជន:</b> <code>${p.telegramId}</code>\n` +
          `📦 <b>កញ្ចប់:</b> <b>${pkgLabel}</b> (${amountStr})\n` +
          `🧾 <b>វិក្កយបត្រ:</b> <code>#${p.billNumber}</code>\n` +
          (isCoins
            ? `🎉 <b>បានបញ្ចូល:</b> +${result.addedCoins} Coins (សមតុល្យ: ${result.coins} Coins)\n`
            : `👑 <b>VIP Status:</b> សកម្មជោគជ័យ (${p.tier || 'Monthly'})\n`) +
          `👮 <b>អនុម័តដោយ:</b> ${approverName}\n` +
          `🕒 <b>ពេលវេលា:</b> ${new Date().toLocaleTimeString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `✨ <i>ប្រព័ន្ធបានបញ្ចូលរង្វាន់ និងផ្ញើសារប្រាប់អតិថិជនរួចរាល់ហើយ!</i>`,
          { parse_mode: 'HTML' }
        );
      } catch (e) {
        console.warn('Could not edit admin message:', e.message);
      }

      // Notify customer directly in Telegram
      await notifyCustomerPaymentApproved(p, result.addedCoins);
    } catch (err) {
      console.error('Error approving payment via Telegram bot:', err);
      try {
        await ctx.answerCallbackQuery({ text: `Error: ${err.message}`, show_alert: true });
      } catch (e) {}
    }
  });

  // Callback query: Live NBC Core Check
  bot.callbackQuery(/^check_nbc:(.+)$/, async (ctx) => {
    try {
      const md5 = ctx.match[1];
      await ctx.answerCallbackQuery({ text: '⏳ កំពុងពិនិត្យផ្ទាល់ជាមួយ NBC Bakong Core...' });
      const { checkPaymentStatus, processPaymentApproval } = await import('./services/bakong.js');
      const checkRes = await checkPaymentStatus(md5);

      if (checkRes.paid) {
        const result = processPaymentApproval(md5, 'NBC Bakong Core (Live Verification)');
        const p = result.payment || {};
        await ctx.editMessageText(
          `✅ <b>ផ្ទៀងផ្ទាត់ជោគជ័យពីធនាគារជាតិ NBC Bakong!</b>\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `វិក្កយបត្រ <code>#${p.billNumber}</code> ត្រូវបានផ្ទៀងផ្ទាត់ឃើញក្នុង Ledger ធនាគារជាតិ!\n` +
          `កាក់/VIP ត្រូវបានបញ្ចូលជូនអតិថិជន <code>${p.telegramId}</code> ដោយស្វ័យប្រវត្តិ។`,
          { parse_mode: 'HTML' }
        );
        await notifyCustomerPaymentApproved(p, result.addedCoins);
      } else if (checkRes.quotaExceeded) {
        await ctx.reply(
          `⚠️ <b>កូតា NBC Bakong API ពេញកំណត់ (errorCode: 17)</b>\n\n` +
          `សូមពិនិត្យមើល App ធនាគារផ្ទាល់ខ្លួនរបស់អ្នក (ABA / ACLEDA / Bakong) រួចចុចប៊ូតុង Approve ខាងលើដោយផ្ទាល់!`,
          { parse_mode: 'HTML' }
        );
      } else {
        await ctx.reply(
          `ℹ️ <b>លទ្ធផលពី NBC Bakong:</b>\n${checkRes.message || 'មិនទាន់រកឃើញប្រតិបត្តិការក្នុង Ledger របស់ធនាគារជាតិទេ។'}`,
          { parse_mode: 'HTML' }
        );
      }
    } catch (err) {
      console.error('Error checking NBC via Telegram bot:', err);
      try {
        await ctx.answerCallbackQuery({ text: `Error: ${err.message}` });
      } catch (e) {}
    }
  });

  // Callback query: List Recent Payments
  bot.callbackQuery('admin_list_payments', async (ctx) => {
    try {
      const payments = db.getAllPayments().slice(0, 5);
      if (payments.length === 0) {
        return ctx.answerCallbackQuery({ text: 'មិនទាន់មានប្រតិបត្តិការទេ' });
      }
      let text = `📋 <b>វិក្កយបត្រថ្មីៗទាំង ៥:</b>\n━━━━━━━━━━━━━━━━━━\n`;
      for (const p of payments) {
        text += `• <b>#${p.billNumber}</b> - <code>${p.telegramId}</code> (${p.amount} ${p.currency}) [${p.isProcessed ? '✅ Completed' : p.isPaid ? '✓ Paid' : '⏳ Pending'}]\n`;
      }
      await ctx.reply(text, { parse_mode: 'HTML' });
      await ctx.answerCallbackQuery();
    } catch (e) {
      try { await ctx.answerCallbackQuery(); } catch (_) {}
    }
  });

  // Handle Customer Photo (Bank Transfer Slip / Screenshot)
  bot.on('message:photo', async (ctx) => {
    try {
      const uid = String(ctx.from.id);
      const adminIds = getAdminChatIds();

      // If sent by an admin without invoice context, skip
      if (adminIds.includes(uid) && !ctx.message.caption?.includes('#SS')) {
        return;
      }

      const pending = db.getLatestPendingPaymentForUser(uid);
      const photos = ctx.message.photo;
      const highestResPhoto = photos[photos.length - 1];

      await ctx.reply(
        `🙏 <b>យើងខ្ញុំបានទទួលរូបភាពស្លីបផ្ទេរប្រាក់របស់អ្នកហើយ!</b>\n\n` +
        `ប្រព័ន្ធកំពុងបញ្ជូនទៅកាន់ Admin ដើម្បីពិនិត្យ និងអនុម័តបញ្ចូលកាក់ជូនភ្លាមៗ។ សូមរង់ចាំបន្តិច! ⏳`,
        { parse_mode: 'HTML' }
      );

      const keyboard = new InlineKeyboard();
      if (pending) {
        const amountStr = pending.currency === 'USD' ? `$${pending.amount}` : `${pending.amount?.toLocaleString()} ៛`;
        keyboard.text(`✅ ចុច Approve (${amountStr}) ភ្លាម`, `approve_pay:${pending.md5}`);
      } else {
        keyboard.text(`📋 ពិនិត្យបញ្ជីវិក្កយបត្រ`, `admin_list_payments`);
      }

      const customerTag = ctx.from.username ? `@${ctx.from.username}` : (ctx.from.first_name || uid);
      const caption =
        `📸 <b>អតិថិជនបានផ្ញើស្លីបផ្ទេរប្រាក់ (Receipt)!</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>អតិថិជន:</b> ${customerTag} (ID: <code>${uid}</code>)\n` +
        (pending
          ? `📦 <b>វិក្កយបត្រ:</b> <code>#${pending.billNumber}</code> (${pending.amount} ${pending.currency})\n`
          : `⚠️ <i>មិនមានវិក្កយបត្រ Pending ក្នុងប្រព័ន្ធទេ</i>\n`) +
        `🕒 <b>ពេលវេលា:</b> ${new Date().toLocaleTimeString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👉 សូមពិនិត្យស្លីបខាងលើ និង App ធនាគារ រួចចុច Approve ខាងក្រោម៖`;

      for (const adminId of adminIds) {
        try {
          await ctx.api.sendPhoto(adminId, highestResPhoto.file_id, {
            caption,
            parse_mode: 'HTML',
            reply_markup: keyboard
          });
        } catch (e) {
          console.warn(`Could not forward photo to admin ${adminId}:`, e.message);
        }
      }
    } catch (err) {
      console.error('Error handling customer photo slip:', err);
    }
  });

  // Telegram Stars Payment Handlers
  bot.on('pre_checkout_query', async (ctx) => {
    try {
      await ctx.answerPreCheckoutQuery(true);
    } catch (err) {
      console.error('Error answering pre_checkout_query:', err);
      try {
        await ctx.answerPreCheckoutQuery(false, { error_message: 'Payment verification failed' });
      } catch (e) {}
    }
  });

  bot.on('message:successful_payment', async (ctx) => {
    try {
      const payment = ctx.message.successful_payment;
      const user = ctx.from;
      let payload = {};
      try {
        payload = JSON.parse(payment.invoice_payload);
      } catch (e) {
        payload = { telegramId: user.id, type: 'coins', packageId: 2 };
      }

      const telegramId = String(payload.telegramId || user.id);
      if (payload.type === 'coins') {
        const packageCoinsMap = { 1: 200, 2: 345, 3: 1000, 4: 2700 };
        const addedCoins = packageCoinsMap[payload.packageId] || 345;
        db.topUpCoins(telegramId, addedCoins);
        await ctx.reply(
          `🌟 <b>ការទូទាត់ជោគជ័យ! (Payment Successful)</b>\n\n` +
          `អ្នកបានទិញតាម Telegram Stars (${payment.total_amount} Stars) ដោយជោគជ័យ!\n` +
          `ទទួលបាន: <b>+${addedCoins} កាក់</b> 🎬\n` +
          `សូមចូលទៅកាន់ SiengStudio ដើម្បីទស្សនាបន្ត!`,
          { parse_mode: 'HTML' }
        );
      } else if (payload.type === 'vip') {
        db.upgradeVip(telegramId, payload.tier || 'monthly');
        if (payload.tier === 'lite') {
          db.topUpCoins(telegramId, 200);
        }
        await ctx.reply(
          `👑 <b>សូមអបអរសាទរ! អ្នកបានក្លាយជាសមាជិក VIP!</b>\n\n` +
          `បានបង់តាម Telegram Stars (${payment.total_amount} Stars) ដោយជោគជ័យ!\n` +
          `រីករាយទស្សនារឿងភាគទាំងអស់ដោយគ្មានដែនកំណត់! ✨`,
          { parse_mode: 'HTML' }
        );
      }
    } catch (err) {
      console.error('Error processing successful_payment:', err);
    }
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

  activeBotInstance = bot;
  return bot;
}

export let activeBotInstance = null;

export async function createStarsInvoice({ title, description, payload, starsAmount }) {
  if (!activeBotInstance) {
    return { success: false, message: 'Telegram Bot is not initialized or offline' };
  }
  try {
    const link = await activeBotInstance.api.createInvoiceLink({
      title: title || 'SiengStudio Coins',
      description: description || 'Digital currency for SiengStudio Mini App',
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      provider_token: '', // Must be empty string for Telegram Stars (XTR)
      currency: 'XTR',
      prices: [{ label: title || 'Stars', amount: Number(starsAmount) || 25 }]
    });
    return { success: true, invoiceLink: link };
  } catch (err) {
    console.error('Failed to create Stars invoice:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Broadcast message to Telegram subscribers and/or channel
 */
export async function broadcastMessage({
  messageText,
  title,
  dramaId,
  episodeNumber,
  buttonText,
  customChannelId,
  target = 'all', // 'all' | 'channel' | 'both'
  webAppUrl: customWebAppUrl
}) {
  if (!activeBotInstance) {
    return {
      success: false,
      message: 'Telegram Bot is not online or TELEGRAM_BOT_TOKEN is not configured.'
    };
  }

  const appUrl = customWebAppUrl || process.env.WEB_APP_URL || 'https://siengstudio-mini-app.onrender.com';
  let targetUrl = appUrl;
  if (dramaId) {
    targetUrl = episodeNumber
      ? `${appUrl}?startapp=ep_${dramaId}_${episodeNumber}`
      : `${appUrl}?startapp=drama_${dramaId}`;
  }

  const keyboard = new InlineKeyboard();
  const btnLabel = buttonText || (episodeNumber ? `🎬 មើលភាគទី ${episodeNumber} ឥឡូវនេះ` : '🎬 ទស្សនាឥឡូវនេះ (Watch Now)');
  if (targetUrl.startsWith('https://')) {
    keyboard.webApp(btnLabel, targetUrl);
  } else {
    keyboard.url(btnLabel, targetUrl);
  }

  const header = title
    ? `📢 <b>${title}</b>\n\n`
    : `📢 <b>SiengStudio ដំណឹងរឿងភាគថ្មី! (New Update)</b>\n\n`;

  const fullMessage = `${header}${messageText || 'មានរឿងភាគ និងភាគថ្មីៗទើបតែបញ្ចេញ! សូមចុចទស្សនាឥឡូវនេះ។'}\n\n✨ <b>SiengStudio Mini App</b>`;

  let sentCount = 0;
  let failedCount = 0;
  let channelSent = false;
  let channelError = null;

  // 1. Send to Channel if requested
  const channelId = customChannelId || process.env.TELEGRAM_CHANNEL_ID;
  if ((target === 'channel' || target === 'both') && channelId) {
    try {
      await activeBotInstance.api.sendMessage(channelId, fullMessage, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      channelSent = true;
    } catch (err) {
      console.error('Failed to broadcast to channel:', err.message);
      channelError = err.message;
    }
  }

  // 2. Send to all registered users
  if (target === 'all' || target === 'both') {
    const userIds = Object.keys(db.data.users || {});
    for (const uid of userIds) {
      try {
        await activeBotInstance.api.sendMessage(uid, fullMessage, {
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
        sentCount++;
      } catch (err) {
        failedCount++;
      }
      // Delay 40ms to stay well below Telegram's 30 msg/sec rate limit
      await new Promise((r) => setTimeout(r, 40));
    }
  }

  return {
    success: true,
    sentCount,
    failedCount,
    totalTargetUsers: Object.keys(db.data.users || {}).length,
    channelSent,
    channelError,
    target
  };
}

/**
 * Get all authorized admin Telegram Chat IDs
 */
export function getAdminChatIds() {
  const envAdmins = (process.env.ADMIN_TELEGRAM_ID || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const dbAdmins = (db.data.adminTelegramIds || []).map((s) => String(s).trim());
  return Array.from(new Set([...envAdmins, ...dbAdmins]))
    .filter((id) => id && id !== '8175240868');
}

/**
 * Notify admin when a customer generates a KHQR payment request
 */
export async function notifyAdminNewPayment(paymentRecord) {
  if (!activeBotInstance) return;
  const adminIds = getAdminChatIds();
  if (adminIds.length === 0) return;

  const isCoins = paymentRecord.type === 'coins';
  const pkgMap = { 1: '200 Coins', 2: '345 Coins', 3: '1,000 Coins', 4: '2,700 Coins' };
  const pkgLabel = isCoins ? (pkgMap[paymentRecord.packageId] || 'Coins') : `VIP ${paymentRecord.tier || 'Monthly'}`;
  const amountStr = paymentRecord.currency === 'USD' ? `$${paymentRecord.amount}` : `${paymentRecord.amount?.toLocaleString()} ៛`;

  const msg =
    `🔔 <b>មានការស្នើសុំទិញ ${isCoins ? 'កាក់' : 'VIP'} ថ្មី! (New KHQR)</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>អតិថិជន:</b> <code>${paymentRecord.telegramId}</code>\n` +
    `📦 <b>កញ្ចប់:</b> <b>${pkgLabel}</b> (${amountStr})\n` +
    `🧾 <b>វិក្កយបត្រ:</b> <code>#${paymentRecord.billNumber}</code>\n` +
    `🏦 <b>គណនីទទួល:</b> <code>${paymentRecord.accountId}</code>\n` +
    `⏳ <b>ស្ថានភាព:</b> <i>កំពុងរង់ចាំការស្កេន (Pending)</i>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💡 <i>ពេលឃើញប្រាក់ចូលកុងធនាគារ លោកអ្នកអាចចុច Approve ខាងក្រោមនេះភ្លាមៗ៖</i>`;

  const keyboard = new InlineKeyboard()
    .text(`⚡ Approve (${amountStr})`, `approve_pay:${paymentRecord.md5}`)
    .text(`🔍 ពិនិត្យ NBC`, `check_nbc:${paymentRecord.md5}`);

  for (const adminId of adminIds) {
    try {
      await activeBotInstance.api.sendMessage(adminId, msg, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } catch (e) {
      console.warn(`Could not send new payment alert to admin ${adminId}:`, e.message);
    }
  }
}

/**
 * Notify admin when customer taps "I have transferred / ខ្ញុំបានផ្ទេរប្រាក់រួចរាល់"
 */
export async function notifyAdminPaymentConfirmation(payment, nbcReason) {
  if (!activeBotInstance) return;
  const adminIds = getAdminChatIds();
  if (adminIds.length === 0) return;

  const isCoins = payment.type === 'coins';
  const pkgMap = { 1: '200 Coins', 2: '345 Coins', 3: '1,000 Coins', 4: '2,700 Coins' };
  const pkgLabel = isCoins ? (pkgMap[payment.packageId] || 'Coins') : `VIP ${payment.tier || 'Monthly'}`;
  const amountStr = payment.currency === 'USD' ? `$${payment.amount}` : `${payment.amount?.toLocaleString()} ៛`;

  const msg =
    `🚨 <b>អតិថិជនទើបតែចុច «ខ្ញុំបានផ្ទេរប្រាក់រួចរាល់»!</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>អតិថិជន:</b> <code>${payment.telegramId}</code>\n` +
    `📦 <b>កញ្ចប់:</b> <b>${pkgLabel}</b> (${amountStr})\n` +
    `🧾 <b>វិក្កយបត្រ:</b> <code>#${payment.billNumber}</code>\n` +
    `⚠️ <b>ស្ថានភាព NBC:</b> <i>${nbcReason || 'កំពុងរង់ចាំ / ផុតកូតា API'}</i>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👉 <b>សូមពិនិត្យមើល App ធនាគាររបស់អ្នក (ABA / ACLEDA / Bakong)</b>\n` +
    `ប្រសិនបើឃើញប្រាក់ចូលរួចហើយ សូមចុចប៊ូតុង Approve ខាងក្រោម៖`;

  const keyboard = new InlineKeyboard()
    .text(`✅ ចុច Approve បញ្ចូលកាក់ (${amountStr}) ភ្លាម`, `approve_pay:${payment.md5}`)
    .text(`🔍 ពិនិត្យ NBC`, `check_nbc:${payment.md5}`);

  for (const adminId of adminIds) {
    try {
      await activeBotInstance.api.sendMessage(adminId, msg, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } catch (e) {
      console.warn(`Could not send confirmation alert to admin ${adminId}:`, e.message);
    }
  }
}

/**
 * Notify customer via Telegram Bot that payment was approved
 */
export async function notifyCustomerPaymentApproved(payment, addedCoins) {
  if (!activeBotInstance || !payment.telegramId) return;
  try {
    const isCoins = payment.type === 'coins';
    const rewardText = isCoins
      ? `🎉 អ្នកទទួលបាន: <b>+${addedCoins} កាក់</b> 🎬`
      : `👑 គណនីរបស់អ្នកត្រូវបានដំឡើងទៅជា <b>VIP (${payment.tier || 'Monthly'})</b> រួចរាល់ហើយ!`;

    const webAppUrl = process.env.WEB_APP_URL || 'https://siengstudio-mini-app.onrender.com';
    const keyboard = new InlineKeyboard();
    if (webAppUrl.startsWith('https://')) {
      keyboard.webApp('🎬 បើកទស្សនាឥឡូវនេះ (Open App)', webAppUrl);
    } else {
      keyboard.url('🎬 បើកទស្សនាឥឡូវនេះ (Open App)', webAppUrl);
    }

    const msg =
      `🌟 <b>ការទូទាត់ទទួលបានជោគជ័យ! (Payment Approved)</b>\n\n` +
      `វិក្កយបត្រ <code>#${payment.billNumber}</code> ត្រូវបានអនុម័តដោយជោគជ័យ!\n` +
      `${rewardText}\n\n` +
      `សូមអរគុណសម្រាប់ការគាំទ្រ SiengStudio! រីករាយទស្សនារឿងភាគខ្លីៗគ្មានដែនកំណត់។ ✨`;

    await activeBotInstance.api.sendMessage(payment.telegramId, msg, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  } catch (err) {
    console.warn(`Could not notify customer ${payment.telegramId}:`, err.message);
  }
}


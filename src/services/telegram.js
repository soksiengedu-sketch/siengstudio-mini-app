// Telegram WebApp Helper & Bridge
export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

export const isTelegramWebApp = () => {
  return Boolean(tg && tg.initData && tg.initData.length > 0);
};

export const initTelegramApp = () => {
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (typeof tg.requestFullscreen === 'function') {
        try {
          tg.requestFullscreen();
        } catch (err) {}
      }
      tg.enableClosingConfirmation();
      if (tg.setHeaderColor) {
        tg.setHeaderColor('#0b0c13');
      }
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#0b0c13');
      }
    } catch (e) {
      console.warn('Telegram WebApp init notice:', e);
    }
  }
};

export const getTelegramUser = () => {
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }
  // Fallback realistic user for development or browser preview
  return {
    id: 887654321,
    first_name: 'Vannak',
    last_name: 'Sieng',
    username: 'vannak_sieng',
    language_code: 'km',
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'
  };
};

export const haptic = {
  light: () => {
    try {
      tg?.HapticFeedback?.impactOccurred('light');
    } catch (e) {}
  },
  medium: () => {
    try {
      tg?.HapticFeedback?.impactOccurred('medium');
    } catch (e) {}
  },
  heavy: () => {
    try {
      tg?.HapticFeedback?.impactOccurred('heavy');
    } catch (e) {}
  },
  success: () => {
    try {
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (e) {}
  },
  error: () => {
    try {
      tg?.HapticFeedback?.notificationOccurred('error');
    } catch (e) {}
  },
  select: () => {
    try {
      tg?.HapticFeedback?.selectionChanged();
    } catch (e) {}
  }
};

export const shareToTelegram = (text, url) => {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
};

/**
 * Open native Telegram Stars invoice dialog in Telegram WebApp
 * @param {string} invoiceLink - Link returned by Bot API createInvoiceLink
 * @returns {Promise<'paid' | 'cancelled' | 'failed' | 'pending' | 'fallback'>}
 */
export const openTelegramInvoice = (invoiceLink) => {
  return new Promise((resolve) => {
    if (tg?.openInvoice) {
      try {
        tg.openInvoice(invoiceLink, (status) => {
          resolve(status);
        });
        return;
      } catch (err) {
        console.warn('Telegram openInvoice error:', err);
      }
    }
    // Fallback if tested outside Telegram WebApp
    if (invoiceLink && invoiceLink.startsWith('http')) {
      window.open(invoiceLink, '_blank');
      resolve('opened_external');
    } else {
      resolve('fallback');
    }
  });
};

export const setupTelegramBackButton = (onBack) => {
  if (tg?.BackButton) {
    try {
      tg.BackButton.show();
      tg.BackButton.offClick();
      if (typeof onBack === 'function') {
        tg.BackButton.onClick(onBack);
      }
    } catch (e) {
      console.warn('Telegram BackButton error:', e);
    }
  }
};

export const hideTelegramBackButton = () => {
  if (tg?.BackButton) {
    try {
      tg.BackButton.hide();
      tg.BackButton.offClick();
    } catch (e) {
      console.warn('Telegram hideBackButton error:', e);
    }
  }
};


import { useCallback, useEffect, useRef } from 'react';
import type { TelegramUser } from '../types';

const IS_DEV = import.meta.env.DEV;

// Access the Telegram WebApp SDK via the global injected by the script tag in index.html
// We also try to use the window.Telegram.WebApp directly for maximum compatibility
function getWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

const MOCK_USER: TelegramUser = {
  id: 123456789,
  first_name: 'Александр',
  last_name: 'Кольцов',
  username: 'akoltsov',
  language_code: 'ru',
};

export interface UseTelegramReturn {
  user: TelegramUser | null;
  initData: string;
  isReady: boolean;
  showBackButton: () => void;
  hideBackButton: () => void;
  onBackButtonClicked: (handler: () => void) => () => void;
  hapticFeedback: (type: 'light' | 'medium' | 'heavy' | 'error' | 'success') => void;
  expand: () => void;
  close: () => void;
}

export function useTelegram(): UseTelegramReturn {
  const backHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const webApp = getWebApp();
    if (webApp) {
      try {
        webApp.ready();
        webApp.expand();
      } catch {
        // ignore SDK errors in non-Telegram environment
      }
    }
  }, []);

  const user: TelegramUser | null = (() => {
    const webApp = getWebApp();
    if (webApp) {
      try {
        const tgUser = webApp.initDataUnsafe?.user;
        if (tgUser) {
          return {
            id: tgUser.id,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            username: tgUser.username,
            photo_url: tgUser.photo_url,
            language_code: tgUser.language_code,
          };
        }
      } catch {
        // fall through to mock
      }
    }
    if (IS_DEV) return MOCK_USER;
    return null;
  })();

  const initData = (() => {
    const webApp = getWebApp();
    if (webApp) {
      try {
        return webApp.initData || '';
      } catch {
        return '';
      }
    }
    return IS_DEV ? 'mock_init_data' : '';
  })();

  // isReady is true only when actually running inside Telegram (initData is non-empty)
  // or in dev mode. The WebApp object always exists after script load even in regular browsers,
  // so checking initData is the reliable way to detect real Telegram context.
  const webAppObj = getWebApp();
  const isReady = Boolean((webAppObj?.initData) || IS_DEV);

  const showBackButton = useCallback(() => {
    const webApp = getWebApp();
    if (webApp) {
      try {
        webApp.BackButton.show();
      } catch {
        // ignore
      }
    }
  }, []);

  const hideBackButton = useCallback(() => {
    const webApp = getWebApp();
    if (webApp) {
      try {
        webApp.BackButton.hide();
      } catch {
        // ignore
      }
    }
  }, []);

  const onBackButtonClicked = useCallback((handler: () => void) => {
    const webApp = getWebApp();
    if (webApp) {
      try {
        if (backHandlerRef.current) {
          webApp.BackButton.offClick(backHandlerRef.current);
        }
        backHandlerRef.current = handler;
        webApp.BackButton.onClick(handler);
        return () => {
          const wa = getWebApp();
          if (wa && backHandlerRef.current) {
            try {
              wa.BackButton.offClick(backHandlerRef.current);
            } catch {
              // ignore
            }
          }
        };
      } catch {
        return () => undefined;
      }
    }
    return () => undefined;
  }, []);

  const hapticFeedback = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'error' | 'success') => {
      const webApp = getWebApp();
      if (webApp) {
        try {
          if (type === 'error' || type === 'success') {
            webApp.HapticFeedback.notificationOccurred(type);
          } else {
            webApp.HapticFeedback.impactOccurred(type);
          }
        } catch {
          // ignore
        }
      }
    },
    []
  );

  const expand = useCallback(() => {
    const webApp = getWebApp();
    if (webApp) {
      try {
        webApp.expand();
      } catch {
        // ignore
      }
    }
  }, []);

  const close = useCallback(() => {
    const webApp = getWebApp();
    if (webApp) {
      try {
        webApp.close();
      } catch {
        // ignore
      }
    }
  }, []);

  return {
    user,
    initData,
    isReady,
    showBackButton,
    hideBackButton,
    onBackButtonClicked,
    hapticFeedback,
    expand,
    close,
  };
}

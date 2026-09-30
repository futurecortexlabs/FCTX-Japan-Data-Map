import { useEffect, useState } from 'react';

const STORAGE_KEY = 'fctx_theme';

/** 保存済みの設定 → OS の設定 (prefers-color-scheme) の順で初期テーマを決める */
function getInitialDarkMode(fallback: boolean): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
  } catch {
    // プライベートブラウズ等で localStorage が使えない場合は OS 設定にフォールバック
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? fallback;
}

export function useDarkMode(initialValue = false) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getInitialDarkMode(initialValue));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
    try {
      localStorage.setItem(STORAGE_KEY, isDarkMode ? 'dark' : 'light');
    } catch {
      // 保存できなくても表示には影響しない
    }
  }, [isDarkMode]);

  return { isDarkMode, setIsDarkMode };
}

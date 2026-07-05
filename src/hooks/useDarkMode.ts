import { useState, useEffect } from 'react';

export function useDarkMode(initialValue = false) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(initialValue);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return { isDarkMode, setIsDarkMode };
}

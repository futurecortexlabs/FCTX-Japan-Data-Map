import { useState, useEffect } from 'react';

export const useKonamiCode = (onUnlock: () => void) => {
  const [, setSequence] = useState<string[]>([]);
  const konamiCode = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      setSequence((prev) => {
        const newSequence = [...prev, key];
        if (newSequence.length > konamiCode.length) {
          newSequence.shift();
        }
        
        const isMatch = newSequence.every((k, i) => k.toLowerCase() === konamiCode[i].toLowerCase());
        
        if (isMatch) {
          onUnlock();
          return [];
        }
        
        return newSequence;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUnlock, konamiCode]);
};

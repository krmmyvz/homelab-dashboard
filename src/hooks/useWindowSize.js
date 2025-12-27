import { useState, useEffect } from 'react';

// Ekran genişliğini anlık olarak takip eden bir custom hook
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // Pencere yeniden boyutlandırıldığında state'i güncelleyen fonksiyon
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Event listener'ı ekle
    window.addEventListener('resize', handleResize);

    // Component kaldırıldığında event listener'ı temizle
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Sadece component mount edildiğinde çalışır

  return windowSize;
};

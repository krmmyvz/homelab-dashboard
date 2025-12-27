// --- src/hooks/useScrollTracker.js (YENİ DOSYA) ---

import { useState, useEffect } from 'react';

/**
 * Bir DOM elementinin kaydırma pozisyonunu takip eder ve belirli bir eşiği
 * geçip geçmediğini döndürür. Bu, Header gibi bileşenlerin kaydırma
 * durumuna göre davranışını değiştirmesi için kullanılır.
 * @param {React.RefObject<HTMLElement>} ref - Takip edilecek scrollable elementin ref'i.
 * @param {number} threshold - "Scrolled" durumuna geçmek için gereken kaydırma miktarı (pixel).
 * @returns {boolean} - Elementin eşiği geçip geçmediğini belirten boolean.
 */
export const useScrollTracker = (ref, threshold = 10) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const targetElement = ref.current;
    if (!targetElement) return;

    const handleScroll = () => {
      const { scrollTop } = targetElement;
      setIsScrolled(scrollTop > threshold);
    };

    // Event listener'ı ekle
    targetElement.addEventListener('scroll', handleScroll);

    // İlk yüklemede durumu kontrol et
    handleScroll();

    // Component kaldırıldığında event listener'ı temizle
    return () => targetElement.removeEventListener('scroll', handleScroll);
  }, [ref, threshold]);

  return isScrolled;
};

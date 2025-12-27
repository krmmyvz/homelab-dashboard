// --- src/components/Portal.jsx (YENİ DOSYA) ---
// Bileşenleri DOM'da farklı bir yere render etmek için.

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted
    ? createPortal(children, document.querySelector("#portal-root"))
    : null;
};

// Portal'ın ekleneceği root elementini public/index.html'e eklemeyi unutma!
// <div id="root"></div>
// <div id="portal-root"></div>

export default Portal;
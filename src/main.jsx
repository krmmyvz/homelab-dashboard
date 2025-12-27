import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/index.css';

// DÜZELTME: Artık kullanmadığımız kütüphanelerin CSS import'ları kaldırıldı.
// import 'react-resizable/css/styles.css';
// import 'react-grid-layout/css/styles.css';

import App from '@/App';
import { GlobalProvider } from '@/contexts/GlobalProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalProvider>
      <App />
    </GlobalProvider>
  </React.StrictMode>,
);
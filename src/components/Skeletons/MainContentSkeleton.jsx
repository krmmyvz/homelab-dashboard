import React from 'react';
import './Skeleton.css';

const MainContentSkeleton = () => {
  return (
    <main 
      className="skeleton-main-content"
      role="status"
      aria-label="İçerik yükleniyor"
      aria-live="polite"
    >
      <header className="skeleton-main-header" aria-hidden="true">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-subtitle" />
      </header>
      <div className="skeleton-grid" aria-hidden="true">
        {/* Ekrana sığacak kadar iskelet kart oluşturuyoruz */}
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton skeleton-card" />
        ))}
      </div>
      
      {/* Screen reader text */}
      <span className="sr-only">
        Dashboard içeriği yükleniyor, lütfen bekleyin...
      </span>
    </main>
  );
};

export default MainContentSkeleton;

import React from 'react';
import './Skeleton.css';

const SidebarSkeleton = () => {
  return (
    <aside className="skeleton-sidebar-wrapper">
      <div className="skeleton-sidebar-header">
        <div className="skeleton skeleton-menu-button" />
      </div>
      <div className="skeleton-sidebar-menu">
        <div className="skeleton skeleton-menu-item" />
        <div className="skeleton skeleton-divider" />
        <div className="skeleton skeleton-menu-item" />
        <div className="skeleton skeleton-menu-item" />
        <div className="skeleton skeleton-menu-item" />
        <div className="skeleton skeleton-menu-item" />
      </div>
      <div className="skeleton-sidebar-footer">
         <div className="skeleton skeleton-menu-item" />
      </div>
    </aside>
  );
};

export default SidebarSkeleton;

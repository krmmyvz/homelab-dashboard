import React, { Suspense, lazy } from 'react';
import { UIContext } from '@/contexts/UIContext';

// Lazy load modal components for better performance
const AddServerModal = lazy(() => import('./AddServerModal'));
const AddCategoryModal = lazy(() => import('./AddCategoryModal'));
const AddGroupModal = lazy(() => import('./AddGroupModal'));
const ConfirmModal = lazy(() => import('./ConfirmModal'));
const TagsModal = lazy(() => import('./TagsModal'));

// Modal loading fallback component
const ModalSkeleton = () => (
  <div 
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '400px',
      height: '300px',
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--border-radius-large)',
      border: '1px solid var(--color-outline)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'var(--typography-bodyMedium-fontSize)',
      color: 'var(--color-onSurfaceVariant)',
      boxShadow: 'var(--elevation-level3)'
    }}
    role="status"
    aria-label="Modal yükleniyor"
  >
    Yükleniyor...
  </div>
);

/**
 * ModalManager - Centralized modal management component
 * Manages all application modals with lazy loading and proper error boundaries
 */
const ModalManager = () => {
  const { isModalOpen } = React.useContext(UIContext);

  return (
    <>
      {isModalOpen.server && (
        <Suspense fallback={<ModalSkeleton />}>
          <AddServerModal />
        </Suspense>
      )}
      
      {isModalOpen.category && (
        <Suspense fallback={<ModalSkeleton />}>
          <AddCategoryModal />
        </Suspense>
      )}
      
      {isModalOpen.group && (
        <Suspense fallback={<ModalSkeleton />}>
          <AddGroupModal />
        </Suspense>
      )}
      
      {isModalOpen.confirm && (
        <Suspense fallback={<ModalSkeleton />}>
          <ConfirmModal />
        </Suspense>
      )}
      
      {isModalOpen.tags && (
        <Suspense fallback={<ModalSkeleton />}>
          <TagsModal />
        </Suspense>
      )}
    </>
  );
};

export default ModalManager;

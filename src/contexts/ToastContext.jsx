import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationToast from '../components/common/NotificationToast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    duration: 5000,
    actionText: null,
    onAction: null,
    confirmText: null,
    onConfirm: null
  });

  const showToast = useCallback((type, message, title = '', duration = 5000, actionText = null, onAction = null, confirmText = null, onConfirm = null) => {
    setToast({
      isOpen: true,
      type,
      title,
      message,
      duration,
      actionText,
      onAction,
      confirmText,
      onConfirm
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showSuccess = useCallback((message, title = 'Success', duration = 5000) => {
    showToast('success', message, title, duration);
  }, [showToast]);

  const showError = useCallback((message, title = 'Error', duration = 5000) => {
    showToast('error', message, title, duration);
  }, [showToast]);

  const showWarning = useCallback((message, title = 'Warning', duration = 5000) => {
    showToast('warning', message, title, duration);
  }, [showToast]);

  const showInfo = useCallback((message, title = 'Info', duration = 5000) => {
    showToast('info', message, title, duration);
  }, [showToast]);

  const showConfirm = useCallback((message, title = 'Confirm', onConfirm, onCancel = null) => {
    setToast({
      isOpen: true,
      type: 'warning',
      title,
      message,
      duration: 0, // Don't auto-close confirmation dialogs
      actionText: 'Cancel',
      onAction: () => {
        hideToast();
        if (onCancel) onCancel();
      },
      confirmText: 'Confirm',
      onConfirm: () => {
        hideToast();
        if (onConfirm) onConfirm();
      }
    });
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{
      showToast,
      hideToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showConfirm
    }}>
      {children}
      <NotificationToast
        isOpen={toast.isOpen}
        onClose={hideToast}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        duration={toast.duration}
        actionText={toast.actionText}
        onAction={toast.onAction}
        confirmText={toast.confirmText}
        onConfirm={toast.onConfirm}
      />
    </ToastContext.Provider>
  );
};


// File: NotificationContext.jsx
// Path: frontend/src/context/NotificationContext.jsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Toast notifications
  const showSuccess = useCallback((message, options = {}) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }, []);

  const showError = useCallback((message, options = {}) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }, []);

  const showWarning = useCallback((message, options = {}) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }, []);

  const showInfo = useCallback((message, options = {}) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }, []);

  // In-app notifications (for persistent notifications)
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Quick notification methods
  const notifySuccess = useCallback((title, message) => {
    showSuccess(title);
    addNotification({
      type: 'success',
      title,
      message
    });
  }, [showSuccess, addNotification]);

  const notifyError = useCallback((title, message) => {
    showError(title);
    addNotification({
      type: 'error',
      title,
      message
    });
  }, [showError, addNotification]);

  const value = {
    // Toast methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // In-app notification methods
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    
    // Quick methods
    notifySuccess,
    notifyError,
    
    // Computed properties
    unreadCount: notifications.filter(n => !n.read).length,
    hasUnread: notifications.some(n => !n.read)
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          fontFamily: 'var(--font-thai)',
          fontSize: '14px'
        }}
      />
    </NotificationContext.Provider>
  );
};
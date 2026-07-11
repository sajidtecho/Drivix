/* eslint-disable no-unused-vars */
import React, { createContext, useState, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#00cc6a" />;
      case 'error':
        return <AlertTriangle size={18} color="#ff4b4b" />;
      case 'warning':
        return <AlertCircle size={18} color="#FFAD00" />;
      case 'info':
      default:
        return <Info size={18} color="#0090FF" />;
    }
  };

  const getToastBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'rgba(0, 204, 106, 0.4)';
      case 'error':
        return 'rgba(255, 75, 75, 0.4)';
      case 'warning':
        return 'rgba(255, 173, 0, 0.4)';
      case 'info':
      default:
        return 'rgba(0, 144, 255, 0.4)';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Container */}
      <div
        style={{
          position: 'fixed',
          top: '92px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'none',
          maxWidth: '350px',
          width: '90%'
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px 20px',
                borderRadius: 'var(--radius-card)',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: `1.5px solid ${getToastBorderColor(toast.type)}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                color: 'var(--text-primary)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {getToastIcon(toast.type)}
              </div>
              <div style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.4, pr: '12px' }}>
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: 0.7,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.7; }}
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

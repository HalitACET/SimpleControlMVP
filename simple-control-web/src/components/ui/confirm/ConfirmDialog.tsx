import React, { useEffect, useRef } from 'react';
import styles from './ConfirmDialog.module.css';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface ConfirmDialogProps extends ConfirmOptions {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  danger = false,
  onConfirm,
  onCancel
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Save previous active element
    previousFocus.current = document.activeElement as HTMLElement;

    // Focus cancel button by default to prevent accidental confirmation
    if (cancelBtnRef.current) {
      cancelBtnRef.current.focus();
    }

    // Disable body scroll while dialog is open
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Tab') {
        const focusableElements = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean) as HTMLElement[];
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // If shift+tab and on the first element (or not on any of them), loop to last
          if (document.activeElement === firstElement || !focusableElements.includes(document.activeElement as HTMLElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // If tab and on the last element (or not on any of them), loop to first
          if (document.activeElement === lastElement || !focusableElements.includes(document.activeElement as HTMLElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previous active element
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [onCancel]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onCancel();
    }
  };

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div 
        className={styles.dialog} 
        role="alertdialog" 
        aria-modal="true" 
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <h3 id="confirm-title" className={styles.title}>{title}</h3>
        <p id="confirm-message" className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            ref={cancelBtnRef}
            className={styles.cancelBtn}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            className={`${styles.confirmBtn} ${danger ? styles.danger : styles.normal}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './Drawer.module.css';
import { useConfirm } from '../confirm/ConfirmDialogContext';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  isDirty?: boolean;
  width?: string | number;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footerLeft,
  footerRight,
  isDirty = false,
  width = 480
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const { confirm } = useConfirm();

  useEffect(() => {
    if (!isOpen) return;

    // Focus first input on open
    setTimeout(() => {
      if (drawerRef.current) {
        const firstInput = drawerRef.current.querySelector<HTMLElement>('input, textarea, select');
        firstInput?.focus();
      }
    }, 100);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseRequest();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDirty]);

  const handleCloseRequest = async () => {
    if (isDirty) {
      const confirmClose = await confirm({
        title: 'Kaydetmeden Çık',
        message: 'Kaydedilmemiş değişiklikler var, çıkmak istediğinize emin misiniz?',
        confirmText: 'Evet, Çık',
        cancelText: 'Vazgeç'
      });
      if (!confirmClose) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={handleCloseRequest}></div>
      <div className={styles.drawer} ref={drawerRef} role="dialog" aria-modal="true" style={{ width }}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{title}</div>
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          <button className={styles.closeButton} onClick={handleCloseRequest} title="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {children}
        </div>

        <div className={styles.footer}>
          <div>{footerLeft}</div>
          <div className={styles.footerRight}>
            {footerRight}
          </div>
        </div>
      </div>
    </>
  );
}

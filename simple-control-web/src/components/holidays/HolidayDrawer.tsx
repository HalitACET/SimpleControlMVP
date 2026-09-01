import { useState, useEffect, useRef, type FormEvent } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';
import { handleApiError } from '../../utils/errorHandler';
import { useToast } from '../ui/toast/ToastContext';
import FormInput from '../ui/form/FormInput';
import styles from '../employees/EmployeeDrawer.module.css';

interface HolidayDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HolidayDrawer({ isOpen, onClose, onSuccess }: HolidayDrawerProps) {
  const [holidayDate, setHolidayDate] = useState('');
  const [name, setName] = useState('');
  
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setHolidayDate('');
      setName('');
      setFieldErrors({});
      setGlobalError('');
      setIsSubmitting(false);

      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!holidayDate) errors.holidayDate = 'Tarih seçilmelidir';
    if (!name.trim()) errors.name = 'Tatil adı boş bırakılamaz';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGlobalError('');

    try {
      const payload = { 
        holidayDate,
        name: name.trim()
      };
      
      await api.post('/admin/holidays', payload);
      showToast('Tatil başarıyla eklendi', 'success');
      onSuccess();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.errorCode === 'DUPLICATE_HOLIDAY_DATE') {
        setFieldErrors({ holidayDate: err.response.data.message });
      } else {
        setGlobalError(handleApiError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose}></div>
      <div className={styles.drawer} ref={drawerRef} role="dialog" aria-modal="true" style={{ width: '400px' }}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>Yeni Tatil</div>
            <div className={styles.subtitle}>Sisteme yeni bir tatil günü ekleyin</div>
          </div>
          <button className={styles.closeButton} onClick={onClose} title="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body} style={{ minHeight: 0 }}>
          {globalError && <div className={styles.globalError}>{globalError}</div>}
          
          <form id="holiday-form" onSubmit={handleSubmit}>
            <FormInput
              ref={firstInputRef}
              label="Tarih"
              type="date"
              value={holidayDate}
              onChange={(e) => {
                setHolidayDate(e.target.value);
                setFieldErrors({});
                setGlobalError('');
              }}
              error={fieldErrors.holidayDate}
            />
            
            <FormInput
              label="Tatil Adı"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors({});
                setGlobalError('');
              }}
              placeholder="Örn. Yılbaşı, 23 Nisan"
              error={fieldErrors.name}
            />
          </form>
        </div>

        <div className={styles.footer}>
          <div></div>
          <div className={styles.footerRight}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
              disabled={isSubmitting}
            >
              İptal
            </button>
            <button
              type="submit"
              form="holiday-form"
              className={styles.btnSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


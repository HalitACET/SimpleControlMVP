import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';
import { handleApiError } from '../../utils/errorHandler';
import { useToast } from '../ui/toast/ToastContext';
import { useConfirm } from '../ui/confirm/ConfirmDialogContext';
import FormInput from '../ui/form/FormInput';
import styles from '../employees/EmployeeDrawer.module.css'; // Reusing EmployeeDrawer styles
import { type Shift } from '../../pages/Shifts';

interface ShiftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shiftToEdit: Shift | null;
}

export default function ShiftDrawer({ isOpen, onClose, onSuccess, shiftToEdit }: ShiftDrawerProps) {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [lateToleranceMinutes, setLateToleranceMinutes] = useState('0');
  const [earlyExitToleranceMinutes, setEarlyExitToleranceMinutes] = useState('0');

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const isEdit = !!shiftToEdit;

  useEffect(() => {
    if (isOpen) {
      setTriggerElement(document.activeElement as HTMLElement);
      setFieldErrors({});
      setGlobalError('');
      setIsDirty(false);
      setIsSubmitting(false);

      if (shiftToEdit) {
        setName(shiftToEdit.name);
        setStartTime(shiftToEdit.startTime.substring(0, 5));
        setEndTime(shiftToEdit.endTime.substring(0, 5));
        setBreakMinutes(String(shiftToEdit.breakMinutes));
        setLateToleranceMinutes(String(shiftToEdit.lateToleranceMinutes));
        setEarlyExitToleranceMinutes(String(shiftToEdit.earlyExitToleranceMinutes));
      } else {
        setName('');
        setStartTime('08:00');
        setEndTime('17:00');
        setBreakMinutes('60');
        setLateToleranceMinutes('10');
        setEarlyExitToleranceMinutes('0');
      }

      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    } else {
      if (triggerElement) {
        triggerElement.focus();
      }
    }
  }, [isOpen, shiftToEdit]);

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

  const getShiftInfo = () => {
    if (!startTime || !endTime) return null;
    
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };
    
    const start = parseTime(startTime);
    let end = parseTime(endTime);
    let crossesMidnight = false;
    
    if (start === end) return { error: 'Başlangıç ve bitiş saati aynı olamaz.' };
    
    if (end < start) {
      crossesMidnight = true;
      end += 24 * 60;
    }
    
    const diff = end - start;
    const breakMins = parseInt(breakMinutes) || 0;
    
    if (breakMins >= diff) {
      return { error: 'Mola süresi vardiya süresinden uzun veya eşit olamaz.' };
    }
    
    const duration = diff - breakMins;
    
    return { duration, crossesMidnight };
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = 'Vardiya adı boş bırakılamaz';
    if (!startTime) errors.startTime = 'Başlangıç saati zorunludur';
    if (!endTime) errors.endTime = 'Bitiş saati zorunludur';
    
    const bMins = parseInt(breakMinutes);
    if (isNaN(bMins) || bMins < 0) errors.breakMinutes = 'Geçerli bir mola süresi girin';
    
    const lMins = parseInt(lateToleranceMinutes);
    if (isNaN(lMins) || lMins < 0) errors.lateToleranceMinutes = 'Geçerli bir tolerans girin';

    const eMins = parseInt(earlyExitToleranceMinutes);
    if (isNaN(eMins) || eMins < 0) errors.earlyExitToleranceMinutes = 'Geçerli bir tolerans girin';

    const info = getShiftInfo();
    if (info?.error) {
      if (info.error.includes('saati aynı')) errors.endTime = info.error;
      else errors.breakMinutes = info.error;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (!isDirty) setIsDirty(true);
    setFieldErrors({});
    setGlobalError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGlobalError('');

    try {
      const payload = { 
        name, 
        startTime: startTime + ':00', 
        endTime: endTime + ':00', 
        breakMinutes: parseInt(breakMinutes), 
        lateToleranceMinutes: parseInt(lateToleranceMinutes),
        earlyExitToleranceMinutes: parseInt(earlyExitToleranceMinutes)
      };
      
      if (isEdit) {
        await api.put(`/admin/shifts/${shiftToEdit.id}`, payload);
        showToast('Vardiya başarıyla güncellendi', 'success');
      } else {
        await api.post('/admin/shifts', payload);
        showToast('Vardiya başarıyla oluşturuldu', 'success');
      }
      setIsDirty(false);
      onSuccess();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.errorCode === 'DUPLICATE_SHIFT_NAME') {
        setFieldErrors({ name: err.response.data.message });
      } else {
        setGlobalError(handleApiError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!shiftToEdit) return;
    const confirmDelete = await confirm({
      title: 'Vardiyayı Sil',
      message: 'Bu vardiyayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      confirmText: 'Evet, Sil',
      cancelText: 'Vazgeç',
      danger: true
    });
    if (!confirmDelete) return;

    setIsSubmitting(true);
    setGlobalError('');

    try {
      await api.delete(`/admin/shifts/${shiftToEdit.id}`);
      showToast('Vardiya başarıyla silindi', 'success');
      setIsDirty(false);
      onSuccess();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.errorCode === 'SHIFT_IN_USE') {
        setGlobalError(err.response.data.message);
      } else {
        setGlobalError(handleApiError(err));
      }
      setIsSubmitting(false);
    }
  };

  const shiftInfo = getShiftInfo();
  
  const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}s ${minutes}dk`;
    if (hours > 0) return `${hours}s`;
    return `${minutes}dk`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={handleCloseRequest}></div>
      <div className={styles.drawer} ref={drawerRef} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{isEdit ? 'Vardiyayı Düzenle' : 'Yeni Vardiya'}</div>
            <div className={styles.subtitle}>{isEdit ? 'Vardiya saatlerini ve toleranslarını güncelleyin' : 'Sisteme yeni bir vardiya ekleyin'}</div>
          </div>
          <button className={styles.closeButton} onClick={handleCloseRequest} title="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {globalError && <div className={styles.globalError}>{globalError}</div>}
          
          <form id="shift-form" onSubmit={handleSubmit}>
            <FormInput
              ref={firstInputRef}
              label="Vardiya Adı"
              value={name}
              onChange={handleChange(setName)}
              placeholder="Örn. Gündüz Vardiyası"
              error={fieldErrors.name}
            />

            <div className={styles.row}>
              <FormInput
                label="Başlangıç Saati"
                type="time"
                value={startTime}
                onChange={handleChange(setStartTime)}
                error={fieldErrors.startTime}
              />
              <FormInput
                label="Bitiş Saati"
                type="time"
                value={endTime}
                onChange={handleChange(setEndTime)}
                error={fieldErrors.endTime}
              />
            </div>
            
            <div className={styles.row}>
              <FormInput
                label="Mola (dk)"
                type="number"
                min="0"
                value={breakMinutes}
                onChange={handleChange(setBreakMinutes)}
                error={fieldErrors.breakMinutes}
              />
            </div>

            <div className={styles.row}>
              <FormInput
                label="Geç Kalma Toleransı (dk)"
                type="number"
                min="0"
                value={lateToleranceMinutes}
                onChange={handleChange(setLateToleranceMinutes)}
                error={fieldErrors.lateToleranceMinutes}
                hint="Giriş yaparken bu süreye kadar ceza kesilmez."
              />
              <FormInput
                label="Erken Çıkış Toleransı (dk)"
                type="number"
                min="0"
                value={earlyExitToleranceMinutes}
                onChange={handleChange(setEarlyExitToleranceMinutes)}
                error={fieldErrors.earlyExitToleranceMinutes}
                hint="Çıkış yaparken bu süreye kadar ceza kesilmez."
              />
            </div>

            {/* Dynamic Info Box */}
            <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', backgroundColor: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-body)', color: 'var(--color-text-primary-variant)' }}>
              {shiftInfo && !shiftInfo.error ? (
                <>
                  <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Süre:</span> {formatDuration(shiftInfo.duration as number)}
                  {shiftInfo.crossesMidnight && (
                    <span style={{ color: 'var(--color-info)', fontWeight: 'var(--font-weight-medium)' }}>
                      {' '}· Gece vardiyası (ertesi güne sarkıyor)
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: 'var(--color-text-disabled)' }}>
                  Süre hesabı için geçerli saatler ve mola girin.
                </span>
              )}
            </div>

          </form>
        </div>

        <div className={styles.footer}>
          <div>
            {isEdit && (
              <button
                type="button"
                className={styles.btnDelete}
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                Vardiyayı Sil
              </button>
            )}
          </div>
          <div className={styles.footerRight}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={handleCloseRequest}
              disabled={isSubmitting}
            >
              İptal
            </button>
            <button
              type="submit"
              form="shift-form"
              className={styles.btnSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

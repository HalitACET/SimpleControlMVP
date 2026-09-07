import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import api from '../../api/axios';
import { handleApiError } from '../../utils/errorHandler';
import { useToast } from '../ui/toast/ToastContext';
import { useConfirm } from '../ui/confirm/ConfirmDialogContext';
import Drawer from '../ui/drawer/Drawer';
import drawerStyles from '../ui/drawer/Drawer.module.css';
import styles from '../employees/EmployeeDrawer.module.css';
import FormInput from '../ui/form/FormInput';
import { type Shift } from '../../pages/Shifts';

const parseTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

type BreakInfo = { minutes: number; error?: string; field?: string };
type ShiftInfo = { duration: number; crossesMidnight: boolean; error?: string };

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
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
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
        setBreakStart(shiftToEdit.breakStart ? shiftToEdit.breakStart.substring(0, 5) : '');
        setBreakEnd(shiftToEdit.breakEnd ? shiftToEdit.breakEnd.substring(0, 5) : '');
        setLateToleranceMinutes(String(shiftToEdit.lateToleranceMinutes));
        setEarlyExitToleranceMinutes(String(shiftToEdit.earlyExitToleranceMinutes));
      } else {
        setName('');
        setStartTime('08:00');
        setEndTime('17:00');
        setBreakStart('');
        setBreakEnd('');
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

  // Mola araligi opsiyonel: ikisi de bossa mola dusulmez
  const getBreakInfo = (): BreakInfo => {
    if (!breakStart && !breakEnd) return { minutes: 0 };
    if (!breakStart) return { minutes: 0, error: 'Mola başlangıç ve bitiş saati birlikte verilmelidir.', field: 'breakStart' };
    if (!breakEnd) return { minutes: 0, error: 'Mola başlangıç ve bitiş saati birlikte verilmelidir.', field: 'breakEnd' };

    const bStart = parseTime(breakStart);
    const bEnd = parseTime(breakEnd);
    if (bStart >= bEnd) {
      return { minutes: 0, error: 'Mola bitiş saati başlangıçtan sonra olmalıdır.', field: 'breakEnd' };
    }
    return { minutes: bEnd - bStart };
  };

  const getShiftInfo = (): ShiftInfo | null => {
    if (!startTime || !endTime) return null;

    const start = parseTime(startTime);
    let end = parseTime(endTime);
    let crossesMidnight = false;

    if (start === end) return { duration: 0, crossesMidnight: false, error: 'Başlangıç ve bitiş saati aynı olamaz.' };

    if (end < start) {
      crossesMidnight = true;
      end += 24 * 60;
    }

    const breakInfo = getBreakInfo();
    if (breakInfo.error) {
      return { duration: 0, crossesMidnight, error: breakInfo.error };
    }

    const duration = Math.max(0, end - start - breakInfo.minutes);

    return { duration, crossesMidnight };
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = 'Vardiya adı boş bırakılamaz';
    if (!startTime) errors.startTime = 'Başlangıç saati zorunludur';
    if (!endTime) errors.endTime = 'Bitiş saati zorunludur';
    
    const breakInfo = getBreakInfo();
    if (breakInfo.error && breakInfo.field) errors[breakInfo.field] = breakInfo.error;

    const lMins = parseInt(lateToleranceMinutes);
    if (isNaN(lMins) || lMins < 0) errors.lateToleranceMinutes = 'Geçerli bir tolerans girin';

    const eMins = parseInt(earlyExitToleranceMinutes);
    if (isNaN(eMins) || eMins < 0) errors.earlyExitToleranceMinutes = 'Geçerli bir tolerans girin';

    const info = getShiftInfo();
    if (info?.error && info.error.includes('saati aynı')) {
      errors.endTime = info.error;
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
        breakStart: breakStart ? breakStart + ':00' : null,
        breakEnd: breakEnd ? breakEnd + ':00' : null,
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

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      isDirty={isDirty}
      title={isEdit ? 'Vardiyayı Düzenle' : 'Yeni Vardiya'}
      subtitle={isEdit ? 'Vardiya saatlerini ve toleranslarını güncelleyin' : 'Sisteme yeni bir vardiya ekleyin'}
      footerLeft={
        isEdit && (
          <button
            type="button"
            className={styles.btnDelete}
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            Vardiyayı Sil
          </button>
        )
      }
      footerRight={
        <>
          <button
            type="button"
            className={drawerStyles.btnCancel}
            onClick={() => {
              if (isDirty) {
                confirm({
                  title: 'Kaydetmeden Çık',
                  message: 'Kaydedilmemiş değişiklikler var, çıkmak istediğinize emin misiniz?',
                  confirmText: 'Evet, Çık',
                  cancelText: 'Vazgeç'
                }).then(res => res && onClose());
              } else {
                onClose();
              }
            }}
            disabled={isSubmitting}
          >
            İptal
          </button>
          <button
            type="submit"
            form="shift-form"
            className={drawerStyles.btnSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </>
      }
    >
      {globalError && <div className={styles.globalError}>{globalError}</div>}
      
      <form id="shift-form" onSubmit={handleSubmit}>
        <FormInput
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
            label="Mola Başlangıç"
            type="time"
            value={breakStart}
            onChange={handleChange(setBreakStart)}
            error={fieldErrors.breakStart}
            hint="Boş bırakılırsa mola düşülmez."
          />
          <FormInput
            label="Mola Bitiş"
            type="time"
            value={breakEnd}
            onChange={handleChange(setBreakEnd)}
            error={fieldErrors.breakEnd}
          />
        </div>

        <div className={styles.row}>
          <FormInput
            label="Geç Kalma Tol. (dk)"
            type="number"
            min="0"
            value={lateToleranceMinutes}
            onChange={handleChange(setLateToleranceMinutes)}
            error={fieldErrors.lateToleranceMinutes}
            hint="Sadece bu dakika aşılırsa geç sayılır."
          />
          <FormInput
            label="Erken Çıkış Tol. (dk)"
            type="number"
            min="0"
            value={earlyExitToleranceMinutes}
            onChange={handleChange(setEarlyExitToleranceMinutes)}
            error={fieldErrors.earlyExitToleranceMinutes}
            hint="Sadece bu dakika aşılırsa erken çıktı sayılır."
          />
        </div>

        <div className={styles.infoBox}>
          {shiftInfo?.error ? (
            <span style={{ color: 'var(--color-error)' }}>{shiftInfo.error}</span>
          ) : shiftInfo ? (
            <>
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Süre:</span> {formatDuration(shiftInfo.duration)}
              {shiftInfo.crossesMidnight && (
                <span style={{ color: 'var(--color-info)', fontWeight: 'var(--font-weight-medium)' }}>
                  {' '}• Gece vardiyası (ertesi güne sarkıyor)
                </span>
              )}
            </>
          ) : (
            <span style={{ color: 'var(--color-text-disabled)' }}>
              Süre hesabı için geçerli başlangıç ve bitiş saati girin.
            </span>
          )}
        </div>

      </form>
    </Drawer>
  );
}

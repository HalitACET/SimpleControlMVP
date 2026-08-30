import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import api from '../../api/axios';
import { handleApiError } from '../../utils/errorHandler';
import { useToast } from '../ui/toast/ToastContext';
import { useConfirm } from '../ui/confirm/ConfirmDialogContext';
import FormInput from '../ui/form/FormInput';
import FormSelect from '../ui/form/FormSelect';
import Drawer from '../ui/drawer/Drawer';
import drawerStyles from '../ui/drawer/Drawer.module.css';
import styles from './WorkGroupDrawer.module.css';
import { type WorkGroup } from '../../pages/WorkGroups';
import { type Shift } from '../../pages/Shifts';

interface WorkGroupDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupToEdit: WorkGroup | null;
}

const DAYS_OF_WEEK = [
  { id: 1, name: 'Pazartesi' },
  { id: 2, name: 'Salı' },
  { id: 3, name: 'Çarşamba' },
  { id: 4, name: 'Perşembe' },
  { id: 5, name: 'Cuma' },
  { id: 6, name: 'Cumartesi' },
  { id: 7, name: 'Pazar' }
];

export default function WorkGroupDrawer({ isOpen, onClose, onSuccess, groupToEdit }: WorkGroupDrawerProps) {
  const [name, setName] = useState('');
  const [dailyWorkMinutes, setDailyWorkMinutes] = useState('480');
  const [days, setDays] = useState<Record<number, number | null>>({
    1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null
  });
  const [applyAllShiftId, setApplyAllShiftId] = useState<string>('');
  
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const isEdit = !!groupToEdit;

  useEffect(() => {
    if (isOpen) {
      setFieldErrors({});
      setGlobalError('');
      setIsDirty(false);
      setIsSubmitting(false);
      
      // Fetch shifts for dropdowns
      api.get('/admin/shifts').then(res => {
        setShifts(res.data);
      }).catch(err => {
        setGlobalError(handleApiError(err));
      });

      if (groupToEdit) {
        setName(groupToEdit.name);
        setDailyWorkMinutes(String(groupToEdit.dailyWorkMinutes));
        const newDays: Record<number, number | null> = {};
        groupToEdit.days.forEach(d => {
          newDays[d.dayOfWeek] = d.shiftId;
        });
        setDays(newDays);
      } else {
        setName('');
        setDailyWorkMinutes('480');
        setDays({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null });
      }

      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, groupToEdit]);

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
    return () => document.removeEventListener('keydown', handleKeyDown);
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

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = 'Grup adı boş bırakılamaz';
    const minutes = parseInt(dailyWorkMinutes);
    if (isNaN(minutes) || minutes <= 0) errors.dailyWorkMinutes = 'Geçerli bir çalışma süresi girin';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (!isDirty) setIsDirty(true);
    setFieldErrors({});
    setGlobalError('');
  };

  const handleDayChange = (dayOfWeek: number, shiftId: string) => {
    setDays(prev => ({
      ...prev,
      [dayOfWeek]: shiftId ? parseInt(shiftId) : null
    }));
    if (!isDirty) setIsDirty(true);
  };

  const handleApplyAll = () => {
    const val = applyAllShiftId ? parseInt(applyAllShiftId) : null;
    setDays({
      1: val, 2: val, 3: val, 4: val, 5: val, 6: val, 7: val
    });
    if (!isDirty) setIsDirty(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGlobalError('');

    try {
      const payload = { 
        name: name.trim(), 
        dailyWorkMinutes: parseInt(dailyWorkMinutes),
        days: Object.keys(days).map(day => ({
          dayOfWeek: parseInt(day),
          shiftId: days[parseInt(day)]
        }))
      };
      
      if (isEdit) {
        await api.put(`/admin/work-groups/${groupToEdit.id}`, payload);
        showToast('Çalışma grubu başarıyla güncellendi', 'success');
      } else {
        await api.post('/admin/work-groups', payload);
        showToast('Çalışma grubu başarıyla oluşturuldu', 'success');
      }
      setIsDirty(false);
      onSuccess();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.errorCode === 'DUPLICATE_WORK_GROUP_NAME') {
        setFieldErrors({ name: err.response.data.message });
      } else {
        setGlobalError(handleApiError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!groupToEdit) return;
    const confirmDelete = await confirm({
      title: 'Çalışma Grubunu Sil',
      message: 'Bu çalışma grubunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      confirmText: 'Evet, Sil',
      cancelText: 'Vazgeç',
      danger: true
    });
    if (!confirmDelete) return;

    setIsSubmitting(true);
    setGlobalError('');

    try {
      await api.delete(`/admin/work-groups/${groupToEdit.id}`);
      showToast('Çalışma grubu başarıyla silindi', 'success');
      setIsDirty(false);
      onSuccess();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.errorCode === 'WORK_GROUP_IN_USE') {
        setGlobalError(err.response.data.message);
      } else {
        setGlobalError(handleApiError(err));
      }
      setIsSubmitting(false);
    }
  };

  const shiftOptions = [
    { value: '', label: 'Tatil' },
    ...shifts.map(s => ({ value: String(s.id), label: s.name }))
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      isDirty={isDirty}
      width={560}
      title={isEdit ? 'Grubu Düzenle' : 'Yeni Grup'}
      subtitle={isEdit ? 'Çalışma grubu bilgilerini güncelleyin' : 'Sisteme yeni bir çalışma grubu ekleyin'}
      footerLeft={
        isEdit && (
          <button
            type="button"
            className={styles.btnDelete}
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            Grubu Sil
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
            form="workgroup-form"
            className={drawerStyles.btnSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </>
      }
    >
      {globalError && <div className={styles.globalError}>{globalError}</div>}
      
      <form id="workgroup-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className={styles.row}>
          <FormInput
            label="Grup Adı"
            value={name}
            onChange={handleChange(setName)}
            placeholder="Örn. Standart Ekip"
            error={fieldErrors.name}
          />
          <FormInput
            label="Günlük Çalışma (dk)"
            type="number"
            min="1"
            value={dailyWorkMinutes}
            onChange={handleChange(setDailyWorkMinutes)}
            error={fieldErrors.dailyWorkMinutes}
          />
        </div>

        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <div className={styles.tableHeaderTitle}>Vardiya Programı</div>
            <div className={styles.applyAllContainer}>
              <FormSelect 
                options={shiftOptions} 
                value={applyAllShiftId}
                onChange={(e) => setApplyAllShiftId(e.target.value)}
                containerStyle={{ marginBottom: 0, height: '36px' }}
              />
              <button type="button" className={styles.applyAllBtn} onClick={handleApplyAll}>
                Tümüne Uygula
              </button>
            </div>
          </div>

          {DAYS_OF_WEEK.map(day => {
            const shiftId = days[day.id];
            const shift = shifts.find(s => s.id === shiftId);
            
            return (
              <div key={day.id} className={styles.dayRow}>
                <div className={styles.dayName}>{day.name}</div>
                <div className={styles.daySelect}>
                  <FormSelect
                    options={shiftOptions}
                    value={shiftId ? String(shiftId) : ''}
                    onChange={(e) => handleDayChange(day.id, e.target.value)}
                    containerStyle={{ marginBottom: 0 }}
                  />
                </div>
                <div className={styles.dayInfo}>
                  {shift ? (
                    <>
                      {shift.startTime.substring(0, 5)} — {shift.endTime.substring(0, 5)}
                      {shift.crossesMidnight && <span className={styles.nightBadge}>Gece</span>}
                    </>
                  ) : (
                    <span>Çalışılmıyor</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </form>
    </Drawer>
  );
}

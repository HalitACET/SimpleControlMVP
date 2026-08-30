import { useState, useEffect } from 'react';
import api from '../../api/axios';
import FormSelect from '../ui/form/FormSelect';
import FormInput from '../ui/form/FormInput';
import { useToast } from '../ui/toast/ToastContext';
import Drawer from '../ui/drawer/Drawer';
import drawerStyles from '../ui/drawer/Drawer.module.css';

interface ManualScanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: { value: string; label: string }[];
}

export default function ManualScanDrawer({ isOpen, onClose, onSuccess, employees }: ManualScanDrawerProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [scanTime, setScanTime] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setEmployeeId('');
      
      // Default to current time for datetime-local
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setScanTime(now.toISOString().slice(0, 16));
      
      setNote('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !scanTime || !note) {
      showToast('Lütfen tüm zorunlu alanları doldurun.', 'error');
      return;
    }

    const selectedDate = new Date(scanTime);
    if (selectedDate > new Date()) {
      showToast('Gelecek bir tarih/saat seçilemez.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // POST /admin/scans/manual
      // Payload: { employeeId: number, scanTime: ISO_String_UTC_or_Local_depending_on_Jackson, note: string }
      // The backend expects `scanTime` to be parsed as Local Time, so we just send ISO format with timezone or basic local format.
      // Easiest is to send `scanTime + ':00'` as LocalDateTime can parse it.
      
      const payload = {
        employeeId: parseInt(employeeId, 10),
        scanTime: scanTime + ':00', // pad seconds for LocalDateTime parsing
        note
      };
      
      await api.post('/admin/scans/manual', payload);
      showToast('Manuel kayıt eklendi', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Kayıt eklenirken hata oluştu', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      isDirty={!!employeeId || !!note}
      title="Manuel Kayıt Ekle"
      subtitle="Sisteme geçmiş bir tarih için manuel okutma girin"
      footerRight={
        <>
          <button
            type="button"
            className={drawerStyles.btnCancel}
            onClick={onClose}
            disabled={isSubmitting}
          >
            İptal
          </button>
          <button
            type="submit"
            form="manual-scan-form"
            className={drawerStyles.btnSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </>
      }
    >
      <form id="manual-scan-form" onSubmit={handleSubmit}>
        <FormSelect
          label="Personel"
          options={employees}
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          required
        />
        
        <FormInput
          label="Tarih ve Saat"
          type="datetime-local"
          value={scanTime}
          onChange={(e) => setScanTime(e.target.value)}
          max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16)}
          required
        />
        
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <label style={{ display: 'block', fontSize: 'var(--font-size-label)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-sm)' }}>
            Açıklama <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            rows={3}
            style={{ width: '100%', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-xs)' }}>
            Manuel kayıt bir istisnadır, sebebi kayıt altına alınır.
          </div>
        </div>
      </form>
    </Drawer>
  );
}

import { useEffect, useState } from 'react';
import Drawer from '../ui/drawer/Drawer';
import drawerStyles from '../ui/drawer/Drawer.module.css';
import FormInput from '../ui/form/FormInput';
import api from '../../api/axios';
import { useToast } from '../ui/toast/ToastContext';
import { useConfirm } from '../ui/confirm/ConfirmDialogContext';

export interface Department {
  id: number;
  name: string;
  description: string;
  active: boolean;
  employeeCount: number;
}

interface DepartmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  department?: Department | null;
}

export function DepartmentDrawer({ isOpen, onClose, onSuccess, department }: DepartmentDrawerProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const isEditing = !!department;

  useEffect(() => {
    if (isOpen) {
      setName(department?.name || '');
      setDescription(department?.description || '');
      setGlobalError(null);
      setNameError(null);
    }
  }, [isOpen, department]);

  const handleSave = async () => {
    setGlobalError(null);
    setNameError(null);

    if (!name.trim()) {
      setNameError('Departman adı zorunludur');
      return;
    }

    setSaving(true);
    try {
      const payload = { name, description };
      if (isEditing) {
        await api.put(`/admin/departments/${department.id}`, payload);
        showToast('Departman güncellendi', 'success');
      } else {
        await api.post('/admin/departments', payload);
        showToast('Departman eklendi', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const errCode = err.response?.data?.errorCode;
      const errMsg = err.response?.data?.message || 'Bir hata oluştu';
      
      if (errCode === 'DUPLICATE_DEPARTMENT_NAME') {
        setNameError(errMsg);
      } else {
        setGlobalError(errMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setGlobalError(null);
    const confirmed = await confirm({
      title: 'Departmanı Sil',
      message: `"${department?.name}" departmanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      confirmText: 'Evet, Sil',
      cancelText: 'İptal',
      danger: true
    });

    if (!confirmed) return;

    try {
      await api.delete(`/admin/departments/${department!.id}`);
      showToast('Departman silindi', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Silme işlemi başarısız';
      setGlobalError(errMsg); // DEPARTMENT_HAS_EMPLOYEES hatası burada gösterilecek
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Departmanı Düzenle' : 'Yeni Departman'}
      subtitle={isEditing ? 'Departman bilgilerini güncelleyin' : 'Sisteme yeni bir departman ekleyin'}
      footerLeft={
        isEditing ? (
          <button
            type="button"
            className={drawerStyles.btnCancel}
            style={{ color: 'var(--color-error)' }}
            onClick={handleDelete}
          >
            Departmanı Sil
          </button>
        ) : undefined
      }
      footerRight={
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button type="button" className={drawerStyles.btnCancel} onClick={onClose}>İptal</button>
          <button type="button" className={drawerStyles.btnSave} onClick={handleSave} disabled={saving}>
            {saving ? 'KAYDEDİLİYOR...' : 'KAYDET'}
          </button>
        </div>
      }
    >
      {globalError && (
        <div style={{
          padding: 'var(--space-md)',
          backgroundColor: 'var(--color-error-light, #fde8e8)',
          color: 'var(--color-error)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--space-lg)',
          fontSize: 'var(--font-size-sm)'
        }}>
          {globalError}
        </div>
      )}

      <FormInput
        label="Departman Adı"
        required
        error={nameError || undefined}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Örn: İnsan Kaynakları"
        maxLength={100}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
        <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text)' }}>
          Açıklama (Opsiyonel)
        </label>
        <textarea
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Departman hakkında kısa bilgi"
          rows={4}
          maxLength={255}
          style={{ resize: 'vertical' }}
        />
      </div>
    </Drawer>
  );
}

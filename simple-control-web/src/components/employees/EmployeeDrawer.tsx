import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { handleApiError } from '../../utils/errorHandler';
import { useToast } from '../ui/toast/ToastContext';
import { useConfirm } from '../ui/confirm/ConfirmDialogContext';
import FormInput from '../ui/form/FormInput';
import FormSelect from '../ui/form/FormSelect';
import Badge from '../ui/badge/Badge';
import { type WorkGroupListResponse } from '../../pages/WorkGroups';
import Drawer from '../ui/drawer/Drawer';
import drawerStyles from '../ui/drawer/Drawer.module.css';
import styles from './EmployeeDrawer.module.css';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  cardNo: string;
  workGroupId?: number;
  departmentId?: number;
}

interface ExistingAccount {
  id: number;
  username: string;
  active: boolean;
}

interface EmployeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeToEdit: Employee | null;
}

export default function EmployeeDrawer({ isOpen, onClose, onSuccess, employeeToEdit }: EmployeeDrawerProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [workGroupId, setWorkGroupId] = useState('');
  const [workGroups, setWorkGroups] = useState<WorkGroupListResponse[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);
  
  const [password, setPassword] = useState('');
  // Düzenleme modunda: bu personele ait mevcut hesap (varsa)
  const [existingAccount, setExistingAccount] = useState<ExistingAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string; cardNo?: string; password?: string }>({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const isEdit = !!employeeToEdit;

  useEffect(() => {
    if (isOpen) {
      setTriggerElement(document.activeElement as HTMLElement);
      setFieldErrors({});
      setGlobalError('');
      setIsDirty(false);
      setIsSubmitting(false);
      setPassword('');
      setExistingAccount(null);

      api.get('/admin/work-groups').then(res => setWorkGroups(res.data)).catch(err => setGlobalError(handleApiError(err)));
      api.get('/admin/departments').then(res => setDepartments(res.data)).catch(err => setGlobalError(handleApiError(err)));

      if (employeeToEdit) {
        setFirstName(employeeToEdit.firstName);
        setLastName(employeeToEdit.lastName);
        setCardNo(employeeToEdit.cardNo);
        setWorkGroupId(employeeToEdit.workGroupId ? String(employeeToEdit.workGroupId) : '');
        setDepartmentId(employeeToEdit.departmentId ? String(employeeToEdit.departmentId) : '');

        // Personelin mevcut hesabını bul
        setAccountLoading(true);
        api.get('/admin/users-v2')
          .then(res => {
            const found = res.data.find((u: any) => u.employeeId === employeeToEdit.id);
            setExistingAccount(found || null);
          })
          .catch(() => setExistingAccount(null))
          .finally(() => setAccountLoading(false));
      } else {
        setFirstName('');
        setLastName('');
        setCardNo('');
        setWorkGroupId('');
        setDepartmentId('');
      }

      setTimeout(() => { firstInputRef.current?.focus(); }, 100);
    } else {
      if (triggerElement) triggerElement.focus();
    }
  }, [isOpen, employeeToEdit]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleCloseRequest(); return; }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
          } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
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
    const errors: typeof fieldErrors = {};
    if (!firstName.trim()) errors.firstName = 'Ad boş bırakılamaz';
    else if (firstName.length > 75) errors.firstName = 'Ad en fazla 75 karakter olabilir';

    if (!lastName.trim()) errors.lastName = 'Soyad boş bırakılamaz';
    else if (lastName.length > 75) errors.lastName = 'Soyad en fazla 75 karakter olabilir';

    if (!cardNo.trim()) errors.cardNo = 'Kart numarası boş bırakılamaz';
    else if (cardNo.length > 50) errors.cardNo = 'Kart numarası en fazla 50 karakter olabilir';

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
        firstName, 
        lastName, 
        cardNo, 
        workGroupId: workGroupId ? parseInt(workGroupId) : null,
        departmentId: departmentId ? parseInt(departmentId) : null
      };
      let savedEmployeeId: number;

      if (isEdit) {
        await api.put(`/admin/employees/${employeeToEdit.id}`, payload);
        savedEmployeeId = employeeToEdit.id;
        showToast('Personel başarıyla güncellendi', 'success');
      } else {
        const res = await api.post('/admin/employees', payload);
        savedEmployeeId = res.data.id;
        showToast('Personel başarıyla oluşturuldu', 'success');
      }

      // Hesap alanları doldurulmuşsa ve bu personelin henüz hesabı yoksa hesap oluştur
      // Sıralama: önce personel kaydedilir, ardından (başarıyla) hesap oluşturulur.
      // Hesap oluşturma başarısız olsa bile personel kaydı korunur.
      const showAccountFields = !isEdit || !existingAccount;
      if (showAccountFields && password.trim()) {
        try {
          await api.post('/admin/users-v2', {
            employeeId: savedEmployeeId,
            password
          });
          showToast(`Hesap oluşturuldu — Giriş kimliği (Kart No): ${cardNo}, Şifre: ${password}`, 'success');
        } catch (accountErr: any) {
          const reason = accountErr.response?.data?.message || 'Bilinmeyen hata';
          // Personel kaydedildi ama hesap oluşturulamadı — kullanıcıya açıkça bildir
          showToast(`Personel kaydedildi ancak hesap oluşturulamadı: ${reason}`, 'error');
        }
      }

      setIsDirty(false);
      onSuccess();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.errorCode === 'DUPLICATE_CARD_NO') {
        setFieldErrors({ cardNo: err.response.data.message });
      } else {
        setGlobalError(handleApiError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!employeeToEdit) return;
    const confirmDelete = await confirm({
      title: 'Personeli Sil',
      message: 'Bu personeli silmek istediğinize emin misiniz?\n\nPersonel kaydı korunur ancak listede görünmez (Geri alınabilir).',
      confirmText: 'Evet, Sil',
      cancelText: 'Vazgeç',
      danger: true
    });
    if (!confirmDelete) return;

    setIsSubmitting(true);
    setGlobalError('');

    try {
      await api.delete(`/admin/employees/${employeeToEdit.id}`);
      showToast('Personel başarıyla pasife alındı', 'success');
      setIsDirty(false);
      onSuccess();
    } catch (err: unknown) {
      setGlobalError(handleApiError(err));
      setIsSubmitting(false);
    }
  };

  // Düzenleme modunda hesap varsa: salt okunur göster + link
  // Düzenleme modunda hesap yoksa (veya yeni personel): hesap alanlarını göster
  const renderAccountSection = () => {
    if (accountLoading) {
      return (
        <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-body-sm)' }}>
          Hesap bilgisi yükleniyor...
        </div>
      );
    }

    if (isEdit && existingAccount) {
      // Salt okunur hesap bilgisi
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body)' }}>
              {existingAccount.username}
            </span>
            <Badge variant={existingAccount.active ? 'success' : 'neutral'}>
              {existingAccount.active ? 'Aktif' : 'Pasif'}
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => navigate('/users')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--color-accent)',
              fontSize: 'var(--font-size-body-sm)',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Hesap ayarları →
          </button>
        </div>
      );
    }

    // Yeni personel veya hesabı olmayan mevcut personel
    return (
      <>
        <FormInput
          label="Başlangıç Şifresi"
          type="password"
          value={password}
          onChange={handleChange(setPassword)}
          placeholder="Geçici şifre"
          error={fieldErrors.password}
          hint="Boş bırakılırsa hesap oluşturulmaz. İlk girişte değiştirilmesi zorunludur. Personel giriş kimliği olarak kart numarasını kullanacaktır."
        />
      </>
    );
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      isDirty={isDirty}
      title={isEdit ? 'Personeli Düzenle' : 'Yeni Personel'}
      subtitle={isEdit ? 'Personel bilgilerini güncelleyin' : 'Sisteme yeni bir personel ekleyin'}
      footerLeft={
        isEdit && (
          <button
            type="button"
            className={styles.btnDelete}
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            Personeli Sil
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
            form="employee-form"
            className={drawerStyles.btnSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </>
      }
    >
      {globalError && <div className={styles.globalError}>{globalError}</div>}
      
      <form id="employee-form" onSubmit={handleSubmit}>
        <div className={styles.row}>
          <FormInput
            label="Ad"
            value={firstName}
            onChange={handleChange(setFirstName)}
            placeholder="Örn. Mehmet"
            error={fieldErrors.firstName}
          />
          <FormInput
            label="Soyad"
            value={lastName}
            onChange={handleChange(setLastName)}
            placeholder="Örn. Arslan"
            error={fieldErrors.lastName}
          />
        </div>

        <FormInput
          label="Kart Numarası"
          value={cardNo}
          onChange={handleChange(setCardNo)}
          placeholder="Örn. 4821"
          error={fieldErrors.cardNo}
          hint="Terminalde okutulan kartın üzerindeki numara."
          isMono
        />
        <FormSelect
          label="Çalışma Grubu"
          value={workGroupId}
          onChange={(e) => {
            setWorkGroupId(e.target.value);
            if (!isDirty) setIsDirty(true);
          }}
          options={[{ value: '', label: 'Atanmamış' }, ...workGroups.map(wg => ({ value: String(wg.id), label: wg.name }))]}
        />
        <FormSelect
          label="Departman"
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            if (!isDirty) setIsDirty(true);
          }}
          options={[{ value: '', label: 'Atanmamış' }, ...departments.map(d => ({ value: String(d.id), label: d.name }))]}
        />

        {/* Uygulama Erişimi bölümü */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          marginTop: 'var(--space-xl)',
          paddingTop: 'var(--space-xl)'
        }}>
          <div style={{
            fontSize: 'var(--font-size-label)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 'var(--space-lg)'
          }}>
            Uygulama Erişimi
          </div>
          {renderAccountSection()}
        </div>
      </form>
    </Drawer>
  );
}

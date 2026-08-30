import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import api from '../../api/axios';
import { handleApiError } from '../../utils/errorHandler';
import { useToast } from '../ui/toast/ToastContext';
import { useConfirm } from '../ui/confirm/ConfirmDialogContext';
import FormInput from '../ui/form/FormInput';
import FormSelect from '../ui/form/FormSelect';
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
  
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string; cardNo?: string }>({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const isEdit = !!employeeToEdit;

  useEffect(() => {
    if (isOpen) {
      setTriggerElement(document.activeElement as HTMLElement);
      setFieldErrors({});
      setGlobalError('');
      setIsDirty(false);
      setIsSubmitting(false);

      api.get('/admin/work-groups').then(res => setWorkGroups(res.data)).catch(err => setGlobalError(handleApiError(err)));

      if (employeeToEdit) {
        setFirstName(employeeToEdit.firstName);
        setLastName(employeeToEdit.lastName);
        setCardNo(employeeToEdit.cardNo);
        setWorkGroupId(employeeToEdit.workGroupId ? String(employeeToEdit.workGroupId) : '');
      } else {
        setFirstName('');
        setLastName('');
        setCardNo('');
        setWorkGroupId('');
      }

      // Focus first input on open
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    } else {
      if (triggerElement) {
        triggerElement.focus();
      }
    }
  }, [isOpen, employeeToEdit]);

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

  const validate = () => {
    const errors: { firstName?: string; lastName?: string; cardNo?: string } = {};
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
      const payload = { firstName, lastName, cardNo, workGroupId: workGroupId ? parseInt(workGroupId) : null };
      if (isEdit) {
        await api.put(`/admin/employees/${employeeToEdit.id}`, payload);
        showToast('Personel başarıyla güncellendi', 'success');
      } else {
        await api.post('/admin/employees', payload);
        showToast('Personel başarıyla oluşturuldu', 'success');
      }
      setIsDirty(false); // don't warn on close
      onSuccess(); // parent should call onClose
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
      </form>
    </Drawer>
  );
}

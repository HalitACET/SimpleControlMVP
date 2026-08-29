import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';
import { handleApiError } from '../../utils/errorHandler';
import { useToast } from '../ui/toast/ToastContext';
import FormInput from '../ui/form/FormInput';
import styles from './EmployeeDrawer.module.css';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  cardNo: string;
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
  
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string; cardNo?: string }>({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const { showToast } = useToast();
  const isEdit = !!employeeToEdit;

  useEffect(() => {
    if (isOpen) {
      setTriggerElement(document.activeElement as HTMLElement);
      setFieldErrors({});
      setGlobalError('');
      setIsDirty(false);
      setIsSubmitting(false);

      if (employeeToEdit) {
        setFirstName(employeeToEdit.firstName);
        setLastName(employeeToEdit.lastName);
        setCardNo(employeeToEdit.cardNo);
      } else {
        setFirstName('');
        setLastName('');
        setCardNo('');
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

  const handleCloseRequest = () => {
    if (isDirty) {
      const confirmClose = window.confirm('Kaydedilmemiş değişiklikler var, çıkmak istediğinize emin misiniz?');
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
      const payload = { firstName, lastName, cardNo };
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
    const confirmDelete = window.confirm('Bu personeli silmek istediğinize emin misiniz?\n\nPersonel kaydı korunur ancak listede görünmez (Geri alınabilir).');
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

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={handleCloseRequest}></div>
      <div className={styles.drawer} ref={drawerRef} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{isEdit ? 'Personeli Düzenle' : 'Yeni Personel'}</div>
            <div className={styles.subtitle}>{isEdit ? 'Personel bilgilerini güncelleyin' : 'Sisteme yeni bir personel ekleyin'}</div>
          </div>
          <button className={styles.closeButton} onClick={handleCloseRequest} title="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {globalError && <div className={styles.globalError}>{globalError}</div>}
          
          <form id="employee-form" onSubmit={handleSubmit}>
            <div className={styles.row}>
              <FormInput
                ref={firstInputRef}
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
                Personeli Sil
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
              form="employee-form"
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

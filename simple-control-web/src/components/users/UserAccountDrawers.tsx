import { useState, useEffect, type FormEvent } from 'react';
import api from '../../api/axios';
import Drawer from '../ui/drawer/Drawer';
import drawerStyles from '../ui/drawer/Drawer.module.css';
import FormInput from '../ui/form/FormInput';
import FormSelect from '../ui/form/FormSelect';
import Badge from '../ui/badge/Badge';
import { useToast } from '../ui/toast/ToastContext';
import { useConfirm } from '../ui/confirm/ConfirmDialogContext';

export interface UserAccount {
  id: number;
  username: string;
  active: boolean;
  mustChangePassword: boolean;
  employeeId: number;
  employeeName: string;
  cardNo: string;
}

interface EmployeeOption {
  id: number;
  firstName: string;
  lastName: string;
  cardNo: string;
}

interface CreateUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingEmployeeIds: Set<number>;
}

export function CreateUserDrawer({ isOpen, onClose, onSuccess, existingEmployeeIds }: CreateUserDrawerProps) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ employeeId?: string; username?: string }>({});
  const [isDirty, setIsDirty] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setEmployeeId('');
      setUsername('');
      setPassword('');
      setFieldErrors({});
      setIsDirty(false);
      // Tüm personeli çek — hesabı olanları filtreleyeceğiz
      api.get('/admin/employees')
        .then(res => setEmployees(res.data))
        .catch(() => showToast('Personel listesi alınamadı', 'error'));
    }
  }, [isOpen]);

  // Hesabı olmayan personeller — existingEmployeeIds kullanarak çıkarıyoruz
  // Bu sayede kullanıcı var olan bir personeli seçip hata almaz
  const availableEmployees = employees.filter(e => !existingEmployeeIds.has(e.id));

  const employeeOptions = [
    { value: '', label: availableEmployees.length === 0 ? 'Tüm personelin hesabı var' : 'Personel seçin...' },
    ...availableEmployees.map(e => ({
      value: String(e.id),
      label: `${e.firstName} ${e.lastName} (${e.cardNo})`
    }))
  ];

  const handleChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    setIsDirty(true);
    setFieldErrors({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: { employeeId?: string; username?: string } = {};
    if (!employeeId) errors.employeeId = 'Personel seçimi zorunludur';
    if (!username.trim()) errors.username = 'Kullanıcı adı zorunludur';
    if (!password.trim()) {
      showToast('Başlangıç şifresi boş bırakılamaz', 'error');
      return;
    }
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setIsSubmitting(true);
    try {
      await api.post('/admin/users-v2', {
        employeeId: parseInt(employeeId),
        username: username.trim(),
        password
      });
      // Şifre bir daha gösterilemiyor — toast'ta göster
      showToast(`Hesap oluşturuldu — Kullanıcı adı: ${username.trim()}, Şifre: ${password}`, 'success');
      setIsDirty(false);
      onSuccess();
    } catch (err: any) {
      const errorCode = err.response?.data?.errorCode;
      if (errorCode === 'DUPLICATE_USERNAME') {
        setFieldErrors({ username: err.response.data.message });
      } else if (errorCode === 'DUPLICATE_EMPLOYEE_ACCOUNT') {
        setFieldErrors({ employeeId: err.response.data.message });
      } else {
        showToast(err.response?.data?.message || 'Hesap oluşturulamadı', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      isDirty={isDirty}
      title="Yeni Hesap"
      subtitle="Personel için giriş hesabı oluşturun"
      footerRight={
        <>
          <button type="button" className={drawerStyles.btnCancel} onClick={onClose} disabled={isSubmitting}>
            İptal
          </button>
          <button type="submit" form="create-user-form" className={drawerStyles.btnSave} disabled={isSubmitting}>
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit}>
        <FormSelect
          label="Personel"
          options={employeeOptions}
          value={employeeId}
          onChange={handleChange(setEmployeeId) as any}
          error={fieldErrors.employeeId}
          required
        />
        <FormInput
          label="Kullanıcı Adı"
          value={username}
          onChange={handleChange(setUsername) as any}
          placeholder="Örn. mehmet.yilmaz"
          error={fieldErrors.username}
          required
        />
        <FormInput
          label="Başlangıç Şifresi"
          type="password"
          value={password}
          onChange={handleChange(setPassword) as any}
          placeholder="Geçici şifre girin"
          hint="Personel ilk girişte bu şifreyi değiştirmek zorunda kalacak."
          required
        />
      </form>
    </Drawer>
  );
}

interface EditUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserAccount | null;
}

export function EditUserDrawer({ isOpen, onClose, onSuccess, user }: EditUserDrawerProps) {
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
    }
  }, [isOpen]);

  if (!user) return null;

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Yeni şifre boş bırakılamaz', 'error');
      return;
    }
    setIsResetting(true);
    try {
      await api.put(`/admin/users-v2/${user.id}/password`, { newPassword });
      showToast(`Şifre sıfırlandı — Yeni şifre: ${newPassword}`, 'success');
      setNewPassword('');
      onSuccess();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Şifre sıfırlanamadı', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleStatus = async () => {
    // Pasife alırken onay sor
    if (user.active) {
      const ok = await confirm({
        title: 'Hesabı Pasife Al',
        message: `"${user.username}" hesabı pasife alınacak. Bu hesap giriş yapamayacak. Devam etmek istiyor musunuz?`,
        confirmText: 'Pasife Al',
        cancelText: 'Vazgeç',
        danger: true
      });
      if (!ok) return;
    }

    setIsTogglingStatus(true);
    try {
      await api.put(`/admin/users-v2/${user.id}/status`, { active: !user.active });
      showToast(user.active ? 'Hesap pasife alındı' : 'Hesap aktif edildi', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Durum güncellenemedi', 'error');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const divider = { borderTop: '1px solid var(--color-border)', margin: 'var(--space-xl) 0' };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Hesap Detayı"
      subtitle="Hesap bilgilerini görüntüleyin ve yönetin"
    >
      {/* Salt okunur bilgiler */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ fontSize: 'var(--font-size-label)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>
            Kullanıcı Adı
          </div>
          <div style={{ fontSize: 'var(--font-size-body)', fontFamily: 'var(--font-mono)', background: 'var(--color-surface-sunken)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            {user.username}
          </div>
        </div>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ fontSize: 'var(--font-size-label)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>
            Personel
          </div>
          <div style={{ fontSize: 'var(--font-size-body)', background: 'var(--color-surface-sunken)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            {user.employeeName} <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-body-sm)' }}>({user.cardNo})</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-label)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Durum</div>
            <Badge variant={user.active ? 'success' : 'neutral'}>{user.active ? 'Aktif' : 'Pasif'}</Badge>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-label)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Şifre Durumu</div>
            {user.mustChangePassword
              ? <Badge variant="warning">Değiştirilmeli</Badge>
              : <Badge variant="success">Güncellendi</Badge>}
          </div>
        </div>
      </div>

      <div style={divider} />

      {/* Şifre sıfırlama */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-md)' }}>
          Şifre Sıfırla
        </div>
        <form id="reset-password-form" onSubmit={handleResetPassword}>
          <FormInput
            label="Yeni Şifre"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Yeni geçici şifre girin"
          />
          <button
            type="submit"
            disabled={isResetting || !newPassword.trim()}
            style={{
              height: '36px',
              padding: '0 var(--space-lg)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-body)',
              cursor: isResetting || !newPassword.trim() ? 'not-allowed' : 'pointer',
              opacity: isResetting || !newPassword.trim() ? 0.6 : 1
            }}
          >
            {isResetting ? 'Sıfırlanıyor...' : 'Şifreyi Sıfırla'}
          </button>
        </form>
      </div>

      <div style={divider} />

      {/* Durum değiştirme */}
      <div>
        <div style={{ fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-xs)' }}>
          Hesap Durumu
        </div>
        <div style={{ fontSize: 'var(--font-size-body-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
          {user.active
            ? 'Hesabı pasife almak girişi engeller.'
            : 'Hesabı aktif etmek personelin giriş yapmasını sağlar.'}
        </div>
        <button
          onClick={handleToggleStatus}
          disabled={isTogglingStatus}
          style={{
            height: '36px',
            padding: '0 var(--space-lg)',
            border: `1px solid ${user.active ? 'var(--color-error)' : 'var(--color-success)'}`,
            background: 'transparent',
            color: user.active ? 'var(--color-error)' : 'var(--color-success)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-body)',
            cursor: isTogglingStatus ? 'not-allowed' : 'pointer',
            opacity: isTogglingStatus ? 0.6 : 1
          }}
        >
          {isTogglingStatus ? 'Güncelleniyor...' : user.active ? 'Pasife Al' : 'Aktif Et'}
        </button>
      </div>
    </Drawer>
  );
}

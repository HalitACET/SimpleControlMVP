import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';
import { handleApiError } from '../../utils/errorHandler';
import { useToast } from '../ui/toast/ToastContext';
import styles from './ExcludeScanModal.module.css';

interface ExcludeScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scan: {
    id: number;
    employeeName: string;
    scannedAt: string;
    locationName: string | null;
  } | null;
}

const PREDEFINED_REASONS = [
  'Yanlış okutma',
  'Test kaydı',
  'Cihaz hatası',
  'Personel talebi',
  'Mükerrer kayıt'
];

export default function ExcludeScanModal({ isOpen, onClose, onSuccess, scan }: ExcludeScanModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!scan || !reason.trim()) return;

    setLoading(true);
    try {
      await api.put(`/admin/scans/${scan.id}/exclude`, { reason });
      showToast('Kayıt iptal edildi', 'success');
      onSuccess();
    } catch (err) {
      showToast(handleApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !scan) return null;

  const formattedDate = (() => {
    if (!scan.scannedAt) return '—';
    const date = scan.scannedAt.substring(0, 10).split('-');
    const time = scan.scannedAt.substring(11, 16);
    return `${date[2]}.${date[1]}.${date[0]} ${time}`;
  })();

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        
        <div className={styles.header}>
          <h2 className={styles.title}>Hareket İptali</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.summary}>
            <div><b>Personel:</b> {scan.employeeName}</div>
            <div><b>Tarih / Saat:</b> {formattedDate}</div>
            <div><b>Lokasyon:</b> {scan.locationName || '—'}</div>
          </div>

          <div className={styles.reasonsWrapper}>
            <div className={styles.reasonsLabel}>Hazır Sebepler</div>
            <div className={styles.reasonTags}>
              {PREDEFINED_REASONS.map(r => (
                <button 
                  key={r} 
                  className={styles.reasonTag}
                  onClick={() => setReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <textarea 
            className={styles.textarea}
            placeholder="İptal sebebini yazın..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose} disabled={loading}>
            Vazgeç
          </button>
          <button 
            className={styles.btnSubmit} 
            onClick={handleSubmit} 
            disabled={loading || !reason.trim()}
          >
            {loading ? 'İşleniyor...' : 'İptal Et'}
          </button>
        </div>

      </div>
    </div>
  );
}

import { MapPin, CircleDot, Edit2, Trash2, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Location } from './Locations';
import api from '../../api/axios';
import { handleApiError } from '../../utils/errorHandler';
import { useToast } from '../../components/ui/toast/ToastContext';
import { useConfirm } from '../../components/ui/confirm/ConfirmDialogContext';
import styles from './LocationCard.module.css';

interface LocationCardProps {
  location: Location;
  onEdit: () => void;
  onRefresh: () => void;
  onPrint: () => void;
}

export default function LocationCard({ location, onEdit, onRefresh, onPrint }: LocationCardProps) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Lokasyon Sil',
      message: `${location.name} lokasyonunu silmek istediğinize emin misiniz?`,
      danger: true,
      confirmText: 'Sil',
    });

    if (isConfirmed) {
      try {
        await api.delete(`/admin/locations/${location.id}`);
        showToast('Lokasyon başarıyla silindi', 'success');
        onRefresh();
      } catch (err) {
        showToast(handleApiError(err), 'error');
      }
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{location.name}</h3>
          <span className={styles.code}>KOD: {location.code}</span>
        </div>
        
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <MapPin size={16} className={styles.detailIcon} />
            <span>{location.latitude}, {location.longitude}</span>
          </div>
          <div className={styles.detailRow}>
            <CircleDot size={16} className={styles.detailIcon} />
            <span>{location.radiusMeters} m</span>
          </div>
        </div>

        <div className={styles.qrContainer} onClick={onPrint} title="Yazdır">
          <QRCodeSVG 
            value={`PDKS:${import.meta.env.VITE_FIRM_ID || 'SIMPLE_CONTROL'}:${location.code}`} 
            size={120} 
            level="H" 
          />
          <div className={styles.qrOverlay}>
            <Printer size={24} />
            <span>Yazdır</span>
          </div>
        </div>
      </div>
      
      <div className={styles.actions}>
        <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={onEdit}>
          <Edit2 size={16} />
          Düzenle
        </button>
        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={handleDelete}>
          <Trash2 size={16} />
          Sil
        </button>
      </div>
    </div>
  );
}

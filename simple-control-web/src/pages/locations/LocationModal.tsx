import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import type { Location } from './Locations';
import api from '../../api/axios';
import { handleApiError } from '../../utils/errorHandler';
import { useToast } from '../../components/ui/toast/ToastContext';
import FormInput from '../../components/ui/form/FormInput';
import LocationMap from './LocationMap';
import styles from './LocationModal.module.css';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  locationToEdit: Location | null;
}

export default function LocationModal({ isOpen, onClose, onSuccess, locationToEdit }: LocationModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [latitude, setLatitude] = useState<string>('39.0');
  const [longitude, setLongitude] = useState<string>('35.0');
  const [radius, setRadius] = useState<string>('100');
  const [loading, setLoading] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    if (locationToEdit) {
      setName(locationToEdit.name);
      setCode(locationToEdit.code);
      setLatitude(locationToEdit.latitude.toString());
      setLongitude(locationToEdit.longitude.toString());
      setRadius(locationToEdit.radiusMeters.toString());
    }
  }, [locationToEdit]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast('Tarayıcınız konum servisini desteklemiyor.', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        showToast('Tahmini konum alındı. Haritadan işaretçiyi sürükleyerek hassaslaştırabilirsiniz.', 'success');
      },
      (error) => {
        let msg = 'Konum alınamadı.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Konum izni reddedildi.';
        }
        showToast(msg, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMapSelect = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
  };

  const handleSubmit = async () => {
    if (!name || !code || !latitude || !longitude || !radius) {
      showToast('Lütfen tüm alanları doldurun.', 'error');
      return;
    }

    setLoading(true);
    const payload = {
      name,
      code,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusMeters: parseInt(radius, 10),
    };

    try {
      if (locationToEdit) {
        await api.put(`/admin/locations/${locationToEdit.id}`, payload);
        showToast('Lokasyon güncellendi', 'success');
      } else {
        await api.post('/admin/locations', payload);
        showToast('Lokasyon oluşturuldu', 'success');
      }
      onSuccess();
    } catch (err) {
      showToast(handleApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        
        <div className={styles.header}>
          <h2 className={styles.title}>{locationToEdit ? 'Lokasyon Düzenle' : 'Yeni Lokasyon'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <FormInput
                label="Lokasyon Adı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ana Bina"
                autoFocus
              />
            </div>
            
            <div className={styles.formGroup}>
              <FormInput
                label="Kod"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Örn: ANA_BINA"
                isMono
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <FormInput
                  label="Enlem (Latitude)"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  isMono
                />
              </div>
              <div className={styles.formGroup}>
                <FormInput
                  label="Boylam (Longitude)"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  isMono
                />
              </div>
            </div>

            <button type="button" className={styles.btnGetLocation} onClick={handleGetLocation}>
              <MapPin size={16} />
              Konumumu Al
            </button>

            <div className={styles.formGroup}>
              <FormInput
                label="Yarıçap (Metre)"
                type="number"
                min="10"
                max="5000"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.mapSection}>
            <LocationMap
              latitude={parseFloat(latitude) || 39.0}
              longitude={parseFloat(longitude) || 35.0}
              radiusMeters={parseInt(radius, 10) || 0}
              onLocationSelect={handleMapSelect}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose} disabled={loading}>
            İptal
          </button>
          <button className={styles.btnSave} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>

      </div>
    </div>
  );
}

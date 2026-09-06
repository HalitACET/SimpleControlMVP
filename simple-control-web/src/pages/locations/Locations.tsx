import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../../api/axios';
import { handleApiError } from '../../utils/errorHandler';
import { useToast } from '../../components/ui/toast/ToastContext';
import LocationCard from './LocationCard';
import LocationModal from './LocationModal';
import LocationPrintModal from './LocationPrintModal';
import styles from './Locations.module.css';

export interface Location {
  id: number;
  firmId: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  active: boolean;
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null);
  const [printLocation, setPrintLocation] = useState<Location | null>(null);

  const { showToast } = useToast();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/locations');
      setLocations(res.data);
    } catch (err) {
      showToast(handleApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleEdit = (location: Location) => {
    setLocationToEdit(location);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setLocationToEdit(null);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchLocations();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lokasyonlar</h1>
        <button className={styles.btnNew} onClick={handleNew}>
          <Plus size={18} />
          Yeni Lokasyon
        </button>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Yükleniyor...</div>
      ) : locations.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Henüz lokasyon bulunmamaktadır.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {locations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              onEdit={() => handleEdit(loc)}
              onRefresh={fetchLocations}
              onPrint={() => setPrintLocation(loc)}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <LocationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          locationToEdit={locationToEdit}
        />
      )}

      <LocationPrintModal
        isOpen={!!printLocation}
        onClose={() => setPrintLocation(null)}
        location={printLocation}
      />
    </div>
  );
}

import { QRCodeSVG } from 'qrcode.react';
import { Printer, X } from 'lucide-react';
import type { Location } from './Locations';
import styles from './LocationPrintModal.module.css';

interface LocationPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location | null;
}

export default function LocationPrintModal({ isOpen, onClose, location }: LocationPrintModalProps) {
  if (!isOpen || !location) return null;

  const firmId = import.meta.env.VITE_FIRM_ID || 'SIMPLE_CONTROL';
  const qrValue = `PDKS:${firmId}:${location.code}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.printArea}>
          <div className={styles.firmName}>{firmId === 'SIMPLE_CONTROL' ? 'Simple Control' : firmId}</div>
          <div className={styles.locationName}>{location.name}</div>
          
          <div className={styles.qrWrapper}>
            <QRCodeSVG value={qrValue} size={300} level="H" />
          </div>
          
          <div className={styles.instruction}>
            Simple Control uygulamasıyla okutun
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose}>
            <X size={16} />
            Kapat
          </button>
          <button className={styles.btnPrint} onClick={handlePrint}>
            <Printer size={16} />
            Yazdır
          </button>
        </div>
      </div>
    </div>
  );
}

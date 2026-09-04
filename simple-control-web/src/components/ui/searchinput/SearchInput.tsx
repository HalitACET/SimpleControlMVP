import { Search, X } from 'lucide-react';
import styles from './SearchInput.module.css';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'Ara...' }: SearchInputProps) {
  return (
    <div className={styles.wrapper}>
      <Search size={16} className={styles.iconLeft} />
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={() => onChange('')}
          title="Aramayı Temizle"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

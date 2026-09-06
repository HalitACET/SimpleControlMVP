import React, { forwardRef } from 'react';
import styles from './FormInput.module.css';

export interface Option {
  value: string;
  label: string;
}

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Option[];
  containerStyle?: React.CSSProperties;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, hint, options, className, containerStyle, ...props }, ref) => {
    return (
      <div className={styles.field} style={containerStyle}>
        {label && <label className={styles.label}>{label}</label>}
        <select
          ref={ref}
          className={`${styles.input} ${error ? styles.inputError : ''} ${className || ''}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <div className={styles.errorText}>{error}</div>}
        {hint && <div className={styles.hint}>{hint}</div>}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

export default FormSelect;

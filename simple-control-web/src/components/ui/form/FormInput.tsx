import React, { forwardRef } from 'react';
import styles from './FormInput.module.css';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  isMono?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, isMono, className, ...props }, ref) => {
    return (
      <div className={styles.field}>
        <label className={styles.label}>{label}</label>
        <input
          ref={ref}
          className={`${styles.input} ${isMono ? styles.inputMono : ''} ${error ? styles.inputError : ''} ${className || ''}`}
          {...props}
        />
        {error && <div className={styles.errorText}>{error}</div>}
        {hint && <div className={styles.hint}>{hint}</div>}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;

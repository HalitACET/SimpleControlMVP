import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  title?: string;
}

export default function Badge({ children, variant = 'neutral', className = '', title }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`} title={title}>
      {children}
    </span>
  );
}

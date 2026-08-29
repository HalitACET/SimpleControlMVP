import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import ConfirmDialog, { type ConfirmOptions } from './ConfirmDialog';

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState<(ConfirmOptions & { resolve: (val: boolean) => void }) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialogConfig({ ...options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    if (dialogConfig) {
      dialogConfig.resolve(true);
      setDialogConfig(null);
    }
  };

  const handleCancel = () => {
    if (dialogConfig) {
      dialogConfig.resolve(false);
      setDialogConfig(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialogConfig && (
        <ConfirmDialog
          title={dialogConfig.title}
          message={dialogConfig.message}
          confirmText={dialogConfig.confirmText}
          cancelText={dialogConfig.cancelText}
          danger={dialogConfig.danger}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
};

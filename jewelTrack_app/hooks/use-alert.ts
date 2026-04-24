import { useState, useCallback } from 'react';
import { AlertButton } from '../components/ui/CustomAlert';

type AlertState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
};

export function useAlert() {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false, title: '', message: '', buttons: []
  });

  const showAlert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons: buttons ?? [{ text: 'OK', style: 'default' }],
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
  }, []);

  return { alertState, showAlert, hideAlert };
}

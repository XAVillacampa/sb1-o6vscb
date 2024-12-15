import React, { useEffect } from 'react';
import { useAlertStore } from '../store';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

const alertStyles = {
  success: 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100',
  error: 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-100',
  warning: 'bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100',
  info: 'bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
};

const alertIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

function Alert() {
  const { message, type, showAlert, clearAlert } = useAlertStore();

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        clearAlert();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert, clearAlert]);

  if (!showAlert) return null;

  const Icon = alertIcons[type];

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`rounded-md p-4 ${alertStyles[type]}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alert;
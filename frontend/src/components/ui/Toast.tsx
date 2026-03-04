import toast, { Toaster } from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Custom toast styles
export const ToastProvider = () => (
  <Toaster
    position="top-right"
    gutter={12}
    containerStyle={{
      top: 80,
    }}
    toastOptions={{
      duration: 4000,
      style: {
        background: 'white',
        color: '#1e293b',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
      },
    }}
  />
);

// Success toast
export const showSuccess = (message: string, options?: { duration?: number }) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Berhasil
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-slate-200 dark:border-slate-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-500 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    ),
    { duration: options?.duration || 4000 }
  );
};

// Error toast
export const showError = (message: string, options?: { duration?: number }) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-red-500 ring-opacity-20`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Error
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-slate-200 dark:border-slate-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-500 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    ),
    { duration: options?.duration || 5000 }
  );
};

// Warning toast
export const showWarning = (message: string, options?: { duration?: number }) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-yellow-500 ring-opacity-20`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Peringatan
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-slate-200 dark:border-slate-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-500 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    ),
    { duration: options?.duration || 4000 }
  );
};

// Info toast
export const showInfo = (message: string, options?: { duration?: number }) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-blue-500 ring-opacity-20`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Info
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-slate-200 dark:border-slate-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-500 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    ),
    { duration: options?.duration || 4000 }
  );
};

// Loading toast
export const showLoading = (message: string = 'Memproses...') => {
  return toast.loading(message, {
    style: {
      background: 'white',
      color: '#1e293b',
      padding: '16px',
      borderRadius: '12px',
    },
  });
};

// Dismiss loading toast
export const dismissLoading = (toastId: string) => {
  toast.dismiss(toastId);
};

// Promise toast
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, messages, {
    style: {
      background: 'white',
      color: '#1e293b',
      padding: '16px',
      borderRadius: '12px',
    },
  });
};

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  dismiss: toast.dismiss,
  promise: showPromise,
};

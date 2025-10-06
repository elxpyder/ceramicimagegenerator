import { useNotification, Toast } from '../context/NotificationContext.tsx';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast: Toast) => {
        const Icon = toast.type === 'success' ? CheckCircle :
                    toast.type === 'error' ? AlertCircle : Info;

        const bgColor = toast.type === 'success' ? 'bg-green-50 border-green-200' :
                       toast.type === 'error' ? 'bg-red-50 border-red-200' :
                       'bg-blue-50 border-blue-200';

        const textColor = toast.type === 'success' ? 'text-green-800' :
                         toast.type === 'error' ? 'text-red-800' :
                         'text-blue-800';

        const iconColor = toast.type === 'success' ? 'text-green-600' :
                         toast.type === 'error' ? 'text-red-600' :
                         'text-blue-600';

        return (
          <div
            key={toast.id}
            className={`max-w-sm w-full ${bgColor} border rounded-lg p-4 shadow-lg animate-in slide-in-from-right-2`}
          >
            <div className="flex items-start">
              <Icon className={`w-5 h-5 ${iconColor} mt-0.5 mr-3 flex-shrink-0`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${textColor}`}>
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className={`ml-3 ${textColor} hover:opacity-75 transition-opacity`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
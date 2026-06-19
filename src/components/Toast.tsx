import { useEffect } from "react";
import { CheckCircle, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastProps) {
  return (
    <div className="fixed top-5 right-5 z-550 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  key?: string;
  toast: ToastMessage;
  onClose: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl relative overflow-hidden ${
        toast.type === "success"
          ? "bg-stone-900/95 border-amber-500/30 text-stone-100"
          : toast.type === "error"
          ? "bg-red-950/95 border-red-500/30 text-red-100"
          : "bg-stone-900/95 border-stone-700/50 text-stone-100"
      }`}
    >
      {/* Decorative vertical bar representing the type */}
      <span
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          toast.type === "success"
            ? "bg-amber-500"
            : toast.type === "error"
            ? "bg-red-500"
            : "bg-blue-500"
        }`}
      />

      <div className="mr-1 mt-0.5 shrink-0 pl-1">
        {toast.type === "success" ? (
          <CheckCircle className="w-5 h-5 text-amber-500" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-red-500" />
        )}
      </div>

      <div className="flex-1 text-sm font-medium tracking-wide">
        {toast.message}
      </div>

      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="text-stone-400 hover:text-stone-200 transition-colors cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

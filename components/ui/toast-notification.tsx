"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose?: () => void;
}

interface ToastNotificationProps {
  toasts: ToastProps[];
  removeToast: (index: number) => void;
}

export function ToastNotification({ toasts, removeToast }: ToastNotificationProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <Toast key={index} {...toast} onClose={() => removeToast(index)} />
      ))}
    </div>
  );
}

function Toast({ message, type = "info", duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "error":
        return <AlertTriangle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-emerald-500 text-white border-emerald-600";
      case "error":
        return "bg-red-500 text-white border-red-600";
      case "warning":
        return "bg-amber-500 text-white border-amber-600";
      default:
        return "bg-blue-500 text-white border-blue-600";
    }
  };

  if (!isVisible) return null;

  return (
    <div className={cn("flex items-center gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm", "transform transition-all duration-300 ease-in-out", "animate-slide-up max-w-md", getStyles(), isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0")}>
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1">
        <p className="text-sm font-body">{message}</p>
      </div>
      <button onClick={() => { setIsVisible(false); setTimeout(() => onClose?.(), 300); }} className="flex-shrink-0 hover:opacity-70 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const addToast = (toast: Omit<ToastProps, "onClose">) => setToasts((prev) => [...prev, toast]);
  const removeToast = (index: number) => setToasts((prev) => prev.filter((_, i) => i !== index));
  const showSuccess = (message: string) => addToast({ message, type: "success" });
  const showError = (message: string) => addToast({ message, type: "error" });
  const showInfo = (message: string) => addToast({ message, type: "info" });
  const showWarning = (message: string) => addToast({ message, type: "warning" });
  return { toasts, removeToast, showSuccess, showError, showInfo, showWarning };
}

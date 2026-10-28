"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/components/icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className = "" }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto p-4"
    >
      <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px]" onClick={onClose} />
      <div
        className={`relative w-full rounded-3xl bg-white text-start dark:bg-gray-900 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute inset-e-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 sm:inset-e-6 sm:top-6 sm:h-11 sm:w-11 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        >
          <CloseIcon className="size-6" />
        </button>
        <div>{children}</div>
      </div>
    </div>
  );
};

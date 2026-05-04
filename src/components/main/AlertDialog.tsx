"use client";

import { useEffect, useRef } from "react";

interface AlertDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function AlertDialog({
  open,
  title,
  message,
  onClose,
}: AlertDialogProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => btnRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-title"
      aria-describedby="alert-message"
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ animation: "fadeIn 0.18s ease" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        style={{ animation: "fadeIn 0.18s ease" }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-[320px] bg-white rounded-[24px] shadow-2xl shadow-stone-900/20 border border-stone-100 overflow-hidden"
        style={{ animation: "slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Top accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-stone-300 via-stone-400 to-stone-300" />

        {/* Icon area */}
        <div className="flex flex-col items-center pt-7 pb-1 px-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 mb-4 shadow-sm">
            <svg
              className="w-7 h-7 text-emerald-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2
            id="alert-title"
            className="font-barlow-bold text-[17px] font-bold text-stone-900 text-center tracking-tight leading-snug"
          >
            {title}
          </h2>

          <p
            id="alert-message"
            className="font-monterat-tipis mt-2 text-[13.5px] font-medium text-stone-500 text-center leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-5 mt-6 border-t border-stone-100" />

        {/* Action */}
        <div className="px-5 py-4">
          <button
            ref={btnRef}
            onClick={onClose}
            className="font-barlow-bold w-full min-h-[46px] rounded-2xl bg-stone-900 text-white font-semibold text-[14px] tracking-wide shadow-md shadow-stone-900/15 hover:bg-stone-800 active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
          >
            Oke
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

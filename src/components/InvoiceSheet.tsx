"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { type OrderByCode } from "@/api/order"; // sesuaikan path

type Props = {
  order: OrderByCode;
  open: boolean;
  onClose: () => void;
};

export function InvoiceSheet({ order, open, onClose }: Props) {
  const router = useRouter();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleView = () => {
    const code = order.order_code?.code;
    if (!code) return;
    router.push(`/admin/queue/invoices/${code}`);
  };

  const handlePrint = () => {
    const code = order.order_code?.code;
    if (!code) return;
    window.open(`/admin/queue/invoices/${code}?print=1`, "_blank");
  };

  if (!rendered) return null;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: visible ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
        backdropFilter: visible ? "blur(4px)" : "blur(0px)",
        transition: "background 0.35s ease, backdrop-filter 0.35s ease",
      }}
    >
      <div
        ref={sheetRef}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
          overflow: "hidden",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 8px",
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 99,
              background: "#e5e5e5",
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            padding: "4px 20px 16px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#111",
                margin: "0 0 2px",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Struk Pesanan
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#888",
                margin: 0,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {order.order_code?.code ?? "-"} · {order.service_name_snapshot}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#f5f5f5",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "#555",
              lineHeight: 1,
            }}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* View */}
          <button
            onClick={handleView}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 14,
              background: "#111",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Lihat Struk
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 14,
              background: "#fff",
              color: "#111",
              border: "1.5px solid #e5e5e5",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 9V2h12v7"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"
              />
              <rect x="6" y="14" width="12" height="8" rx="1" />
            </svg>
            Cetak / Download
          </button>
        </div>

        {/* Safe area */}
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

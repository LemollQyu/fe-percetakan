"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { InvoiceStruk } from "@/components/InvoiceStruk"; // sesuaikan path
import { getOrderByCode, type OrderByCode } from "@/api/order"; // sesuaikan path
import { getToken } from "@/lib/auth"; // sesuaikan path

export default function InvoicePageMain() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params?.code as string;
  const autoPrint = searchParams?.get("print") === "1";

  const [order, setOrder] = useState<OrderByCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    const token = getToken();

    getOrderByCode({ code, token: token ?? undefined })
      .then((res) => setOrder(res.data))
      .catch(() => setError("Gagal memuat data struk."))
      .finally(() => setLoading(false));
  }, [code]);

  // Auto print jika buka dari tombol "Cetak / Download"
  useEffect(() => {
    if (autoPrint && order) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [autoPrint, order]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          fontSize: 14,
          color: "#888",
        }}
      >
        Memuat struk...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          fontSize: 14,
          color: "#e44",
        }}
      >
        {error ?? "Struk tidak ditemukan."}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        

        @media print {
          /* Sembunyikan semua kecuali struk */
          body * { visibility: hidden; }
          .struk-print-area, .struk-print-area * { visibility: visible; }

          /* Reset layout saat print */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Posisi struk di pojok kiri atas */
          .struk-print-area {
            position: fixed;
            top: 0;
            left: 0;
          }

          /* Ukuran kertas thermal 58mm */
          @page {
            size: 58mm auto;
            margin: 0;
          }
        }
      `}</style>

      {/* Halaman normal (layar) */}
      <div
        style={{
          minHeight: "100vh",
          background: "transparent",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px 16px 48px",
        }}
      >
        {/* Toolbar — tidak ikut print karena body * visibility hidden */}
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => window.history.back()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#555",
              fontFamily: "system-ui, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: 0,
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
                d="M19 12H5M12 5l-7 7 7 7"
              />
            </svg>
            Kembali
          </button>

          <button
            onClick={() => window.print()}
            style={{
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg
              width="14"
              height="14"
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
            Print
          </button>
        </div>

        {/* Struk card — preview di layar */}
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            background: "#fff",
            borderRadius: 8,
            border: "1px solid #e5e5e5",
            overflow: "hidden",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          }}
        >
          <InvoiceStruk order={order} />
        </div>
      </div>

      {/* Area khusus print — hanya ini yang muncul saat cetak */}
      <div
        className="struk-print-area"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "58mm",
          background: "white",
          zIndex: -1, // tersembunyi di layar normal
        }}
      >
        <InvoiceStruk order={order} printMode />
      </div>
    </>
  );
}

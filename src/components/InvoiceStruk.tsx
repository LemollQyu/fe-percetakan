"use client";

import { type OrderByCode } from "@/api/order"; // sesuaikan path

const SHOP_NAME = "Fotocopy Nabila";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  order: OrderByCode;
  printMode?: boolean; // true = ukuran 58mm untuk thermal printer
};

export function InvoiceStruk({ order, printMode = false }: Props) {
  const specs = order.order_spesifications ?? [];

  // Ukuran font menyesuaikan mode
  const fs = (normal: number, print: number) => (printMode ? print : normal);

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        width: printMode ? "58mm" : "100%",
        maxWidth: printMode ? "58mm" : 360,
        margin: "0 auto",
        background: "#fff",
        color: "#111",
        padding: printMode ? "2mm 3mm" : 0,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}

      <div
        style={{
          textAlign: "center",
          padding: printMode ? "4px 0 6px" : "20px 20px 14px",
          borderBottom: "1px dashed #ccc",
        }}
      >
        <p
          style={{
            fontSize: fs(13, 9),
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: "0 0 2px",
          }}
        >
          Pesanan
        </p>
        <p style={{ fontSize: fs(12, 8), fontWeight: 600, margin: "0 0 2px" }}>
          {SHOP_NAME}
        </p>

        {/* Alamat — TAMBAHAN INI SAJA */}
        <p
          style={{
            fontSize: fs(10, 7),
            color: "#666",
            margin: "0 0 2px",
            lineHeight: 1.4,
          }}
        >
          Jl.Onggorawe, 05/05 Desa Prampelan
          <br />
          Sayung Demak
        </p>

        <p
          style={{
            fontSize: fs(10, 7),
            color: "#888",
            margin: 0,
            letterSpacing: "0.06em",
          }}
        >
          {order.order_code?.code ?? "-"}
        </p>
      </div>

      {/* Meta */}
      <div
        style={{
          padding: printMode ? "4px 0" : "10px 20px",
          borderBottom: "1px dashed #ccc",
          fontSize: fs(11, 7),
          lineHeight: 1.8,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#666" }}>Pelanggan</span>
          <span style={{ color: "#111" }}>{order.user?.name ?? "-"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#666" }}>Waktu</span>
          <span style={{ color: "#111" }}>{formatDate(order.created_at)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#666" }}>Struk Pesanan</span>
        </div>
      </div>

      {/* Layanan + Spesifikasi */}
      <div
        style={{
          padding: printMode ? "4px 0" : "12px 20px",
          borderBottom: "1px dashed #ccc",
        }}
      >
        <p
          style={{
            fontSize: fs(9, 6),
            fontWeight: 700,
            color: "#999",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: "0 0 4px",
          }}
        >
          Layanan
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: fs(12, 8),
              fontWeight: 700,
              flex: 1,
              marginRight: 4,
            }}
          >
            {order.service_name_snapshot}
          </span>
          <span
            style={{
              fontSize: fs(12, 8),
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {formatRupiah(order.base_price_snapshot)}
          </span>
        </div>

        {specs.length > 0 && (
          <div style={{ borderTop: "1px solid #eee", paddingTop: 4 }}>
            {specs.map((spec, idx) => (
              <div
                key={spec.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  fontSize: fs(11, 7),
                  color: "#444",
                  padding: "2px 0",
                }}
              >
                <span
                  style={{ minWidth: 14, color: "#aaa", fontSize: fs(10, 6) }}
                >
                  {idx + 1}.
                </span>
                <span style={{ flex: 1, margin: "0 4px", lineHeight: 1.4 }}>
                  {spec.spesification_name_snapshot}
                  <br />
                  <span style={{ fontSize: fs(10, 6), color: "#999" }}>
                    {spec.value_snapshot}
                  </span>
                </span>
                <span style={{ whiteSpace: "nowrap", color: "#111" }}>
                  {spec.additional_price_snapshot > 0
                    ? `+${formatRupiah(spec.additional_price_snapshot)}`
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total */}
      <div
        style={{
          padding: printMode ? "4px 0" : "12px 20px",
          borderBottom: "1px dashed #ccc",
        }}
      >
        {/* Hitung breakdown */}
        {(() => {
          const specNumber = specs.find(
            (s) =>
              s.additional_price_snapshot === 0 &&
              /^\d+$/.test(s.value_snapshot?.trim() ?? ""),
          );
          const specNumberValue = specNumber
            ? Number(specNumber.value_snapshot)
            : 1;
          const hasSpecNumber = !!specNumber && specNumberValue > 1;
          const hasQty = order.quantity > 1;

          // subtotal = base + semua additional spek
          const totalAdditional = specs.reduce(
            (sum, s) => sum + Number(s.additional_price_snapshot ?? 0),
            0,
          );
          const subtotal = Number(order.base_price_snapshot) + totalAdditional;
          const afterSpecNumber = subtotal * specNumberValue;

          return (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: fs(11, 7),
                  color: "#666",
                  marginBottom: 2,
                }}
              >
                <span>Sub Total</span>
                <span style={{ color: "#111" }}>{formatRupiah(subtotal)}</span>
              </div>

              {hasSpecNumber && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: fs(11, 7),
                      color: "#666",
                      marginBottom: 2,
                    }}
                  >
                    <span>× {specNumber.spesification_name_snapshot}</span>
                    <span style={{ color: "#111" }}>{specNumberValue}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: fs(11, 7),
                      color: "#666",
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        borderTop: "1px dashed #ccc",
                        paddingTop: 2,
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>= Subtotal</span>
                      <span style={{ color: "#111" }}>
                        {formatRupiah(afterSpecNumber)}
                      </span>
                    </span>
                  </div>
                </>
              )}

              {hasQty && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: fs(11, 7),
                      color: "#666",
                      marginBottom: 2,
                    }}
                  >
                    <span>× Qty</span>
                    <span style={{ color: "#111" }}>{order.quantity}</span>
                  </div>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: fs(11, 7),
                  color: "#666",
                  marginBottom: 2,
                }}
              >
                <span>Total QTY</span>
                <span style={{ color: "#111" }}>{order.quantity}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#000",
                  borderRadius: 2,
                  padding: printMode ? "4px 6px" : "10px 12px",
                }}
              >
                <span
                  style={{
                    fontSize: fs(12, 8),
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  Total
                </span>
                <span style={{ fontSize: fs(15, 9), fontWeight: 700 }}>
                  {formatRupiah(order.total_price_snapshot)}
                </span>
              </div>
            </>
          );
        })()}
      </div>

      {/* Catatan */}
      {order.user_note && (
        <div
          style={{
            padding: printMode ? "4px 0" : "10px 20px",
            borderBottom: "1px dashed #ccc",
            fontSize: fs(10, 7),
            color: "#666",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              display: "block",
              fontStyle: "normal",
              fontWeight: 700,
              fontSize: fs(9, 6),
              color: "#aaa",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 2,
            }}
          >
            Catatan
          </span>
          {order.user_note}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: printMode ? "4px 0 6px" : "14px 20px",
          textAlign: "center",
          fontSize: fs(10, 7),
          color: "#aaa",
          lineHeight: 1.6,
        }}
      >
        <p style={{ margin: "0 0 2px", fontSize: fs(9, 6) }}>
          Bukan Bukti Pembayaran
        </p>
        <p
          style={{
            margin: 0,
            fontWeight: 600,
            color: "#666",
            fontSize: fs(11, 7),
          }}
        >
          Terimakasih telah memesan!
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { getReport } from "@/api/order";
import type { ReportType, ReportData, ReportOrder } from "@/api/order";
import {
  exportReportToExcel,
  previewReportAsHTML,
} from "@/app/helper/exportExcel";

function useToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") ?? "";
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const DAYS_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function ReportPage() {
  const token = useToken();
  const [type, setType] = useState<ReportType>("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calMonth, setCalMonth] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [navMonth, setNavMonth] = useState(new Date());
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      let dateStr = toDateStr(selectedDate);
      if (type === "week") dateStr = toDateStr(weekStart);
      if (type === "month")
        dateStr = toDateStr(
          new Date(navMonth.getFullYear(), navMonth.getMonth(), 1),
        );

      const res = await getReport({
        token,
        type,
        date: dateStr,
        page,
        limit: 10,
      });
      setData(res.data);
    } catch {
      setError("Gagal memuat data laporan.");
    } finally {
      setLoading(false);
    }
  }, [token, type, selectedDate, weekStart, navMonth, page]);

  useEffect(() => {
    setPage(1);
  }, [type, selectedDate, weekStart, navMonth]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calDays = () => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDow = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const cells: (Date | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= last.getDate(); d++)
      cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const periodLabel = () => {
    if (type === "day")
      return `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    if (type === "week") {
      const end = new Date(weekStart);
      end.setDate(weekStart.getDate() + 6);
      return `${weekStart.getDate()} ${MONTHS_SHORT[weekStart.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
    }
    return `${MONTHS[navMonth.getMonth()]} ${navMonth.getFullYear()}`;
  };

  const orders: ReportOrder[] = data?.orders ?? [];
  const hasOrders = orders.length > 0;
  const [exporting, setExporting] = useState(false);

  const fetchAllOrders = async () => {
    if (!token) return null;
    let dateStr = toDateStr(selectedDate);
    if (type === "week") dateStr = toDateStr(weekStart);
    if (type === "month")
      dateStr = toDateStr(
        new Date(navMonth.getFullYear(), navMonth.getMonth(), 1),
      );

    const res = await getReport({
      token,
      type,
      date: dateStr,
      page: 1,
      limit: 9999,
    });
    return res.data;
  };

  const handlePreview = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const allData = await fetchAllOrders();
      if (!allData) return;
      previewReportAsHTML({
        orders: allData.orders,
        summary: allData.summary,
        breakdown: allData.breakdown,
        type,
        period: periodLabel(),
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const allData = await fetchAllOrders();
      if (!allData) return;
      exportReportToExcel({
        orders: allData.orders,
        summary: allData.summary,
        breakdown: allData.breakdown,
        type,
      });
    } finally {
      setExporting(false);
    }
  };

  /* ── Column widths ── */
  const COL_NO = "44px";
  const COL_SVC = "auto";
  const COL_TOTAL = "140px";
  const COL_QTY = "60px";
  const COL_DATE = "110px";

  return (
    <>
      <style>{`
        .rp-wrap {
          font-family: system-ui, -apple-system, sans-serif;
          padding: 28px 24px 0;
          max-width: 1100px;
          margin: 0 auto;
          color: #111;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-sizing: border-box;
        }

        /* ── HEADER ── */
        .rp-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 16px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        .rp-title   { margin: 0 0 2px; font-size: 18px; font-weight: 600; letter-spacing: -0.3px; }
        .rp-subtitle{ margin: 0; font-size: 12.5px; color: #666; }

        .rp-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Export buttons */
        .rp-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          font-size: 12.5px;
          font-weight: 500;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .rp-btn-preview {
          background: #fff;
          color: #111;
        }
        .rp-btn-preview:hover:not(:disabled) {
          background: #f3f4f6;
        }
        .rp-btn-download {
          background: #111;
          color: #fff;
          border-color: #111;
        }
        .rp-btn-download:hover:not(:disabled) {
          background: #333;
          border-color: #333;
        }
        .rp-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .rp-tabs {
          display: flex;
          gap: 2px;
          background: #f3f4f6;
          border-radius: 9px;
          padding: 3px;
          border: 1px solid #e5e7eb;
        }
        .rp-tab {
          padding: 5px 18px;
          font-size: 12.5px;
          font-weight: 500;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          background: transparent;
          color: #666;
          transition: all 0.15s;
          font-family: inherit;
        }
        .rp-tab.active {
          background: #fff;
          color: #111;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        /* ── BODY LAYOUT ── */
        .rp-body {
          display: grid;
          grid-template-columns: 1fr 264px;
          gap: 16px;
          align-items: start;
          flex: 1;
          overflow: hidden;
          padding-bottom: 24px;
        }

        .rp-left {
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: 100%;
          overflow: hidden;
        }

        /* ── TABLE CONTAINER ── */
        .rp-table-container {
          border: 1px solid #eaedf5;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 8px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        .rp-table-scroll {
          overflow-y: auto;
          flex: 1;
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb transparent;
        }
        .rp-table-scroll::-webkit-scrollbar { width: 4px; }
        .rp-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .rp-table-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

        .rp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          table-layout: fixed;
        }

        .rp-table col.c-no    { width: ${COL_NO}; }
        .rp-table col.c-svc   { width: ${COL_SVC}; }
        .rp-table col.c-total { width: ${COL_TOTAL}; }
        .rp-table col.c-qty   { width: ${COL_QTY}; }
        .rp-table col.c-date  { width: ${COL_DATE}; }

        .rp-table thead {
          position: sticky;
          top: 0;
          z-index: 1;
          background: #111;
        }
        .rp-table thead th {
          padding: 9px 12px;
          text-align: left;
          font-size: 9.5px;
          font-weight: 500;
          letter-spacing: 0.7px;
          text-transform: uppercase;
          color: #fff;
          white-space: nowrap;
        }
        .rp-table thead th.th-total { text-align: right; }
        .rp-table thead th.th-qty   { text-align: center; }
        .rp-table thead th.th-date  { text-align: right; }

        .rp-table .order-group tr {
          border-bottom: 1px solid #f0f2f8;
          transition: background 0.12s;
        }
        .rp-table .order-group:last-child tr:last-child { border-bottom: none; }
        .rp-table .order-group:hover tr { background: #fafafa; }
        .rp-table .order-group tr:not(:last-child) td { border-bottom: none; }

        .rp-table td {
          padding: 10px 12px;
          vertical-align: top;
          color: #111;
        }

        .svc-name { font-weight: 500; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .svc-code { font-size: 10px; color: #6366f1; font-family: monospace; margin-top: 2px; }

        .rp-td-total { text-align: right; vertical-align: middle; }
        .price-val   { font-weight: 600; font-size: 12.5px; white-space: nowrap; }

        .rp-td-qty { text-align: center; vertical-align: middle; }
        .qty-chip {
          display: inline-block;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 5px;
          padding: 2px 8px;
          font-size: 11px;
          font-family: monospace;
          color: #444;
        }

        .rp-td-date { text-align: right; vertical-align: middle; }
        .d-date { font-size: 11.5px; font-weight: 500; }
        .d-time { font-size: 10px; color: #9ca3af; font-family: monospace; margin-top: 2px; }

        .spec-tags-row td { padding-top: 0 !important; vertical-align: top; }
        .spec-tags {
          display: flex;
          flex-wrap: nowrap;
          gap: 6px;
          align-items: center;
          max-width: 100%;
          overflow: hidden;
        }
        .spec-tag {
          font-size: 10px;
          padding: 2px 7px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          color: #555;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── EMPTY / ERROR ── */
        .rp-empty {
          padding: 48px 16px;
          text-align: center;
          color: #9ca3af;
          font-size: 13px;
        }
        .rp-error {
          padding: 12px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 9px;
          font-size: 13px;
          color: #dc2626;
          flex-shrink: 0;
        }

        /* ── SKELETON ── */
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .skeleton-bar {
          height: 12px;
          border-radius: 4px;
          background: linear-gradient(90deg, #f0f2f8 25%, #e4e7f0 50%, #f0f2f8 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite;
        }

        /* ── PAGINATION ── */
        .rp-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          background: #fff;
          border: 1px solid #eaedf5;
          border-radius: 9px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          flex-shrink: 0;
        }
        .rp-page-label { font-size: 12px; color: #666; }
        .rp-page-btns  { display: flex; gap: 5px; }
        .rp-page-btn {
          padding: 4px 12px;
          font-size: 12px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #111;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.12s;
        }
        .rp-page-btn:hover:not(:disabled) { background: #f3f4f6; }
        .rp-page-btn:disabled { color: #d1d5db; cursor: not-allowed; }

        /* ── RIGHT SIDEBAR ── */
        .rp-right {
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
          overflow-y: auto;
          padding-right: 2px;
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb transparent;
        }
        .rp-right::-webkit-scrollbar { width: 4px; }
        .rp-right::-webkit-scrollbar-track { background: transparent; }
        .rp-right::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

        .rp-card {
          background: #fff;
          border: 1px solid #eaedf5;
          border-radius: 12px;
          padding: 14px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
          flex-shrink: 0;
        }
        .rp-card-label {
          font-size: 9.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          color: #9ca3af;
          margin: 0 0 12px;
        }

        /* Calendar */
        .cal-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .cal-nav-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          font-size: 15px;
          padding: 2px 5px;
          border-radius: 5px;
          line-height: 1;
          transition: background 0.12s;
          font-family: inherit;
        }
        .cal-nav-btn:hover { background: #f3f4f6; }
        .cal-nav-title { font-size: 13px; font-weight: 500; }

        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          text-align: center;
        }
        .cal-day-label {
          font-size: 9.5px;
          color: #9ca3af;
          font-weight: 600;
          letter-spacing: 0.3px;
          padding-bottom: 5px;
        }
        .cal-cell {
          font-size: 12px;
          padding: 5px 0;
          border-radius: 6px;
          cursor: pointer;
          color: #111;
          transition: background 0.1s;
        }
        .cal-cell:hover              { background: #f3f4f6; }
        .cal-cell.empty              { cursor: default; color: transparent; pointer-events: none; }
        .cal-cell.other-month        { opacity: 0.25; }
        .cal-cell.today              { background: #f3f4f6; font-weight: 500; }
        .cal-cell.selected           { background: #111 !important; color: #fff !important; font-weight: 600; }

        .week-labels {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          text-align: center;
          margin-bottom: 4px;
        }
        .week-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
          text-align: center;
        }
        .week-cell {
          font-size: 12px;
          padding: 5px 0;
          border-radius: 6px;
          background: #f3f4f6;
          color: #111;
        }
        .week-cell.today { background: #111; color: #fff; font-weight: 600; }

        /* Summary */
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .summary-box {
          background: #f9fafb;
          border: 1px solid #f0f2f8;
          border-radius: 8px;
          padding: 10px 11px;
        }
        .summary-box-label { font-size: 10.5px; color: #666; margin: 0 0 4px; }
        .summary-box-value { font-size: 22px; font-weight: 600; margin: 0; letter-spacing: -0.5px; line-height: 1.2; }
        .summary-box-value.small { font-size: 12.5px; letter-spacing: -0.2px; }

        /* Breakdown */
        .breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 7px 0;
          border-bottom: 1px solid #f0f2f8;
        }
        .breakdown-row:last-child    { border-bottom: none; }
        .breakdown-row-date          { font-size: 12px; color: #555; }
        .breakdown-row-right         { text-align: right; }
        .breakdown-row-rev           { font-size: 12px; font-weight: 500; }
        .breakdown-row-orders        { font-size: 10.5px; color: #9ca3af; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .rp-wrap  { height: auto; overflow: visible; padding-bottom: 24px; }
          .rp-body  { grid-template-columns: 1fr; overflow: visible; padding-bottom: 0; }
          .rp-right { order: -1; height: auto; overflow-y: visible; }
          .rp-left  { order: 1;  height: auto; overflow-y: visible; }
          .rp-table-container { min-height: unset; flex: none; }
        }
      `}</style>

      <div className="rp-wrap">
        {/* ── HEADER ── */}
        <div className="rp-header">
          <div>
            <h1 className="rp-title">Laporan Penjualan</h1>
            <p className="rp-subtitle">{periodLabel()}</p>
          </div>

          <div className="rp-header-right">
            {/* Export buttons */}
            <button
              className="rp-btn rp-btn-preview"
              onClick={handlePreview}
              disabled={!data || !hasOrders || exporting}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {exporting ? "Memuat..." : "Preview"}
            </button>
            <button
              className="rp-btn rp-btn-download"
              onClick={handleDownload}
              disabled={!data || !hasOrders || exporting}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting ? "Memuat..." : "Download Excel"}
            </button>

            {/* Period tabs */}
            <div className="rp-tabs">
              {(["day", "week", "month"] as ReportType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rp-tab ${type === t ? "active" : ""}`}
                >
                  {t === "day" ? "Hari" : t === "week" ? "Minggu" : "Bulan"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="rp-body">
          {/* LEFT: order list */}
          <div className="rp-left">
            {error && <div className="rp-error">{error}</div>}

            <div className="rp-table-container">
              <div className="rp-table-scroll">
                {/* Skeleton */}
                {loading && (
                  <table className="rp-table">
                    <colgroup>
                      <col className="c-no" />
                      <col className="c-svc" />
                      <col className="c-total" />
                      <col className="c-qty" />
                      <col className="c-date" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Layanan</th>
                        <th className="th-total">Total</th>
                        <th className="th-qty">Qty</th>
                        <th className="th-date">Selesai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: "1px solid #f0f2f8" }}
                        >
                          <td>
                            <div
                              className="skeleton-bar"
                              style={{ width: 16, height: 11 }}
                            />
                          </td>
                          <td>
                            <div
                              className="skeleton-bar"
                              style={{
                                width: `${55 + (i % 3) * 15}%`,
                                marginBottom: 6,
                              }}
                            />
                            <div
                              className="skeleton-bar"
                              style={{ width: "40%", height: 9, opacity: 0.6 }}
                            />
                            {i % 2 === 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 5,
                                  marginTop: 5,
                                }}
                              >
                                <div
                                  className="skeleton-bar"
                                  style={{ width: 64, height: 9, opacity: 0.5 }}
                                />
                                <div
                                  className="skeleton-bar"
                                  style={{ width: 48, height: 9, opacity: 0.5 }}
                                />
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div
                              className="skeleton-bar"
                              style={{ width: 80, marginLeft: "auto" }}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div
                              className="skeleton-bar"
                              style={{
                                width: 28,
                                height: 22,
                                borderRadius: 5,
                                margin: "0 auto",
                              }}
                            />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div
                              className="skeleton-bar"
                              style={{
                                width: 72,
                                marginLeft: "auto",
                                marginBottom: 5,
                              }}
                            />
                            <div
                              className="skeleton-bar"
                              style={{
                                width: 44,
                                height: 9,
                                marginLeft: "auto",
                                opacity: 0.6,
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Real table */}
                {!loading && data && (
                  <table className="rp-table">
                    <colgroup>
                      <col className="c-no" />
                      <col className="c-svc" />
                      <col className="c-total" />
                      <col className="c-qty" />
                      <col className="c-date" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Layanan</th>
                        <th className="th-total">Total</th>
                        <th className="th-qty">Qty</th>
                        <th className="th-date">Selesai</th>
                      </tr>
                    </thead>

                    {hasOrders ? (
                      orders.map((order, index) => {
                        const ua = new Date(order.updated_at);
                        const dateStr = `${ua.getDate()} ${MONTHS_SHORT[ua.getMonth()]} ${ua.getFullYear()}`;
                        const timeStr = `${String(ua.getHours()).padStart(2, "0")}.${String(ua.getMinutes()).padStart(2, "0")}`;
                        const hasSpec =
                          (order.order_spesifications?.length ?? 0) > 0;

                        return (
                          <tbody key={order.id} className="order-group">
                            <tr>
                              <td>{index + 1}</td>
                              <td>
                                <div className="svc-name">
                                  {order.service_name_snapshot}
                                </div>
                                <div className="svc-code">
                                  {order.order_code?.code}
                                </div>
                              </td>
                              <td className="rp-td-total">
                                <div className="price-val">
                                  {formatRupiah(order.total_price_snapshot)}
                                </div>
                              </td>
                              <td className="rp-td-qty">
                                <span className="qty-chip">
                                  {order.quantity}
                                </span>
                              </td>
                              <td className="rp-td-date">
                                <div className="d-date">{dateStr}</div>
                                <div className="d-time">{timeStr}</div>
                              </td>
                            </tr>
                            {hasSpec && (
                              <tr className="spec-tags-row">
                                <td />
                                <td colSpan={4}>
                                  <div className="spec-tags">
                                    {order.order_spesifications.map((s) => (
                                      <span key={s.id} className="spec-tag">
                                        {s.spesification_name_snapshot}:{" "}
                                        {s.value_snapshot}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        );
                      })
                    ) : (
                      <tbody>
                        <tr>
                          <td colSpan={5}>
                            <div className="rp-empty">
                              Tidak ada order pada periode ini
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    )}
                  </table>
                )}
              </div>
            </div>

            {!loading && hasOrders && (
              <div className="rp-pagination">
                <span className="rp-page-label">
                  Halaman {data?.pagination?.page ?? page}
                </span>
                <div className="rp-page-btns">
                  <button
                    className="rp-page-btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    ‹ Prev
                  </button>
                  <button
                    className="rp-page-btn"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={orders.length < 10}
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: sidebar */}
          <div className="rp-right">
            {/* Calendar / week / month picker */}
            <div className="rp-card">
              {type === "day" && (
                <>
                  <div className="cal-nav">
                    <button
                      className="cal-nav-btn"
                      onClick={() =>
                        setCalMonth((m) => {
                          const d = new Date(m);
                          d.setMonth(d.getMonth() - 1);
                          return d;
                        })
                      }
                    >
                      ‹
                    </button>
                    <span className="cal-nav-title">
                      {MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}
                    </span>
                    <button
                      className="cal-nav-btn"
                      onClick={() =>
                        setCalMonth((m) => {
                          const d = new Date(m);
                          d.setMonth(d.getMonth() + 1);
                          return d;
                        })
                      }
                    >
                      ›
                    </button>
                  </div>
                  <div className="cal-grid">
                    {DAYS_SHORT.map((d) => (
                      <div key={d} className="cal-day-label">
                        {d}
                      </div>
                    ))}
                    {calDays().map((d, i) => {
                      const cls = [
                        "cal-cell",
                        !d ? "empty" : "",
                        d && d.getMonth() !== calMonth.getMonth()
                          ? "other-month"
                          : "",
                        d &&
                        isSameDay(d, new Date()) &&
                        !isSameDay(d, selectedDate)
                          ? "today"
                          : "",
                        d && isSameDay(d, selectedDate) ? "selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <div
                          key={i}
                          className={cls}
                          onClick={() => d && setSelectedDate(d)}
                        >
                          {d?.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {type === "week" && (
                <>
                  <div className="cal-nav">
                    <button
                      className="cal-nav-btn"
                      onClick={() =>
                        setWeekStart((w) => {
                          const d = new Date(w);
                          d.setDate(d.getDate() - 7);
                          return d;
                        })
                      }
                    >
                      ‹
                    </button>
                    <span className="cal-nav-title" style={{ fontSize: 12 }}>
                      {weekDays[0].getDate()}{" "}
                      {MONTHS_SHORT[weekDays[0].getMonth()]} –{" "}
                      {weekDays[6].getDate()}{" "}
                      {MONTHS_SHORT[weekDays[6].getMonth()]}{" "}
                      {weekDays[6].getFullYear()}
                    </span>
                    <button
                      className="cal-nav-btn"
                      onClick={() =>
                        setWeekStart((w) => {
                          const d = new Date(w);
                          d.setDate(d.getDate() + 7);
                          return d;
                        })
                      }
                    >
                      ›
                    </button>
                  </div>
                  <div className="week-labels">
                    {DAYS_SHORT.map((d) => (
                      <div key={d} className="cal-day-label">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="week-grid">
                    {weekDays.map((d, i) => (
                      <div
                        key={i}
                        className={`week-cell ${isSameDay(d, new Date()) ? "today" : ""}`}
                      >
                        {d.getDate()}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {type === "month" && (
                <div className="cal-nav">
                  <button
                    className="cal-nav-btn"
                    onClick={() =>
                      setNavMonth((m) => {
                        const d = new Date(m);
                        d.setMonth(d.getMonth() - 1);
                        return d;
                      })
                    }
                  >
                    ‹
                  </button>
                  <span className="cal-nav-title">
                    {MONTHS[navMonth.getMonth()]} {navMonth.getFullYear()}
                  </span>
                  <button
                    className="cal-nav-btn"
                    onClick={() =>
                      setNavMonth((m) => {
                        const d = new Date(m);
                        d.setMonth(d.getMonth() + 1);
                        return d;
                      })
                    }
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* Summary */}
            {data && (
              <div className="rp-card">
                <p className="rp-card-label">Ringkasan</p>
                <div className="summary-grid">
                  <div className="summary-box">
                    <p className="summary-box-label">Total Order</p>
                    <p className="summary-box-value">
                      {data.summary.total_orders}
                    </p>
                  </div>
                  <div className="summary-box">
                    <p className="summary-box-label">Pendapatan</p>
                    <p className="summary-box-value small">
                      {formatRupiah(data.summary.total_revenue)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Breakdown */}
            {data && (data.breakdown?.length ?? 0) > 0 && (
              <div className="rp-card">
                <p className="rp-card-label">Rincian</p>
                {data.breakdown.map((b, i) => {
                  const d = new Date(b.date);
                  return (
                    <div key={i} className="breakdown-row">
                      <span className="breakdown-row-date">
                        {d.getDate()} {MONTHS_SHORT[d.getMonth()]}
                      </span>
                      <div className="breakdown-row-right">
                        <div className="breakdown-row-rev">
                          {formatRupiah(b.total_revenue)}
                        </div>
                        <div className="breakdown-row-orders">
                          {b.total_orders} order
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

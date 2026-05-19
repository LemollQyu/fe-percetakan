"use client";

import { useEffect, useState } from "react";
import {
  getPaymentMethods,
  createMethodPayment,
  deleteMethodPayment,
} from "@/api/payment";
import type { PaymentMethod } from "@/api/payment";
import { getToken } from "@/lib/auth";

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Add popup state ──
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    payment_method: "",
    number_payment: "",
  });
  const [addIcon, setAddIcon] = useState<File | null>(null);
  const [addQris, setAddQris] = useState<File | null>(null);

  // ── Delete popup state ──
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isQris = addForm.payment_method.toLowerCase() === "qris";

  function normalizeUrl(url: string): string {
    if (!url || typeof url !== "string") return url;
    const t = url.trim();
    if (t.startsWith("http://") || t.startsWith("https://")) {
      const idx = t.indexOf("/static/");
      if (idx !== -1) return t.substring(idx);
      return t;
    }
    if (t.startsWith("/static/")) return t;
    const idx = t.indexOf("/static/");
    if (idx !== -1) return t.substring(idx);
    if (t.startsWith("static/")) return `/${t}`;
    return t.startsWith("/") ? t : `/${t}`;
  }

  function extractErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null) {
      const e = err as Record<string, unknown>;
      if (typeof e.message === "string") return e.message;
      if (typeof e.error === "string") return e.error;
      if (typeof e.msg === "string") return e.msg;
    }
    return "Terjadi kesalahan yang tidak diketahui.";
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getPaymentMethods();
      setMethods(res.data);
    } catch (err) {
      setFetchError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filtered = methods.filter((m) =>
    `${m.payment_method} ${m.number_payment}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const handleAdd = async () => {
    if (!addForm.payment_method || !addForm.number_payment || !addIcon) return;
    if (isQris && !addQris) return;

    const token = getToken();
    if (!token) return;

    setAddLoading(true);
    setAddError(null);
    try {
      await createMethodPayment({
        payment_method: addForm.payment_method,
        number_payment: addForm.number_payment,
        icon: addIcon,
        qris: isQris && addQris ? addQris : undefined,
        token,
      });
      setShowAddPopup(false);
      setAddForm({ payment_method: "", number_payment: "" });
      setAddIcon(null);
      setAddQris(null);
      await fetchData();
    } catch (err) {
      setAddError(extractErrorMessage(err));
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const token = getToken();
    if (!token) return;

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteMethodPayment({ id_method: deleteTarget.id, token });
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .pm-wrap {
          font-family: system-ui, sans-serif;
          padding: 24px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .pm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .pm-title { display: flex; align-items: center; gap: 10px; }
        .pm-title-icon {
          width: 36px; height: 36px; background: black;
          border-radius: 10px; display: flex;
          align-items: center; justify-content: center;
        }
        .pm-title-icon svg {
          width: 18px; height: 18px; fill: none;
          stroke: #fff; stroke-width: 1.8;
          stroke-linecap: round; stroke-linejoin: round;
        }
        .pm-title h1 {
          font-size: 17px; font-weight: 600; color: #111;
          letter-spacing: -0.3px; margin: 0;
        }
        .pm-title span { font-size: 11px; color: #666; display: block; margin-top: 1px; }
        .pm-controls { display: flex; align-items: center; gap: 8px; }
        .btn-refresh {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; background: #f3f4f6; color: #444;
          border: none; border-radius: 8px;
          font-family: system-ui, sans-serif; font-size: 12px;
          font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .btn-refresh:hover:not(:disabled) { background: #e5e7eb; }
        .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-refresh svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .btn-refresh.spinning svg { animation: spin 0.7s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .btn-add {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; background: black; color: #fff;
          border: none; border-radius: 8px;
          font-family: system-ui, sans-serif; font-size: 12px;
          font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .btn-add:hover { background: #333; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.18); }
        .btn-add svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
        .search-wrap { position: relative; }
        .search-wrap svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 13px; height: 13px; stroke: #9ca3af; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
        .search-input { font-family: system-ui, sans-serif; font-size: 12px; padding: 7px 12px 7px 30px; border: 1.5px solid #e5e7eb; border-radius: 8px; width: 220px; color: #111; background: #fff; transition: all 0.2s; outline: none; }
        .search-input::placeholder { color: #b0b5c9; }
        .search-input:focus { border-color: #111; box-shadow: 0 0 0 3px rgba(0,0,0,0.07); }
        .pm-badge { font-size: 11px; font-weight: 500; color: #444; background: #f3f4f6; border-radius: 6px; padding: 3px 8px; margin-bottom: 12px; display: inline-block; }
        .pm-table-wrap { border-radius: 14px; border: 1.5px solid #eaedf5; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.05); }
        .pm-table { width: 100%; border-collapse: collapse; font-size: 11.5px; table-layout: fixed; }
        .pm-table thead { background: black; }
        .pm-table thead th { padding: 10px 12px; text-align: left; font-size: 9.5px; font-weight: 500; letter-spacing: 0.8px; text-transform: uppercase; color: #fff; white-space: nowrap; }
        .pm-table thead th:first-child { width: 36px; text-align: center; }
        .pm-table thead th:nth-child(2) { width: 80px; }
        .pm-table thead th:nth-child(3) { width: 160px; }
        .pm-table thead th:nth-child(4) { width: 160px; }
        .pm-table thead th:nth-child(5) { width: 80px; }
        .pm-table thead th:nth-child(6) { width: 120px; }
        .pm-table thead th:nth-child(7) { width: 120px; }
        .pm-table thead th:last-child { width: 80px; }
        .pm-table tbody tr { border-bottom: 1px solid #f0f2f8; transition: background 0.15s; }
        .pm-table tbody tr:last-child { border-bottom: none; }
        .pm-table tbody tr:hover { background: #fafafa; }
        .pm-table td { padding: 9px 12px; color: #111; vertical-align: middle; word-break: break-word; white-space: normal; line-height: 1.5; }
        .td-no { text-align: center; font-family: monospace; font-size: 10px; font-weight: 500; color: #9ca3af; }
        .td-icon img { width: 36px; height: 36px; object-fit: contain; border-radius: 8px; border: 1px solid #f0f2f8; background: #fafafa; }
        .td-icon-placeholder { width: 36px; height: 36px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
        .td-method { font-weight: 600; color: #111; text-transform: capitalize; }
        .td-number { font-family: monospace; font-size: 11px; color: #444; }
        .td-qris img { width: 40px; height: 40px; object-fit: contain; border-radius: 6px; border: 1px solid #f0f2f8; }
        .td-qris-none { font-size: 10px; color: #d1d5db; }
        .date-cell { display: flex; flex-direction: column; gap: 2px; }
        .date-cell .d-date { font-size: 10.5px; color: #111; font-weight: 500; white-space: nowrap; }
        .date-cell .d-time { font-family: monospace; font-size: 10px; color: #6b7280; white-space: nowrap; }
        .btn-delete {
          padding: 5px 12px; background: #fff0f0; color: #ef4444;
          border: 1px solid #fecaca; border-radius: 7px;
          font-size: 11px; font-weight: 600; cursor: pointer;
          font-family: system-ui, sans-serif; white-space: nowrap;
          transition: all 0.15s;
        }
        .btn-delete:hover { background: #ef4444; color: #fff; border-color: #ef4444; }
        .pm-empty { text-align: center; padding: 48px 24px; color: #9ca3af; }
        .pm-empty svg { width: 32px; height: 32px; stroke: #d1d5db; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; margin: 0 auto 10px; display: block; }
        .pm-empty p { font-size: 13px; margin: 0; }

        /* ERROR BANNER (fetch) */
        .error-banner {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fff5f5; border: 1.5px solid #fecaca;
          border-radius: 10px; padding: 12px 14px;
          margin-bottom: 14px; animation: popIn 0.18s ease;
        }
        .error-banner svg { width: 15px; height: 15px; stroke: #ef4444; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; margin-top: 1px; }
        .error-banner-body { flex: 1; min-width: 0; }
        .error-banner-label { font-size: 11px; font-weight: 700; color: #dc2626; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 0.4px; }
        .error-banner-msg { font-size: 12px; color: #b91c1c; margin: 0; line-height: 1.5; word-break: break-word; }
        .error-banner-close { background: none; border: none; cursor: pointer; padding: 0; color: #f87171; flex-shrink: 0; line-height: 1; font-size: 18px; font-family: system-ui, sans-serif; }
        .error-banner-close:hover { color: #dc2626; }

        /* ERROR inline (inside popup) */
        .popup-error {
          display: flex; align-items: flex-start; gap: 8px;
          background: #fff5f5; border: 1.5px solid #fecaca;
          border-radius: 8px; padding: 10px 12px; margin-top: 14px;
          animation: popIn 0.18s ease;
        }
        .popup-error svg { width: 13px; height: 13px; stroke: #ef4444; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; margin-top: 1px; }
        .popup-error p { font-size: 11.5px; color: #b91c1c; margin: 0; line-height: 1.5; }

        /* POPUP */
        .popup-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; backdrop-filter: blur(2px);
        }
        .popup-box {
          background: #fff; border-radius: 16px;
          padding: 28px 28px 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          min-width: 340px; max-width: 440px; width: 100%;
          animation: popIn 0.18s ease;
        }
        @keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .popup-title { font-size: 15px; font-weight: 700; color: #111; margin: 0 0 6px; }
        .popup-sub { font-size: 12px; color: #666; margin: 0 0 20px; line-height: 1.5; }
        .popup-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
        .popup-btn-cancel { padding: 8px 16px; background: #f3f4f6; color: #444; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: system-ui, sans-serif; }
        .popup-btn-cancel:hover { background: #e5e7eb; }
        .popup-btn-ok { padding: 8px 16px; background: #111; color: #fff; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: system-ui, sans-serif; }
        .popup-btn-ok:hover:not(:disabled) { background: #333; }
        .popup-btn-ok:disabled { opacity: 0.5; cursor: not-allowed; }
        .popup-btn-danger { padding: 8px 16px; background: #ef4444; color: #fff; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: system-ui, sans-serif; }
        .popup-btn-danger:hover:not(:disabled) { background: #dc2626; }
        .popup-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

        /* FORM */
        .form-group { margin-bottom: 14px; }
        .form-label { display: block; font-size: 11px; font-weight: 600; color: #444; margin-bottom: 5px; letter-spacing: 0.3px; text-transform: uppercase; }
        .form-input {
          width: 100%; box-sizing: border-box;
          padding: 9px 12px; border: 1.5px solid #e5e7eb;
          border-radius: 8px; font-size: 13px;
          font-family: system-ui, sans-serif; color: #111;
          outline: none; transition: all 0.2s;
        }
        .form-input:focus { border-color: #111; box-shadow: 0 0 0 3px rgba(0,0,0,0.07); }
        .form-input::placeholder { color: #b0b5c9; }
        .form-file-wrap {
          width: 100%; box-sizing: border-box;
          padding: 9px 12px; border: 1.5px dashed #e5e7eb;
          border-radius: 8px; font-size: 12px;
          font-family: system-ui, sans-serif; color: #666;
          cursor: pointer; transition: all 0.2s; background: #fafafa;
          display: flex; align-items: center; gap: 8px;
        }
        .form-file-wrap:hover { border-color: #111; background: #f5f5f5; }
        .form-file-wrap svg { width: 14px; height: 14px; stroke: #9ca3af; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
        .form-file-input { display: none; }
        .qris-note { font-size: 10.5px; color: #6366f1; background: #eef2ff; border-radius: 6px; padding: 6px 10px; margin-bottom: 14px; }
      `}</style>

      {/* ── POPUP: Tambah Metode ── */}
      {showAddPopup && (
        <div
          className="popup-overlay"
          onClick={() => {
            setShowAddPopup(false);
            setAddError(null);
          }}
        >
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <p className="popup-title">Tambah Metode Pembayaran</p>
            <p className="popup-sub">Isi detail metode pembayaran baru.</p>

            <div className="form-group">
              <label className="form-label">Metode Pembayaran</label>
              <input
                className="form-input"
                type="text"
                placeholder="Contoh: BCA, BRI, qris"
                value={addForm.payment_method}
                onChange={(e) =>
                  setAddForm((prev) => ({
                    ...prev,
                    payment_method: e.target.value,
                  }))
                }
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor / Nama Rekening</label>
              <input
                className="form-input"
                type="text"
                placeholder="Contoh: 1234567890 / Nama Toko"
                value={addForm.number_payment}
                onChange={(e) =>
                  setAddForm((prev) => ({
                    ...prev,
                    number_payment: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Icon</label>
              <label className="form-file-wrap">
                <svg viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {addIcon ? addIcon.name : "Pilih file icon..."}
                <input
                  className="form-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAddIcon(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {isQris && (
              <>
                <div className="qris-note">
                  Metode <strong>QRIS</strong> terdeteksi — upload gambar QR
                  code kamu.
                </div>
                <div className="form-group">
                  <label className="form-label">QRIS (Gambar QR)</label>
                  <label className="form-file-wrap">
                    <svg viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    {addQris ? addQris.name : "Pilih file QRIS..."}
                    <input
                      className="form-file-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAddQris(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </>
            )}

            {addError && (
              <div className="popup-error">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>{addError}</p>
              </div>
            )}

            <div className="popup-actions">
              <button
                className="popup-btn-cancel"
                onClick={() => {
                  setShowAddPopup(false);
                  setAddForm({ payment_method: "", number_payment: "" });
                  setAddIcon(null);
                  setAddQris(null);
                  setAddError(null);
                }}
              >
                Batal
              </button>
              <button
                className="popup-btn-ok"
                onClick={handleAdd}
                disabled={
                  addLoading ||
                  !addForm.payment_method ||
                  !addForm.number_payment ||
                  !addIcon ||
                  (isQris && !addQris)
                }
              >
                {addLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP: Konfirmasi Hapus ── */}
      {deleteTarget && (
        <div
          className="popup-overlay"
          onClick={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
        >
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <p className="popup-title">Hapus Metode Pembayaran?</p>
            <p className="popup-sub">
              Kamu akan menghapus metode{" "}
              <strong>{deleteTarget.payment_method}</strong> dengan nomor{" "}
              <strong>{deleteTarget.number_payment}</strong>. Tindakan ini tidak
              dapat dibatalkan.
            </p>

            {deleteError && (
              <div className="popup-error">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>{deleteError}</p>
              </div>
            )}

            <div className="popup-actions">
              <button
                className="popup-btn-cancel"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
              >
                Batal
              </button>
              <button
                className="popup-btn-danger"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pm-wrap">
        {/* HEADER */}
        <div className="pm-header">
          <div className="pm-title">
            <div className="pm-title-icon">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <div>
              <h1>Metode Pembayaran</h1>
              <span>Kelola daftar metode pembayaran aktif</span>
            </div>
          </div>

          <div className="pm-controls">
            <button
              onClick={fetchData}
              disabled={loading}
              className={`btn-refresh ${loading ? "spinning" : ""}`}
            >
              <svg viewBox="0 0 24 24">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              {loading ? "Memuat..." : "Refresh"}
            </button>

            <div className="search-wrap">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Cari metode / nomor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <button className="btn-add" onClick={() => setShowAddPopup(true)}>
              <svg viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tambah
            </button>
          </div>
        </div>

        {/* Error banner — gagal fetch */}
        {fetchError && (
          <div className="error-banner">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="error-banner-body">
              <p className="error-banner-label">Gagal memuat data</p>
              <p className="error-banner-msg">{fetchError}</p>
            </div>
            <button
              className="error-banner-close"
              onClick={() => setFetchError(null)}
            >
              ×
            </button>
          </div>
        )}

        <div className="pm-badge">{filtered.length} metode ditemukan</div>

        {/* TABLE */}
        <div className="pm-table-wrap">
          <table className="pm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Icon</th>
                <th>Metode</th>
                <th>Nomor / Rekening</th>
                <th>QRIS</th>
                <th>Dibuat</th>
                <th>Diperbarui</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => {
                const created = formatDate(item.created_at);
                const updated = formatDate(item.updated_at);

                return (
                  <tr key={item.id}>
                    <td className="td-no">{index + 1}</td>
                    <td className="td-icon">
                      {item.url_icon ? (
                        <img
                          src={normalizeUrl(item.url_icon)}
                          alt={item.payment_method}
                        />
                      ) : (
                        <div className="td-icon-placeholder">
                          <svg
                            viewBox="0 0 24 24"
                            style={{
                              width: 16,
                              height: 16,
                              stroke: "#d1d5db",
                              fill: "none",
                              strokeWidth: 1.5,
                            }}
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 9h18" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="td-method">{item.payment_method}</td>
                    <td className="td-number">{item.number_payment}</td>
                    <td className="td-qris">
                      {item.url_code ? (
                        <img src={normalizeUrl(item.url_code)} alt="QRIS" />
                      ) : (
                        <span className="td-qris-none">—</span>
                      )}
                    </td>
                    <td>
                      <div className="date-cell">
                        <span className="d-date">{created.date}</span>
                        <span className="d-time">{created.time}</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <span className="d-date">{updated.date}</span>
                        <span className="d-time">{updated.time}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => {
                          setDeleteTarget(item);
                          setDeleteError(null);
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="pm-empty">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
              <p>
                {loading
                  ? "Memuat data..."
                  : "Tidak ada metode pembayaran ditemukan"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

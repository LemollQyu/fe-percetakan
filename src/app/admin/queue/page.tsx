"use client";

import { useEffect, useRef, useState } from "react";
import { getOrders, type Order } from "@/api/order";
import { getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

// ── WS types ──
type WSTimerEvent =
  | "timer_start"
  | "timer_pause"
  | "timer_resume"
  | "timer_add";

type WSTimerMessage = {
  event: WSTimerEvent;
  order_code: string;
  timer_status: "idle" | "running" | "paused";
  started_at: string | null;
  remaining_seconds: number;
};

// ── Timer state per order ──
type TimerState = {
  status: "idle" | "running" | "paused";
  remainingSeconds: number;
  startedAt: string | null; // ISO string
};

// ── REST API helpers ──
const API_BASE =
  process.env.NEXT_PUBLIC_API_ORDER_URL || "http://localhost:8082";
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8082";

async function timerAction(
  action: "start" | "pause" | "resume",
  code: string,
  token: string,
) {
  await fetch(`${API_BASE}/api/v1/admin/order/${code}/timer/${action}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function timerAdd(code: string, addSeconds: number, token: string) {
  await fetch(`${API_BASE}/api/v1/admin/order/${code}/timer/add`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ add_seconds: addSeconds }),
  });
}

// ── Format countdown ──
function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

type Tab = "antrian" | "proses";

export default function QueuePage() {
  const [tab, setTab] = useState<Tab>("antrian");
  const [antrian, setAntrian] = useState<Order[]>([]);
  const [proses, setProses] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ── Timer states (key = order code) ──
  const [timerStates, setTimerStates] = useState<Record<string, TimerState>>(
    {},
  );
  const wsRefs = useRef<Record<string, WebSocket>>({});
  const tickRefs = useRef<Record<string, NodeJS.Timeout>>({});
  // display seconds (derived from timerState, ticks every second)
  const [displaySeconds, setDisplaySeconds] = useState<Record<string, number>>(
    {},
  );

  // ── Popups ──
  const [confirmCode, setConfirmCode] = useState<string | null>(null); // "Kerjakan" confirm
  const [addDurCode, setAddDurCode] = useState<string | null>(null); // tambah durasi
  const [addMinutes, setAddMinutes] = useState<string>("");

  // ── Fetch orders ──
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const [resPaid, resProgress] = await Promise.all([
      getOrders({ status: "Paid", page: 1, limit: 50, token }),
      getOrders({ status: "On_progress", page: 1, limit: 50, token }),
    ]);

    const sortByUpdated = (a: Order, b: Order) =>
      new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();

    setAntrian(resPaid.data.sort(sortByUpdated));
    setProses(resProgress.data.sort(sortByUpdated));
    setLoading(false);
  };

  // ── Connect WS for a single order ──
  const connectWS = (code: string) => {
    if (wsRefs.current[code]) return; // already connected
    const ws = new WebSocket(`${WS_BASE}/ws/orders/${code}`);
    wsRefs.current[code] = ws;

    ws.onmessage = (event) => {
      const msg: WSTimerMessage = JSON.parse(event.data);
      applyWSMessage(code, msg);
    };

    ws.onerror = () => console.error(`WS error for ${code}`);
    ws.onclose = () => {
      delete wsRefs.current[code];
    };
  };

  const disconnectWS = (code: string) => {
    wsRefs.current[code]?.close();
    delete wsRefs.current[code];
    stopTick(code);
  };

  // ── Apply WS message → update timer state ──
  const applyWSMessage = (code: string, msg: WSTimerMessage) => {
    const newState: TimerState = {
      status: msg.timer_status,
      remainingSeconds: msg.remaining_seconds,
      startedAt: msg.started_at,
    };
    setTimerStates((prev) => ({ ...prev, [code]: newState }));

    if (msg.timer_status === "running") {
      startTick(code, msg.remaining_seconds, msg.started_at);
    } else {
      stopTick(code);
      setDisplaySeconds((prev) => ({ ...prev, [code]: msg.remaining_seconds }));
    }
  };

  // ── Tick countdown ──
  const startTick = (
    code: string,
    remainingSeconds: number,
    startedAt: string | null,
  ) => {
    stopTick(code);
    const started = startedAt ? new Date(startedAt).getTime() : Date.now();

    const tick = () => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const left = Math.max(remainingSeconds - elapsed, 0);
      setDisplaySeconds((prev) => ({ ...prev, [code]: left }));
    };

    tick();
    tickRefs.current[code] = setInterval(tick, 1000);
  };

  const stopTick = (code: string) => {
    if (tickRefs.current[code]) {
      clearInterval(tickRefs.current[code]);
      delete tickRefs.current[code];
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      Object.keys(wsRefs.current).forEach(disconnectWS);
    };
  }, []);

  // ── Handlers ──
  const handleKerjakan = (code: string) => setConfirmCode(code);

  const handleConfirmKerjakan = async () => {
    if (!confirmCode) return;
    const token = getToken();
    if (!token) return;
    connectWS(confirmCode);
    await timerAction("start", confirmCode, token);
    setConfirmCode(null);
  };

  const handleStop = async (code: string) => {
    const token = getToken();
    if (!token) return;
    await timerAction("pause", code, token);
  };

  const handleLanjutkan = async (code: string) => {
    const token = getToken();
    if (!token) return;
    await timerAction("resume", code, token);
  };

  const handleAddDuration = async () => {
    if (!addDurCode) return;
    const token = getToken();
    if (!token) return;
    const secs = parseInt(addMinutes) * 60;
    if (!secs || secs <= 0) return;
    await timerAdd(addDurCode, secs, token);
    setAddDurCode(null);
    setAddMinutes("");
  };

  // ── Helpers ──
  const activeData = tab === "antrian" ? antrian : proses;
  const filtered = activeData.filter((item) =>
    `${item.user.name} ${item.order_code.code} ${item.service_name_snapshot}`
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

  const switchTab = (t: Tab) => {
    setTab(t);
    setSearch("");
    setSelectedId(null);
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // ── Render timer cell ──
  const renderTimerCell = (item: Order) => {
    const code = item.order_code.code;
    const timer = timerStates[code];
    const display = displaySeconds[code];

    // belum ada timer state → tampilkan estimasi statis, bisa diklik saat paused
    if (!timer || timer.status === "idle") {
      return (
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#6366f1",
          }}
        >
          {formatDuration(item.estimated_duration)}
        </span>
      );
    }

    const secs = display ?? timer.remainingSeconds;
    const isLow = secs <= 60;

    if (timer.status === "paused") {
      return (
        <span
          title="Klik untuk tambah durasi"
          onClick={() => {
            setAddDurCode(code);
            setAddMinutes("");
          }}
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            fontWeight: 700,
            color: "#f59e0b",
            cursor: "pointer",
            textDecoration: "underline dotted",
            userSelect: "none",
          }}
        >
          {formatCountdown(secs)} ⏸
        </span>
      );
    }

    // running
    return (
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "12px",
          fontWeight: 700,
          color: isLow ? "#ef4444" : "#10b981",
          animation: isLow ? "pulse 1s infinite" : undefined,
        }}
      >
        {formatCountdown(secs)}
      </span>
    );
  };

  const btnStyle = (bg: string, color: string) => ({
    background: bg,
    color,
    border: "none",
    borderRadius: "7px",
    padding: "5px 12px",
    fontSize: "11px",
    fontWeight: 600 as const,
    cursor: "pointer" as const,
    fontFamily: "system-ui, sans-serif",
    whiteSpace: "nowrap" as const,
    transition: "opacity 0.15s",
  });

  return (
    <>
      <style>{`
        .queue-wrap {
          font-family: system-ui, sans-serif;
          padding: 24px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .queue-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .queue-title { display: flex; align-items: center; gap: 10px; }
        .queue-title-icon {
          width: 36px; height: 36px; background: black;
          border-radius: 10px; display: flex;
          align-items: center; justify-content: center;
        }
        .queue-title-icon svg {
          width: 18px; height: 18px; fill: none;
          stroke: #fff; stroke-width: 1.8;
          stroke-linecap: round; stroke-linejoin: round;
        }
        .queue-title h1 {
          font-size: 17px; font-weight: 600; color: #111;
          letter-spacing: -0.3px; margin: 0;
        }
        .queue-title span { font-size: 11px; color: #666; display: block; margin-top: 1px; }
        .queue-controls { display: flex; align-items: center; gap: 8px; }
        .btn-refresh {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; background: black; color: #fff;
          border: none; border-radius: 8px;
          font-family: system-ui, sans-serif; font-size: 12px;
          font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .btn-refresh:hover:not(:disabled) { background: #333; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.18); }
        .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-refresh svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .btn-refresh.spinning svg { animation: spin 0.7s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .search-wrap { position: relative; }
        .search-wrap svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 13px; height: 13px; stroke: #9ca3af; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
        .search-input { font-family: system-ui, sans-serif; font-size: 12px; padding: 7px 12px 7px 30px; border: 1.5px solid #e5e7eb; border-radius: 8px; width: 220px; color: #111; background: #fff; transition: all 0.2s; outline: none; }
        .search-input::placeholder { color: #b0b5c9; }
        .search-input:focus { border-color: #111; box-shadow: 0 0 0 3px rgba(0,0,0,0.07); }
        .queue-tabs { display: flex; margin-bottom: 14px; border-bottom: 1.5px solid #e5e7eb; }
        .tab-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; font-family: system-ui, sans-serif; font-size: 12px; font-weight: 500; color: #888; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1.5px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .tab-btn:hover { color: #111; }
        .tab-btn.active { color: #111; border-bottom-color: #111; }
        .tab-pill { font-size: 10px; font-weight: 600; padding: 1px 7px; border-radius: 20px; background: #f3f4f6; color: #666; transition: all 0.15s; }
        .tab-btn.active .tab-pill { background: #111; color: #fff; }
        .queue-badge { font-size: 11px; font-weight: 500; color: #444; background: #f3f4f6; border-radius: 6px; padding: 3px 8px; margin-bottom: 12px; display: inline-block; }
        .queue-table-wrap { border-radius: 14px; border: 1.5px solid #eaedf5; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.05); }
        .queue-table { width: 100%; border-collapse: collapse; font-size: 11.5px; table-layout: fixed; }
        .queue-table thead { background: black; }
        .queue-table thead th { padding: 10px 12px; text-align: left; font-size: 9.5px; font-weight: 500; letter-spacing: 0.8px; text-transform: uppercase; color: #fff; white-space: nowrap; }
        .queue-table thead th:first-child { width: 36px; text-align: center; }
        .queue-table tbody tr { border-bottom: 1px solid #f0f2f8; transition: background 0.15s; }
        .queue-table tbody tr:last-child { border-bottom: none; }
        .queue-table tbody tr:hover { background: #fafafa; }
        .queue-table tbody tr.selected { background: #f5f5f5; border-left: 3px solid #111; }
        .queue-table tbody tr.selected td:first-child { padding-left: 9px; }
        .queue-table td { padding: 9px 12px; color: #111; vertical-align: middle; word-break: break-word; white-space: normal; line-height: 1.5; }
        .td-no { text-align: center; font-family: monospace; font-size: 10px; font-weight: 500; color: #9ca3af; }
        .td-user { font-weight: 500; color: #111; word-break: break-word; white-space: normal; }
        .td-service { color: #444; word-break: break-word; white-space: normal; line-height: 1.5; }
        .td-amount { font-family: monospace; font-size: 11px; font-weight: 500; color: #111; white-space: nowrap; }
        .td-qty { font-family: monospace; font-size: 11px; text-align: center; color: #111; }
        .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 500; white-space: nowrap; }
        .status-badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; display: inline-block; }
        .status-paid { background: #ecfdf5; color: #059669; }
        .status-paid::before { background: #10b981; }
        .status-progress { background: #eff6ff; color: #2563eb; }
        .status-progress::before { background: #3b82f6; }
        .td-code { font-family: monospace; font-size: 10.5px; font-weight: 500; color: #6366f1; letter-spacing: 0.3px; word-break: break-all; }
        .date-cell { display: flex; flex-direction: column; gap: 2px; }
        .date-cell .d-date { font-size: 10.5px; color: #111; font-weight: 500; white-space: nowrap; }
        .date-cell .d-time { font-family: monospace; font-size: 10px; color: #6b7280; white-space: nowrap; }
        .queue-table thead th:nth-child(1) { width: 36px; text-align: center; }
        .queue-table thead th:nth-child(2) { width: 140px; }
        .queue-table thead th:nth-child(3) { width: 200px; }
        .queue-table thead th:nth-child(4) { width: 120px; }
        .queue-table thead th:nth-child(5) { width: 44px; text-align: center; }
        .queue-table thead th:nth-child(6) { width: 110px; }
        .queue-table thead th:nth-child(7) { width: 130px; }
        .queue-table thead th:nth-child(8) { width: 110px; }
        .queue-table thead th:nth-child(9) { width: 110px; }
        .queue-table thead th:nth-child(10) { width: 100px; }
        .queue-table thead th:nth-child(11) { width: 150px; }
        .queue-empty { text-align: center; padding: 48px 24px; color: #9ca3af; }
        .queue-empty svg { width: 32px; height: 32px; stroke: #d1d5db; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; margin: 0 auto 10px; display: block; }
        .queue-empty p { font-size: 13px; margin: 0; }

        /* POPUP OVERLAY */
        .popup-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; backdrop-filter: blur(2px);
        }
        .popup-box {
          background: #fff; border-radius: 16px;
          padding: 28px 28px 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          min-width: 320px; max-width: 400px; width: 100%;
          animation: popIn 0.18s ease;
        }
        @keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .popup-title { font-size: 15px; font-weight: 700; color: #111; margin: 0 0 6px; }
        .popup-sub { font-size: 12px; color: #666; margin: 0 0 20px; line-height: 1.5; }
        .popup-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .popup-btn-cancel { padding: 8px 16px; background: #f3f4f6; color: #444; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: system-ui, sans-serif; }
        .popup-btn-ok { padding: 8px 16px; background: #111; color: #fff; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: system-ui, sans-serif; }
        .popup-btn-ok:hover { background: #333; }
        .popup-input { width: 100%; box-sizing: border-box; padding: 9px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; font-family: system-ui, sans-serif; color: #111; outline: none; margin-bottom: 16px; }
        .popup-input:focus { border-color: #111; box-shadow: 0 0 0 3px rgba(0,0,0,0.07); }
      `}</style>

      {/* ── POPUP: Konfirmasi Kerjakan ── */}
      {confirmCode && (
        <div className="popup-overlay" onClick={() => setConfirmCode(null)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <p className="popup-title">Ingin mengerjakan progress ini?</p>
            <p className="popup-sub">
              Timer akan mulai berjalan untuk order{" "}
              <strong>{confirmCode}</strong>. Pastikan sudah siap sebelum
              memulai.
            </p>
            <div className="popup-actions">
              <button
                className="popup-btn-cancel"
                onClick={() => setConfirmCode(null)}
              >
                Batal
              </button>
              <button className="popup-btn-ok" onClick={handleConfirmKerjakan}>
                Ya, Mulai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP: Tambah Durasi ── */}
      {addDurCode && (
        <div className="popup-overlay" onClick={() => setAddDurCode(null)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <p className="popup-title">Tambah Durasi</p>
            <p className="popup-sub">
              Masukkan durasi tambahan (menit) untuk order{" "}
              <strong>{addDurCode}</strong>.
            </p>
            <input
              className="popup-input"
              type="number"
              min={1}
              placeholder="Contoh: 30"
              value={addMinutes}
              onChange={(e) => setAddMinutes(e.target.value)}
              autoFocus
            />
            <div className="popup-actions">
              <button
                className="popup-btn-cancel"
                onClick={() => setAddDurCode(null)}
              >
                Batal
              </button>
              <button className="popup-btn-ok" onClick={handleAddDuration}>
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="queue-wrap">
        {/* HEADER */}
        <div className="queue-header">
          <div className="queue-title">
            <div className="queue-title-icon">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M7 7h10M7 12h10M7 17h6" />
              </svg>
            </div>
            <div>
              <h1>Manajemen Pesanan</h1>
              <span>Antrian &amp; proses pengerjaan</span>
            </div>
          </div>

          <div className="queue-controls">
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
                placeholder="Cari nama / kode order..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedId(null);
                }}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="queue-tabs">
          <button
            className={`tab-btn ${tab === "antrian" ? "active" : ""}`}
            onClick={() => switchTab("antrian")}
          >
            Antrian <span className="tab-pill">{antrian.length}</span>
          </button>
          <button
            className={`tab-btn ${tab === "proses" ? "active" : ""}`}
            onClick={() => switchTab("proses")}
          >
            Proses <span className="tab-pill">{proses.length}</span>
          </button>
        </div>

        <div className="queue-badge">{filtered.length} pesanan ditemukan</div>

        {/* TABLE */}
        <div className="queue-table-wrap">
          <table className="queue-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Layanan</th>
                <th>Total</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Kode Order</th>
                <th>Dibuat</th>
                <th>{tab === "antrian" ? "Dibayar" : "Dikonfirmasi"}</th>
                {tab === "proses" && <th>Estimasi</th>}
                {tab === "proses" && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => {
                const created = formatDate(item.created_at);
                const updated = formatDate(item.updated_at);
                const isSelected = selectedId === item.id;

                return (
                  <tr
                    key={item.id}
                    onClick={() => {
                      if (tab === "proses") return;
                      setSelectedId(item.id);
                      router.push(
                        `/admin/kelola/orders/${item.order_code.code}`,
                      );
                    }}
                    className={isSelected ? "selected" : ""}
                    style={{ cursor: tab === "proses" ? "default" : "pointer" }}
                  >
                    <td className="td-no">{index + 1}</td>
                    <td className="td-user">{item.user.name}</td>
                    <td className="td-service">{item.service_name_snapshot}</td>
                    <td className="td-amount">
                      Rp {item.total_price_snapshot.toLocaleString("id-ID")}
                    </td>
                    <td className="td-qty">{item.quantity}</td>
                    <td>
                      <span
                        className={`status-badge ${tab === "antrian" ? "status-paid" : "status-progress"}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="td-code">{item.order_code.code}</td>
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

                    {tab === "proses" && (
                      <td onClick={(e) => e.stopPropagation()}>
                        {renderTimerCell(item)}
                      </td>
                    )}

                    {tab === "proses" && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            style={{
                              background: "#f3f4f6",
                              color: "#111",
                              border: "none",
                              borderRadius: "7px",
                              padding: "5px 12px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "system-ui, sans-serif",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => {
                              setSelectedId(item.id);
                              router.push(
                                `/admin/kelola/orders/${item.order_code.code}`,
                              );
                            }}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="queue-empty">
              <svg viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
              <p>Tidak ada pesanan ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

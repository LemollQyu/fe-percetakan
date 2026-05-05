"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState, useCallback } from "react";
import { getToken, clearAuth } from "@/lib/auth";
import { getAdminInfo } from "@/api/authentikasi/admin-info/get";
import { logout } from "@/api/authentikasi/logout/post";
import { getOrders, Order } from "@/api/order/orders/get-order";
import { getRefunds, RefundData } from "@/api/payment";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileInfo {
  username: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const DefaultAvatarIcon = ({
  className = "text-white",
}: {
  className?: string;
}) => (
  <svg
    className={`w-6 h-6 ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const BellIcon = () => (
  <svg
    className="w-5 h-5 text-white"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const MenuIcon = () => (
  <svg
    className="w-6 h-6 text-white"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);

const ImageIcon = ({ className = "text-blue-500" }: { className?: string }) => (
  <svg
    className={`w-6 h-6 ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
    />
  </svg>
);

const FileIcon = ({
  className = "text-orange-500",
}: {
  className?: string;
}) => (
  <svg
    className={`w-6 h-6 ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
    />
  </svg>
);

// ─── Sub-komponen: Order Thumbnail ────────────────────────────────────────────

function OrderThumbnail({ order }: { order: Order }) {
  const file = order.order_file;

  if (!file) {
    return (
      <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-stone-100 border border-stone-200">
        <FileIcon className="w-5 h-5 text-stone-400" />
      </div>
    );
  }

  const isImage = /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(file.file_url);

  return (
    <div
      className={`w-12 h-12 flex items-center justify-center rounded-2xl border ${isImage ? "bg-blue-50 border-blue-100" : "bg-orange-50 border-orange-100"}`}
    >
      {isImage ? (
        <ImageIcon className="w-6 h-6 text-blue-500" />
      ) : (
        <FileIcon className="w-6 h-6 text-orange-500" />
      )}
    </div>
  );
}

// ─── Sub-komponen: Notification Item ─────────────────────────────────────────

function NotificationItem({
  order,
  statusType,
  isRead,
  onCheck,
}: {
  order: Order;
  statusType: "waiting" | "paid";
  isRead: boolean;
  onCheck: (id: string | number) => void;
}) {
  return (
    <Link
      href={`/admin/kelola/orders/${order.order_code?.code ?? order.id}`}
      onClick={() => onCheck(order.id)}
      className={`group flex items-center gap-4 p-4 rounded-2xl transition-all mb-1.5 ${
        isRead
          ? "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:bg-stone-50"
          : statusType === "waiting"
            ? "bg-amber-50/50 hover:bg-amber-100/40 border-l-4 border-amber-400"
            : "bg-emerald-50/50 hover:bg-emerald-100/40 border-l-4 border-emerald-400"
      }`}
    >
      <OrderThumbnail order={order} />

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="text-[13px] font-bold text-stone-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
            {order.service_name_snapshot}
          </h4>
          <span className="text-[9px] text-stone-400 font-medium ml-2 whitespace-nowrap">
            {new Date(order.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex flex-col mt-1 space-y-0.5">
          <p className="text-[11px] text-stone-500 font-medium">
            Oleh:{" "}
            <span className="text-stone-700 font-bold">
              {order.user.name || "User"}
            </span>
          </p>
          <p className="text-[10px] text-stone-400">
            Kuantitas:{" "}
            <span className="font-semibold">{order.quantity} item</span>
          </p>
        </div>
      </div>

      {!isRead && (
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${statusType === "waiting" ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`}
        />
      )}
    </Link>
  );
}

// ─── Sub-komponen: Notification Box ──────────────────────────────────────────

function NotificationBox({
  notifRef,
  waitingOrders,
  paidOrders,
  unreadWaiting,
  unreadPaid,
  totalUnreadCount,
  checkedOrderIds,
  notifLoading,
  refundOrders,
  unreadRefunds,
  checkedRefundIds,
  onCheckRefund,
  onCheck,
  onMarkAllRead,
}: {
  notifRef: React.RefObject<HTMLDivElement>; // FIX 1: izinkan null
  waitingOrders: Order[];
  paidOrders: Order[];
  unreadWaiting: Order[];
  unreadPaid: Order[];
  totalUnreadCount: number;
  checkedOrderIds: string[];
  notifLoading: boolean;
  refundOrders: RefundData[];
  unreadRefunds: RefundData[];
  checkedRefundIds: string[];
  onCheckRefund: (id: string | number) => void;
  onCheck: (id: string | number) => void;
  onMarkAllRead: () => void;
}) {
  return (
    <div
      ref={notifRef}
      className="absolute top-full right-0 mt-3 w-[360px] rounded-3xl overflow-hidden z-50 bg-white/95 backdrop-blur-xl border border-stone-100 shadow-2xl"
    >
      {/* Header */}
      <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
        <div>
          <h3 className="font-barlow-bold text-stone-950 font-bold text-xs uppercase tracking-wider">
            Pusat Notifikasi
          </h3>
          <p className="text-[10px] text-stone-500 mt-0.5">
            {notifLoading
              ? "Memuat pesanan..."
              : `Anda memiliki ${totalUnreadCount} pesanan baru yang belum diproses.`}
          </p>
        </div>
        {totalUnreadCount > 0 && !notifLoading && (
          <button
            onClick={onMarkAllRead}
            className="text-[11px] text-blue-600 font-bold hover:underline px-3 py-1.5 rounded-full hover:bg-blue-50 transition-all"
          >
            Tandai Dibaca
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto pt-2 pb-4 space-y-2">
        {/* Skeleton loading */}
        {notifLoading && (
          <div className="px-5 py-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-stone-100 rounded-lg w-3/4" />
                  <div className="h-2.5 bg-stone-100 rounded-lg w-1/2" />
                  <div className="h-2 bg-stone-100 rounded-lg w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!notifLoading &&
          waitingOrders.length === 0 &&
          paidOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center text-stone-400">
              <BellIcon />
              <p className="mt-3 text-xs italic">
                Tidak ada notifikasi pesanan.
              </p>
            </div>
          )}

        {!notifLoading && waitingOrders.length > 0 && (
          <div className="px-3">
            <p className="px-4 py-2 text-[10px] font-bold text-amber-700 uppercase tracking-widest bg-amber-50 rounded-lg mb-2">
              Menunggu Pembayaran ({unreadWaiting.length})
            </p>
            {waitingOrders.map((o) => (
              <NotificationItem
                key={o.id}
                order={o}
                statusType="waiting"
                isRead={checkedOrderIds.includes(String(o.id))}
                onCheck={onCheck}
              />
            ))}
          </div>
        )}

        {!notifLoading && waitingOrders.length > 0 && paidOrders.length > 0 && (
          <div className="h-[1px] bg-stone-100 mx-5 my-3" />
        )}

        {!notifLoading && paidOrders.length > 0 && (
          <div className="px-3">
            <p className="px-4 py-2 text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 rounded-lg mb-2">
              Sudah Dibayar ({unreadPaid.length})
            </p>
            {paidOrders.map((o) => (
              <NotificationItem
                key={o.id}
                order={o}
                statusType="paid"
                isRead={checkedOrderIds.includes(String(o.id))}
                onCheck={onCheck}
              />
            ))}
          </div>
        )}
        {/* Divider */}
        {!notifLoading && paidOrders.length > 0 && refundOrders.length > 0 && (
          <div className="h-[1px] bg-stone-100 mx-5 my-3" />
        )}

        {/* Section: Pengembalian Dana */}
        {!notifLoading && refundOrders.length > 0 && (
          <div className="px-3">
            <p className="px-4 py-2 text-[10px] font-bold text-red-700 uppercase tracking-widest bg-red-50 rounded-lg mb-2">
              Pengembalian Dana ({unreadRefunds.length})
            </p>
            {refundOrders.map((r) => {
              const isRead = checkedRefundIds.includes(String(r.id));
              return (
                <Link
                  key={r.id}
                  href={`/admin/kelola/refunds/${r.id}`}
                  onClick={() => onCheckRefund(r.id)}
                  className={`group flex items-center gap-4 p-4 rounded-2xl transition-all mb-1.5 ${
                    isRead
                      ? "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:bg-stone-50"
                      : "bg-red-50/50 hover:bg-red-100/40 border-l-4 border-red-400"
                  }`}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-50 border border-red-100 shrink-0">
                    <svg
                      className="w-5 h-5 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                      />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-[13px] font-bold text-stone-900 truncate leading-tight group-hover:text-red-600 transition-colors">
                        {r.order_name}
                      </h4>
                      <span className="text-[9px] text-stone-400 font-medium ml-2 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex flex-col mt-1 space-y-0.5">
                      <p className="text-[11px] text-stone-500 font-medium">
                        Bank:{" "}
                        <span className="text-stone-700 font-bold">
                          {r.refunds?.[0]?.bank_name ?? "–"}
                        </span>
                      </p>
                      <p className="text-[10px] text-stone-400">
                        Kode:{" "}
                        <span className="font-semibold">{r.order_code}</span>
                      </p>
                    </div>
                  </div>

                  {!isRead && (
                    <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main: AdminHeader ────────────────────────────────────────────────────────

export function AdminHeader() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [profile, setProfile] = useState<ProfileInfo>({
    username: "",
    name: "",
    email: "",
    phone: null,
    avatar_url: null,
  });
  const [waitingOrders, setWaitingOrders] = useState<Order[]>([]);
  const [paidOrders, setPaidOrders] = useState<Order[]>([]);
  const [checkedOrderIds, setCheckedOrderIds] = useState<string[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const [refundOrders, setRefundOrders] = useState<RefundData[]>([]);
  const [checkedRefundIds, setCheckedRefundIds] = useState<string[]>([]);

  // menu
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(
    null,
  ) as React.MutableRefObject<HTMLDivElement>;
  const menuTriggerRef = useRef<HTMLButtonElement>(
    null,
  ) as React.MutableRefObject<HTMLButtonElement>;

  const navMenus = [
    { label: "Kelola", href: "/admin/kelola" },
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Pesanan", href: "/admin/queue" },
  ];

  const cardRef = useRef<HTMLDivElement>(
    null,
  ) as React.MutableRefObject<HTMLDivElement>;
  const triggerRef = useRef<HTMLButtonElement>(
    null,
  ) as React.MutableRefObject<HTMLButtonElement>;
  const notifRef = useRef<HTMLDivElement>(
    null,
  ) as React.MutableRefObject<HTMLDivElement>;
  const notifTriggerRef = useRef<HTMLButtonElement>(
    null,
  ) as React.MutableRefObject<HTMLButtonElement>;

  // FIX 2: handleAuthError pakai useCallback agar stabil sebagai dependency effect
  const handleAuthError = useCallback(() => {
    clearAuth();
    window.location.replace("/admin/login");
  }, []);

  // Di useEffect mount (yang load localStorage):
  useEffect(() => {
    const saved = localStorage.getItem("admin_checked_orders");
    if (saved) {
      try {
        setCheckedOrderIds(JSON.parse(saved));
      } catch {}
    }
    const savedRefunds = localStorage.getItem("admin_checked_refunds");
    if (savedRefunds) {
      try {
        setCheckedRefundIds(JSON.parse(savedRefunds));
      } catch {}
    }
    setIsMounted(true);
  }, []);

  // 2. Fetch admin info — hanya saat profile dibuka
  useEffect(() => {
    if (!profileOpen) return;
    const token = getToken();
    if (!token) return;
    getAdminInfo(token)
      .then((info) =>
        setProfile({
          username: info.username ?? "",
          name: info.name ?? "",
          email: info.email ?? "",
          phone: info.phone ?? null,
          avatar_url: info.avatar_url ?? null,
        }),
      )
      .catch((err) => {
        if (err?.status === 401) handleAuthError();
      });
  }, [profileOpen, handleAuthError]); // FIX 2: handleAuthError masuk dependency

  // 3. Fetch notifikasi — tunggu sampai client mount agar localStorage siap
  useEffect(() => {
    if (!isMounted) return;

    // fetch refund
    const fetchData = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const [resWaiting, resPaid, resRefund] = await Promise.all([
          getOrders({ token, status: "Waiting_payment", limit: 10 }),
          getOrders({ token, status: "Paid", limit: 10 }),
          getRefunds({ token, status: "requested", limit: 10 }), // tambah ini
        ]);
        setWaitingOrders(resWaiting.data);
        setPaidOrders(resPaid.data);
        setRefundOrders(resRefund.data); // tambah ini
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setNotifLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [isMounted]);

  // 4. Hitung unread
  const unreadWaiting = waitingOrders.filter(
    (o) => !checkedOrderIds.includes(String(o.id)),
  );
  const unreadPaid = paidOrders.filter(
    (o) => !checkedOrderIds.includes(String(o.id)),
  );
  const unreadRefunds = refundOrders.filter(
    (r) => !checkedRefundIds.includes(String(r.id)),
  );

  // Update totalUnreadCount:
  const totalUnreadCount =
    unreadWaiting.length + unreadPaid.length + unreadRefunds.length;
  // FIX 3: Functional update agar tidak stale saat dipanggil cepat berturut-turut
  const handleCheckOrder = useCallback((id: string | number) => {
    const orderId = String(id);
    setCheckedOrderIds((prev) => {
      if (prev.includes(orderId)) return prev;
      const next = [...prev, orderId];
      localStorage.setItem("admin_checked_orders", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleCheckRefund = useCallback((id: string | number) => {
    const strId = String(id);
    setCheckedRefundIds((prev) => {
      if (prev.includes(strId)) return prev;
      const next = [...prev, strId];
      localStorage.setItem("admin_checked_refunds", JSON.stringify(next));
      return next;
    });
  }, []);

  // FIX 3: Sama — merge dengan prev agar tidak buang ID lama
  const markAllAsRead = useCallback(() => {
    setCheckedOrderIds((prev) => {
      const allIds = [...waitingOrders, ...paidOrders].map((o) => String(o.id));
      const merged = Array.from(new Set([...prev, ...allIds]));
      localStorage.setItem("admin_checked_orders", JSON.stringify(merged));
      return merged;
    });
    setCheckedRefundIds((prev) => {
      const allIds = refundOrders.map((r) => String(r.id));
      const merged = Array.from(new Set([...prev, ...allIds]));
      localStorage.setItem("admin_checked_refunds", JSON.stringify(merged));
      return merged;
    });
  }, [waitingOrders, paidOrders, refundOrders]);
  // 5. Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        profileOpen &&
        !cardRef.current?.contains(t) &&
        !triggerRef.current?.contains(t)
      )
        setProfileOpen(false);
      if (
        notifOpen &&
        !notifRef.current?.contains(t) &&
        !notifTriggerRef.current?.contains(t)
      )
        setNotifOpen(false);

      // ← tambah di sini, setelah yang notifOpen
      if (
        menuOpen &&
        !menuRef.current?.contains(t) &&
        !menuTriggerRef.current?.contains(t)
      )
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen, notifOpen, menuOpen]); // ← tambah menuOpen di sini juga

  const handleLogout = async () => {
    const token = getToken();
    if (token) {
      try {
        await logout(token);
      } catch {}
    }
    handleAuthError();
  };

  if (pathname === "/admin/login") return null;

  return (
    <div className="sticky top-0 z-30 pt-3 px-4">
      <header className="max-w-[1000px] w-full mx-auto flex items-center h-16 px-5 rounded-3xl bg-black relative shadow-lg">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => {
                setMenuOpen((v) => !v);
                setProfileOpen(false);
                setNotifOpen(false);
              }}
              className="flex items-center justify-center w-11 h-11 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <MenuIcon />
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute top-full -left-5 mt-3 w-48 rounded-2xl overflow-hidden z-50 bg-white border border-stone-100 shadow-2xl py-2"
              >
                <p className="px-4 pt-1 pb-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Navigasi
                </p>
                {navMenus.map((menu) => {
                  const isActive = pathname.startsWith(menu.href);
                  return (
                    <Link
                      key={menu.href}
                      href={menu.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                        isActive
                          ? "bg-stone-100 text-stone-900"
                          : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                          isActive ? "bg-stone-900" : "bg-stone-300"
                        }`}
                      />
                      {menu.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          <Link
            href="/admin/dashboard"
            className="font-barlow-bold text-xl font-extrabold text-white tracking-tight"
          >
            Dash<span className="text-stone-400">board</span>
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5 relative ml-auto">
          {/* Tombol Notifikasi */}
          <button
            ref={notifTriggerRef}
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative flex items-center justify-center w-11 h-11 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <BellIcon />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-extrabold px-1 animate-pulse shadow-md border border-black/10">
                {totalUnreadCount}
              </span>
            )}
          </button>

          {/* Box Notifikasi */}
          {notifOpen && (
            <NotificationBox
              notifRef={notifRef}
              waitingOrders={waitingOrders}
              paidOrders={paidOrders}
              unreadWaiting={unreadWaiting}
              unreadPaid={unreadPaid}
              totalUnreadCount={totalUnreadCount}
              checkedOrderIds={checkedOrderIds}
              notifLoading={notifLoading}
              refundOrders={refundOrders}
              unreadRefunds={unreadRefunds}
              checkedRefundIds={checkedRefundIds}
              onCheckRefund={handleCheckRefund}
              onCheck={handleCheckOrder}
              onMarkAllRead={markAllAsRead}
            />
          )}

          {/* Tombol Profile */}
          <button
            ref={triggerRef}
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center justify-center w-11 h-11 rounded-full overflow-hidden text-white hover:ring-2 hover:ring-white/50 active:scale-95 transition-all ring-1 ring-white/10"
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                className="w-full h-full object-cover"
                alt="avatar"
              />
            ) : (
              <DefaultAvatarIcon className="text-stone-300 w-5 h-5" />
            )}
          </button>

          {/* Box Profile */}
          {profileOpen && (
            <div
              ref={cardRef}
              className="absolute top-full right-0 mt-3 w-80 rounded-3xl overflow-hidden z-50 bg-white/95 backdrop-blur-xl border border-stone-100 shadow-2xl"
            >
              <div className="p-6 bg-gradient-to-b from-stone-100/80 to-white/70">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-4 ring-white shadow-xl bg-white flex items-center justify-center border border-stone-100">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        className="w-full h-full object-cover"
                        alt="avatar"
                      />
                    ) : (
                      <DefaultAvatarIcon className="text-stone-500 w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-white bg-stone-900 px-2.5 py-1 rounded-full shadow-sm">
                      Admin
                    </span>
                    <p className="font-barlow-bold text-stone-950 font-bold truncate text-[16px] mt-1.5">
                      {profile.username || "Admin"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 pt-0 space-y-4 border-t border-stone-100">
                <div className="mt-4">
                  <p className="text-[10px] text-stone-400 font-extrabold uppercase tracking-widest">
                    Email Address
                  </p>
                  <p className="text-sm text-stone-800 font-medium">
                    {profile.email || "–"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-stone-950 text-white rounded-2xl text-xs font-bold hover:bg-stone-800 transition-all shadow-md active:scale-95"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

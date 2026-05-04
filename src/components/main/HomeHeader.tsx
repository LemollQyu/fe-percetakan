"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState, useCallback } from "react";
import {
  getToken,
  getAuthRole,
  getUserAvatarUrl,
  getUserProfile,
  clearAuth,
  setUserProfile,
  setUserAvatarUrl,
} from "@/lib/auth";
import { getUserInfo } from "@/api/authentikasi/user-info/get";
import { logout } from "@/api/authentikasi/logout/post";
import { getMyRefund, RefundData } from "@/api/payment";
import { getMyOrders, MyOrder } from "@/api/order";

const BellIcon = () => (
  <svg
    className="w-5 h-5 text-stone-500"
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

const DefaultAvatarIcon = () => (
  <svg
    className="w-6 h-6 text-stone-500"
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

export function HomeHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
  });

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

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // Data notif
  const [refunds, setRefunds] = useState<RefundData[]>([]);
  const [transferredRefunds, setTransferredRefunds] = useState<RefundData[]>(
    [],
  );
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [finishedOrders, setFinishedOrders] = useState<MyOrder[]>([]);

  // Checked IDs
  const [checkedNotifIds, setCheckedNotifIds] = useState<string[]>([]);

  // Mount + load localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("user_checked_notifs");
    if (saved) {
      try {
        setCheckedNotifIds(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // FIX: functional update agar tidak stale
  const handleCheckNotif = useCallback((id: string | number) => {
    const strId = String(id);
    setCheckedNotifIds((prev) => {
      if (prev.includes(strId)) return prev;
      const next = [...prev, strId];
      localStorage.setItem("user_checked_notifs", JSON.stringify(next));
      return next;
    });
  }, []);

  const markAllUserNotifRead = useCallback(() => {
    setCheckedNotifIds((prev) => {
      const allIds = [
        ...refunds.map((r) => `refund-${r.id}`),
        ...transferredRefunds.map((r) => `transferred-${r.id}`),
        ...orders.map((o) => `order-${o.id}`),
        ...finishedOrders.map((o) => `finished-${o.id}`),
      ];
      const merged = Array.from(new Set([...prev, ...allIds]));
      localStorage.setItem("user_checked_notifs", JSON.stringify(merged));
      return merged;
    });
  }, [refunds, transferredRefunds, orders, finishedOrders]);

  // Hitung unread
  const unreadRefunds = refunds.filter(
    (r) => !checkedNotifIds.includes(`refund-${r.id}`),
  );
  const unreadTransferred = transferredRefunds.filter(
    (r) => !checkedNotifIds.includes(`transferred-${r.id}`),
  );
  const unreadOrders = orders.filter(
    (o) => !checkedNotifIds.includes(`order-${o.id}`),
  );
  const unreadFinished = finishedOrders.filter(
    (o) => !checkedNotifIds.includes(`finished-${o.id}`),
  );
  const totalUnread =
    unreadRefunds.length +
    unreadTransferred.length +
    unreadOrders.length +
    unreadFinished.length;

  // Fetch user info
  useEffect(() => {
    if (!mounted) return;
    const token = getToken();
    const role = getAuthRole();
    const isUser = !!token && role === "user";
    setLoggedIn(isUser);
    setProfile(getUserProfile());
    setAvatarUrl(getUserAvatarUrl());

    if (isUser && token) {
      const current = getUserProfile();
      if (
        !current.username &&
        !current.name &&
        !current.email &&
        !current.phone
      ) {
        getUserInfo(token)
          .then((info) => {
            setUserProfile({
              username: info.username ?? "",
              name: info.name ?? "",
              email: info.email ?? "",
              phone: info.phone ?? "",
            });
            if (info.avatar_url) {
              setUserAvatarUrl(info.avatar_url);
              setAvatarUrl(info.avatar_url);
            }
            setProfile({
              username: info.username ?? "",
              name: info.name ?? "",
              email: info.email ?? "",
              phone: info.phone ?? "",
            });
          })
          .catch(() => {});
      }
    }
  }, [mounted, pathname]);

  // Fetch notif data
  const fetchNotifData = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setNotifLoading(true);
    try {
      const [refundAllRes, refundTransferredRes, orderRes, finishedRes] =
        await Promise.all([
          getMyRefund({ token, status: "" }),
          getMyRefund({ token, status: "transferred" }),
          getMyOrders({ token, status: "Waiting_payment", limit: 5 }),
          getMyOrders({ token, status: "Finished", limit: 5 }),
        ]);

      // status "" — filter yang belum ada refund item
      const pendingRefunds = (refundAllRes.data || []).filter(
        (r) => !r.refunds || r.refunds.length === 0,
      );
      setRefunds(pendingRefunds);

      // status "transferred"
      setTransferredRefunds(refundTransferredRes.data || []);

      const orderData = Array.isArray(orderRes)
        ? orderRes
        : orderRes.data || [];
      const finishedData = Array.isArray(finishedRes)
        ? finishedRes
        : finishedRes.data || [];

      setOrders(orderData);
      setFinishedOrders(finishedData);
    } catch (err) {
      console.error("Gagal ambil notif:", err);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Polling — fetch saat loggedIn + tiap 30 detik saat tab aktif
  useEffect(() => {
    if (!loggedIn) return;

    fetchNotifData();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchNotifData();
    }, 30_000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchNotifData();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loggedIn, fetchNotifData]);

  // Refresh saat panel notif dibuka
  useEffect(() => {
    if (!notifOpen) return;
    fetchNotifData();
  }, [notifOpen, fetchNotifData]);

  // Outside click — profile
  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        cardRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;
      setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  // Outside click — notif
  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        notifRef.current?.contains(target) ||
        notifTriggerRef.current?.contains(target)
      )
        return;
      setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const handleSignOut = async () => {
    setProfileOpen(false);
    const token = getToken();
    if (token) {
      try {
        await logout(token);
      } catch {}
    }
    clearAuth();
    window.location.replace("/");
  };

  const hideOnServiceDetail =
    (pathname.startsWith("/category/") && pathname.includes("/service/")) ||
    pathname === "/riwayat-order" ||
    pathname.startsWith("/order/") ||
    pathname.startsWith("/my-order/") ||
    pathname.startsWith("/payment/") ||
    pathname.startsWith("/refund") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/landing-page");

  if (hideOnServiceDetail) return null;

  if (!mounted) {
    return (
      <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 max-w-[430px] w-full mx-auto border-b border-stone-200/60 bg-[#f5f0eb]/90 backdrop-blur-sm">
        <span className="font-barlow-bold text-lg font-semibold text-stone-800">
          Nabila Fotocopy
        </span>
        <div className="w-24 h-10 rounded-xl bg-stone-200/50 animate-pulse" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 max-w-[430px] w-full mx-auto border-b border-stone-200/60 bg-[#f5f0eb]/90 backdrop-blur-sm">
      <span className="font-barlow-bold text-lg font-semibold text-stone-800">
        Nabila Fotocopy
      </span>

      <div className="flex items-center gap-2 relative">
        {loggedIn ? (
          <>
            {/* Tombol Notif */}
            <button
              ref={notifTriggerRef}
              onClick={() => {
                setNotifOpen((v) => !v);
                setProfileOpen(false);
              }}
              className="relative flex items-center justify-center w-11 h-11 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <BellIcon />
              {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1 shadow border border-[#f5f0eb]">
                  {totalUnread}
                </span>
              )}
            </button>

            {/* Tombol Profile */}
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-stone-200 border-2 border-stone-200 hover:border-stone-300 active:scale-95 transition-all shrink-0"
              aria-label="Profil"
              aria-expanded={profileOpen}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="flex w-full h-full items-center justify-center bg-stone-100">
                  <DefaultAvatarIcon />
                </span>
              )}
            </button>

            {/* Box Profile */}
            {profileOpen && (
              <div
                ref={cardRef}
                className="absolute top-full right-0 mt-2 w-80 rounded-[20px] bg-white border border-stone-100 shadow-2xl shadow-stone-300/40 ring-1 ring-stone-100/80 overflow-hidden z-30"
              >
                <div className="pt-5 pb-4 px-5 bg-gradient-to-b from-stone-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-stone-200 ring-2 ring-white shadow-md">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="flex w-full h-full items-center justify-center bg-stone-100">
                          <DefaultAvatarIcon />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-monterat-tipis text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                        Username
                      </p>
                      <p className="font-barlow-bold text-stone-900 font-semibold truncate text-[15px] mt-0.5">
                        {profile.username || profile.email || "–"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 space-y-2.5 border-t border-stone-100">
                  {/* Nama */}
                  <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-stone-50/80">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-200/80 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-stone-600"
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
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-monterat-tipis text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                        Nama
                      </p>
                      <p className="font-monterat-tipis text-stone-800 text-sm truncate">
                        {profile.name || "–"}
                      </p>
                    </div>
                  </div>
                  {/* Email */}
                  <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-stone-50/80">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-200/80 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-stone-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-monterat-tipis text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                        Email
                      </p>
                      <p className="font-monterat-tipis text-stone-800 text-sm truncate">
                        {profile.email || "–"}
                      </p>
                    </div>
                  </div>
                  {/* Phone */}
                  <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-stone-50/80">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-200/80 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-stone-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-monterat-tipis text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                        Phone
                      </p>
                      <p className="font-monterat-tipis text-stone-800 text-sm truncate">
                        {profile.phone || "–"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-2 border-t border-stone-100 bg-stone-50/30">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="font-barlow-bold w-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-stone-900 text-white font-semibold text-[14px] shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.99] transition-all"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}

            {/* Box Notif */}
            {notifOpen && (
              <div
                ref={notifRef}
                className="absolute top-full right-0 mt-2 w-80 rounded-[20px] bg-white border border-stone-100 shadow-2xl shadow-stone-300/40 overflow-hidden z-30"
              >
                {/* Header notif */}
                <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-stone-800 text-sm">
                      Notifikasi
                    </p>
                    {totalUnread > 0 && (
                      <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1">
                        {totalUnread}
                      </span>
                    )}
                  </div>
                  {totalUnread > 0 && !notifLoading && (
                    <button
                      onClick={markAllUserNotifRead}
                      className="text-[11px] text-stone-500 hover:text-stone-800 font-medium"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {/* Skeleton */}
                  {notifLoading && (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse flex gap-3">
                          <div className="w-9 h-9 rounded-xl bg-stone-100 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-2.5 bg-stone-100 rounded w-3/4" />
                            <div className="h-2 bg-stone-100 rounded w-1/2" />
                            <div className="h-2 bg-stone-100 rounded w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!notifLoading && (
                    <>
                      {/* ── Section: Menunggu Pembayaran ── */}
                      <div className="px-4 py-2 flex items-center gap-2 border-b border-stone-100 bg-amber-50/40">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                          Menunggu Pembayaran
                        </p>
                        <span className="ml-auto text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {unreadOrders.length}
                        </span>
                      </div>

                      {orders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-5 text-center text-stone-400">
                          <BellIcon />
                          <p className="mt-1.5 text-xs italic">
                            Tidak ada pembayaran menunggu
                          </p>
                        </div>
                      )}

                      {orders.map((o) => {
                        const isRead = checkedNotifIds.includes(
                          `order-${o.id}`,
                        );
                        return (
                          <Link
                            href={`/order/${o.order_code.code}`}
                            key={o.id}
                            onClick={() => handleCheckNotif(`order-${o.id}`)}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-stone-100 cursor-pointer transition-all ${
                              isRead
                                ? "opacity-50 hover:opacity-80 hover:bg-stone-50"
                                : "border-l-4 border-l-amber-400 hover:bg-amber-50/30"
                            }`}
                          >
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 border border-amber-100 shrink-0">
                              <svg
                                className="w-4 h-4 text-amber-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.8}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-stone-800">
                                Menunggu pembayaran
                              </p>
                              <p className="text-[11px] text-stone-500 truncate">
                                Order {o.service_name_snapshot}
                              </p>
                              <p className="text-[11px] text-stone-500 truncate">
                                Total {o.total_price_snapshot}
                              </p>
                              <p className="text-[10px] text-stone-400 mt-0.5">
                                {o.created_at
                                  ? new Date(o.created_at).toLocaleString(
                                      "id-ID",
                                    )
                                  : "-"}
                              </p>
                            </div>
                            {!isRead && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            )}
                          </Link>
                        );
                      })}

                      {/* ── Section: Pengembalian Dana (status "") ── */}
                      <div className="px-4 py-2 flex items-center gap-2 border-b border-stone-100 bg-red-50/40">
                        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                        <p className="text-[10px] font-semibold text-red-800 uppercase tracking-wider">
                          Pengembalian Dana
                        </p>
                        <span className="ml-auto text-[10px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          {unreadRefunds.length}
                        </span>
                      </div>

                      {refunds.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-5 text-center text-stone-400">
                          <BellIcon />
                          <p className="mt-1.5 text-xs italic">
                            Tidak ada notifikasi refund
                          </p>
                        </div>
                      )}

                      {refunds.map((r) => {
                        const isRead = checkedNotifIds.includes(
                          `refund-${r.id}`,
                        );
                        return (
                          <Link
                            href={`/refund/${r.id}`}
                            key={r.id}
                            onClick={() => handleCheckNotif(`refund-${r.id}`)}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-stone-100 cursor-pointer transition-all ${
                              isRead
                                ? "opacity-50 hover:opacity-80 hover:bg-stone-50"
                                : "border-l-4 border-l-red-400 hover:bg-red-50/30"
                            }`}
                          >
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 border border-red-100 shrink-0">
                              <svg
                                className="w-4 h-4 text-red-400"
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
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-stone-800">
                                Pengembalian dana diajukan
                              </p>
                              <p className="text-[11px] text-stone-500 truncate">
                                {r.order_name}
                              </p>
                              {r.admin_note && (
                                <p className="text-[11px] text-red-500 mt-0.5 line-clamp-1">
                                  {r.admin_note}
                                </p>
                              )}
                              <p className="text-[10px] text-stone-400 mt-0.5">
                                {new Date(r.created_at).toLocaleString("id-ID")}
                              </p>
                            </div>
                            {!isRead && (
                              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                            )}
                          </Link>
                        );
                      })}

                      {/* ── Section: Dana Ditransfer (status "transferred") ── */}
                      <div className="px-4 py-2 flex items-center gap-2 border-b border-stone-100 bg-blue-50/40">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        <p className="text-[10px] font-semibold text-blue-800 uppercase tracking-wider">
                          Dana Ditransfer
                        </p>
                        <span className="ml-auto text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          {unreadTransferred.length}
                        </span>
                      </div>

                      {transferredRefunds.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-5 text-center text-stone-400">
                          <BellIcon />
                          <p className="mt-1.5 text-xs italic">
                            Tidak ada dana yang ditransfer
                          </p>
                        </div>
                      )}

                      {transferredRefunds.map((r) => {
                        const isRead = checkedNotifIds.includes(
                          `transferred-${r.id}`,
                        );
                        return (
                          <Link
                            href={`/refund/${r.id}`}
                            key={r.id}
                            onClick={() =>
                              handleCheckNotif(`transferred-${r.id}`)
                            }
                            className={`flex items-center gap-3 px-4 py-3 border-b border-stone-100 cursor-pointer transition-all ${
                              isRead
                                ? "opacity-50 hover:opacity-80 hover:bg-stone-50"
                                : "border-l-4 border-l-blue-400 hover:bg-blue-50/30"
                            }`}
                          >
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 border border-blue-100 shrink-0">
                              <svg
                                className="w-4 h-4 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.8}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-stone-800">
                                Dana sudah ditransfer
                              </p>
                              <p className="text-[11px] text-stone-500 truncate">
                                {r.order_name}
                              </p>
                              {r.admin_note && (
                                <p className="text-[11px] text-blue-500 mt-0.5 line-clamp-1">
                                  {r.admin_note}
                                </p>
                              )}
                              <p className="text-[10px] text-stone-400 mt-0.5">
                                {new Date(r.created_at).toLocaleString("id-ID")}
                              </p>
                            </div>
                            {!isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                            )}
                          </Link>
                        );
                      })}

                      {/* ── Section: Pesanan Selesai ── */}
                      <div className="px-4 py-2 flex items-center gap-2 border-b border-stone-100 bg-green-50/40">
                        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                        <p className="text-[10px] font-semibold text-green-800 uppercase tracking-wider">
                          Pesanan Selesai
                        </p>
                        <span className="ml-auto text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          {unreadFinished.length}
                        </span>
                      </div>

                      {finishedOrders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-5 text-center text-stone-400">
                          <BellIcon />
                          <p className="mt-1.5 text-xs italic">
                            Tidak ada pesanan selesai
                          </p>
                        </div>
                      )}

                      {finishedOrders.map((o) => {
                        const isRead = checkedNotifIds.includes(
                          `finished-${o.id}`,
                        );
                        return (
                          <Link
                            href={`/order/${o.order_code.code}`}
                            key={o.id}
                            onClick={() => handleCheckNotif(`finished-${o.id}`)}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-stone-100 cursor-pointer transition-all ${
                              isRead
                                ? "opacity-50 hover:opacity-80 hover:bg-stone-50"
                                : "border-l-4 border-l-green-400 hover:bg-green-50/30"
                            }`}
                          >
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-50 border border-green-100 shrink-0">
                              <svg
                                className="w-4 h-4 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.8}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-stone-800">
                                Pesanan selesai
                              </p>
                              <p className="text-[11px] text-stone-500 truncate">
                                {o.service_name_snapshot}
                              </p>
                              <p className="text-[10px] text-stone-400 mt-0.5">
                                {o.created_at
                                  ? new Date(o.created_at).toLocaleString(
                                      "id-ID",
                                    )
                                  : "-"}
                              </p>
                            </div>
                            {!isRead && (
                              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                            )}
                          </Link>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="font-monterat-tipis text-sm font-semibold text-stone-600 hover:text-stone-800 px-3 py-2 rounded-xl hover:bg-white/80 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/auth"
              className="font-barlow-bold text-sm font-semibold text-stone-900 bg-stone-900 text-white px-4 py-2 rounded-xl hover:bg-stone-800 active:scale-[0.98] transition-all"
            >
              Daftar
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

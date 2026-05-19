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
    className="w-5 h-5 text-stone-400"
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
    className="w-6 h-6 text-stone-400"
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
      <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 max-w-[430px] w-full mx-auto border-b border-stone-700/60 bg-stone-900 backdrop-blur-sm">
        <span className="font-barlow-bold text-lg font-semibold text-stone-100">
          Nabila Fotocopy
        </span>
        <div className="w-24 h-10 rounded-xl bg-stone-800/70 animate-pulse" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 max-w-[430px] w-full mx-auto border-b border-stone-700/60 bg-stone-900 backdrop-blur-sm">
      <div className="flex items-center gap-1">
        <svg
          width="28"
          height="28"
          viewBox="0 0 128 148"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="22"
            y="12"
            width="84"
            height="34"
            rx="7"
            fill="#FFFFFF"
            stroke="#6B3F1F"
            strokeWidth="1.5"
          />
          <line
            x1="34"
            y1="24"
            x2="94"
            y2="24"
            stroke="#6B3F1F"
            strokeWidth="0.8"
            opacity="0.35"
          />
          <line
            x1="34"
            y1="34"
            x2="68"
            y2="34"
            stroke="#A0724A"
            strokeWidth="0.8"
            opacity="0.3"
          />

          <rect
            x="6"
            y="43"
            width="116"
            height="58"
            rx="11"
            fill="#3D1F0D"
            stroke="#6B3F1F"
            strokeWidth="1.5"
          />
          <line
            x1="6"
            y1="62"
            x2="122"
            y2="62"
            stroke="#7A5030"
            strokeWidth="0.8"
            opacity="0.5"
          />

          <circle cx="28" cy="79" r="5.5" fill="#2C1208" />
          <circle cx="28" cy="79" r="3.5" fill="#C4956A" />
          <circle cx="46" cy="79" r="5.5" fill="#2C1208" />
          <circle cx="46" cy="79" r="3.5" fill="#C4956A" opacity="0.55" />
          <circle cx="64" cy="79" r="5.5" fill="#2C1208" />
          <circle cx="64" cy="79" r="3.5" fill="#C4956A" opacity="0.2" />

          <circle cx="96" cy="79" r="5" fill="#FAF6F1" />
          <circle cx="96" cy="79" r="2.5" fill="#8B5E3C" />
          <circle cx="112" cy="79" r="5" fill="#FFFFFF" opacity="0.1" />
          <circle cx="112" cy="79" r="2.5" fill="#6B3F1F" opacity="0.4" />

          <rect
            x="22"
            y="98"
            width="84"
            height="40"
            rx="8"
            fill="#FFFFFF"
            stroke="#6B3F1F"
            strokeWidth="1.5"
          />
          <line
            x1="34"
            y1="113"
            x2="88"
            y2="113"
            stroke="#3D1F0D"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.75"
          />
          <line
            x1="34"
            y1="126"
            x2="58"
            y2="126"
            stroke="#6B3F1F"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>

        <span className="font-barlow-bold text-lg font-semibold text-stone-100">
          Nabila Fotocopy
        </span>
      </div>

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
              className="relative flex items-center justify-center w-11 h-11 rounded-full hover:bg-stone-800/70 active:scale-95 transition-all"
            >
              <BellIcon />
              {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1 shadow border border-black">
                  {totalUnread}
                </span>
              )}
            </button>

            {/* Tombol Profile */}
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-stone-800 border-2 border-stone-700 hover:border-stone-600 active:scale-95 transition-all shrink-0"
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
                <span className="flex w-full h-full items-center justify-center bg-stone-800">
                  <DefaultAvatarIcon />
                </span>
              )}
            </button>

            {/* Box Profile */}
            {profileOpen && (
              <div
                ref={cardRef}
                className="absolute top-full right-0 mt-2 w-80 rounded-[20px] bg-stone-800 border border-stone-700 shadow-2xl shadow-black/60 ring-1 ring-stone-700/80 overflow-hidden z-30"
              >
                <div className="pt-5 pb-4 px-5 bg-gradient-to-b from-stone-800 to-stone-800/90">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-stone-800 ring-2 ring-stone-600 shadow-md">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="flex w-full h-full items-center justify-center bg-stone-800">
                          <DefaultAvatarIcon />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-monterat-tipis text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                        Username
                      </p>
                      <p className="font-barlow-bold text-stone-100 font-semibold truncate text-[15px] mt-0.5">
                        {profile.username || profile.email || "–"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 space-y-2.5 border-t border-stone-700">
                  {/* Nama */}
                  <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-stone-800/70">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-700/80 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-stone-300"
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
                      <p className="font-monterat-tipis text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                        Nama
                      </p>
                      <p className="font-monterat-tipis text-stone-200 text-sm truncate">
                        {profile.name || "–"}
                      </p>
                    </div>
                  </div>
                  {/* Email */}
                  <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-stone-800/70">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-700/80 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-stone-300"
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
                      <p className="font-monterat-tipis text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                        Email
                      </p>
                      <p className="font-monterat-tipis text-stone-200 text-sm truncate">
                        {profile.email || "–"}
                      </p>
                    </div>
                  </div>
                  {/* Phone */}
                  <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-stone-800/70">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-700/80 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-stone-300"
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
                      <p className="font-monterat-tipis text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                        Phone
                      </p>
                      <p className="font-monterat-tipis text-stone-200 text-sm truncate">
                        {profile.phone || "–"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-2 border-t border-stone-700 bg-stone-900/60">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="font-barlow-bold w-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-stone-100 text-stone-900 font-semibold text-[14px] shadow-lg shadow-black/30 hover:bg-white active:scale-[0.99] transition-all"
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
                className="absolute top-full right-0 mt-2 w-80 rounded-[20px] bg-stone-800 border border-stone-700 shadow-2xl shadow-black/60 overflow-hidden z-30"
              >
                {/* Header notif */}
                <div className="px-4 py-3 border-b border-stone-700 bg-stone-900/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-stone-100 text-sm">
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
                      className="text-[11px] text-stone-400 hover:text-stone-200 font-medium"
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
                          <div className="w-9 h-9 rounded-xl bg-stone-800 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-2.5 bg-stone-800 rounded w-3/4" />
                            <div className="h-2 bg-stone-800 rounded w-1/2" />
                            <div className="h-2 bg-stone-800 rounded w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!notifLoading && (
                    <>
                      {/* ── Section: Menunggu Pembayaran ── */}
                      <div className="px-4 py-2 flex items-center gap-2 border-b border-stone-700 bg-amber-900/20">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                          Menunggu Pembayaran
                        </p>
                        <span className="ml-auto text-[10px] font-semibold text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded-full">
                          {unreadOrders.length}
                        </span>
                      </div>

                      {orders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-5 text-center text-stone-500">
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
                            className={`flex items-center gap-3 px-4 py-3 border-b border-stone-700 cursor-pointer transition-all ${
                              isRead
                                ? "opacity-40 hover:opacity-60 hover:bg-stone-800/40"
                                : "border-l-4 border-l-amber-400 hover:bg-amber-900/20"
                            }`}
                          >
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-900/40 border border-amber-800/50 shrink-0">
                              <svg
                                className="w-4 h-4 text-amber-400"
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
                              <p className="text-xs font-semibold text-stone-100">
                                Menunggu pembayaran
                              </p>
                              <p className="text-[11px] text-stone-400 truncate">
                                Order {o.service_name_snapshot}
                              </p>
                              <p className="text-[11px] text-stone-400 truncate">
                                Total {o.total_price_snapshot}
                              </p>
                              <p className="text-[10px] text-stone-500 mt-0.5">
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
                      <div className="px-4 py-2 flex items-center gap-2 border-b border-stone-700 bg-red-900/20">
                        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                        <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                          Pengembalian Dana
                        </p>
                        <span className="ml-auto text-[10px] font-semibold text-red-300 bg-red-900/50 px-2 py-0.5 rounded-full">
                          {unreadRefunds.length}
                        </span>
                      </div>

                      {refunds.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-5 text-center text-stone-500">
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
                            className={`flex items-center gap-3 px-4 py-3 border-b border-stone-700 cursor-pointer transition-all ${
                              isRead
                                ? "opacity-40 hover:opacity-60 hover:bg-stone-800/40"
                                : "border-l-4 border-l-red-400 hover:bg-red-900/20"
                            }`}
                          >
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-900/40 border border-red-800/50 shrink-0">
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
                              <p className="text-xs font-semibold text-stone-100">
                                Pengembalian dana diajukan
                              </p>
                              <p className="text-[11px] text-stone-400 truncate">
                                {r.order_name}
                              </p>
                              {r.admin_note && (
                                <p className="text-[11px] text-red-400 mt-0.5 line-clamp-1">
                                  {r.admin_note}
                                </p>
                              )}
                              <p className="text-[10px] text-stone-500 mt-0.5">
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
                      <div className="px-4 py-2 flex items-center gap-2 border-b border-stone-700 bg-blue-900/20">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                          Dana Ditransfer
                        </p>
                        <span className="ml-auto text-[10px] font-semibold text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded-full">
                          {unreadTransferred.length}
                        </span>
                      </div>

                      {transferredRefunds.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-5 text-center text-stone-500">
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
                            className={`flex items-center gap-3 px-4 py-3 border-b border-stone-700 cursor-pointer transition-all ${
                              isRead
                                ? "opacity-40 hover:opacity-60 hover:bg-stone-800/40"
                                : "border-l-4 border-l-blue-400 hover:bg-blue-900/20"
                            }`}
                          >
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-900/40 border border-blue-800/50 shrink-0">
                              <svg
                                className="w-4 h-4 text-blue-400"
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
                              <p className="text-xs font-semibold text-stone-100">
                                Dana sudah ditransfer
                              </p>
                              <p className="text-[11px] text-stone-400 truncate">
                                {r.order_name}
                              </p>
                              {r.admin_note && (
                                <p className="text-[11px] text-blue-400 mt-0.5 line-clamp-1">
                                  {r.admin_note}
                                </p>
                              )}
                              <p className="text-[10px] text-stone-500 mt-0.5">
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
                      <div className="px-4 py-2 flex items-center gap-2 border-b border-stone-700 bg-green-900/20">
                        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                        <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">
                          Pesanan Selesai
                        </p>
                        <span className="ml-auto text-[10px] font-semibold text-green-300 bg-green-900/50 px-2 py-0.5 rounded-full">
                          {unreadFinished.length}
                        </span>
                      </div>

                      {finishedOrders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-5 text-center text-stone-500">
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
                            className={`flex items-center gap-3 px-4 py-3 border-b border-stone-700 cursor-pointer transition-all ${
                              isRead
                                ? "opacity-40 hover:opacity-60 hover:bg-stone-800/40"
                                : "border-l-4 border-l-green-400 hover:bg-green-900/20"
                            }`}
                          >
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-900/40 border border-green-800/50 shrink-0">
                              <svg
                                className="w-4 h-4 text-green-400"
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
                              <p className="text-xs font-semibold text-stone-100">
                                Pesanan selesai
                              </p>
                              <p className="text-[11px] text-stone-400 truncate">
                                {o.service_name_snapshot}
                              </p>
                              <p className="text-[10px] text-stone-500 mt-0.5">
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
              className="font-monterat-tipis text-sm font-semibold text-stone-300 hover:text-stone-100 px-3 py-2 rounded-xl hover:bg-stone-800/60 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/auth"
              className="font-barlow-bold text-sm font-semibold bg-stone-100 text-stone-900 px-4 py-2 rounded-xl hover:bg-white active:scale-[0.98] transition-all"
            >
              Daftar
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

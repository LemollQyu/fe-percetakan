 "use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { getToken, clearAuth } from "@/lib/auth";
import { getAdminInfo } from "@/api/authentikasi/admin-info/get";
import { logout } from "@/api/authentikasi/logout/post";

const DefaultAvatarIcon = ({ className = "text-white" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

/** Ikon menu: 4 lingkaran outline 2x2 (grid) */
const MenuIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);

export function AdminHeader() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<{ username: string; name: string; email: string; phone: string | null; avatar_url: string | null }>({
    username: "",
    name: "",
    email: "",
    phone: null,
    avatar_url: null,
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const token = getToken();
    if (token) {
      getAdminInfo(token)
        .then((info) => {
          setProfile({
            username: info.username ?? "",
            name: info.name ?? "",
            email: info.email ?? "",
            phone: info.phone ?? null,
            avatar_url: info.avatar_url ?? null,
          });
        })
        .catch((err: Error & { status?: number }) => {
          if (err?.status === 401) {
            clearAuth();
            window.location.replace("/admin/login");
          }
        });
    }
  }, [profileOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (cardRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    const token = getToken();
    if (token) {
      try {
        await logout(token);
      } catch {
        // Tetap clear local meskipun API gagal
      }
    }
    clearAuth();
    window.location.replace("/admin/login");
  };

  // Sembunyikan nav dashboard di halaman login admin (authentikasi)
  if (pathname === "/admin/login") return null;

  return (
    <div className="sticky top-0 z-30 pt-3 px-4">
      <header className="max-w-[900px] w-full mx-auto flex items-center h-14 px-4 rounded-2xl bg-black relative">
        {/* Kiri: menu + Dashboard */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all shrink-0"
            aria-label="Menu"
          >
            <MenuIcon />
          </button>
          <Link
            href="/admin/dashboard"
            className="font-barlow-bold text-lg font-semibold text-white hover:text-white/90 transition-colors"
          >
            Dashboard
          </Link>
        </div>

        {/* Kanan: notifikasi + profile */}
        <div className="flex items-center gap-2 relative ml-auto">
          {/* Tombol notifikasi (lingkaran) + badge merah */}
          <button
            type="button"
            className="relative flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all shrink-0"
            aria-label="Notifikasi"
          >
            <BellIcon />
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold px-1">
              9
            </span>
          </button>

          {/* Tombol profile (lingkaran) - sama style dengan notif */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden text-white hover:bg-white/10 active:scale-95 transition-all shrink-0"
            aria-label="Profil admin"
            aria-expanded={profileOpen}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="flex w-full h-full items-center justify-center">
                <DefaultAvatarIcon />
              </span>
            )}
          </button>

          {profileOpen && (
            <div
              ref={cardRef}
              className="absolute top-full right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50 bg-white/90 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.5)_inset]"
            >
              {/* Header: avatar + username + badge Admin */}
              <div className="pt-5 pb-4 px-5 bg-gradient-to-b from-stone-100/80 to-white/70 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-stone-200/90 ring-2 ring-white/80 shadow-lg">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex w-full h-full items-center justify-center bg-stone-100">
                        <DefaultAvatarIcon className="text-stone-600" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-monterat-tipis text-[10px] font-bold uppercase tracking-wider text-white bg-stone-700 px-2 py-0.5 rounded">
                        Admin
                      </span>
                    </div>
                    <p className="font-barlow-bold text-stone-900 font-semibold truncate text-[15px] mt-1">
                      {profile.username || profile.email || "–"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info detail */}
              <div className="px-5 py-3 space-y-2.5 border-t border-stone-200/50">
                <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-stone-100/50 backdrop-blur-sm">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-200/70 flex items-center justify-center">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-monterat-tipis text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Nama</p>
                    <p className="font-monterat-tipis text-stone-800 text-sm truncate">{profile.name || "–"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-stone-100/50 backdrop-blur-sm">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-200/70 flex items-center justify-center">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-monterat-tipis text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Email</p>
                    <p className="font-monterat-tipis text-stone-800 text-sm truncate">{profile.email || "–"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-stone-100/50 backdrop-blur-sm">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-200/70 flex items-center justify-center">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-monterat-tipis text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Phone</p>
                    <p className="font-monterat-tipis text-stone-800 text-sm truncate">{profile.phone ?? "–"}</p>
                  </div>
                </div>
              </div>

              {/* Sign out */}
              <div className="p-4 pt-2 border-t border-stone-200/50 bg-stone-100/40 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="font-barlow-bold w-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-stone-900 text-white font-semibold text-[14px] shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.99] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
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


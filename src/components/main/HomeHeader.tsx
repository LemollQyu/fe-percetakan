 "use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { getToken, getAuthRole, getUserAvatarUrl, getUserProfile, clearAuth, setUserProfile, setUserAvatarUrl } from "@/lib/auth";
import { getUserInfo } from "@/api/authentikasi/user-info/get";
import { logout } from "@/api/authentikasi/logout/post";

const DefaultAvatarIcon = () => (
  <svg className="w-6 h-6 text-stone-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export function HomeHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ username: "", name: "", email: "", phone: "" });
  const cardRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      if (!current.username && !current.name && !current.email && !current.phone) {
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

  const handleSignOut = async () => {
    setProfileOpen(false);
    const token = getToken();
    if (token) {
      try {
        await logout(token);
      } catch {
        // Tetap clear local meskipun API gagal (offline / 401)
      }
    }
    clearAuth();
    window.location.replace("/");
  };

  // Sembunyikan header di halaman detail layanan kategori
  const hideOnServiceDetail =
    pathname.startsWith("/category/") && pathname.includes("/service/");

  if (hideOnServiceDetail) {
    return null;
  }

  if (!mounted) {
    return (
      <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 max-w-[430px] w-full mx-auto border-b border-stone-200/60 bg-[#f5f0eb]/90 backdrop-blur-sm">
        <span className="font-barlow-bold text-lg font-semibold text-stone-800">Nabila Fotocopy</span>
        <div className="w-24 h-10 rounded-xl bg-stone-200/50 animate-pulse" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 max-w-[430px] w-full mx-auto border-b border-stone-200/60 bg-[#f5f0eb]/90 backdrop-blur-sm">
      <span className="font-barlow-bold text-lg font-semibold text-stone-800">Nabila Fotocopy</span>
      <div className="flex items-center gap-2 relative">
        {loggedIn ? (
          <>
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

            {profileOpen && (
              <div
                ref={cardRef}
                className="absolute top-full right-0 mt-2 w-80 rounded-[20px] bg-white border border-stone-100 shadow-2xl shadow-stone-300/40 ring-1 ring-stone-100/80 overflow-hidden z-30"
              >
                {/* Header dengan avatar & username */}
                <div className="pt-5 pb-4 px-5 bg-gradient-to-b from-stone-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-stone-200 ring-2 ring-white shadow-md">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
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

                {/* Info detail */}
                <div className="px-5 py-3 space-y-2.5 border-t border-stone-100">
                  <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-stone-50/80">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-200/80 flex items-center justify-center">
                      <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                  <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-stone-50/80">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-200/80 flex items-center justify-center">
                      <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
                  <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-stone-50/80">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-200/80 flex items-center justify-center">
                      <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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

                {/* Sign out */}
                <div className="p-4 pt-2 border-t border-stone-100 bg-stone-50/30">
                  <button
                    type="button"
                    onClick={handleSignOut}
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


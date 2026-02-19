"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RequireUser } from "@/components/main/RequireUser";
import { getToken, clearAuth, setUserProfile, setUserAvatarUrl } from "@/lib/auth";
import { getUserInfo } from "@/api/authentikasi/user-info/get";
import { logout } from "@/api/authentikasi/logout/post";

type ProfileRowProps = {
  label: string;
  value: string;
};

function ProfileRow({ label, value }: ProfileRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-stone-100 last:border-b-0">
      <span className="font-monterat-tipis text-[15px] font-medium text-stone-600">
        {label}
      </span>
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end pl-4">
        <span className="font-monterat-tipis text-[15px] font-semibold text-stone-900 truncate text-right">
          {value || "–"}
        </span>
        <svg
          className="w-5 h-5 flex-shrink-0 text-stone-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-[400px] mx-auto">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-stone-200 animate-pulse" />
        <div className="h-6 w-32 bg-stone-200 rounded animate-pulse" />
      </div>

      {/* Card skeleton */}
      <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden">
        {/* Avatar skeleton */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-stone-200 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-stone-200 border-2 border-white animate-pulse" />
          </div>
        </div>

        {/* General info skeleton */}
        <div className="px-4 pb-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-b-0">
              <div className="h-4 w-20 bg-stone-200 rounded animate-pulse" />
              <div className="flex items-center gap-2 min-w-0 flex-1 justify-end pl-4">
                <div className="h-4 w-32 bg-stone-100 rounded animate-pulse" />
                <div className="w-5 h-5 bg-stone-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Private information skeleton */}
        <div className="px-4 pt-2 pb-4">
          <div className="h-3 w-40 bg-stone-200 rounded mb-1 pt-2 animate-pulse" />
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-b-0">
              <div className="h-4 w-24 bg-stone-200 rounded animate-pulse" />
              <div className="flex items-center gap-2 min-w-0 flex-1 justify-end pl-4">
                <div className="h-4 w-40 bg-stone-100 rounded animate-pulse" />
                <div className="w-5 h-5 bg-stone-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out button skeleton */}
      <div className="mt-8">
        <div className="w-full h-12 bg-stone-200 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    username: string;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  }>({
    username: "",
    name: "",
    email: "",
    phone: null,
    avatar_url: null,
  });
  const [signingOut, setSigningOut] = useState(false);

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getUserInfo(token);
      setProfile({
        username: res.username ?? "",
        name: res.name ?? "",
        email: res.email ?? "",
        phone: res.phone ?? null,
        avatar_url: res.avatar_url ?? null,
      });
      setUserProfile({
        username: res.username ?? "",
        name: res.name ?? "",
        email: res.email ?? "",
        phone: res.phone ?? "",
      });
      if (res.avatar_url) setUserAvatarUrl(res.avatar_url);
    } catch {
      setProfile((p) => ({ ...p }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const token = getToken();
    if (token) {
      try {
        await logout(token);
      } catch {
        // Tetap clear local meskipun API gagal
      }
    }
    clearAuth();
    window.location.replace("/");
  };

  return (
    <main className="flex-1 w-full max-w-[430px] mx-auto px-4 sm:px-6 py-6 pb-28">
      <RequireUser title="Profil" description="User belum terdaftar, silahkan masuk atau daftar terlebih dulu.">
        {loading ? (
          <ProfileSkeleton />
        ) : (
          <div className="max-w-[400px] mx-auto">
            {/* Header: back + title */}
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/"
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-stone-200 bg-white/80 hover:bg-stone-50 active:scale-95 transition-all shrink-0"
                aria-label="Kembali"
              >
                <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="font-barlow-bold text-xl font-bold text-stone-900">
                Edit Profil
              </h1>
            </div>

            {/* Card: avatar + sections */}
            <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden">
              {/* Profile picture */}
              <div className="flex flex-col items-center pt-8 pb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-stone-200 border-2 border-stone-100 flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-stone-500 font-barlow-bold text-3xl">
                        {(profile.name || profile.username || "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center"
                    aria-hidden
                  >
                    <svg
                      className="w-4 h-4 text-stone-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 13v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* General info */}
              <div className="px-4 pb-2">
                <ProfileRow label="Name" value={profile.name} />
                <ProfileRow label="Username" value={profile.username} />
              </div>

              {/* Private information */}
              <div className="px-4 pt-2 pb-4">
                <h2 className="font-barlow-bold text-sm font-bold text-stone-500 uppercase tracking-wide mb-1 pt-2">
                  Informasi Pribadi
                </h2>
                <ProfileRow label="Email" value={profile.email} />
                <ProfileRow label="No. Telepon" value={profile.phone ?? ""} />
              </div>
            </div>

            {/* Sign out */}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="font-barlow-bold w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl border-2 border-red-200 text-red-600 font-semibold text-[15px] hover:bg-red-50 active:scale-[0.99] transition-all disabled:opacity-60"
              >
                {signingOut ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    Keluar...
                  </>
                ) : (
                  "Sign out"
                )}
              </button>
            </div>
          </div>
        )}
      </RequireUser>
    </main>
  );
}

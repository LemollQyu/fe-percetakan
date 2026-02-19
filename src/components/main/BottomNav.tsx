 "use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/riwayat-order", label: "Riwayat Order", icon: OrderIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 shrink-0 ${active ? "text-stone-900" : "text-white"}`}
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function OrderIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 shrink-0 ${active ? "text-stone-900" : "text-white"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 shrink-0 ${active ? "text-stone-900" : "text-white"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Hanya tampilkan di route tertentu
  const allowedRoutes = ["/", "/riwayat-order", "/profile"];
  const shouldShow = allowedRoutes.includes(pathname);

  if (!shouldShow) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex justify-center px-4 pb-4 pt-3"
      aria-label="Navigasi utama"
    >
      <div className="flex items-center justify-around w-full max-w-[430px] h-14 px-2 rounded-[28px] bg-stone-900 shadow-lg">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-2 rounded-2xl transition-colors text-white hover:text-white/90"
              aria-current={active ? "page" : undefined}
            >
              <span
                className={
                  active
                    ? "flex items-center justify-center w-11 h-11 rounded-full bg-white text-stone-900"
                    : "flex items-center justify-center w-11 h-11 rounded-full"
                }
              >
                <Icon active={active} />
              </span>
              <span className="font-monterat-tipis text-[10px] font-semibold sr-only">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


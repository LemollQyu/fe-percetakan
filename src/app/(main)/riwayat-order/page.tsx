"use client";

import { useState } from "react";
import { RequireUser } from "@/components/main/RequireUser";
import { PesananTab } from "@/components/main/PesananTab";
import { RiwayatTab } from "@/components/main/RiwayatTab";

type Tab = "pesanan" | "riwayat";

export default function RiwayatOrderPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pesanan");

  return (
    <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-28">
      <RequireUser
        title="Pesanan & Riwayat"
        description="Silakan login atau daftar untuk melihat pesanan Anda."
      >
        {/* ── Header ── */}
        <div className="mb-5">
          <h1 className="font-barlow-bold text-2xl font-bold text-stone-900 leading-tight">
            Riwayat Order
          </h1>
          <p className="text-[13px] text-stone-500 mt-0.5">
            Pantau semua pesanan Anda di sini.
          </p>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="mb-6">
          <div className="flex rounded-2xl bg-stone-100 p-1 gap-1">
            {(["pesanan", "riwayat"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] ${
                  activeTab === tab
                    ? "bg-white text-stone-900 shadow-sm shadow-stone-200/60"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {tab === "pesanan" ? "Pesanan" : "Riwayat"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {activeTab === "pesanan" ? <PesananTab /> : <RiwayatTab />}
      </RequireUser>
    </main>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";

export default function AdminDashboardPage() {
  return (
    <main className="flex-1 w-full max-w-[900px] mx-auto px-4 py-8">
      <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden mb-6">
          <div className="pt-4 px-4 pb-4">
            <div className="relative w-full h-40 sm:h-48 bg-stone-200 rounded-2xl overflow-hidden">
              <Image
                src="/photo/printing1.webp"
                alt=""
                fill
                className="object-cover object-center"
                sizes="100vw"
              />
            </div>
          </div>
          <div className="p-6">
            <h1 className="font-barlow-bold text-xl font-bold text-stone-900 mb-2">
              Selamat datang di Panel Admin
            </h1>
            <p className="font-monterat-tipis text-sm text-stone-600">
              Anda masuk sebagai administrator. Gunakan menu untuk mengelola konten dan pengguna.
            </p>
          </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/dashboard/categories"
            className="group flex items-center gap-4 rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 p-5 hover:border-stone-200 hover:shadow-stone-200/40 transition-all active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 group-hover:bg-stone-200 transition-colors">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="font-barlow-bold text-stone-900 font-semibold">
                Kategori Jasa
              </h2>
              <p className="font-monterat-tipis text-sm text-stone-700 mt-0.5">
                Kelola kategori jasa
              </p>
            </div>
            <svg className="ml-auto h-5 w-5 flex-shrink-0 text-stone-600 group-hover:text-stone-600 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/admin/dashboard/services"
            className="group flex items-center gap-4 rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 p-5 hover:border-stone-200 hover:shadow-stone-200/40 transition-all active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 group-hover:bg-stone-200 transition-colors">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="font-barlow-bold text-stone-900 font-semibold">
                Management Service
              </h2>
              <p className="font-monterat-tipis text-sm text-stone-700 mt-0.5">
                Kelola layanan jasa, spesifikasi, media &amp; nilai
              </p>
            </div>
            <svg className="ml-auto h-5 w-5 flex-shrink-0 text-stone-600 group-hover:text-stone-600 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
      </div>
    </main>
  );
}

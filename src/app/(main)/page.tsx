import Image from "next/image";
import { Suspense } from "react";
import { HomeCtaSection } from "@/components/main/HomeCtaSection";
import { CategoriesSection } from "@/components/main/CategoriesSection";

function CategorySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-white border border-stone-100 shadow-sm shadow-stone-200/20 p-4 flex items-start gap-3 animate-pulse"
        >
          <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-stone-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 bg-stone-200 rounded w-3/4" />
            <div className="h-3 bg-stone-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {

  return (
    <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-24">
      {/* Hero */}
      <section className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden mb-6">
        <div className="pt-4 px-4 pb-4">
          <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-stone-200">
            <Image
              src="/photo/printing1.webp"
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 430px) 100vw, 430px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
        <div className="px-5 pb-6">
          <h1 className="font-barlow-bold text-2xl font-bold text-stone-900 tracking-tight">
            Nabila Fotocopy
          </h1>
          <p className="font-monterat-tipis text-sm text-stone-600 mt-1.5">
            Cetak brosur, undangan, kartu nama, dan berbagai kebutuhan percetakan dengan hasil terbaik.
          </p>
        </div>
      </section>

      {/* Kategori Layanan - data dari API */}
      <section className="mb-6">
        <h2 className="font-barlow-bold text-lg font-bold text-stone-900 mb-3">
          Kategori Layanan
        </h2>
        <Suspense fallback={<CategorySkeleton />}>
          <CategoriesSection />
        </Suspense>
      </section>

      {/* CTA: Daftar/Masuk (belum login) atau Lihat layanan (sudah login) */}
      <HomeCtaSection />
    </main>
  );
}

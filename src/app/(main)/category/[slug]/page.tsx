import Link from "next/link";
import { Suspense } from "react";
import { getCategoriesList, getCategoryById } from "@/api/jasa/categories";
import type { CategoryJasaDetail } from "@/api/jasa/categories/types";
import { ServicePaginatedGrid } from "@/components/main/ServicePaginationGrid";

/** URL icon kategori: konversi ke path relatif untuk proxy Next.js */
function normalizeIconUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  let t = url.trim();

  if (t.startsWith("/static/")) return t;

  if (t.startsWith("http://") || t.startsWith("https://")) {
    const staticIndex = t.indexOf("/static/");
    if (staticIndex !== -1) {
      return t.substring(staticIndex);
    }
  }

  const staticIndex = t.indexOf("/static/");
  if (staticIndex !== -1) {
    return t.substring(staticIndex);
  }

  if (t.startsWith("/")) return t;

  return `/static/${t}`;
}

function CategoryDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-stone-200 animate-pulse" />
        <div className="h-6 w-48 bg-stone-200 rounded animate-pulse" />
      </div>

      {/* Category card skeleton */}
      <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-stone-200 animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-stone-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-stone-100 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-stone-100 rounded w-full animate-pulse" />
            <div className="h-4 bg-stone-100 rounded w-5/6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Services section skeleton */}
      <div className="space-y-4">
        <div className="h-5 bg-stone-200 rounded w-32 animate-pulse" />
        <div className="grid gap-3 grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-stone-100 shadow-sm p-4 animate-pulse"
            >
              <div className="h-32 bg-stone-200 rounded-xl mb-3" />
              <div className="h-4 bg-stone-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-stone-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function CategoryDetail({ slug }: { slug: string }) {
  // Cari kategori berdasarkan slug untuk dapat ID
  let categoryId: number | null = null;
  try {
    const categoriesRes = await getCategoriesList();
    const category = categoriesRes.data?.find((c) => c.slug === slug);
    if (category) {
      categoryId = category.id;
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  if (!categoryId) {
    return (
      <div className="text-center py-12">
        <p className="font-monterat-tipis text-stone-500 mb-4">
          Kategori tidak ditemukan
        </p>
        <Link
          href="/"
          className="font-barlow-bold text-stone-900 hover:text-stone-700 underline"
        >
          Kembali ke Homepage
        </Link>
      </div>
    );
  }

  // Fetch detail kategori berdasarkan ID
  let category: CategoryJasaDetail | null = null;
  try {
    const res = await getCategoryById(categoryId);
    category = res.data;
  } catch (error) {
    console.error("Error fetching category detail:", error);
    return (
      <div className="text-center py-12">
        <p className="font-monterat-tipis text-red-500 mb-4">
          Gagal memuat detail kategori
        </p>
        <Link
          href="/"
          className="font-barlow-bold text-stone-900 hover:text-stone-700 underline"
        >
          Kembali ke Homepage
        </Link>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="font-monterat-tipis text-stone-500 mb-4">
          Kategori tidak ditemukan
        </p>
        <Link
          href="/"
          className="font-barlow-bold text-stone-900 hover:text-stone-700 underline"
        >
          Kembali ke Homepage
        </Link>
      </div>
    );
  }

  const services = category.service ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-stone-200 bg-white/80 hover:bg-stone-50 active:scale-95 transition-all shrink-0"
          aria-label="Kembali"
        >
          <svg
            className="w-5 h-5 text-stone-700"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="font-barlow-bold text-xl font-bold text-stone-900">
          {category.name}
        </h1>
      </div>

      {/* Category Detail Card */}
      <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 flex-shrink-0 rounded-xl bg-stone-100 overflow-hidden flex items-center justify-center">
            {category.meta?.icon ? (
              <img
                src={normalizeIconUrl(category.meta.icon)}
                alt={category.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-stone-500 font-barlow-bold text-2xl">
                {category.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-barlow-bold text-xl font-bold text-stone-900 mb-1">
              {category.name}
            </h2>
            {category.slug && (
              <p className="font-monterat-tipis text-sm text-stone-400 mb-3">
                /{category.slug}
              </p>
            )}
            {category.description && (
              <p className="font-monterat-tipis text-sm text-stone-600 leading-relaxed">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <section>
        <h2 className="font-barlow-bold text-lg font-bold text-stone-900 mb-4">
          Layanan di Kategori Ini
        </h2>
        {services.length === 0 ? (
          <div className="rounded-2xl bg-white border border-stone-100 shadow-sm shadow-stone-200/20 p-8 text-center">
            <p className="font-monterat-tipis text-stone-500">
              Belum ada layanan di kategori ini.
            </p>
          </div>
        ) : (
          <ServicePaginatedGrid services={services} slug={slug} />
        )}
      </section>
    </div>
  );
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;

  return (
    <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-24">
      <Suspense fallback={<CategoryDetailSkeleton />}>
        <CategoryDetail slug={slug} />
      </Suspense>
    </main>
  );
}

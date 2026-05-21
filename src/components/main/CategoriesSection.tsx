import Link from "next/link";
import { getCategoriesList } from "@/api/jasa/categories";
import type { CategoryJasa } from "@/api/jasa/categories";

export const dynamic = "force-dynamic";

function normalizeIconUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  const t = url.trim();
  if (t.startsWith("/static/")) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) {
    const idx = t.indexOf("/static/");
    if (idx !== -1) return t.substring(idx);
    return t;
  }
  const idx = t.indexOf("/static/");
  if (idx !== -1) return t.substring(idx);
  if (t.startsWith("/")) return t;
  return `/static/${t}`;
}

/** Retry fetch dengan delay — aman untuk Server Component */
async function fetchCategoriesWithRetry(
  retries = 2,
  delayMs = 300,
): Promise<CategoryJasa[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await getCategoriesList();
      return (res.data ?? []).filter((c) => c.is_active);
    } catch (err) {
      const isLastAttempt = attempt === retries;
      if (isLastAttempt) {
        console.error(
          `[CategoriesSection] Gagal setelah ${retries + 1}x percobaan:`,
          err,
        );
        throw err;
      }
      console.warn(
        `[CategoriesSection] Percobaan ${attempt + 1} gagal, retry dalam ${delayMs}ms...`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return [];
}

export async function CategoriesSection() {
  let categories: CategoryJasa[] = [];
  let fetchError = false;

  try {
    categories = await fetchCategoriesWithRetry();
  } catch {
    fetchError = true;
  }

  if (fetchError) {
    return (
      <p className="font-monterat-tipis text-sm text-red-500 py-4">
        Gagal memuat kategori.
      </p>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="font-monterat-tipis text-sm text-stone-500 py-4">
        Belum ada kategori layanan.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className="rounded-2xl bg-white border border-stone-100 shadow-sm shadow-stone-200/20 p-4 hover:border-stone-200 hover:shadow-stone-200/30 transition-all flex items-start gap-3 cursor-pointer"
        >
          <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-stone-100 overflow-hidden flex items-center justify-center">
            {cat.meta?.icon ? (
              <img
                src={normalizeIconUrl(cat.meta.icon)}
                alt={cat.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-stone-500 font-barlow-bold text-lg">
                {cat.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-barlow-bold text-stone-900 font-semibold text-[15px]">
              {cat.name}
            </h3>
            {cat.slug ? (
              <p className="font-monterat-tipis text-[11px] text-stone-400 truncate">
                /{cat.slug}
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

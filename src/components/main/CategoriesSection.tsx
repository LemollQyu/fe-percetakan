import { getCategoriesList } from "@/api/jasa/categories";
import type { CategoryJasa } from "@/api/jasa/categories";

export const dynamic = "force-dynamic";
/** URL icon kategori: konversi ke path relatif untuk proxy Next.js */
function normalizeIconUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  let t = url.trim();

  // Jika sudah path relatif yang dimulai dengan /static/, langsung return
  if (t.startsWith("/static/")) return t;

  // Jika URL lengkap dengan http:// atau https://, ekstrak bagian /static/...
  if (t.startsWith("http://") || t.startsWith("https://")) {
    const staticIndex = t.indexOf("/static/");
    if (staticIndex !== -1) {
      return t.substring(staticIndex);
    }
  }

  // Jika mengandung localhost:8081/static/ atau format serupa, ekstrak bagian /static/...
  const staticIndex = t.indexOf("/static/");
  if (staticIndex !== -1) {
    return t.substring(staticIndex);
  }

  // Jika sudah dimulai dengan /, langsung return
  if (t.startsWith("/")) return t;

  // Jika tidak ada / di awal, tambahkan /static/ (asumsi path relatif dari static)
  return `/static/${t}`;
}

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

export async function CategoriesSection() {
  let categories: CategoryJasa[] = [];

  try {
    const res = await getCategoriesList();
    categories = (res.data ?? []).filter((c) => c.is_active);
  } catch (error) {
    console.error("Error fetching categories:", error);
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
        <a
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
        </a>
      ))}
    </div>
  );
}

import { type CategoryJasa } from "@/api/jasa/categories";
import { type ServiceJasa } from "@/api/jasa/services";

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
      // Ambil path setelah domain (misal: /static/jasa/icon-category/...)
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

type CategoryPickerProps = {
  categories: CategoryJasa[];
  services: ServiceJasa[];
  loading: boolean;
  error: string | null;
  onSelectCategory: (categoryId: number) => void;
};

export function CategoryPicker({
  categories,
  services,
  loading,
  error,
  onSelectCategory,
}: CategoryPickerProps) {
  return (
    <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-stone-100">
        <h2 className="font-barlow-bold text-base sm:text-lg font-bold text-stone-900">
          Pilih Kategori
        </h2>
        <p className="font-monterat-tipis text-[15px] sm:text-sm text-stone-700 mt-0.5 leading-relaxed">
          Klik kategori untuk mengelola service di kategori tersebut
        </p>
      </div>
      <div className="p-4">
        {loading && (
          <div className="flex justify-center py-12">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
          </div>
        )}
        {!loading && error && (
          <div className="font-monterat-tipis rounded-2xl bg-red-50/90 border border-red-100 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {!loading && !error && categories.length === 0 && (
          <p className="font-monterat-tipis text-center text-stone-700 py-8">
            Belum ada kategori. Tambahkan kategori dulu di menu Kategori Jasa.
          </p>
        )}
        {!loading && !error && categories.length > 0 && (
          <ul className="space-y-4">
            {categories.map((cat) => {
              const count = services.filter((s) => s.category_id === cat.id).length;
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    className="w-full text-left rounded-2xl border border-stone-200 bg-stone-50/50 p-4 hover:bg-stone-50/80 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-stone-200 flex items-center justify-center text-stone-700 font-barlow-bold text-base overflow-hidden">
                        {cat.meta?.icon ? (
                          <img
                            src={normalizeIconUrl(cat.meta.icon)}
                            alt={`Icon ${cat.name}`}
                            className="w-full h-full object-contain rounded-xl"
                          />
                        ) : (
                          <span className="flex w-full h-full items-center justify-center">
                            {cat.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-barlow-bold text-stone-900 font-semibold text-base leading-snug truncate">
                            {cat.name}
                          </span>
                          <span
                            className={`font-monterat-tipis text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              cat.is_active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-800"
                            }`}
                          >
                            {cat.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                          <span className="font-monterat-tipis text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white border border-stone-200 text-stone-700">
                            {count} service
                          </span>
                        </div>
                        {cat.slug && (
                          <p className="font-monterat-tipis text-[15px] sm:text-xs text-stone-700 mt-0.5 leading-relaxed">
                            /{cat.slug}
                          </p>
                        )}
                        {cat.description && (
                          <p className="font-monterat-tipis text-[15px] sm:text-sm text-stone-800 mt-1 line-clamp-2 leading-relaxed">
                            {cat.description}
                          </p>
                        )}
                      </div>
                      <svg
                        className="ml-auto h-5 w-5 flex-shrink-0 text-stone-600 mt-1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}


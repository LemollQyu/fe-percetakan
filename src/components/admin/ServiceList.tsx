import Link from "next/link";
import type { CategoryJasa } from "@/api/jasa/categories";
import type { ServiceJasa, ServiceMedia } from "@/api/jasa/services";

function normalizeMediaUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  const t = url.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const base = process.env.NEXT_PUBLIC_API_JASA_URL ?? "http://localhost:8081";
  // Backend bisa return "localhost:8081/path" tanpa scheme → tambah http:// saja, jangan base
  if (t.startsWith("localhost")) return "http://" + t;
  return t.startsWith("/") ? `${base}${t}` : `${base}/${t}`;
}

type ServiceListProps = {
  services: ServiceJasa[];
  categories: CategoryJasa[];
  loading: boolean;
  error: string | null;
  displayThumbs: Record<number, ServiceMedia[]>;
  actioningId: number | null;
  onToggleStatus: (serviceId: number) => void;
  onDeleteClick: (serviceId: number, serviceName: string) => void;
};

export function ServiceList({
  services,
  categories,
  loading,
  error,
  displayThumbs,
  actioningId,
  onToggleStatus,
  onDeleteClick,
}: ServiceListProps) {
  return (
    <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-stone-100">
        <h2 className="font-barlow-bold text-base sm:text-lg font-bold text-stone-900">
          Daftar Service
        </h2>
        <p className="font-monterat-tipis text-[15px] sm:text-sm text-stone-700 mt-0.5 leading-relaxed">
          Kelola layanan: spesifikasi, media, dan nilai opsi di halaman detail
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
        {!loading && !error && services.length === 0 && (
          <p className="font-monterat-tipis text-center text-stone-700 py-8">
            Belum ada service di kategori ini. Tambah service baru.
          </p>
        )}
        {!loading && !error && services.length > 0 && (
          <ul className="space-y-4">
            {services.map((svc) => {
              const thumbs = displayThumbs[svc.id] ?? [];
              const categoryName =
                categories.find((c) => c.id === svc.category_id)?.name ??
                `Kategori #${svc.category_id}`;
              return (
                <li
                  key={svc.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 sm:p-4 hover:bg-stone-50/80 transition-colors"
                >
                  <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
                    <Link
                      href={`/admin/dashboard/services/${svc.id}`}
                      className="flex flex-row items-start gap-2 sm:gap-4 min-w-0 flex-1"
                    >
                      {/* Satu thumbnail acak di samping kiri */}
                      <div className="flex-shrink-0">
                        {thumbs.length > 0 ? (
                          (() => {
                            const m = thumbs[0];
                            const url =
                              (m as { url?: string; URL?: string }).url ??
                              (m as { url?: string; URL?: string }).URL ??
                              "";
                            return (
                              <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl bg-stone-200 overflow-hidden">
                                <img
                                  src={normalizeMediaUrl(url)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            );
                          })()
                        ) : (
                          <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl bg-stone-200 flex items-center justify-center">
                            <span className="text-stone-700 font-barlow-bold text-sm sm:text-lg">
                              {svc.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Teks di samping: dikecilin biar muat */}
                      <div className="min-w-0 flex-1 flex flex-col gap-0.5 overflow-hidden">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-barlow-bold text-stone-900 font-semibold text-xs sm:text-[15px] leading-tight truncate">
                            {svc.name}
                          </span>
                          <span
                            className={`font-monterat-tipis text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                              svc.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-200 text-stone-600"
                            }`}
                          >
                            {svc.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                        <p className="font-monterat-tipis text-[11px] sm:text-sm text-stone-700 leading-tight truncate">
                          /{svc.slug}
                        </p>
                        <p className="font-monterat-tipis text-[11px] sm:text-sm text-stone-800 font-medium leading-tight truncate">
                          {categoryName}
                        </p>
                        {svc.description && (
                          <p className="font-monterat-tipis text-[11px] sm:text-sm text-stone-700 line-clamp-2 leading-tight">
                            {svc.description}
                          </p>
                        )}
                      </div>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/admin/dashboard/services/${svc.id}`}
                        className="font-monterat-tipis inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 sm:py-2 min-h-[44px] sm:min-h-0 sm:px-4 text-xs sm:text-sm font-semibold text-stone-800 bg-white border border-stone-200 hover:bg-stone-50 active:bg-stone-100 transition-colors"
                      >
                        Kelola
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                      <button
                        type="button"
                        onClick={() => onToggleStatus(svc.id)}
                        disabled={actioningId === svc.id}
                        className="font-monterat-tipis inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 sm:py-2 min-h-[44px] sm:min-h-0 text-xs sm:text-sm font-semibold text-stone-800 bg-white border border-stone-200 hover:bg-stone-50 active:bg-stone-100 disabled:opacity-60 transition-colors"
                      >
                        {actioningId === svc.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                        ) : (
                          <span>{svc.is_active ? "Nonaktifkan" : "Aktifkan"}</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteClick(svc.id, svc.name)}
                        disabled={actioningId === svc.id}
                        className="font-monterat-tipis rounded-xl px-3 py-3 sm:py-2 min-h-[44px] sm:min-h-0 text-xs sm:text-sm font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 active:bg-red-100 disabled:opacity-60 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}


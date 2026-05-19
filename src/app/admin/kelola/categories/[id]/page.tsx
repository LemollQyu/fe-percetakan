"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import {
  getCategoryById,
  updateCategoryStatus,
  deleteCategory,
  uploadCategoryIcon,
} from "@/api/jasa/categories";

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

export default function AdminCategoryEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [iconUploading, setIconUploading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [icon, setIcon] = useState<string | null>(null);

  const fetchCategory = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError("ID kategori tidak valid.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getCategoryById(id);
      const d = res.data;
      if (d) {
        setName(d.name);
        setDescription(d.description ?? "");
        setSlug(d.slug ?? "");
        setIsActive(d.is_active);
        setIcon(d.meta?.icon ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat kategori.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  const token = typeof window !== "undefined" ? getToken() : null;

  const handleToggleStatus = async () => {
    if (!token || !Number.isFinite(id)) return;
    setActioningId(id);
    try {
      await updateCategoryStatus(id, token);
      setIsActive((prev) => !prev);
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async () => {
    if (!token || !Number.isFinite(id) || !confirm("Yakin hapus kategori ini?"))
      return;
    setActioningId(id);
    try {
      await deleteCategory(id, token);
      router.push("/admin/kelola/categories");
    } catch {
      setError("Gagal menghapus kategori.");
    } finally {
      setActioningId(null);
    }
  };

  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!token || !file || !Number.isFinite(id)) return;
    const allowed = ["image/png", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Icon hanya PNG atau SVG atau WEBB");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran icon maksimal 2MB.");
      return;
    }
    setIconUploading(true);
    try {
      await uploadCategoryIcon(id, file, token);
      const res = await getCategoryById(id);
      setIcon(res.data?.meta?.icon ?? null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      setIconUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f0eb]">
        <main className="flex-1 w-full max-w-[900px] mx-auto px-4 py-6">
          <div className="flex justify-center py-12">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !Number.isFinite(id)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f0eb]">
        <main className="flex-1 w-full max-w-[900px] mx-auto px-4 py-6">
          <div className="rounded-2xl bg-red-50/90 border border-red-100 px-4 py-3 text-sm text-red-800 font-monterat-tipis">
            {error ?? "ID tidak valid"}
          </div>
          <Link
            href="/admin/kelola/categories"
            className="font-monterat-tipis mt-4 inline-block text-stone-800 font-semibold hover:underline"
          >
            ← Kembali ke Daftar Kategori
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0eb]">
      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/kelola/categories"
              className="font-monterat-tipis inline-flex items-center gap-2 text-stone-800 font-semibold hover:underline"
            >
              ← Kembali
            </Link>
          </div>

          <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden">
            <div className="px-5 pt-5 pb-5">
              <h2 className="font-barlow-bold text-lg font-bold text-stone-900 mb-4">
                Edit Kategori
              </h2>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-xl bg-stone-200 flex items-center justify-center overflow-hidden">
                    {icon ? (
                      <img
                        src={normalizeIconUrl(icon)}
                        alt={`Icon ${name}`}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <span className="text-stone-600 font-barlow-bold text-2xl">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label className="font-monterat-tipis mt-2 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 transition-colors">
                    <input
                      type="file"
                      accept=".png,.svg, .webp,image/png,image/svg+xml"
                      className="sr-only"
                      disabled={iconUploading}
                      onChange={handleIconChange}
                    />
                    {iconUploading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                    ) : (
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                        />
                      </svg>
                    )}
                    Ganti Icon
                  </label>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <p className="font-barlow-bold text-stone-900 font-semibold">
                    {name}
                  </p>
                  {slug && (
                    <p className="font-monterat-tipis text-stone-700 text-sm">
                      /{slug}
                    </p>
                  )}
                  {description && (
                    <p className="font-monterat-tipis text-stone-800 text-sm leading-relaxed">
                      {description}
                    </p>
                  )}
                  <span
                    className={`font-monterat-tipis text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-200 text-stone-800"
                    }`}
                  >
                    {isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={actioningId === id}
                  className="font-monterat-tipis min-h-[44px] px-5 rounded-2xl border-2 border-stone-200 text-stone-800 font-semibold text-[15px] hover:bg-stone-50 disabled:opacity-60 transition-all"
                >
                  {actioningId === id
                    ? "..."
                    : isActive
                      ? "Nonaktifkan"
                      : "Aktifkan"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={actioningId === id}
                  className="font-monterat-tipis min-h-[44px] px-5 rounded-2xl border-2 border-red-200 text-red-600 font-semibold text-[15px] hover:bg-red-50 disabled:opacity-60 transition-all"
                >
                  Hapus Kategori
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

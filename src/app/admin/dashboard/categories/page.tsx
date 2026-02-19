"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import {
  getCategoriesList,
  createCategory,
  deleteCategory,
  updateCategoryStatus,
  uploadCategoryIcon,
  type CategoryJasa,
  type CreateCategoryPayload,
} from "@/api/jasa/categories";

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

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

export default function AdminCategoriesPage() {
  const [list, setList] = useState<CategoryJasa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCategoryPayload>({
    name: "",
    description: "",
    slug: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [iconUploadId, setIconUploadId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCategoriesList();
      setList(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat kategori.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const token = typeof window !== "undefined" ? getToken() : null;

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "name" && !prev.slug) next.slug = slugFromName(value);
      return next;
    });
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormError("");
    setSubmitting(true);
    try {
      await createCategory(
        { ...form, slug: form.slug || slugFromName(form.name) },
        token
      );
      setForm({ name: "", description: "", slug: "" });
      setShowForm(false);
      await fetchList();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gagal membuat kategori.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    if (!token) return;
    setActioningId(id);
    try {
      await updateCategoryStatus(id, token);
      await fetchList();
    } catch {
      // could set toast/error
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Yakin hapus kategori ini?")) return;
    setActioningId(id);
    try {
      await deleteCategory(id, token);
      await fetchList();
    } catch {
      // could set toast/error
    } finally {
      setActioningId(null);
    }
  };

  const handleIconChange = async (id: number, file: File | null) => {
    if (!token || !file) return;
    const allowed = ["image/png", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      alert("Icon hanya PNG atau SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran icon maksimal 2MB.");
      return;
    }
    setIconUploadId(id);
    try {
      await uploadCategoryIcon(id, file, token);
      await fetchList();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      setIconUploadId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0eb]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(214,211,209,0.4),transparent)] pointer-events-none" aria-hidden />

 

      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* Form tambah kategori */}
          {showForm && (
            <div className="rou-nded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden">
              <div className="px-5 pt-5 pb-2">
                <h2 className="font-barlow-bold text-lg font-bold text-stone-900 mb-4">
                  Kategori Baru
                </h2>
                {formError && (
                  <div
                    role="alert"
                    className="font-monterat-tipis mb-4 flex items-start gap-3 rounded-2xl bg-red-50/90 border border-red-100 px-4 py-3 text-sm font-medium text-red-800"
                  >
                    <span className="flex-shrink-0 mt-0.5 text-red-500" aria-hidden>●</span>
                    <span>{formError}</span>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="cat-name" className="font-monterat-tipis block text-[13px] font-semibold text-stone-800 mb-1.5">
                      Nama
                    </label>
                    <input
                      id="cat-name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      required
                      maxLength={200}
                      placeholder="Contoh: Cetak Brosur"
                      className="font-monterat-tipis w-full min-h-[46px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 placeholder-stone-400 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                    />
                  </div>
                  <div>
                    <label htmlFor="cat-desc" className="font-monterat-tipis block text-[13px] font-semibold text-stone-800 mb-1.5">
                      Deskripsi
                    </label>
                    <textarea
                      id="cat-desc"
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      required
                      rows={3}
                      placeholder="Deskripsi singkat kategori"
                      className="font-monterat-tipis w-full rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-[15px] font-medium text-stone-900 placeholder-stone-400 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 resize-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="cat-slug" className="font-monterat-tipis block text-[13px] font-semibold text-stone-800 mb-1.5">
                      Slug (opsional)
                    </label>
                    <input
                      id="cat-slug"
                      type="text"
                      name="slug"
                      value={form.slug}
                      onChange={handleFormChange}
                      placeholder="cetak-brosur"
                      className="font-monterat-tipis w-full min-h-[46px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 placeholder-stone-400 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="font-barlow-bold min-h-[44px] px-5 rounded-2xl bg-stone-900 text-white font-semibold text-[15px] shadow-lg shadow-stone-900/20 hover:bg-stone-800 disabled:opacity-60 transition-all"
                    >
                      {submitting ? "Menyimpan..." : "Simpan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setForm({ name: "", description: "", slug: "" });
                        setFormError("");
                      }}
                      className="font-monterat-tipis min-h-[44px] px-5 rounded-2xl border-2 border-stone-200 text-stone-800 font-semibold text-[15px] hover:bg-stone-50 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Daftar kategori */}
          <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-stone-100">
              <h2 className="font-barlow-bold text-base sm:text-lg font-bold text-stone-900">
                Daftar Kategori
              </h2>
              <p className="font-monterat-tipis text-[15px] sm:text-sm text-stone-700 mt-0.5 leading-relaxed">
                Kelola kategori jasa yang ditampilkan
              </p>
              {!showForm && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="font-barlow-bold mt-4 flex items-center justify-center gap-2 rounded-2xl bg-stone-900 text-white font-semibold text-[15px] px-6 py-3 shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.99] transition-all w-full sm:w-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Kategori
                </button>
              )}
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
              {!loading && !error && list.length === 0 && (
                <p className="font-monterat-tipis text-center text-stone-700 py-8">
                  Belum ada kategori. Tambah kategori baru di atas.
                </p>
              )}
              {!loading && !error && list.length > 0 && (
                <ul className="space-y-4">
                  {list.map((cat) => (
                    <li
                      key={cat.id}
                      className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 sm:p-4 hover:bg-stone-50/80 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-stone-200 flex items-center justify-center text-stone-700 font-barlow-bold text-base sm:text-lg overflow-hidden">
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
                              <span className="font-barlow-bold text-stone-900 font-semibold text-base sm:text-[15px] leading-snug truncate">
                                {cat.name}
                              </span>
                              <span
                                className={`font-monterat-tipis text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                  cat.is_active
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-stone-200 text-stone-800"
                                }`}
                              >
                                {cat.is_active ? "Aktif" : "Nonaktif"}
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
                        </div>
                        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                          <Link
                            href={`/admin/dashboard/categories/${cat.id}`}
                            className="font-monterat-tipis inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 sm:py-2 min-h-[44px] sm:min-h-0 text-[15px] sm:text-sm font-semibold text-stone-800 bg-white border border-stone-200 hover:bg-stone-50 active:bg-stone-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Link>
                          <label className="font-monterat-tipis cursor-pointer flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 sm:py-2 min-h-[44px] sm:min-h-0 text-[15px] sm:text-sm font-semibold text-stone-800 bg-white border border-stone-200 hover:bg-stone-50 active:bg-stone-100 transition-colors">
                            <input
                              type="file"
                              accept=".png,.svg,image/png,image/svg+xml"
                              className="sr-only"
                              disabled={iconUploadId === cat.id}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleIconChange(cat.id, f);
                                e.target.value = "";
                              }}
                            />
                            {iconUploadId === cat.id ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                              </svg>
                            )}
                            Icon
                          </label>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(cat.id)}
                            disabled={actioningId === cat.id}
                            className="font-monterat-tipis inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 sm:py-2 min-h-[44px] sm:min-h-0 text-[15px] sm:text-sm font-semibold text-stone-800 bg-white border border-stone-200 hover:bg-stone-50 active:bg-stone-100 disabled:opacity-60 transition-colors"
                          >
                            {actioningId === cat.id && (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
                            )}
                            {cat.is_active ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id)}
                            disabled={actioningId === cat.id}
                            className="font-monterat-tipis rounded-xl px-3 py-3 sm:py-2 min-h-[44px] sm:min-h-0 text-[15px] sm:text-sm font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 active:bg-red-100 disabled:opacity-60 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

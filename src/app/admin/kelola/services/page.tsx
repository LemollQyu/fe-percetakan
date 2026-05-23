"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken } from "@/lib/auth";
import { getCategoriesList, type CategoryJasa } from "@/api/jasa/categories";
import {
  getServicesList,
  createService,
  updateServiceStatus,
  deleteService,
  type ServiceJasa,
  type CreateServiceForm,
  type ServiceMedia,
} from "@/api/jasa/services";
import ConfirmDeleteServiceModal from "@/components/admin/ConfirmDeleteServiceModal";
import { CategoryPicker } from "@/components/admin/CategoryPicker";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { ServiceList } from "@/components/admin/ServiceList";

export default function AdminServicesPage() {
  const [list, setList] = useState<ServiceJasa[]>([]);
  const [categories, setCategories] = useState<CategoryJasa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<
    Omit<CreateServiceForm, "base_price" | "duration_per_unit"> & {
      base_price: string;
      duration_per_unit: number;
    }
  >({
    category_id: 0,
    name: "",
    description: "",
    base_price: "",
    duration_per_unit: 0,
  });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [thumbnailSlots, setThumbnailSlots] = useState<(File | null)[]>([null]);
  const [gallerySlots, setGallerySlots] = useState<(File | null)[]>([null]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        getServicesList(),
        getCategoriesList(),
      ]);
      setList(servicesRes.data ?? []);
      setCategories(categoriesRes.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Ambil kategori terpilih dari query (?category=ID)
  useEffect(() => {
    const q = searchParams?.get("category");
    if (!q) {
      setSelectedCategoryId(null);
      return;
    }
    const id = Number(q);
    setSelectedCategoryId(Number.isNaN(id) ? null : id);
  }, [searchParams]);

  // Sinkronkan form.category_id dengan kategori terpilih / default kategori pertama
  useEffect(() => {
    setForm((prev) => {
      if (selectedCategoryId != null) {
        return { ...prev, category_id: selectedCategoryId };
      }
      if (
        (prev.category_id === 0 || Number.isNaN(prev.category_id)) &&
        categories.length > 0
      ) {
        return { ...prev, category_id: categories[0].id };
      }
      return prev;
    });
  }, [selectedCategoryId, categories]);

  const selectedCategory = useMemo(() => {
    if (selectedCategoryId == null) return null;
    return categories.find((c) => c.id === selectedCategoryId) ?? null;
  }, [categories, selectedCategoryId]);

  const filteredList = useMemo(() => {
    if (selectedCategoryId == null) return [];
    return list.filter((svc) => svc.category_id === selectedCategoryId);
  }, [list, selectedCategoryId]);

  // Satu thumbnail acak per service untuk tampilan list
  const displayThumbs = useMemo(() => {
    const thumbMap: Record<number, ServiceMedia[]> = {};
    list.forEach((svc) => {
      const mediaList =
        svc.media ?? (svc as { Media?: ServiceMedia[] }).Media ?? [];
      const thumbs = mediaList.filter(
        (m) =>
          String(
            (m as { type?: string; Type?: string }).type ??
              (m as { type?: string; Type?: string }).Type ??
              "",
          ).toLowerCase() === "thumbnail",
      );
      if (thumbs.length === 0) {
        thumbMap[svc.id] = [];
      } else {
        const shuffled = [...thumbs].sort(() => Math.random() - 0.5);
        thumbMap[svc.id] = shuffled.slice(0, 1);
      }
    });
    return thumbMap;
  }, [list]);

  const token = typeof window !== "undefined" ? getToken() : null;

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: name === "category_id" ? Number(value) : value,
      };
      return next;
    });
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const thumbnailFiles = thumbnailSlots.filter(
      (f): f is File => f != null && f.size > 0,
    );
    const galleryFiles = gallerySlots.filter(
      (f): f is File => f != null && f.size > 0,
    );
    if (thumbnailFiles.length === 0) {
      setFormError("Minimal satu thumbnail wajib diisi.");
      return;
    }
    if (galleryFiles.length === 0) {
      setFormError("Minimal satu file gallery wajib diisi.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      await createService(
        {
          category_id: form.category_id,
          name: form.name,
          description: form.description,
          base_price:
            form.base_price === "" ? undefined : Number(form.base_price),
          duration_per_unit:
            form.duration_per_unit === 0
              ? undefined
              : Number(form.duration_per_unit),
        },
        {
          icon: iconFile ?? undefined,
          thumbnail: thumbnailFiles,
          gallery: galleryFiles,
        },
        token,
      );
      setForm({
        category_id: selectedCategoryId ?? categories[0]?.id ?? 0,
        name: "",
        description: "",
        base_price: "",
        duration_per_unit: 0,
      });
      setIconFile(null);
      setThumbnailSlots([null]);
      setGallerySlots([null]);
      setShowForm(false);
      await fetchList();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gagal membuat service.");
    } finally {
      setSubmitting(false);
    }
  };

  const setThumbnailAt = (index: number, file: File | null) => {
    setThumbnailSlots((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };

  const setGalleryAt = (index: number, file: File | null) => {
    setGallerySlots((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };

  const addThumbnailSlot = () => {
    if (thumbnailSlots.length >= 3) return;
    setThumbnailSlots((prev) => [...prev, null]);
  };

  const addGallerySlot = () => {
    setGallerySlots((prev) => [...prev, null]);
  };

  const handleToggleStatus = async (serviceId: number) => {
    if (!token) return;
    setActioningId(serviceId);
    try {
      await updateServiceStatus(serviceId, token);
      await fetchList();
    } catch {
      // could set toast/error
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteClick = (serviceId: number, serviceName: string) => {
    setDeleteModal({ id: serviceId, name: serviceName });
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteModal) return;
    setActioningId(deleteModal.id);
    try {
      await deleteService(deleteModal.id, token);
      setDeleteModal(null);
      await fetchList();
    } catch {
      // could set toast/error
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0eb]">
      <ConfirmDeleteServiceModal
        open={!!deleteModal}
        serviceName={deleteModal?.name ?? ""}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDeleteConfirm}
        loading={actioningId === deleteModal?.id}
      />
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(214,211,209,0.4),transparent)] pointer-events-none"
        aria-hidden
      />

      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* MODE 1: pilih kategori */}
          {selectedCategoryId == null && (
            <CategoryPicker
              categories={categories}
              services={list}
              loading={loading}
              error={error}
              onSelectCategory={(categoryId) => {
                setShowForm(false);
                setFormError("");
                setSelectedCategoryId(categoryId);
                router.push(`/admin/kelola/services?category=${categoryId}`);
              }}
            />
          )}

          {/* MODE 2: kelola service di kategori terpilih */}
          {selectedCategoryId != null && (
            <>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormError("");
                    setSelectedCategoryId(null);
                    router.push("/admin/kelola/services");
                  }}
                  className="font-monterat-tipis text-sm font-semibold text-stone-600 hover:text-stone-900"
                >
                  ← Kategori
                </button>
                {!showForm && (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="font-barlow-bold flex items-center justify-center gap-2 rounded-2xl bg-stone-900 text-white font-semibold text-[15px] px-5 py-3 shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.99] transition-all"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Tambah Service
                  </button>
                )}
              </div>

              <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden">
                <div className="px-4 sm:px-5 py-4 border-b border-stone-100">
                  <h2 className="font-barlow-bold text-base sm:text-lg font-bold text-stone-900">
                    Manage Service
                    {selectedCategory?.name
                      ? ` — ${selectedCategory.name}`
                      : ""}
                  </h2>
                  <p className="font-monterat-tipis text-[15px] sm:text-sm text-stone-700 mt-0.5 leading-relaxed">
                    Kelola layanan, media, dan spesifikasi untuk kategori ini
                  </p>
                </div>
              </div>

              {/* Form tambah service */}
              {showForm && (
                <ServiceForm
                  form={form}
                  formError={formError}
                  submitting={submitting}
                  thumbnailSlots={thumbnailSlots}
                  gallerySlots={gallerySlots}
                  selectedCategory={selectedCategory}
                  selectedCategoryId={selectedCategoryId}
                  onChange={handleFormChange}
                  onSubmit={handleSubmit}
                  setIconFile={setIconFile}
                  setThumbnailAt={setThumbnailAt}
                  setGalleryAt={setGalleryAt}
                  addThumbnailSlot={addThumbnailSlot}
                  addGallerySlot={addGallerySlot}
                  onCancel={() => {
                    setShowForm(false);
                    setFormError("");
                  }}
                />
              )}

              {/* Daftar service (terfilter kategori) */}
              <ServiceList
                services={filteredList}
                categories={categories}
                loading={loading}
                error={error}
                displayThumbs={displayThumbs}
                actioningId={actioningId}
                onToggleStatus={handleToggleStatus}
                onDeleteClick={handleDeleteClick}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

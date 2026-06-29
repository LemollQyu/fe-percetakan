"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { getToken } from "@/lib/auth";
import {
  getServiceById,
  addServiceMedia,
  deleteServiceMedia,
  createServiceSpecification,
  deleteServiceSpecification,
  toggleServiceSpecificationStatus,
  toggleServiceSpecificationRequired,
  createServiceSpecificationValue,
  updateServiceSpecificationValue,
  updateServiceStatus,
  deleteService,
  type ServiceJasa,
  type ServiceSpesification,
  type AddServiceMediaType,
} from "@/api/jasa/services";
import { updateServiceEstimate } from "@/api/jasa/services";
import ConfirmDeleteServiceModal from "@/components/admin/ConfirmDeleteServiceModal";

function normalizeMediaUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  const t = url.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) {
    const idx = t.indexOf("/static/");
    if (idx !== -1) return t.substring(idx);
    return t;
  }
  if (t.startsWith("/static/")) return t;
  const idx = t.indexOf("/static/");
  if (idx !== -1) return t.substring(idx);
  if (t.startsWith("static/")) return `/${t}`;
  return t.startsWith("/") ? t : `/${t}`;
}

export default function AdminServiceDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [service, setService] = useState<ServiceJasa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Form: tambah spesifikasi
  const [specForm, setSpecForm] = useState({
    name: "",
    input_type: "select" as "select" | "boolean" | "text" | "number",
    options: "",
    is_required: true,
  });
  const [specSubmitting, setSpecSubmitting] = useState(false);
  const [specError, setSpecError] = useState("");

  // Estimasi
  const [estimateForm, setEstimateForm] = useState({ duration_per_unit: "" });
  const [estimateSubmitting, setEstimateSubmitting] = useState(false);
  const [estimateError, setEstimateError] = useState("");
  const [estimateSuccess, setEstimateSuccess] = useState(false);

  // Media
  const [thumbnailSlotCount, setThumbnailSlotCount] = useState(1);
  const [galleryEmptySlots, setGalleryEmptySlots] = useState(1);
  const [mediaUploading, setMediaUploading] = useState<
    "icon" | "thumbnail" | "gallery" | null
  >(null);
  const [mediaError, setMediaError] = useState("");

  // Form: tambah spec value (per spec)
  const [valueFormBySpec, setValueFormBySpec] = useState<
    Record<number, { value: string; additional_price: string }>
  >({});
  const [valueSubmittingBySpec, setValueSubmittingBySpec] = useState<
    Record<number, boolean>
  >({});
  const [valueErrorBySpec, setValueErrorBySpec] = useState<
    Record<number, string>
  >({});

  // Edit spec value
  const [editingValueId, setEditingValueId] = useState<{
    specId: number;
    valueId: number;
  } | null>(null);
  const [editValueForm, setEditValueForm] = useState({
    value: "",
    additional_price: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchService = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getServiceById(id);
      setService(res.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat service.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const thumbnails =
    service?.media?.filter((m) => m.type === "thumbnail") ?? [];
  const galleryMedia =
    service?.media?.filter((m) => m.type === "gallery") ?? [];
  const iconMedia = service?.media?.find((m) => m.type === "icon");

  useEffect(() => {
    if (service && thumbnails.length > 0) {
      setThumbnailSlotCount((prev) =>
        Math.max(prev, Math.min(3, thumbnails.length)),
      );
    }
  }, [service?.id, thumbnails.length]);

  // Sync estimasi dari data service
  useEffect(() => {
    if (service?.duration_per_unit != null) {
      setEstimateForm({ duration_per_unit: String(service.duration_per_unit) });
    }
  }, [service?.id, service?.duration_per_unit]);

  const token = typeof window !== "undefined" ? getToken() : null;

  const handleToggleStatus = async () => {
    if (!token || !service) return;
    setActioningId("status");
    try {
      await updateServiceStatus(service.id, token);
      await fetchService();
    } catch {
      // could toast
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteClick = () => setShowDeleteModal(true);

  const handleDeleteConfirm = async () => {
    if (!token || !service) return;
    setActioningId("delete");
    try {
      await deleteService(service.id, token);
      setShowDeleteModal(false);
      window.location.href = `/admin/kelola/services?category=${service.category_id}`;
    } catch {
      setActioningId(null);
    }
  };

  const handleUpdateEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !service) return;
    if (estimateForm.duration_per_unit === "") {
      setEstimateError("Duration per unit wajib diisi.");
      return;
    }
    setEstimateError("");
    setEstimateSuccess(false);
    setEstimateSubmitting(true);
    try {
      await updateServiceEstimate(
        service.id,
        { duration_per_unit: Number(estimateForm.duration_per_unit) },
        token,
      );
      setEstimateSuccess(true);
      await fetchService();
    } catch (e) {
      setEstimateError(
        e instanceof Error ? e.message : "Gagal update estimasi.",
      );
    } finally {
      setEstimateSubmitting(false);
    }
  };

  const handleAddSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !service) return;
    setSpecError("");
    setSpecSubmitting(true);
    try {
      const options =
        specForm.input_type === "select" && specForm.options.trim()
          ? specForm.options
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;
      await createServiceSpecification(
        {
          service_id: service.id,
          name: specForm.name,
          input_type: specForm.input_type,
          options,
          is_required: specForm.is_required,
        },
        token,
      );
      setSpecForm({
        name: "",
        input_type: "select",
        options: "",
        is_required: true,
      });
      await fetchService();
    } catch (e) {
      setSpecError(
        e instanceof Error ? e.message : "Gagal menambah spesifikasi.",
      );
    } finally {
      setSpecSubmitting(false);
    }
  };

  const handleDeleteSpec = async (specId: number) => {
    if (!token || !service || !confirm("Hapus spesifikasi ini?")) return;
    setActioningId(`spec-${specId}`);
    try {
      await deleteServiceSpecification(service.id, specId, token);
      await fetchService();
    } finally {
      setActioningId(null);
    }
  };

  const handleToggleSpecStatus = async (specId: number) => {
    if (!token || !service) return;
    setActioningId(`spec-status-${specId}`);
    try {
      await toggleServiceSpecificationStatus(service.id, specId, token);
      await fetchService();
    } finally {
      setActioningId(null);
    }
  };

  const handleToggleSpecRequired = async (specId: number) => {
    if (!token || !service) return;
    setActioningId(`spec-req-${specId}`);
    try {
      await toggleServiceSpecificationRequired(service.id, specId, token);
      await fetchService();
    } finally {
      setActioningId(null);
    }
  };

  const handleMediaUpload = async (type: AddServiceMediaType, file: File) => {
    if (!token || !service) return;
    setMediaError("");
    setMediaUploading(type);
    try {
      await addServiceMedia(service.id, type, file, token);
      await fetchService();
    } catch (e) {
      setMediaError(e instanceof Error ? e.message : "Upload gagal.");
    } finally {
      setMediaUploading(null);
    }
  };

  const handleDeleteMedia = async (mediaID: number) => {
    if (!token || !service || !confirm("Hapus media ini?")) return;
    setActioningId(`media-${mediaID}`);
    try {
      await deleteServiceMedia(service.id, mediaID, token);
      await fetchService();
    } finally {
      setActioningId(null);
    }
  };

  const handleAddSpecValue = async (spec: ServiceSpesification) => {
    if (!token || !service) return;
    const form = valueFormBySpec[spec.id] ?? {
      value: "",
      additional_price: "",
    };
    const isBoolean = spec.input_type === "boolean";
    const valueToSend = isBoolean ? "Ya" : form.value.trim();
    if (!isBoolean && !form.value.trim()) {
      setValueErrorBySpec((prev) => ({
        ...prev,
        [spec.id]: "Nilai wajib diisi.",
      }));
      return;
    }
    setValueErrorBySpec((prev) => ({ ...prev, [spec.id]: "" }));
    setValueSubmittingBySpec((prev) => ({ ...prev, [spec.id]: true }));
    try {
      await createServiceSpecificationValue(
        {
          service_id: service.id,
          spesification_id: spec.id,
          value: valueToSend,
          additional_price:
            form.additional_price === "" ? 0 : Number(form.additional_price),
        },
        token,
      );
      setValueFormBySpec((prev) => ({
        ...prev,
        [spec.id]: { value: "", additional_price: "" },
      }));
      await fetchService();
    } catch (e) {
      setValueErrorBySpec((prev) => ({
        ...prev,
        [spec.id]: e instanceof Error ? e.message : "Gagal menambah nilai.",
      }));
    } finally {
      setValueSubmittingBySpec((prev) => ({ ...prev, [spec.id]: false }));
    }
  };

  const handleUpdateSpecValue = async () => {
    if (!token || !service || !editingValueId) return;
    setActioningId(`edit-value-${editingValueId.valueId}`);
    try {
      await updateServiceSpecificationValue(
        service.id,
        editingValueId.specId,
        editingValueId.valueId,
        {
          value: editValueForm.value,
          additional_price:
            editValueForm.additional_price === ""
              ? 0
              : Number(editValueForm.additional_price),
        },
        token,
      );
      setEditingValueId(null);
      setEditValueForm({ value: "", additional_price: "" });
      await fetchService();
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0eb]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f0eb] px-4 py-8">
        <Link
          href="/admin/kelola/services"
          className="text-sm font-semibold text-stone-600 hover:text-stone-900 mb-4"
        >
          ← Daftar Service
        </Link>
        <p className="font-monterat-tipis text-red-700">
          {error ?? "Service tidak ditemukan."}
        </p>
      </div>
    );
  }

  const thumb = service.media?.find((m) => m.type === "thumbnail");

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0eb]">
      <ConfirmDeleteServiceModal
        open={showDeleteModal}
        serviceName={service.name}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        loading={actioningId === "delete"}
      />
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(214,211,209,0.4),transparent)] pointer-events-none"
        aria-hidden
      />

      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/admin/kelola/services?category=${service.category_id}`}
            className="font-monterat-tipis text-sm font-semibold text-stone-600 hover:text-stone-900"
          >
            ← Daftar Service
          </Link>
        </div>

        {/* Header service */}
        <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden mb-6">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-stone-200 overflow-hidden">
              {thumb?.url ? (
                <Image
                  src={normalizeMediaUrl(thumb.url)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="flex w-full h-full items-center justify-center text-stone-700 font-barlow-bold text-2xl">
                  {service.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-barlow-bold text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                {service.name}
              </h1>
              <p className="font-monterat-tipis text-[15px] sm:text-sm text-stone-700 leading-relaxed mt-0.5">
                /{service.slug}
              </p>
              <p className="font-monterat-tipis text-[15px] sm:text-sm text-stone-700 mt-1 leading-relaxed">
                Harga dasar: Rp{" "}
                {Number(service.base_price).toLocaleString("id-ID")}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`font-monterat-tipis text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    service.is_active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {service.is_active ? "Aktif" : "Nonaktif"}
                </span>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={actioningId === "status"}
                  className="border border-stone-200 rounded-lg px-3 py-2 hover:bg-stone-50 font-monterat-tipis text-[13px] sm:text-xs font-semibold text-stone-700 hover:text-stone-900 disabled:opacity-60 min-h-[44px] sm:min-h-0 flex items-center"
                >
                  {actioningId === "status"
                    ? "..."
                    : service.is_active
                      ? "Nonaktifkan"
                      : "Aktifkan"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={actioningId === "delete"}
                  className="border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 font-monterat-tipis text-[13px] sm:text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-60 min-h-[44px] sm:min-h-0 flex items-center"
                >
                  {actioningId === "delete" ? "..." : "Hapus Service"}
                </button>
              </div>
            </div>
          </div>
          {service.description && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              <p className="font-monterat-tipis text-[15px] sm:text-sm text-stone-700 leading-relaxed">
                {service.description}
              </p>
            </div>
          )}
        </div>

        {/* Estimasi */}
        <section className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden mb-6">
          <div className="px-4 sm:px-5 py-4 border-b border-stone-100">
            <h2 className="font-barlow-bold text-base sm:text-lg font-bold text-stone-900">
              Estimasi
            </h2>
            <p className="font-monterat-tipis text-[15px] sm:text-sm text-stone-700 mt-0.5 leading-relaxed">
              Durasi pengerjaan per unit
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <form
              onSubmit={handleUpdateEstimate}
              className="flex flex-wrap gap-3 items-end"
            >
              <div className="flex-1 min-w-[180px]">
                <label className="font-monterat-tipis block text-[13px] sm:text-xs font-semibold text-stone-700 mb-1">
                  Duration per unit
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Contoh: 30"
                  value={estimateForm.duration_per_unit}
                  onChange={(e) => {
                    setEstimateForm({ duration_per_unit: e.target.value });
                    setEstimateError("");
                    setEstimateSuccess(false);
                  }}
                  className="font-monterat-tipis w-full min-h-[44px] sm:min-h-[40px] rounded-lg border border-stone-200 px-3 text-[15px] sm:text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={estimateSubmitting}
                className="font-barlow-bold min-h-[44px] sm:min-h-[40px] px-5 rounded-xl bg-stone-900 text-white text-sm font-semibold disabled:opacity-60"
              >
                {estimateSubmitting ? "..." : "Simpan"}
              </button>
            </form>
            {estimateError && (
              <p className="font-monterat-tipis text-sm text-red-600 mt-2">
                {estimateError}
              </p>
            )}
            {estimateSuccess && (
              <p className="font-monterat-tipis text-sm text-emerald-700 mt-2">
                Estimasi berhasil diperbarui.
              </p>
            )}
          </div>
        </section>

        {/* Spesifikasi */}
        <section className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden mb-6">
          <div className="px-4 sm:px-5 py-4 border-b border-stone-100">
            <h2 className="font-barlow-bold text-base sm:text-lg font-bold text-stone-900">
              Spesifikasi
            </h2>
            <p className="font-monterat-tipis text-[15px] sm:text-sm text-stone-700 mt-0.5 leading-relaxed">
              Tambah field spesifikasi (select, boolean, text, number) untuk
              layanan ini
            </p>
          </div>
          <div className="p-4 sm:p-5 space-y-4">
            <form
              onSubmit={handleAddSpec}
              className="flex flex-wrap gap-3 items-end p-4 rounded-xl bg-stone-50/80 border border-stone-100"
            >
              <div className="flex-1 min-w-0 sm:min-w-[140px] w-full">
                <label className="font-monterat-tipis block text-[13px] sm:text-xs font-semibold text-stone-700 mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  value={specForm.name}
                  onChange={(e) =>
                    setSpecForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="Contoh: Ukuran Kertas"
                  className="font-monterat-tipis w-full min-h-[44px] sm:min-h-[40px] rounded-lg border border-stone-200 px-3 text-[15px] sm:text-sm"
                />
              </div>
              <div className="w-full sm:w-32">
                <label className="font-monterat-tipis block text-[13px] sm:text-xs font-semibold text-stone-700 mb-1">
                  Tipe
                </label>
                <select
                  value={specForm.input_type}
                  onChange={(e) =>
                    setSpecForm((p) => ({
                      ...p,
                      input_type: e.target.value as
                        | "select"
                        | "boolean"
                        | "text"
                        | "number",
                    }))
                  }
                  className="font-monterat-tipis w-full min-h-[44px] sm:min-h-[40px] rounded-lg border border-stone-200 px-3 text-[15px] sm:text-sm"
                >
                  <option value="select">Select</option>
                  <option value="boolean">Boolean</option>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                </select>
              </div>
              {specForm.input_type === "select" && (
                <div className="flex-1 min-w-0 sm:min-w-[160px] w-full">
                  <label className="font-monterat-tipis block text-[13px] sm:text-xs font-semibold text-stone-700 mb-1">
                    Opsi (pisah koma)
                  </label>
                  <input
                    type="text"
                    value={specForm.options}
                    onChange={(e) =>
                      setSpecForm((p) => ({ ...p, options: e.target.value }))
                    }
                    placeholder="A4, A5, F4"
                    className="font-monterat-tipis w-full min-h-[44px] sm:min-h-[40px] rounded-lg border border-stone-200 px-3 text-[15px] sm:text-sm"
                  />
                </div>
              )}
              <label className="font-monterat-tipis flex items-center gap-2 text-[15px] sm:text-sm min-h-[44px] sm:min-h-0">
                <input
                  type="checkbox"
                  checked={specForm.is_required}
                  onChange={(e) =>
                    setSpecForm((p) => ({
                      ...p,
                      is_required: e.target.checked,
                    }))
                  }
                />
                Wajib
              </label>
              <button
                type="submit"
                disabled={specSubmitting}
                className="font-barlow-bold min-h-[40px] px-4 rounded-xl bg-stone-900 text-white text-sm font-semibold disabled:opacity-60"
              >
                {specSubmitting ? "..." : "Tambah"}
              </button>
            </form>
            {specError && (
              <p className="font-monterat-tipis text-sm text-red-600">
                {specError}
              </p>
            )}

            {service.spesification && service.spesification.length > 0 ? (
              <ul className="space-y-3">
                {service.spesification.map((spec) => (
                  <li
                    key={spec.id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/50"
                  >
                    <div className="flex flex-row items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                      <div className="min-w-0 flex-1 order-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-barlow-bold text-stone-900 font-semibold text-sm sm:text-base">
                            {spec.name}
                          </span>
                          <span
                            className={`font-monterat-tipis text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                              spec.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-200 text-stone-600"
                            }`}
                          >
                            {spec.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                        <p className="font-monterat-tipis text-xs text-stone-600 mt-0.5">
                          {spec.input_type} ·{" "}
                          {spec.is_required ? "Wajib" : "Opsional"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 order-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSpecStatus(spec.id)}
                          disabled={actioningId === `spec-status-${spec.id}`}
                          className="font-monterat-tipis text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg px-3 py-2 hover:bg-stone-50 disabled:opacity-60"
                        >
                          {spec.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSpecRequired(spec.id)}
                          disabled={actioningId === `spec-req-${spec.id}`}
                          className="font-monterat-tipis text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg px-3 py-2 hover:bg-stone-50 disabled:opacity-60"
                        >
                          {spec.is_required
                            ? "Jadikan opsional"
                            : "Jadikan wajib"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSpec(spec.id)}
                          disabled={actioningId === `spec-${spec.id}`}
                          className="font-monterat-tipis text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 disabled:opacity-60"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                    {(spec.input_type === "select" ||
                      spec.input_type === "boolean") &&
                      (() => {
                        const isBoolean = spec.input_type === "boolean";
                        const existingValues = spec.spesification_value ?? [];
                        const hasBooleanValue =
                          isBoolean && existingValues.length > 0;
                        const selectOptions: string[] = isBoolean
                          ? []
                          : Array.isArray(spec.options)
                            ? (spec.options as unknown[]).map((o) =>
                                typeof o === "string"
                                  ? o
                                  : ((o as { value?: string; label?: string })
                                      ?.value ??
                                    (o as { value?: string; label?: string })
                                      ?.label ??
                                    String(o)),
                              )
                            : typeof spec.options === "string"
                              ? (() => {
                                  try {
                                    const arr = JSON.parse(
                                      spec.options as string,
                                    );
                                    return Array.isArray(arr)
                                      ? arr.map((x: unknown) => String(x))
                                      : [];
                                  } catch {
                                    return [];
                                  }
                                })()
                              : [];
                        const usedSelectValues = existingValues.map(
                          (v) => v.value,
                        );
                        const availableSelectOptions = selectOptions.filter(
                          (opt) => !usedSelectValues.includes(opt),
                        );
                        const canAddSelectValue =
                          spec.input_type === "select" &&
                          availableSelectOptions.length > 0;
                        const showAddForm = isBoolean
                          ? !hasBooleanValue
                          : canAddSelectValue;
                        return (
                          <div className="w-full mt-4 pt-3 border-t border-stone-200 space-y-2">
                            <div className="flex flex-wrap gap-2 items-center">
                              {spec.input_type === "select" && showAddForm && (
                                <select
                                  value={valueFormBySpec[spec.id]?.value ?? ""}
                                  onChange={(e) =>
                                    setValueFormBySpec((p) => ({
                                      ...p,
                                      [spec.id]: {
                                        ...(p[spec.id] ?? {
                                          value: "",
                                          additional_price: "",
                                        }),
                                        value: e.target.value,
                                      },
                                    }))
                                  }
                                  className="font-monterat-tipis min-h-[36px] rounded-lg border border-stone-200 px-3 text-sm min-w-[100px]"
                                >
                                  <option value="">Pilih opsi</option>
                                  {availableSelectOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              )}
                              {showAddForm && (
                                <>
                                  <div className="flex-1 min-w-[120px] sm:min-w-[160px]">
                                    <input
                                      type="number"
                                      placeholder="Harga spesifikasi"
                                      min={0}
                                      step={0.01}
                                      value={
                                        valueFormBySpec[spec.id]
                                          ?.additional_price ?? ""
                                      }
                                      onChange={(e) =>
                                        setValueFormBySpec((p) => ({
                                          ...p,
                                          [spec.id]: {
                                            ...(p[spec.id] ?? {
                                              value: "",
                                              additional_price: "",
                                            }),
                                            additional_price: e.target.value,
                                          },
                                        }))
                                      }
                                      className="font-monterat-tipis w-full min-h-[36px] rounded-lg border border-stone-200 px-3 text-sm"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAddSpecValue(spec)}
                                    disabled={valueSubmittingBySpec[spec.id]}
                                    className="font-barlow-bold min-h-[36px] px-4 rounded-lg bg-stone-700 text-white text-sm flex-shrink-0"
                                  >
                                    {valueSubmittingBySpec[spec.id]
                                      ? "..."
                                      : "Tambah nilai"}
                                  </button>
                                </>
                              )}
                            </div>
                            {spec.input_type === "select" &&
                              selectOptions.length > 0 &&
                              existingValues.length >= selectOptions.length && (
                                <p className="font-monterat-tipis text-xs text-stone-500">
                                  Semua opsi sudah punya nilai (maks{" "}
                                  {selectOptions.length}).
                                </p>
                              )}
                            {valueErrorBySpec[spec.id] && (
                              <p className="font-monterat-tipis text-xs text-red-600">
                                {valueErrorBySpec[spec.id]}
                              </p>
                            )}
                            {existingValues.map((v) => (
                              <div
                                key={v.id}
                                className="flex flex-row items-center justify-between gap-2 text-sm"
                              >
                                {editingValueId?.specId === spec.id &&
                                editingValueId?.valueId === v.id ? (
                                  <div className="flex flex-wrap gap-2 items-center flex-1">
                                    {spec.input_type === "select" && (
                                      <select
                                        value={editValueForm.value}
                                        onChange={(e) =>
                                          setEditValueForm((p) => ({
                                            ...p,
                                            value: e.target.value,
                                          }))
                                        }
                                        className="font-monterat-tipis min-h-[32px] rounded-lg border border-stone-200 px-2 text-sm min-w-[90px]"
                                      >
                                        {editValueForm.value &&
                                          !selectOptions.includes(
                                            editValueForm.value,
                                          ) && (
                                            <option value={editValueForm.value}>
                                              {editValueForm.value}
                                            </option>
                                          )}
                                        {selectOptions.map((opt) => (
                                          <option key={opt} value={opt}>
                                            {opt}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                    <input
                                      type="number"
                                      min={0}
                                      step={0.01}
                                      placeholder="Harga spesifikasi"
                                      value={editValueForm.additional_price}
                                      onChange={(e) =>
                                        setEditValueForm((p) => ({
                                          ...p,
                                          additional_price: e.target.value,
                                        }))
                                      }
                                      className="font-monterat-tipis min-h-[32px] rounded-lg border border-stone-200 px-2 text-sm w-28"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleUpdateSpecValue}
                                      disabled={
                                        actioningId === `edit-value-${v.id}`
                                      }
                                      className="font-monterat-tipis text-xs font-semibold text-stone-600 hover:text-stone-900"
                                    >
                                      Simpan
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingValueId(null);
                                        setEditValueForm({
                                          value: "",
                                          additional_price: "",
                                        });
                                      }}
                                      className="font-monterat-tipis text-xs text-stone-700 hover:text-stone-900"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="font-monterat-tipis text-stone-700">
                                      {spec.input_type === "boolean" ? (
                                        <>
                                          Rp{" "}
                                          {Number(
                                            v.additional_price,
                                          ).toLocaleString("id-ID")}
                                        </>
                                      ) : (
                                        <>
                                          {v.value} — Rp{" "}
                                          {Number(
                                            v.additional_price,
                                          ).toLocaleString("id-ID")}
                                        </>
                                      )}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingValueId({
                                          specId: spec.id,
                                          valueId: v.id,
                                        });
                                        setEditValueForm({
                                          value: v.value,
                                          additional_price: String(
                                            v.additional_price,
                                          ),
                                        });
                                      }}
                                      className="font-monterat-tipis text-xs font-semibold text-stone-700 hover:text-stone-900 rounded-lg px-3 py-1.5 border border-stone-200 bg-white hover:bg-stone-50 flex-shrink-0"
                                    >
                                      Edit
                                    </button>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-monterat-tipis text-sm text-stone-700">
                Belum ada spesifikasi.
              </p>
            )}
          </div>
        </section>

        {/* Media */}
        <section className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden mb-6">
          <div className="px-4 sm:px-5 py-4 border-b border-stone-100">
            <h2 className="font-barlow-bold text-base sm:text-lg font-bold text-stone-900">
              Media
            </h2>
            <p className="font-monterat-tipis text-[15px] sm:text-sm text-stone-700 mt-0.5 leading-relaxed">
              Icon (1), Thumbnail (maks 3), dan Gallery. Pilih gambar lalu
              otomatis ter-upload.
            </p>
          </div>
          <div className="p-4 sm:p-5 space-y-8">
            {mediaError && (
              <div
                role="alert"
                className="font-monterat-tipis flex items-start gap-3 rounded-2xl bg-red-50/90 border border-red-100 px-4 py-3 text-sm font-medium text-red-800"
              >
                <span className="flex-shrink-0 mt-0.5 text-red-500" aria-hidden>
                  ●
                </span>
                <span>{mediaError}</span>
              </div>
            )}

            {/* Icon */}
            <div>
              <h3 className="font-barlow-bold text-[15px] font-semibold text-stone-800 mb-2">
                Icon
              </h3>
              <p className="font-monterat-tipis text-[13px] text-stone-700 mb-3 leading-relaxed">
                Satu icon untuk service. Bisa dihapus lalu pilih lagi dan
                upload.
              </p>
              <div className="flex flex-wrap items-stretch gap-4">
                <div className="w-28 h-28 flex-shrink-0 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/80 overflow-hidden flex items-center justify-center">
                  {iconMedia ? (
                    <div className="relative w-full h-full group">
                      <Image
                        src={normalizeMediaUrl(iconMedia.url)}
                        alt="Icon"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(iconMedia.id)}
                        disabled={actioningId === `media-${iconMedia.id}`}
                        className="absolute inset-0 flex items-center justify-center bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity font-monterat-tipis text-xs font-semibold text-white rounded-2xl"
                      >
                        {actioningId === `media-${iconMedia.id}`
                          ? "..."
                          : "Hapus"}
                      </button>
                    </div>
                  ) : (
                    <span className="font-monterat-tipis text-stone-600 text-xs text-center px-2">
                      Belum ada icon
                    </span>
                  )}
                </div>
                <label className="flex flex-col justify-center gap-1 cursor-pointer">
                  <span className="font-monterat-tipis text-[13px] font-semibold text-stone-600">
                    Pilih gambar
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="font-monterat-tipis text-sm text-stone-600 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-stone-200 file:font-semibold file:text-stone-700 hover:file:bg-stone-300"
                    disabled={mediaUploading === "icon"}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMediaUpload("icon", file);
                      e.target.value = "";
                    }}
                  />
                  {mediaUploading === "icon" && (
                    <span className="font-monterat-tipis text-xs text-stone-700">
                      Mengupload...
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <h3 className="font-barlow-bold text-[15px] font-semibold text-stone-800 mb-2">
                Thumbnail
              </h3>
              <p className="font-monterat-tipis text-[13px] text-stone-700 mb-3">
                Maksimal 3 thumbnail. Klik + untuk menambah kotak, lalu upload
                per kotak.
              </p>
              <div className="flex flex-wrap gap-4">
                {Array.from({ length: thumbnailSlotCount }).map((_, i) => {
                  const t = thumbnails[i];
                  return (
                    <div
                      key={t ? t.id : `empty-thumb-${i}`}
                      className="w-32 h-32 flex-shrink-0 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/80 overflow-hidden flex flex-col items-center justify-center"
                    >
                      {t ? (
                        <div className="relative w-full h-full group">
                          <Image
                            src={normalizeMediaUrl(t.url)}
                            alt={`Thumbnail ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteMedia(t.id)}
                            disabled={actioningId === `media-${t.id}`}
                            className="absolute inset-0 flex items-center justify-center bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity font-monterat-tipis text-xs font-semibold text-white rounded-2xl"
                          >
                            {actioningId === `media-${t.id}` ? "..." : "Hapus"}
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={mediaUploading === "thumbnail"}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleMediaUpload("thumbnail", file);
                              e.target.value = "";
                            }}
                          />
                          {mediaUploading === "thumbnail" ? (
                            <span className="font-monterat-tipis text-xs text-stone-700">
                              Upload...
                            </span>
                          ) : (
                            <>
                              <svg
                                className="w-8 h-8 text-stone-300 mb-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                                />
                              </svg>
                              <span className="font-monterat-tipis text-[11px] text-stone-600 text-center">
                                Upload
                              </span>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  );
                })}
                {thumbnailSlotCount < 3 && (
                  <button
                    type="button"
                    onClick={() =>
                      setThumbnailSlotCount((c) => Math.min(3, c + 1))
                    }
                    className="w-32 h-32 flex-shrink-0 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 hover:border-stone-300 transition-colors flex flex-col items-center justify-center gap-1 text-stone-700 hover:text-stone-900"
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="font-monterat-tipis text-xs font-semibold">
                      + Thumbnail
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Gallery */}
            <div>
              <h3 className="font-barlow-bold text-[15px] font-semibold text-stone-800 mb-2">
                Gallery
              </h3>
              <p className="font-monterat-tipis text-[13px] text-stone-700 mb-3 leading-relaxed">
                Gambar gallery. Klik + untuk menambah kotak, lalu upload per
                kotak.
              </p>
              <div className="flex flex-wrap gap-4">
                {galleryMedia.map((m) => (
                  <div
                    key={m.id}
                    className="w-32 h-32 flex-shrink-0 rounded-2xl border border-stone-200 bg-stone-50/80 overflow-hidden relative group"
                  >
                    <Image
                      src={normalizeMediaUrl(m.url)}
                      alt="Gallery"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(m.id)}
                      disabled={actioningId === `media-${m.id}`}
                      className="absolute inset-0 flex items-center justify-center bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity font-monterat-tipis text-xs font-semibold text-white rounded-2xl"
                    >
                      {actioningId === `media-${m.id}` ? "..." : "Hapus"}
                    </button>
                  </div>
                ))}
                {Array.from({ length: galleryEmptySlots }).map((_, i) => (
                  <label
                    key={`gallery-slot-${i}`}
                    className="w-32 h-32 flex-shrink-0 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/80 hover:bg-stone-100/80 hover:border-stone-300 transition-colors flex flex-col items-center justify-center cursor-pointer"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={mediaUploading === "gallery"}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleMediaUpload("gallery", file);
                        e.target.value = "";
                      }}
                    />
                    {mediaUploading === "gallery" ? (
                      <span className="font-monterat-tipis text-xs text-stone-700">
                        Upload...
                      </span>
                    ) : (
                      <>
                        <svg
                          className="w-8 h-8 text-stone-300 mb-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                          />
                        </svg>
                        <span className="font-monterat-tipis text-[11px] text-stone-600">
                          Upload
                        </span>
                      </>
                    )}
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setGalleryEmptySlots((c) => c + 1)}
                  className="w-32 h-32 flex-shrink-0 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 hover:border-stone-300 transition-colors flex flex-col items-center justify-center gap-1 text-stone-700 hover:text-stone-900"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="font-monterat-tipis text-xs font-semibold">
                    + Gallery
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

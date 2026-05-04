import type { CategoryJasa } from "@/api/jasa/categories";
import type { CreateServiceForm } from "@/api/jasa/services";

type ServiceFormProps = {
  form: Omit<CreateServiceForm, "base_price"> & { base_price: string };
  formError: string;
  submitting: boolean;
  thumbnailSlots: (File | null)[];
  gallerySlots: (File | null)[];
  selectedCategory: CategoryJasa | null;
  selectedCategoryId: number | null;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  setIconFile: (file: File | null) => void;
  setThumbnailAt: (index: number, file: File | null) => void;
  setGalleryAt: (index: number, file: File | null) => void;
  addThumbnailSlot: () => void;
  addGallerySlot: () => void;
  onCancel: () => void;
};

export function ServiceForm({
  form,
  formError,
  submitting,
  thumbnailSlots,
  gallerySlots,
  selectedCategory,
  selectedCategoryId,
  onChange,
  onSubmit,
  setIconFile,
  setThumbnailAt,
  setGalleryAt,
  addThumbnailSlot,
  addGallerySlot,
  onCancel,
}: ServiceFormProps) {
  return (
    <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h2 className="font-barlow-bold text-lg font-bold text-stone-900 mb-4">
          Service Baru
        </h2>
        {formError && (
          <div
            role="alert"
            className="font-monterat-tipis mb-4 flex items-start gap-3 rounded-2xl bg-red-50/90 border border-red-100 px-4 py-3 text-sm font-medium text-red-800"
          >
            <span className="flex-shrink-0 mt-0.5 text-red-500" aria-hidden>
              ●
            </span>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* kategori fixed */}
          <div>
            <label className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-1.5">
              Kategori
            </label>
            <div className="font-monterat-tipis w-full min-h-[46px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 flex items-center text-[15px] font-medium text-stone-900">
              {selectedCategory?.name ?? `Kategori #${selectedCategoryId}`}
            </div>
          </div>

          <div>
            <label
              htmlFor="svc-name"
              className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-1.5"
            >
              Nama Service
            </label>
            <input
              id="svc-name"
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              required
              maxLength={200}
              placeholder="Contoh: Cetak Brosur A4"
              className="font-monterat-tipis w-full min-h-[46px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 placeholder-stone-400 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
            />
          </div>
          <div>
            <label
              htmlFor="svc-desc"
              className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-1.5"
            >
              Deskripsi
            </label>
            <textarea
              id="svc-desc"
              name="description"
              value={form.description}
              onChange={onChange}
              required
              rows={3}
              placeholder="Deskripsi layanan"
              className="font-monterat-tipis w-full rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-[15px] font-medium text-stone-900 placeholder-stone-400 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 resize-none"
            />
          </div>
          <div>
            <label
              htmlFor="svc-price"
              className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-1.5"
            >
              Harga Dasar (opsional)
            </label>
            <input
              id="svc-price"
              type="number"
              name="base_price"
              min={0}
              step={0.01}
              value={form.base_price}
              onChange={onChange}
              placeholder="0"
              className="font-monterat-tipis w-full min-h-[46px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 placeholder-stone-400 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
            />
          </div>

          <div>
            <label
              htmlFor="svc-duration"
              className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-1.5"
            >
              Durasi per Unit (menit, opsional)
            </label>
            <input
              id="svc-duration"
              type="number"
              name="duration_per_unit"
              min={0}
              step={1}
              value={form.duration_per_unit === 0 ? "" : form.duration_per_unit}
              onChange={onChange}
              placeholder="0"
              className="font-monterat-tipis w-full min-h-[46px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 placeholder-stone-400 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
            />
            <p className="font-monterat-tipis text-[11px] text-stone-400 mt-1">
              Kosongkan jika tidak relevan
            </p>
          </div>
          <div className="space-y-6">
            <span className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-1.5">
              Media
            </span>

            {/* Icon (opsional) */}
            <div>
              <p className="font-monterat-tipis text-[13px] text-stone-700 mb-2">
                Icon (opsional)
              </p>
              <label className="inline-flex items-center gap-2 font-monterat-tipis text-sm text-stone-600 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-stone-200 file:font-semibold file:text-stone-700 hover:file:bg-stone-300"
                  onChange={(e) => setIconFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {/* Thumbnail: wadah kotak, maks 3 */}
            <div>
              <p className="font-monterat-tipis text-[13px] font-semibold text-stone-600 mb-1.5">
                Thumbnail (wajib, maks 3)
              </p>
              <p className="font-monterat-tipis text-[12px] text-stone-700 mb-3">
                Klik kotak untuk upload. Tambah kotak dengan tombol + Thumbnail.
              </p>
              <div className="flex flex-wrap gap-4">
                {thumbnailSlots.map((file, i) => (
                  <div
                    key={i}
                    className="w-28 h-28 flex-shrink-0 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/80 overflow-hidden flex flex-col items-center justify-center"
                  >
                    {file ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setThumbnailAt(i, null)}
                          className="absolute inset-0 flex items-center justify-center bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity font-monterat-tipis text-xs font-semibold text-white rounded-2xl"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setThumbnailAt(i, f);
                            e.target.value = "";
                          }}
                        />
                        <svg
                          className="w-7 h-7 text-stone-300 mb-1"
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
                      </label>
                    )}
                  </div>
                ))}
                {thumbnailSlots.length < 3 && (
                  <button
                    type="button"
                    onClick={addThumbnailSlot}
                    className="w-28 h-28 flex-shrink-0 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 hover:border-stone-300 transition-colors flex flex-col items-center justify-center gap-1 text-stone-700 hover:text-stone-900"
                  >
                    <svg
                      className="w-7 h-7"
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

            {/* Gallery: wadah kotak */}
            <div>
              <p className="font-monterat-tipis text-[13px] font-semibold text-stone-600 mb-1.5">
                Gallery (wajib)
              </p>
              <p className="font-monterat-tipis text-[12px] text-stone-700 mb-3">
                Klik kotak untuk upload. Tambah kotak dengan tombol + Gallery.
              </p>
              <div className="flex flex-wrap gap-4">
                {gallerySlots.map((file, i) => (
                  <div
                    key={i}
                    className="w-28 h-28 flex-shrink-0 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/80 overflow-hidden flex flex-col items-center justify-center"
                  >
                    {file ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setGalleryAt(i, null)}
                          className="absolute inset-0 flex items-center justify-center bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity font-monterat-tipis text-xs font-semibold text-white rounded-2xl"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setGalleryAt(i, f);
                            e.target.value = "";
                          }}
                        />
                        <svg
                          className="w-7 h-7 text-stone-300 mb-1"
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
                      </label>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addGallerySlot}
                  className="w-28 h-28 flex-shrink-0 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 hover:border-stone-300 transition-colors flex flex-col items-center justify-center gap-1 text-stone-700 hover:text-stone-900"
                >
                  <svg
                    className="w-7 h-7"
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
              onClick={onCancel}
              className="font-monterat-tipis min-h-[44px] px-5 rounded-2xl border-2 border-stone-200 text-stone-600 font-semibold text-[15px] hover:bg-stone-50 transition-all"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

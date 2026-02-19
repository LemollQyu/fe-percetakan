"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getServiceById } from "@/api/jasa/services";
import type {
  ServiceJasa,
  ServiceMedia,
  ServiceSpesification,
  ServiceSpesificationValue,
} from "@/api/jasa/services";

function normalizeMediaUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  let t = url.trim();
  if (!t) return t;

  // Jika URL absolut mengandung /static/, gunakan path relatif agar kena rewrite Next.js
  if (t.startsWith("http://") || t.startsWith("https://")) {
    const staticIndex = t.indexOf("/static/");
    if (staticIndex !== -1) return t.substring(staticIndex);
    return t;
  }

  if (t.startsWith("/static/")) return t;

  const staticIndex = t.indexOf("/static/");
  if (staticIndex !== -1) return t.substring(staticIndex);

  if (t.startsWith("static/")) return `/${t}`;

  return t.startsWith("/") ? t : `/${t}`;
}

type MediaWithType = ServiceMedia & { type: string };

function parseSelectOptions(options: unknown): string[] {
  if (Array.isArray(options)) {
    return options
      .map((o) => {
        if (typeof o === "string") return o;
        if (o && typeof o === "object") {
          const maybe = o as { value?: unknown; label?: unknown };
          const v = maybe.value ?? maybe.label;
          if (typeof v === "string") return v;
        }
        return String(o);
      })
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (typeof options === "string") {
    const t = options.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t) as unknown;
      return parseSelectOptions(parsed);
    } catch {
      // fallback: comma separated
      return t
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function formatRupiah(amount: number): string {
  return `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;
}

function buildValuePriceMap(
  values: ServiceSpesificationValue[] | undefined,
): Map<string, number> {
  const m = new Map<string, number>();
  (values ?? []).forEach((v) => {
    const key = String(v.value ?? "");
    if (!key) return;
    m.set(key, Number(v.additional_price ?? 0));
  });
  return m;
}

function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setHeight(el.scrollHeight);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, height };
}

type SpecInputState =
  | { type: "select"; value: string }
  | { type: "boolean"; checked: boolean }
  | { type: "text"; value: string }
  | { type: "number"; value: string };

function SpecItem({
  spec,
  open,
  onToggle,
  state,
  onChange,
}: {
  spec: ServiceSpesification;
  open: boolean;
  onToggle: () => void;
  state: SpecInputState | undefined;
  onChange: (next: SpecInputState) => void;
}) {
  const { ref: innerRef, height } = useMeasuredHeight<HTMLDivElement>();

  const [confirmedNumber, setConfirmedNumber] = useState<string>("");
  const [numberConfirmed, setNumberConfirmed] = useState(false);
  const inputType = String(spec.input_type || "").toLowerCase();
  const isSelect = inputType === "select";
  const isBoolean = inputType === "boolean";
  const isText = inputType === "text";
  const isNumber = inputType === "number";

  const selectOptions = useMemo(
    () => parseSelectOptions(spec.options),
    [spec.options],
  );
  const valuePriceMap = useMemo(
    () => buildValuePriceMap(spec.spesification_value),
    [spec.spesification_value],
  );

  const selectState =
    isSelect && state?.type === "select"
      ? state
      : { type: "select" as const, value: "" };
  const booleanState =
    isBoolean && state?.type === "boolean"
      ? state
      : { type: "boolean" as const, checked: false };
  const textState =
    isText && state?.type === "text"
      ? state
      : { type: "text" as const, value: "" };
  const numberState =
    isNumber && state?.type === "number"
      ? state
      : { type: "number" as const, value: "" };

  const selectedAdditionalPrice = isSelect
    ? Number(valuePriceMap.get(selectState.value) ?? 0)
    : isBoolean
      ? Number(spec.spesification_value?.[0]?.additional_price ?? 0)
      : 0;

  const showPriceSection = isSelect || isBoolean;

  return (
    <li className="border border-stone-100 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-2.5 text-left hover:bg-stone-50/60 transition-colors flex items-start justify-between gap-3"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="font-barlow-bold text-sm text-stone-900">{spec.name}</p>
          <p className="font-monterat-tipis text-[11px] text-stone-500 mt-0.5">
            {spec.input_type} · {spec.is_required ? "Wajib" : "Opsional"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showPriceSection && (
            <>
              {selectState.value != "" ? (
                <span className="font-monterat-tipis text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  {selectState.value}
                </span>
              ) : null}
              {spec.input_type != "boolean" ? (
                <span className="font-monterat-tipis text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  {selectedAdditionalPrice >= 0
                    ? `+${formatRupiah(selectedAdditionalPrice)}`
                    : "Tanpa tambahan"}
                </span>
              ) : null}
              {spec.input_type == "boolean" && booleanState.checked == true ? (
                <span className="font-monterat-tipis text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  {selectedAdditionalPrice >= 0
                    ? `+${formatRupiah(selectedAdditionalPrice)}`
                    : "Tanpa tambahan"}
                </span>
              ) : null}
            </>
          )}
          {spec.input_type === "number" &&
          numberConfirmed &&
          numberState.value !== "" ? (
            <span className="font-monterat-tipis text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
              {numberState.value}
            </span>
          ) : null}

          <svg
            className={`w-4 h-4 text-stone-600 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      <div
        className="overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out"
        style={{
          maxHeight: open ? height : 0,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0px)" : "translateY(-4px)",
        }}
      >
        <div ref={innerRef} className="px-3 pb-3">
          <div className="pt-2.5 border-t border-stone-100">
            {/* Input sesuai type */}
            {isSelect && (
              <div className="space-y-2">
                <label className="font-monterat-tipis block text-[12px] font-semibold text-stone-700">
                  Pilih {spec.name}
                  {spec.is_required ? (
                    <span className="text-red-500"> *</span>
                  ) : null}
                </label>
                <div className="flex gap-3 items-stretch">
                  <select
                    value={selectState.value}
                    onChange={(e) =>
                      onChange({ type: "select", value: e.target.value })
                    }
                    className="font-monterat-tipis flex-1 min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                  >
                    <option value="">
                      {spec.is_required ? "Pilih opsi" : "Tidak memilih"}
                    </option>
                    {selectOptions.map((opt) => {
                      const price = valuePriceMap.get(opt);
                      const priceSuffix =
                        typeof price === "number"
                          ? ` (${price > 0 ? `+${formatRupiah(price)}` : "Rp 0"})`
                          : "";
                      return (
                        <option key={opt} value={opt}>
                          {opt}
                          {priceSuffix}
                        </option>
                      );
                    })}
                  </select>
                  {/* Tampilan value & price di kanan dropdown saat dropdown tertutup */}
                  {/* <div className="font-monterat-tipis min-w-[120px] flex flex-col justify-center rounded-xl border border-stone-200 bg-stone-100/80 px-4 py-2">
                    {selectState.value ? (
                      <>
                        <span
                          className="text-[13px] font-semibold text-stone-800 truncate"
                          title={selectState.value}
                        >
                          {selectState.value}
                        </span>
                        {typeof valuePriceMap.get(selectState.value) ===
                          "number" && (
                          <span className="text-[12px] font-medium text-stone-600">
                            {Number(valuePriceMap.get(selectState.value)) > 0
                              ? `+${formatRupiah(Number(valuePriceMap.get(selectState.value)))}`
                              : formatRupiah(
                                  Number(valuePriceMap.get(selectState.value)),
                                )}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[12px] text-stone-400">—</span>
                    )}
                  </div> */}
                </div>

                {/* Harga per value (tidak muncul untuk text/number) */}
                {(spec.spesification_value ?? []).length > 0 && (
                  <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                    <p className="font-barlow-bold text-[12px] font-semibold text-stone-800 mb-2">
                      Harga per opsi
                    </p>
                    <div className="space-y-1.5">
                      {(spec.spesification_value ?? []).map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="font-monterat-tipis text-[12px] text-stone-700 truncate">
                            {v.value}
                          </span>
                          <span className="font-monterat-tipis text-[12px] font-semibold text-stone-800 flex-shrink-0">
                            {Number(v.additional_price) > 0
                              ? `+${formatRupiah(v.additional_price)}`
                              : formatRupiah(v.additional_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isBoolean && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-monterat-tipis text-[12px] font-semibold text-stone-700">
                      {spec.name}
                      {spec.is_required ? (
                        <span className="text-red-500"> *</span>
                      ) : null}
                    </p>
                    {(spec.spesification_value ?? []).length > 0 && (
                      <p className="font-monterat-tipis text-[11px] text-stone-500 mt-0.5">
                        {Number(
                          spec.spesification_value?.[0]?.additional_price ?? 0,
                        ) > 0
                          ? `Tambahan: +${formatRupiah(spec.spesification_value?.[0]?.additional_price ?? 0)}`
                          : "Tanpa tambahan"}
                      </p>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={booleanState.checked}
                      onChange={(e) =>
                        onChange({ type: "boolean", checked: e.target.checked })
                      }
                    />
                    <span
                      className={`w-12 h-7 rounded-full transition-colors ${
                        booleanState.checked ? "bg-stone-900" : "bg-stone-300"
                      }`}
                      aria-hidden
                    />
                    <span
                      className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                        booleanState.checked ? "translate-x-5" : "translate-x-0"
                      }`}
                      aria-hidden
                    />
                  </label>
                </div>
              </div>
            )}

            {isText && (
              <div className="space-y-2">
                <label className="font-monterat-tipis block text-[12px] font-semibold text-stone-700">
                  {spec.name}
                  {spec.is_required ? (
                    <span className="text-red-500"> *</span>
                  ) : null}
                </label>
                <input
                  type="text"
                  value={textState.value}
                  onChange={(e) =>
                    onChange({ type: "text", value: e.target.value })
                  }
                  placeholder={`Masukkan ${spec.name.toLowerCase()}`}
                  className="font-monterat-tipis w-full min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 placeholder-stone-400 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                />
              </div>
            )}

            {isNumber && (
              <div className="space-y-2">
                <label className="font-monterat-tipis block text-[12px] font-semibold text-stone-700">
                  {spec.name}
                  {spec.is_required ? (
                    <span className="text-red-500"> *</span>
                  ) : null}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={numberState.value}
                    onChange={(e) => {
                      setNumberConfirmed(false);
                      onChange({ type: "number", value: e.target.value });
                    }}
                    placeholder={`Masukkan ${spec.name.toLowerCase()}`}
                    className="font-monterat-tipis w-full min-h-[44px] rounded-xl border border-stone-200 bg-stone-50/80 pl-4 pr-16 text-[15px] font-medium text-stone-900 placeholder-stone-400 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                  />
                  <button
                    type="button"
                    onClick={() => setNumberConfirmed(true)}
                    className="font-monterat-tipis absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-stone-900 text-white text-[12px] font-semibold hover:bg-stone-700 active:scale-95 transition-all"
                  >
                    Oke
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const id = Number(params?.id);

  const [orderSheetOpen, setOrderSheetOpen] = useState(false);

  const [service, setService] = useState<ServiceJasa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  const [openSpecId, setOpenSpecId] = useState<number | null>(null);
  const [specInputs, setSpecInputs] = useState<Record<number, SpecInputState>>(
    {},
  );

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError("Layanan tidak ditemukan.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchService() {
      setLoading(true);
      setError(null);
      try {
        const res = await getServiceById(id);
        if (cancelled) return;
        const data = res.data ?? null;
        setService(data);

        const mediaList = (data?.media ?? []) as MediaWithType[];
        const galleries = mediaList.filter((m) => m.type === "gallery");
        const thumbnails = mediaList.filter((m) => m.type === "thumbnail");
        const first = galleries[0]?.url ?? thumbnails[0]?.url ?? null;
        setActiveUrl(first ? normalizeMediaUrl(first) : null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Gagal memuat layanan.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchService();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const media = useMemo(() => {
    const list = (service?.media ?? []) as MediaWithType[];
    const galleries = list.filter(
      (m) => String(m.type).toLowerCase() === "gallery",
    );
    const thumbnails = list.filter(
      (m) => String(m.type).toLowerCase() === "thumbnail",
    );
    return {
      galleries,
      thumbnails,
    };
  }, [service?.media]);

  const allImages = useMemo(() => {
    const urls: string[] = [];
    media.galleries.forEach((m) => {
      if (m.url) urls.push(normalizeMediaUrl(m.url));
    });
    media.thumbnails.forEach((m) => {
      if (m.url) urls.push(normalizeMediaUrl(m.url));
    });
    return urls;
  }, [media.galleries, media.thumbnails]);

  const currentImage = activeUrl ?? allImages[0] ?? null;
  const currentIndex = currentImage ? allImages.indexOf(currentImage) : -1;
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  if (loading) {
    return (
      <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-24">
        <div className="flex items-center justify-center py-24">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
        </div>
      </main>
    );
  }

  if (error || !service) {
    return (
      <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-24">
        <div className="space-y-4">
          <Link
            href={`/category/${slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-stone-900"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Kembali ke kategori
          </Link>
          <p className="font-monterat-tipis text-red-600">
            {error ?? "Layanan tidak ditemukan."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-24">
      <div className="space-y-6">
        {/* Header back + title */}
        <div className="flex items-center gap-3">
          <Link
            href={`/category/${slug}`}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-stone-200 bg-white/80 hover:bg-stone-50 active:scale-95 transition-all shrink-0"
            aria-label="Kembali ke kategori"
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
          <div className="min-w-0">
            <h1 className="font-barlow-bold text-lg font-bold text-stone-900 truncate">
              {service.name}
            </h1>
            {service.slug && (
              <p className="font-monterat-tipis text-xs text-stone-500 mt-0.5 truncate">
                /{service.slug}
              </p>
            )}
          </div>
        </div>

        {/* Media layout: gallery (kiri), main, thumbnail (bawah) */}
        <section className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 p-4">
          <div className="flex flex-row gap-3">
            {/* List gallery: atas ke bawah (type=gallery) */}
            <div className="flex flex-col gap-2 w-14">
              {media.galleries.map((m) => {
                const url = m.url ? normalizeMediaUrl(m.url) : "";
                if (!url) return null;
                const isActive = url === currentImage;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveUrl(url)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden border transition-all ${
                      isActive
                        ? "border-stone-900 ring-2 ring-stone-900/60"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <img
                      src={url}
                      alt="Gallery"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>

            {/* Main image */}
            <div className="flex-1">
              <div className="relative w-full aspect-[1/1] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-barlow-bold text-stone-500 text-2xl">
                      {service.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                )}

                {/* Dot navigation di atas gambar, jumlah sesuai semua media */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-2 left-3 flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {allImages.map((url, idx) => {
                      const active = idx === safeIndex;
                      return (
                        <button
                          key={url + idx}
                          type="button"
                          onClick={() => setActiveUrl(url)}
                          className={`transition-all rounded-full ${
                            active
                              ? "w-2 h-2 bg-white"
                              : "w-2 h-2 bg-white/60 hover:bg-white/90"
                          }`}
                          aria-label={`Lihat gambar ${idx + 1}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Thumbnails bawah: kiri ke kanan (type=thumbnail) */}
              {media.thumbnails.length > 0 && (
                <div className="mt-3 flex flex-row gap-2 overflow-x-auto pb-1">
                  {media.thumbnails.map((m) => {
                    const url = m.url ? normalizeMediaUrl(m.url) : "";
                    if (!url) return null;
                    const isActive = url === currentImage;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setActiveUrl(url)}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0 transition-all ${
                          isActive
                            ? "border-stone-900 ring-2 ring-stone-900/60"
                            : "border-stone-200 hover:border-stone-400"
                        }`}
                      >
                        <img
                          src={url}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Detail layanan */}
        <section className="space-y-4">
          {service.description && (
            <div className="rounded-2xl bg-white border border-stone-100 shadow-sm shadow-stone-200/30 p-4">
              <h2 className="font-barlow-bold text-sm font-semibold text-stone-900 mb-1.5">
                Deskripsi
              </h2>
              <p className="font-monterat-tipis text-sm text-stone-700 leading-relaxed">
                {service.description}
              </p>
            </div>
          )}

          {(service.base_price ?? 0) > 0 && (
            <div className="rounded-2xl bg-white border border-stone-100 shadow-sm shadow-stone-200/30 p-4">
              <h2 className="font-barlow-bold text-sm font-semibold text-stone-900 mb-1.5">
                Harga Dasar
              </h2>
              <p className="font-monterat-tipis text-sm text-stone-800">
                Rp {Number(service.base_price).toLocaleString("id-ID")}
              </p>
            </div>
          )}

          {Array.isArray(service.spesification) &&
            service.spesification.filter((s) => s.is_active).length > 0 && (
              <div className="rounded-2xl bg-white border border-stone-100 shadow-sm shadow-stone-200/30 p-4">
                <h2 className="font-barlow-bold text-sm font-semibold text-stone-900 mb-2">
                  Spesifikasi
                </h2>
                <ul className="space-y-2">
                  {service.spesification
                    .filter((s) => s.is_active)
                    .map((spec) => (
                      <SpecItem
                        key={spec.id}
                        spec={spec}
                        open={openSpecId === spec.id}
                        onToggle={() =>
                          setOpenSpecId((p) => (p === spec.id ? null : spec.id))
                        }
                        state={specInputs[spec.id]}
                        onChange={(next) =>
                          setSpecInputs((p) => ({ ...p, [spec.id]: next }))
                        }
                      />
                    ))}
                </ul>
              </div>
            )}
        </section>
      </div>
      {service && (
        <>
          <FloatingOrderButton
            basePrice={Number(service.base_price ?? 0)}
            specifications={service.spesification ?? []}
            specInputs={specInputs}
            onClick={() => setOrderSheetOpen(true)}
          />
          <OrderSummarySheet
            open={orderSheetOpen}
            onClose={() => setOrderSheetOpen(false)}
            serviceName={service.name}
            basePrice={Number(service.base_price ?? 0)}
            specifications={service.spesification ?? []}
            specInputs={specInputs}
          />
        </>
      )}
    </main>
  );
}

// ============================================================
// OrderSummarySheet Component
// ============================================================

interface OrderItem {
  specName: string;
  displayValue: string;
  additionalPrice: number;
}

interface OrderSummarySheetProps {
  open: boolean;
  onClose: () => void;
  serviceName: string;
  basePrice: number;
  specifications: ServiceSpesification[];
  specInputs: Record<number, SpecInputState>;
}

function OrderSummarySheet({
  open,
  onClose,
  serviceName,
  basePrice,
  specifications,
  specInputs,
}: OrderSummarySheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const { orderItems, subtotalBeforeQty, qtySpecName, qtyValue, grandTotal } =
    calcOrder(basePrice, specifications, specInputs);

  const hasQty = qtyValue > 0;

  if (!rendered) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={handleBackdropClick}
      style={{
        background: visible ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
        transition: "background 0.35s ease",
        backdropFilter: visible ? "blur(2px)" : "blur(0px)",
      }}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-[430px] bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-stone-300" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-barlow-bold text-base font-bold text-stone-900">
                Ringkasan Pesanan
              </h2>
              <p className="font-monterat-tipis text-xs text-stone-500 mt-0.5">
                {serviceName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all"
              aria-label="Tutup"
            >
              <svg
                className="w-4 h-4 text-stone-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Harga Dasar */}
          <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-stone-50 border border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-stone-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
                  />
                </svg>
              </div>
              <span className="font-monterat-tipis text-[13px] font-semibold text-stone-800">
                Harga Dasar
              </span>
            </div>
            <span className="font-monterat-tipis text-[13px] font-bold text-stone-900">
              {formatRupiah(basePrice)}
            </span>
          </div>

          {/* Spesifikasi (select + boolean + text) */}
          {orderItems.length > 0 && (
            <div className="space-y-2">
              <p className="font-barlow-bold text-[11px] font-semibold text-stone-500 uppercase tracking-wider px-1">
                Spesifikasi
              </p>
              {orderItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 py-2.5 px-3 rounded-xl bg-white border border-stone-100"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="font-barlow-bold text-[11px] font-bold text-stone-600">
                        {item.specName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-monterat-tipis text-[11px] text-stone-500">
                        {item.specName}
                      </p>
                      <p className="font-monterat-tipis text-[13px] font-semibold text-stone-900 truncate">
                        {item.displayValue}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {item.additionalPrice > 0 ? (
                      <span className="font-monterat-tipis text-[12px] font-bold text-stone-800">
                        +{formatRupiah(item.additionalPrice)}
                      </span>
                    ) : (
                      <span className="font-monterat-tipis text-[12px] text-stone-400">
                        —
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kosong */}
          {orderItems.length === 0 && !hasQty && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="font-monterat-tipis text-sm text-stone-500">
                Belum ada spesifikasi dipilih
              </p>
            </div>
          )}

          {/* Baris perkalian — ditampilkan sebelum grand total */}
          <div className="pt-1 space-y-2 border-t border-dashed border-stone-200">
            {/* Subtotal per unit */}
            <div className="flex items-center justify-between px-1 pt-2">
              <span className="font-monterat-tipis text-[12px] text-stone-500">
                Subtotal (per unit)
              </span>
              <span className="font-monterat-tipis text-[12px] font-semibold text-stone-700">
                {formatRupiah(subtotalBeforeQty)}
              </span>
            </div>

            {/* Jumlah (type number) */}
            {hasQty && (
              <div className="flex items-center justify-between px-1">
                <span className="font-monterat-tipis text-[12px] text-stone-500">
                  {qtySpecName}
                </span>
                <span className="font-monterat-tipis text-[12px] font-semibold text-stone-700">
                  × {qtyValue}
                </span>
              </div>
            )}

            {/* Box kalkulasi */}
            {hasQty && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-100 border border-stone-200">
                <span className="font-monterat-tipis text-[11px] text-stone-500">
                  {formatRupiah(subtotalBeforeQty)} × {qtyValue}
                </span>
                <span className="font-monterat-tipis text-[13px] font-bold text-stone-800">
                  = {formatRupiah(grandTotal)}
                </span>
              </div>
            )}

            {/* Grand Total */}
            <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-stone-900">
              <div>
                <span className="font-barlow-bold text-sm font-bold text-white">
                  Total
                </span>
                {hasQty && (
                  <p className="font-monterat-tipis text-[10px] text-stone-400 mt-0.5">
                    {formatRupiah(subtotalBeforeQty)} × {qtyValue} {qtySpecName}
                  </p>
                )}
              </div>
              <span className="font-barlow-bold text-lg font-bold text-white">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-8 pt-3 shrink-0 border-t border-stone-100">
          <button
            type="button"
            className="w-full h-[52px] rounded-2xl bg-stone-900 text-white font-barlow-bold text-[15px] font-bold hover:bg-stone-700 active:scale-[0.98] transition-all shadow-lg shadow-stone-900/20"
            onClick={() => {
              // TODO: hubungkan ke proses checkout
              alert("Lanjut ke pembayaran!");
            }}
          >
            Lanjut ke Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Kalkulasi terpusat ----
interface OrderItem {
  specName: string;
  displayValue: string;
  additionalPrice: number;
}

interface CalcResult {
  orderItems: OrderItem[];
  totalAdditional: number;
  subtotalBeforeQty: number;
  qtyMultiplier: number;
  qtySpecName: string;
  qtyValue: number;
  grandTotal: number;
}

function calcOrder(
  basePrice: number,
  specifications: ServiceSpesification[],
  specInputs: Record<number, SpecInputState>,
): CalcResult {
  const orderItems: OrderItem[] = [];
  let totalAdditional = 0;
  let qtyMultiplier = 1;
  let qtySpecName = "";
  let qtyValue = 0;

  specifications
    .filter((s) => s.is_active)
    .forEach((spec) => {
      const state = specInputs[spec.id];
      if (!state) return;

      const inputType = String(spec.input_type || "").toLowerCase();
      const valuePriceMap = buildValuePriceMap(spec.spesification_value);

      if (inputType === "select" && state.type === "select" && state.value) {
        const addPrice = Number(valuePriceMap.get(state.value) ?? 0);
        totalAdditional += addPrice;
        orderItems.push({
          specName: spec.name,
          displayValue: state.value,
          additionalPrice: addPrice,
        });
      } else if (
        inputType === "boolean" &&
        state.type === "boolean" &&
        state.checked
      ) {
        const addPrice = Number(
          spec.spesification_value?.[0]?.additional_price ?? 0,
        );
        totalAdditional += addPrice;
        orderItems.push({
          specName: spec.name,
          displayValue: "Ya",
          additionalPrice: addPrice,
        });
      } else if (inputType === "text" && state.type === "text" && state.value) {
        orderItems.push({
          specName: spec.name,
          displayValue: state.value,
          additionalPrice: 0,
        });
      } else if (
        inputType === "number" &&
        state.type === "number" &&
        state.value
      ) {
        // type number = pengali, bukan tambahan
        const qty = Number(state.value) || 1;
        qtyMultiplier = qty;
        qtySpecName = spec.name;
        qtyValue = qty;
      }
    });

  const subtotalBeforeQty = basePrice + totalAdditional;
  const grandTotal = subtotalBeforeQty * qtyMultiplier;

  return {
    orderItems,
    totalAdditional,
    subtotalBeforeQty,
    qtyMultiplier,
    qtySpecName,
    qtyValue,
    grandTotal,
  };
}

interface FloatingOrderButtonProps {
  basePrice: number;
  specifications: ServiceSpesification[];
  specInputs: Record<number, SpecInputState>;
  onClick: () => void;
}

function FloatingOrderButton({
  basePrice,
  specifications,
  specInputs,
  onClick,
}: FloatingOrderButtonProps) {
  const { grandTotal, qtyValue, qtySpecName, subtotalBeforeQty, orderItems } =
    calcOrder(basePrice, specifications, specInputs);

  const hasQty = qtyValue > 0;
  const filledCount = orderItems.length + (hasQty ? 1 : 0);

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-6 pt-3 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent pointer-events-none z-40">
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto w-full h-[56px] rounded-2xl bg-stone-900 text-white flex items-center justify-between px-5 hover:bg-stone-800 active:scale-[0.98] transition-all shadow-xl shadow-stone-900/25"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 8m12-8l2 8M9 21h6"
              />
            </svg>
            {filledCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-stone-900 text-[9px] font-bold flex items-center justify-center leading-none">
                {filledCount}
              </span>
            )}
          </div>
          <span className="font-barlow-bold text-[14px] font-bold">
            Lihat Pesanan
          </span>
        </div>
        <div className="text-right">
          <p className="font-barlow-bold text-[15px] font-bold">
            {formatRupiah(grandTotal)}
          </p>
          {hasQty && (
            <p className="font-monterat-tipis text-[10px] text-stone-400 -mt-0.5">
              {formatRupiah(subtotalBeforeQty)} × {qtyValue} {qtySpecName}
            </p>
          )}
        </div>
      </button>
    </div>
  );
}

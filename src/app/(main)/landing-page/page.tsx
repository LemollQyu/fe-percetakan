"use client";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { getCategoriesList } from "@/api/jasa/categories";
import type { CategoryJasa } from "@/api/jasa/categories";
import { getServicesList } from "@/api/jasa/services";
import type { ServiceJasa } from "@/api/jasa/services/types";
import Link from "next/link";
import Footer from "@/components/Footer";

// ─── Skeleton Components ──────────────────────────────────────────────────────

function ServiceCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden bg-white w-full animate-pulse"
      style={{
        border: "1px solid #ede3d9",
        boxShadow: "0 2px 12px 0 rgba(180,120,80,0.07)",
      }}
    >
      <div className="w-full aspect-[4/3] p-2.5">
        <div className="w-full h-full rounded-xl bg-[#f0e9e1]" />
      </div>
      <div className="px-3 py-2.5 flex flex-col gap-2">
        <div className="h-3 bg-[#ede3d9] rounded-full w-4/5" />
        <div className="h-2.5 bg-[#ede3d9] rounded-full w-2/5" />
      </div>
    </div>
  );
}

function normalizeUrl(url: string): string {
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

// ─── Sketchy Underline ────────────────────────────────────────────────────────
// Panjang path SVG (viewBox 0 0 48 8), diukur pakai getTotalLength ≈ 48.
// Kita hardcode supaya tidak perlu ref DOM.
const PATH_LENGTH = 90;

function SketchyUnderline({ active }: { active: boolean }) {
  // Setiap kali `active` jadi true, trigger ulang animasi
  const [key, setKey] = useState(0);
  const prevActive = useRef(false);

  useEffect(() => {
    if (active && !prevActive.current) {
      setKey((k) => k + 1); // reset animasi
    }
    prevActive.current = active;
  }, [active]);

  return (
    <svg
      aria-hidden="true"
      key={key}
      style={{
        position: "absolute",
        bottom: -6,
        left: "50%",
        transform: "translateX(-50%)",
        overflow: "visible",
        opacity: active ? 1 : 0,
        // fade-out saat non-aktif, tapi animasi draw saat aktif
        transition: active ? "opacity 0.1s" : "opacity 0.25s ease",
        color: "#C0392B",
        filter: "drop-shadow(0 1px 2px rgba(192,57,43,0.25))",
        pointerEvents: "none",
      }}
      width="60"
      height="8"
      viewBox="0 0 48 8"
      fill="none"
    >
      {/* Coretan utama — draw dari kiri ke kanan */}
      <path
        d="M1 5 C6 3, 12 7, 20 4.5 C28 2, 36 7, 47 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        style={
          active
            ? {
                strokeDasharray: PATH_LENGTH,
                strokeDashoffset: 0,
                animation: `drawLine 0.38s cubic-bezier(0.4,0,0.2,1) forwards`,
              }
            : {
                strokeDasharray: PATH_LENGTH,
                strokeDashoffset: PATH_LENGTH,
              }
        }
      />
      {/* Coretan kedua tipis — sedikit delay */}
      <path
        d="M2 6.5 C10 5, 22 8, 34 5.5 C40 4, 45 6, 47 5.5"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeOpacity="0.45"
        fill="none"
        style={
          active
            ? {
                strokeDasharray: PATH_LENGTH,
                strokeDashoffset: 0,
                animation: `drawLine 0.38s 0.08s cubic-bezier(0.4,0,0.2,1) forwards`,
              }
            : {
                strokeDasharray: PATH_LENGTH,
                strokeDashoffset: PATH_LENGTH,
              }
        }
      />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const [categories, setCategories] = useState<CategoryJasa[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [services, setServices] = useState<ServiceJasa[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const [currentImage, setCurrentImage] = useState<string>("");
  const [nextImage, setNextImage] = useState<string>("");
  const [fadeIn, setFadeIn] = useState(true);

  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      setTime(`${h12}:${minutes} ${ampm}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getCategoriesList()
      .then((res) => {
        const active = res.data.filter((c) => c.is_active);
        setCategories(active);
      })
      .catch(console.error)
      .finally(() => setCategoriesLoading(false));
  }, []);

  const fetchServices = useCallback(async (categoryId: number) => {
    setServicesLoading(true);
    try {
      const res = await getServicesList({ limit: 20 });
      const filtered = res.data.filter(
        (s) => s.category_id === categoryId && s.is_active,
      );
      setServices(filtered);
    } catch (err) {
      console.error(err);
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;
    fetchServices(categories[activeIndex].id);
  }, [activeIndex, categories, fetchServices]);

  const navigate = (direction: "prev" | "next") => {
    if (animating || categories.length === 0) return;
    setAnimating(true);

    const newIndex =
      direction === "next"
        ? (activeIndex + 1) % categories.length
        : (activeIndex - 1 + categories.length) % categories.length;

    setRotation((r) => r + (direction === "next" ? 180 : -180));

    const newImg = categories[newIndex]?.meta?.icon ?? "/photo/printing1.webp";
    setNextImage(newImg);
    setFadeIn(false);

    setTimeout(() => {
      setCurrentImage(newImg);
      setFadeIn(true);
      setActiveIndex(newIndex);
      setAnimating(false);
    }, 400);
  };

  const half = 2;
  const visibleItems =
    categories.length > 0
      ? Array.from(
          { length: Math.min(5, categories.length * 2 + 1) },
          (_, i) => {
            const offset = i - half;
            const index =
              (activeIndex + offset + categories.length) % categories.length;
            return { ...categories[index], offset };
          },
        )
      : [];

  const heroImage =
    currentImage ||
    categories[activeIndex]?.meta?.icon ||
    "/photo/printing1.webp";
  const heroNext =
    nextImage || categories[activeIndex]?.meta?.icon || "/photo/printing2.webp";

  const activeLabel = categoriesLoading
    ? "Memuat..."
    : (categories[activeIndex]?.name ?? "");

  return (
    <div
      className="w-full pb-2"
      style={{ background: "#f5f0eb", minHeight: "100vh" }}
    >
      {/* Inject keyframes sekali di sini */}
      <style>{`
        @keyframes drawLine {
          from { stroke-dashoffset: ${PATH_LENGTH}; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* ── Navbar ── */}
      <header
        className="w-full py-5 px-8 flex flex-col items-center gap-1"
        style={{
          background: "linear-gradient(135deg, #2C1810 0%, #4a2518 100%)",
          boxShadow: "0 2px 20px 0 rgba(44,24,16,0.18)",
        }}
      >
        <div
          className="w-16 h-0.5 rounded-full mb-2"
          style={{
            background:
              "linear-gradient(90deg, transparent, #D4A574, transparent)",
          }}
        />
        <Link
          href="/"
          className="text-2xl font-bold tracking-widest uppercase"
          style={{
            color: "#F5E6D0",
            letterSpacing: "0.18em",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            textShadow: "0 1px 8px rgba(212,165,116,0.3)",
          }}
        >
          Nabila Fotocopy
        </Link>
        <div
          className="w-8 h-px mt-2"
          style={{ background: "#C0392B", opacity: 0.7 }}
        />
        <p
          className="text-xs tracking-widest mt-1"
          style={{
            color: "#D4A574",
            fontFamily: "'Georgia', serif",
            letterSpacing: "0.2em",
            opacity: 0.85,
          }}
        >
          {time}
        </p>
      </header>

      {/* ── Hero Section ── */}
      <div className="relative w-full h-[300px] overflow-hidden">
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(44,24,16,0.22) 0%, rgba(44,24,16,0.08) 60%, rgba(44,24,16,0.35) 100%)",
          }}
        />
        <Image
          src={normalizeUrl(heroImage)}
          fill
          className="object-cover"
          alt="Hero"
          priority
          style={{
            opacity: fadeIn ? 1 : 0,
            transition: "opacity 0.4s ease",
            transform: "scale(1.03)",
          }}
        />
        <Image
          src={normalizeUrl(heroNext)}
          fill
          className="object-cover"
          alt="Hero Next"
          style={{ zIndex: -1, transform: "scale(1.03)" }}
        />

        {/* Half Circle */}
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-72 h-36 flex flex-col items-center justify-center gap-1 overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #fff 70%, #fdf3ec 100%)",
            borderRadius: "9999px 9999px 0 0",
            boxShadow: "0 -4px 32px 0 rgba(192,57,43,0.13), 0 -1px 0 0 #ede3d9",
            zIndex: 20,
          }}
        >
          <div
            className="absolute inset-0 rounded-t-full"
            style={{
              background:
                "radial-gradient(ellipse at 50% 120%, rgba(192,57,43,0.09) 0%, transparent 70%)",
              transform: `rotate(${rotation}deg)`,
              transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
              transformOrigin: "50% 100%",
            }}
          />
          <p
            className="relative text-base font-semibold leading-tight text-center px-6 transition-all duration-300"
            style={{
              color: "#2C1810",
              fontFamily: "'Georgia', serif",
              letterSpacing: "0.04em",
              transform: animating
                ? "scale(0.88) translateY(4px)"
                : "scale(1) translateY(0)",
              opacity: animating ? 0.4 : 1,
            }}
          >
            {activeLabel}
          </p>
          <svg
            className="relative mt-1"
            style={{
              color: "#C0392B",
              transform: `rotate(${rotation}deg)`,
              transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
              filter: "drop-shadow(0 1px 3px rgba(192,57,43,0.3))",
            }}
            width="28"
            height="20"
            viewBox="0 0 28 20"
            fill="none"
          >
            <path
              d="M2 6 C8 6, 16 18, 26 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M21 10 L26 14 L20 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ── Menu Carousel ── */}
      <div
        className="w-full relative flex items-center justify-center py-5 bg-[#f5f0eb] overflow-hidden"
        style={{ borderBottom: "1px solid #ede3d9" }}
      >
        {/* Fade edges */}
        <div
          className="absolute left-0 top-0 h-full w-28 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, #F5EDE2 15%, transparent 100%)",
          }}
        />
        <div
          className="absolute right-0 top-0 h-full w-28 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to left, #F5EDE2 15%, transparent 100%)",
          }}
        />

        {/* Prev button */}
        <button
          onClick={() => navigate("prev")}
          disabled={categoriesLoading || categories.length <= 1}
          className="absolute left-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30"
          style={{
            background: "#fff",
            border: "1px solid #ede3d9",
            boxShadow: "0 2px 8px rgba(44,24,16,0.08)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fdf3ec")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8l4-4"
              stroke="#4a2518"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Items */}
        <div className="flex items-center gap-7 px-16">
          {categoriesLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="animate-pulse h-3 rounded-full"
                  style={{
                    background: "#ddd0c4",
                    width: i === 2 ? 80 : 56,
                    opacity: i === 2 ? 1 : i === 1 || i === 3 ? 0.5 : 0.2,
                  }}
                />
              ))
            : visibleItems.map(({ id, name, offset }) => {
                const isActive = offset === 0;
                const absOffset = Math.abs(offset);
                const opacity =
                  absOffset === 0 ? 1 : absOffset === 1 ? 0.45 : 0.18;

                return (
                  <span
                    key={`${id}-${offset}`}
                    className="relative whitespace-nowrap cursor-default select-none inline-flex flex-col items-center"
                    style={{
                      opacity,
                      fontWeight: isActive ? 700 : 400,
                      fontSize: isActive ? "1rem" : "0.82rem",
                      color: isActive ? "#2C1810" : "#8a6a56",
                      letterSpacing: isActive ? "0.04em" : "0",
                      transform: isActive ? "scale(1.08)" : "scale(1)",
                      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  >
                    {name}
                    <SketchyUnderline active={isActive} />
                  </span>
                );
              })}
        </div>

        {/* Next button */}
        <button
          onClick={() => navigate("next")}
          disabled={categoriesLoading || categories.length <= 1}
          className="absolute right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30"
          style={{
            background: "#fff",
            border: "1px solid #ede3d9",
            boxShadow: "0 2px 8px rgba(44,24,16,0.08)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fdf3ec")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4l4 4-4 4"
              stroke="#4a2518"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* ── Service Cards ── */}
      <div
        className="w-full px-5 pb-20 mb-6 pt-7"
        style={{ background: "#f5f0eb" }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
          {servicesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))
          ) : services.length > 0 ? (
            services.map((service) => {
              const thumb =
                service.media?.find((m) => m.type === "thumbnail")?.url ??
                service.media?.[0]?.url ??
                "/photo/printing1.webp";

              return (
                <Link
                  key={service.id}
                  href={`/landing-page/service/${service.id}`}
                  className="flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-white w-full transition-all duration-300"
                  style={{
                    border: "1px solid #ede3d9",
                    boxShadow: "0 2px 10px 0 rgba(180,120,80,0.07)",
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.boxShadow =
                      "0 8px 28px 0 rgba(192,57,43,0.14)";
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.boxShadow =
                      "0 2px 10px 0 rgba(180,120,80,0.07)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div className="relative w-full aspect-[4/3] p-2">
                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                      <Image
                        src={normalizeUrl(thumb)}
                        fill
                        className="object-cover"
                        alt={service.name}
                      />
                      <span
                        className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full"
                        style={{ background: "#C0392B", opacity: 0.65 }}
                      />
                      <span
                        className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                        style={{ background: "#C0392B", opacity: 0.65 }}
                      />
                      <span
                        className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full"
                        style={{ background: "#C0392B", opacity: 0.65 }}
                      />
                      <span
                        className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                        style={{ background: "#C0392B", opacity: 0.65 }}
                      />
                    </div>
                  </div>
                  <div
                    className="px-3 py-2.5 flex flex-col gap-1"
                    style={{ borderTop: "1px solid #f5ede4" }}
                  >
                    <p
                      className="text-sm font-semibold leading-snug line-clamp-2"
                      style={{
                        color: "#2C1810",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {service.name}
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "#C0392B", letterSpacing: "0.01em" }}
                    >
                      {service.base_price > 0
                        ? `Rp ${service.base_price.toLocaleString("id-ID")}`
                        : "Hubungi kami"}
                    </p>
                  </div>
                </Link>
              );
            })
          ) : (
            <div
              className="col-span-2 sm:col-span-3 md:col-span-4 flex items-center justify-center py-14 text-sm"
              style={{ color: "#b0917c" }}
            >
              Belum ada layanan untuk kategori ini.
            </div>
          )}
        </div>
      </div>
      <Footer isMobileView={false} />
    </div>
  );
}

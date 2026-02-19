"use client";

import { useState } from "react";

type Props = {
  images: string[];
  alt: string;
};

export function ServiceThumbnailCarousel({ images, alt }: Props) {
  const validImages = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  if (validImages.length === 0) {
    return (
      <div className="w-full h-32 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 text-xs font-monterat-tipis">
        Tidak ada gambar
      </div>
    );
  }

  const safeIndex = Math.min(activeIndex, validImages.length - 1);
  const current = validImages[safeIndex];

  return (
    <div className="relative w-full aspect-[1/1]
 rounded-xl overflow-hidden bg-stone-100 border border-stone-100">
      <img
        src={current}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Dot indicator seperti contoh card, jumlah sesuai thumbnail */}
      {/* {validImages.length > 1 && (
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {validImages.map((_, idx) => {
            const active = idx === safeIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                onMouseDown={(e) => {
                  // Cegah event merambat ke parent <Link> sehingga tidak pindah halaman
                  e.stopPropagation();
                }}
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
      )} */}
    </div>
  );
}


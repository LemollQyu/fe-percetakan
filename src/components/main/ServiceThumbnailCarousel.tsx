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
    <div
      className="relative w-full aspect-[1/1]
 rounded-xl overflow-hidden bg-stone-100 border border-stone-100"
    >
      <img
        src={current}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

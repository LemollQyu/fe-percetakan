"use client";
import Link from "next/link";

interface FooterProps {
  className?: string;
  isMobileView: boolean;
}

export default function Footer({ className = "", isMobileView }: FooterProps) {
  return (
    <footer className={`bg-[#f5f0eb] w-full ${className}`}>
      {/* ── Wave + Icon floating di puncak gelombang ── */}
      <div className="relative w-full overflow leading-none">
        {/* Icon mengambang — posisi absolute di puncak gelombang tengah */}
        <div
          className="absolute z-0 md:-top-10 -top-2"
          style={{ left: "50%", transform: "translateX(-50%)" }}
        >
          <Link
            href={"/"}
            className="md:w-16 md:h-16 h-10 w-10 rounded-full flex items-center justify-center"
            style={
              {
                //   background: "linear-gradient(135deg, #4a2518 0%, #2C1810 100%)",
                //   border: "1.5px solid rgba(212,165,116,0.35)",
              }
            }
          >
            {/* opsi 1 */}
            {/* <svg
              width="32"
              height="32"
              viewBox="0 0 34 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="10"
                y="3"
                width="14"
                height="10"
                rx="1.5"
                fill="#D4A574"
                opacity="0.9"
              />
              <rect
                x="5"
                y="11"
                width="24"
                height="13"
                rx="2.5"
                fill="#C0392B"
              />
              <rect x="5" y="11" width="24" height="5" rx="2" fill="#a93226" />
              <rect
                x="9"
                y="21"
                width="16"
                height="2"
                rx="1"
                fill="#2C1810"
                opacity="0.5"
              />
              <rect x="10" y="23" width="14" height="8" rx="1" fill="#F5E6D0" />
              <line
                x1="12"
                y1="26"
                x2="22"
                y2="26"
                stroke="#D4A574"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="28"
                x2="19"
                y2="28"
                stroke="#D4A574"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <circle cx="26" cy="15" r="1.5" fill="#D4A574" />
            </svg> */}
            {/* opsi 2 */}
            {/* <svg
              width="42"
              height="42"
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="11"
                y="4"
                width="22"
                height="14"
                rx="2"
                fill="none"
                stroke="#D4A574"
                strokeWidth="1.5"
              />

              <rect
                x="4"
                y="16"
                width="36"
                height="22"
                rx="4"
                fill="none"
                stroke="#D4A574"
                strokeWidth="1.5"
              />

              <line
                x1="11"
                y1="38"
                x2="33"
                y2="38"
                stroke="#D4A574"
                strokeWidth="1.5"
              />

              <rect
                x="11"
                y="38"
                width="22"
                height="12"
                rx="2"
                fill="#D4A574"
                opacity="0.15"
                stroke="#D4A574"
                strokeWidth="1.5"
              />

              <line
                x1="15"
                y1="42"
                x2="29"
                y2="42"
                stroke="#D4A574"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.7"
              />
              <line
                x1="15"
                y1="46"
                x2="22"
                y2="46"
                stroke="#D4A574"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.5"
              />

              <circle cx="33" cy="26" r="2" fill="#C0392B" />
            </svg> */}

            <svg
              width="64"
              height="64"
              viewBox="0 0 128 148"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="22"
                y="12"
                width="84"
                height="34"
                rx="7"
                fill="#FFFFFF"
                stroke="#6B3F1F"
                strokeWidth="1.5"
              />
              <line
                x1="34"
                y1="24"
                x2="94"
                y2="24"
                stroke="#6B3F1F"
                strokeWidth="0.8"
                opacity="0.35"
              />
              <line
                x1="34"
                y1="34"
                x2="68"
                y2="34"
                stroke="#A0724A"
                strokeWidth="0.8"
                opacity="0.3"
              />

              <rect
                x="6"
                y="43"
                width="116"
                height="58"
                rx="11"
                fill="#3D1F0D"
                stroke="#6B3F1F"
                strokeWidth="1.5"
              />
              <line
                x1="6"
                y1="62"
                x2="122"
                y2="62"
                stroke="#7A5030"
                strokeWidth="0.8"
                opacity="0.5"
              />

              <circle cx="28" cy="79" r="5.5" fill="#2C1208" />
              <circle cx="28" cy="79" r="3.5" fill="#C4956A" />
              <circle cx="46" cy="79" r="5.5" fill="#2C1208" />
              <circle cx="46" cy="79" r="3.5" fill="#C4956A" opacity="0.55" />
              <circle cx="64" cy="79" r="5.5" fill="#2C1208" />
              <circle cx="64" cy="79" r="3.5" fill="#C4956A" opacity="0.2" />

              <circle cx="96" cy="79" r="5" fill="#FAF6F1" />
              <circle cx="96" cy="79" r="2.5" fill="#8B5E3C" />
              <circle cx="112" cy="79" r="5" fill="#FFFFFF" opacity="0.1" />
              <circle cx="112" cy="79" r="2.5" fill="#6B3F1F" opacity="0.4" />

              <rect
                x="22"
                y="98"
                width="84"
                height="40"
                rx="8"
                fill="#FFFFFF"
                stroke="#6B3F1F"
                strokeWidth="1.5"
              />
              <line
                x1="34"
                y1="113"
                x2="88"
                y2="113"
                stroke="#3D1F0D"
                strokeWidth="1.3"
                strokeLinecap="round"
                opacity="0.75"
              />
              <line
                x1="34"
                y1="126"
                x2="58"
                y2="126"
                stroke="#6B3F1F"
                strokeWidth="1.3"
                strokeLinecap="round"
                opacity="0.4"
              />
            </svg>
          </Link>
        </div>

        {/* Gelombang — Mobile */}
        <svg
          viewBox="0 0 430 140"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full block md:hidden"
          style={{ height: "140px" }}
        >
          <path
            d="M0,140 L0,108 C60,105 90,128 130,118 C160,110 170,80 200,62 C210,54 220,50 230,52 C240,54 248,64 268,84 C300,116 340,132 390,128 C408,126 422,120 430,116 L430,140 Z"
            fill="#1a0e08"
            opacity="0.3"
          />
          <path
            d="M0,140 L0,112 C55,108 85,132 128,120 C158,112 168,78 200,60 C212,52 221,48 230,50 C239,52 247,62 265,82 C298,118 336,134 388,130 C410,128 424,121 430,118 L430,140 Z"
            fill="#2C1810"
          />
        </svg>

        {/* Gelombang — Desktop */}
        <svg
          viewBox="0 0 1440 140"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full hidden md:block"
          style={{ height: "140px" }}
        >
          <path
            d="M0,140 L0,108 C200,100 300,128 440,116 C530,108 560,72 620,55 C660,43 700,40 720,42 C740,44 760,56 820,82 C920,118 1060,136 1280,130 C1360,128 1410,120 1440,116 L1440,140 Z"
            fill="#1a0e08"
            opacity="0.3"
          />
          <path
            d="M0,140 L0,112 C190,104 295,132 435,120 C526,112 558,74 618,56 C658,44 698,40 720,42 C742,44 762,56 820,82 C920,120 1058,138 1276,132 C1358,130 1412,122 1440,118 L1440,140 Z"
            fill="#2C1810"
          />
        </svg>
      </div>

      {/* ── Body Footer ── */}
      <div className="w-full px-6 pt-6 pb-10" style={{ background: "#2C1810" }}>
        {/* Nama Toko */}
        <div className="flex flex-col items-center mb-6 gap-1">
          <Link
            href={"/"}
            className="text-xl font-bold tracking-widest uppercase text-center"
            style={{
              color: "#F5E6D0",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              letterSpacing: "0.18em",
              textShadow: "0 1px 8px rgba(212,165,116,0.3)",
            }}
          >
            Nabila Fotocopy
          </Link>
          <div
            className="w-10 h-px"
            style={{ background: "#C0392B", opacity: 0.8 }}
          />
          <p
            className="text-xs tracking-widest"
            style={{ color: "#D4A574", opacity: 0.7, letterSpacing: "0.15em" }}
          >
            PERCETAKAN & FOTOCOPY
          </p>
        </div>

        {/* Info Grid */}
        <div
          className={`flex gap-6 mb-8 ${
            isMobileView ? "flex-col" : "flex-col md:flex-row md:justify-center"
          }`}
        >
          {/* Kontak */}
          <div className="flex flex-col gap-2">
            <p
              className="text-xs font-bold tracking-widest mb-1 uppercase"
              style={{ color: "#C0392B", letterSpacing: "0.15em" }}
            >
              Kontak Kami
            </p>
            <div className="flex items-start gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="mt-0.5 shrink-0"
              >
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill="#D4A574"
                  opacity="0.8"
                />
                <circle cx="12" cy="9" r="2.5" fill="#2C1810" />
              </svg>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "#c9b8a8" }}
              >
                Jl. Onggorawe, Prampelan, Sayung
                <br />
                Demak, Jawa Tengah
              </p>
            </div>
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1v3.5a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.58 1 1 0 01-.25 1.01z"
                  fill="#D4A574"
                  opacity="0.8"
                />
              </svg>
              <p className="text-xs" style={{ color: "#c9b8a8" }}>
                +62 812-3456-7890
              </p>
            </div>
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <rect
                  x="2"
                  y="4"
                  width="20"
                  height="16"
                  rx="2"
                  fill="#D4A574"
                  opacity="0.8"
                />
                <path d="M2 8l10 7 10-7" stroke="#2C1810" strokeWidth="1.5" />
              </svg>
              <p className="text-xs" style={{ color: "#c9b8a8" }}>
                nabila@fotocopy.com
              </p>
            </div>
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="9" fill="#D4A574" opacity="0.8" />
                <path
                  d="M12 7v5l3 3"
                  stroke="#2C1810"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-xs" style={{ color: "#c9b8a8" }}>
                Senin – Sabtu, 07.00 – 22.00
              </p>
            </div>
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="9" fill="#D4A574" opacity="0.8" />
                <path
                  d="M12 7v5l3 3"
                  stroke="#2C1810"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>

              <p className="text-xs" style={{ color: "#c9b8a8" }}>
                Minggu, 06.00 – 23.00
              </p>
            </div>
          </div>

          <div
            className="hidden md:block w-px"
            style={{ background: "rgba(212,165,116,0.15)" }}
          />
          <div
            className="md:hidden w-full h-px"
            style={{ background: "rgba(212,165,116,0.15)" }}
          />

          {/* Layanan */}
          <div className="flex flex-col gap-2">
            <p
              className="text-xs font-bold tracking-widest mb-1 uppercase"
              style={{ color: "#C0392B", letterSpacing: "0.15em" }}
            >
              Layanan
            </p>
            {[
              "Fotocopy & Print",
              "Cetak Foto",
              "Laminating",
              "Jilid & Binding",
              "Spanduk & Banner",
              "Cetak Undangan",
              "Dan Lainnya",
            ].map((item) => (
              <p key={item} className="text-xs" style={{ color: "#c9b8a8" }}>
                — {item}
              </p>
            ))}
          </div>

          <div
            className="hidden md:block w-px"
            style={{ background: "rgba(212,165,116,0.15)" }}
          />
          <div
            className="md:hidden w-full h-px"
            style={{ background: "rgba(212,165,116,0.15)" }}
          />

          {/* Kontak Developer */}
          <div className="flex flex-col gap-2">
            <p
              className="text-xs font-bold tracking-widest mb-1 uppercase"
              style={{ color: "#C0392B", letterSpacing: "0.15em" }}
            >
              Kontak Developer
            </p>

            {/* Number */}
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1v3.5a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.58 1 1 0 01-.25 1.01z"
                  fill="#D4A574"
                  opacity="0.8"
                />
              </svg>
              <p className="text-xs" style={{ color: "#c9b8a8" }}>
                +62 896-9261-2004
              </p>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <rect
                  x="2"
                  y="4"
                  width="20"
                  height="16"
                  rx="2"
                  fill="#D4A574"
                  opacity="0.8"
                />
                <path d="M2 8l10 7 10-7" stroke="#2C1810" strokeWidth="1.5" />
              </svg>
              <p className="text-xs" style={{ color: "#c9b8a8" }}>
                annasauliarahman04@gmail.com
              </p>
            </div>

            {/* Github */}
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                  fill="#D4A574"
                  opacity="0.8"
                />
              </svg>
              <Link
                href="https://github.com/LemollQyu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline"
                style={{ color: "#c9b8a8" }}
              >
                LemollQyu
              </Link>
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                <rect
                  x="2"
                  y="2"
                  width="20"
                  height="20"
                  rx="5"
                  fill="#D4A574"
                  opacity="0.8"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="4.5"
                  stroke="#2C1810"
                  strokeWidth="1.5"
                />
                <circle cx="17" cy="7" r="1" fill="#2C1810" />
              </svg>
              <Link
                href="https://www.instagram.com/_aaaanns"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline"
                style={{ color: "#c9b8a8" }}
              >
                @_aaaanns
              </Link>
            </div>
          </div>
        </div>

        <div
          className="w-full h-px mb-5"
          style={{ background: "rgba(212,165,116,0.12)" }}
        />
        <p
          className="text-center text-xs"
          style={{ color: "#7a6055", letterSpacing: "0.05em" }}
        >
          © {new Date().getFullYear()} Nabila Fotocopy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

"use client";

import { useState, useEffect } from "react";

const PHONE_NUMBER = "6289692612004";
const BUSINESS_NAME = "Fotocopy Nabila";

const GREETING_MESSAGE = `Halo! 👋 Selamat datang di *${BUSINESS_NAME}*.

Kami siap membantu kebutuhan fotocopy, print, dan jilid Anda dengan cepat & terjangkau.

Ada yang bisa kami bantu hari ini? 😊`;

interface Props {
  name?: string;
  code?: string;
  layanan?: string;
}

export default function WhatsAppWidget({
  name = "",
  code = "",
  layanan = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleConsult = () => {
    const message = `Halo Admin Nabila Fotocopy 👋
Saya ingin menanyakan terkait pesanan saya dengan detail berikut:

Nama: ${name || "[Nama Kamu]"}
Kode Order: ${code || "[Kode Order]"}
Layanan: ${layanan || "[Jenis Layanan / Cetak apa]"}

Mohon bantuannya untuk update status pesanan saya ya.
Terima kasih 🙏`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${PHONE_NUMBER}?text=${encoded}`, "_blank");
  };

  return (
    <>
      {/* Popup Widget */}
      <div
        className={`fixed bottom-24 right-5 z-50 w-[320px] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-[#075E54] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">
                {BUSINESS_NAME}
              </p>
              <p className="text-green-300 text-xs">Akun Bisnis ✓</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Chat area */}
        <div
          className="px-4 py-5 flex flex-col gap-3"
          style={{
            background: "#e5ddd5",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8bdb5' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {/* Bubble sapaan dari bisnis */}
          <div className="max-w-[85%] self-start">
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold text-[#075E54] mb-1">
                {BUSINESS_NAME}
              </p>
              <p className="text-[13px] text-gray-800 whitespace-pre-line leading-relaxed">
                {GREETING_MESSAGE}
              </p>
              <p className="text-[10px] text-gray-400 text-right mt-1">
                {new Date().toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="bg-white px-4 py-3 flex flex-col gap-2">
          <button
            onClick={handleConsult}
            className="w-full bg-[#25D366] hover:bg-[#1ebe57] active:bg-[#17a84a] text-white font-semibold text-sm py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-colors duration-200 shadow-md"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Konsultasi dengan Kami
          </button>
          <p className="text-center text-[10px] text-gray-400">
            ⚡ Powered by{" "}
            <span className="text-[#075E54] font-medium">{BUSINESS_NAME}</span>
          </p>
        </div>
      </div>

      {/* Floating Button */}
      <div
        className={`fixed bottom-5 right-5 z-50 transition-all duration-500 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
        )}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            isOpen
              ? "bg-gray-600 hover:bg-gray-700"
              : "bg-[#25D366] hover:bg-[#1ebe57] hover:scale-110"
          }`}
          aria-label="Chat WhatsApp"
        >
          {isOpen ? (
            <span className="text-white text-2xl leading-none">×</span>
          ) : (
            <WhatsAppIcon className="w-7 h-7 text-white" />
          )}
        </button>
      </div>
    </>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

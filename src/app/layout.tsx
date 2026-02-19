import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nabila Fotocopy",
  description: "Nabila Fotocopy - layanan fotocopy dan percetakan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen font-monterat-tipis">{children}</body>
    </html>
  );
}

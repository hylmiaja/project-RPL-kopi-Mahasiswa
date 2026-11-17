import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import FloatingChat from "@/components/chatbot/FloatingChat";
import TopNotificationBar from "@/components/layout/TopNotificationBar";
import NotificationCenter from "@/components/layout/NotificationCenter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kopi Mahasiswa – Kedai Kopi Premium untuk Mahasiswa",
    template: "%s | Kopi Mahasiswa",
  },
  description:
    "Kopi Mahasiswa adalah kedai kopi premium dengan harga terjangkau untuk mahasiswa. Nikmati berbagai menu kopi berkualitas tinggi di suasana yang nyaman.",
  keywords: ["kopi mahasiswa", "kedai kopi", "kopi murah", "coffee shop"],
  authors: [{ name: "Kopi Mahasiswa Team" }],
  openGraph: {
    type:        "website",
    locale:      "id_ID",
    siteName:    "Kopi Mahasiswa",
    title:       "Kopi Mahasiswa – Kedai Kopi Premium untuk Mahasiswa",
    description: "Kopi premium dengan harga mahasiswa.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-surface antialiased">
        <Providers>
          <TopNotificationBar />
          <NotificationCenter />
          {children}
          <FloatingChat />
        </Providers>
      </body>
    </html>
  );
}

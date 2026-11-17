import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Tentang Kami – Kopi Mahasiswa",
  description: "Kenali lebih dekat Kopi Mahasiswa, visi, misi, dan tim di balik layar.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow pt-24 pb-20">
        {/* Header Section */}
        <section className="px-4 sm:px-6 lg:px-8 mb-20 text-center max-w-3xl mx-auto">
          <Badge className="mb-6 px-4 py-1 text-sm bg-gray-100 text-gray-800">Cerita Kami</Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-gray-900 mb-6 tracking-tight">
            Lebih dari Sekadar <br/>Secangkir Kopi
          </h1>
          <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
            Kopi Mahasiswa lahir dari gagasan sederhana: menyediakan tempat yang nyaman, 
            kopi berkualitas premium, dengan harga yang tidak mengosongkan kantong mahasiswa.
          </p>
        </section>

        {/* Story Section Image */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-24">
          <div className="relative h-[400px] md:h-[500px] w-full rounded-3xl overflow-hidden shadow-sm">
            <Image
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop"
              alt="Suasana Cafe Minimalis"
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gray-900/10"></div>
          </div>
        </section>

        {/* Visi Misi Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-24">
          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-6">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 font-display">Visi Kami</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                Menjadi episentrum kreativitas dan produktivitas mahasiswa. Sebuah ruang kolaboratif 
                di mana ide-ide besar lahir ditemani oleh seduhan kopi terbaik yang disajikan 
                dengan cinta dan dedikasi.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 font-display">Misi Kami</h2>
              <ul className="text-gray-600 space-y-4 text-lg">
                <li className="flex gap-3">
                  <span className="text-gray-900 font-bold">1.</span>
                  Menyajikan kopi premium 100% Arabica dengan harga yang ramah di kantong.
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-900 font-bold">2.</span>
                  Menciptakan lingkungan yang nyaman, estetik, dan kondusif untuk belajar maupun bekerja.
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-900 font-bold">3.</span>
                  Memberdayakan mahasiswa lokal melalui program paruh waktu dan pelatihan barista profesional.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gray-50 rounded-3xl py-20 px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
              Bertemu dengan Para <br className="sm:hidden" />Ahli Kopi
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Di balik setiap cangkir yang nikmat, ada dedikasi dari tim barista kami yang penuh semangat.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Rizky Firmansyah",
                role: "Head Roaster & Barista",
                image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=400&auto=format&fit=crop"
              },
              {
                name: "Nabila Aurelia",
                role: "Store Manager",
                image: "https://images.unsplash.com/photo-1600185966952-6c9f6d7d6f54?q=80&w=400&auto=format&fit=crop"
              },
              {
                name: "Dimas Aditya",
                role: "Latte Art Specialist",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
              }
            ].map((member, i) => (
              <div key={i} className="flex flex-col items-center group text-center">
                <div className="relative w-48 h-48 rounded-full overflow-hidden mb-6 border-4 border-white shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                <p className="text-gray-500 font-medium mt-1">{member.role}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
             <Button variant="primary" size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
               Bergabung dengan Tim Kami
             </Button>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

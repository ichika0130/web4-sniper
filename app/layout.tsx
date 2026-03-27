import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WEB4 SNIPER",
  description: "Sniping the Hype. Analyzing the Tech.",
};

const FOOTER_LINKS = [
  { href: "/",           label: "HOME" },
  { href: "/radar",      label: "RADAR" },
  { href: "/crosshairs", label: "CROSSHAIRS" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const year = new Date().getFullYear();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">

        <NavBar />

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col">
          {children}
        </main>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer
          className="py-8 text-center"
          style={{
            backgroundColor: "var(--surface)",
            borderTop:       "1px solid var(--border)",
          }}
        >
          {/* Tagline */}
          <p
            className="text-sm font-semibold tracking-wider mb-4"
            style={{ fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}
          >
            Sniping the Hype. Analyzing the Tech.
          </p>

          {/* Footer nav */}
          <nav className="flex items-center justify-center gap-2 mb-4">
            {FOOTER_LINKS.map(({ href, label }, i) => (
              <span key={href} className="flex items-center gap-2">
                {i > 0 && (
                  <span style={{ color: "var(--border)", userSelect: "none" }}>·</span>
                )}
                <a
                  href={href}
                  className="nav-link"
                  style={{ fontSize: "0.65rem" }}
                >
                  {label}
                </a>
              </span>
            ))}
          </nav>

          {/* Disclaimer */}
          <p
            className="text-xs"
            style={{ color: "var(--text-muted)", opacity: 0.45 }}
          >
            No financial advice. No mercy. &copy; {year} WEB4 SNIPER
          </p>
        </footer>

      </body>
    </html>
  );
}

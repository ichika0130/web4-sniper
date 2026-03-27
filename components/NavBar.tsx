"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/",           label: "HOME" },
  { href: "/radar",      label: "RADAR" },
  { href: "/crosshairs", label: "CROSSHAIRS" },
  { href: "/about",      label: "ABOUT" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function NavBar() {
  const pathname          = usePathname();
  const [open, setOpen]   = useState(false);

  return (
    <header
      className="nav-border-glow sticky top-0 z-50"
      style={{
        backgroundColor: "var(--surface)",
        borderTop:       "2px solid var(--primary)",
        borderBottom:    "1px solid var(--border)",
      }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <a
          href="/"
          className="cursor-blink glow-green text-lg font-bold tracking-widest"
          style={{ fontFamily: "var(--font-geist-mono)", color: "var(--primary)" }}
        >
          WEB4 SNIPER
        </a>

        {/* Desktop nav */}
        <ul className="hidden sm:flex items-center gap-8 list-none m-0 p-0">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <a
                  href={href}
                  className="nav-link"
                  style={
                    active
                      ? {
                          color:         "var(--primary)",
                          borderBottom:  "2px solid var(--primary)",
                          paddingBottom: "2px",
                        }
                      : undefined
                  }
                >
                  {label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex items-center justify-center p-1"
          style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="sm:hidden"
          style={{
            backgroundColor: "var(--surface)",
            borderTop:       "1px solid var(--border)",
          }}
        >
          <ul className="flex flex-col list-none m-0 p-0">
            {NAV_LINKS.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href} style={{ borderBottom: "1px solid var(--border)" }}>
                  <a
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block px-6 py-4"
                    style={{
                      fontFamily:     "var(--font-geist-mono)",
                      fontSize:       "0.75rem",
                      fontWeight:     600,
                      letterSpacing:  "0.1em",
                      textDecoration: "none",
                      color:          active ? "var(--primary)" : "var(--text-muted)",
                    }}
                  >
                    {active ? "▶ " : "  "}{label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}

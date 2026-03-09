"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CTA_LINK, NAV_LINKS } from "@/config/navigation";

// --- Helpers ---
const isActivePath = (pathname: string, path: string) => pathname === path;

/**
 * Header - Main navigation header with logo, nav links, and CTA.
 * Sticky positioned with blur backdrop effect.
 */
export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-blue-100 shadow-sm">
      <div className="section-container py-4 flex items-center justify-between">
        {/* Logo Area */}
        <Link
          href="/"
          className="flex items-center gap-3 text-primary cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tight">Domrov LMS</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex gap-6 text-sm font-bold text-slate-500">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  isActivePath(pathname, link.href)
                    ? "text-primary"
                    : "hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={CTA_LINK.href}
            className="bg-primary hover:bg-primary-dark text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-primary transition-all transform hover:scale-105"
          >
            {CTA_LINK.label}
          </Link>
        </div>
      </div>
    </header>
  );
}

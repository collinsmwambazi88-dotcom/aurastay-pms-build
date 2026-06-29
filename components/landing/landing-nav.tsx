"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-3"
    >
      <div
        className="max-w-6xl mx-auto rounded-2xl px-6 py-3 flex items-center justify-between transition-all duration-300"
        style={{
          background: scrolled ? "rgba(2, 6, 23, 0.85)" : "rgba(2, 6, 23, 0.4)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {/* Logo */}
        <Link href="/landing" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <span className="text-white font-bold text-sm">I</span>
          </div>
          <span className="text-white font-semibold text-base tracking-tight">Innward</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-slate-300 hover:text-white text-sm font-medium transition-colors duration-200 px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/api/auth/judge"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all duration-200 relative group"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              boxShadow: "0 0 20px rgba(99,102,241,0.5), 0 0 40px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
              border: "1px solid rgba(139,92,246,0.6)",
            }}
          >
            {/* Hackathon badge */}
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(255,255,255,0.15)", color: "#e0d7ff" }}
            >
              H0
            </span>
            Judge Demo Access
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="max-w-6xl mx-auto mt-2 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(2, 6, 23, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex flex-col p-4 gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-slate-300 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-white/5 mt-2 pt-2 flex flex-col gap-1">
              <Link href="/sign-in" className="text-slate-300 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                Sign In
              </Link>
              <Link
                href="/api/auth/judge"
                className="inline-flex items-center justify-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl text-center"
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  boxShadow: "0 0 16px rgba(99,102,241,0.45)",
                  border: "1px solid rgba(139,92,246,0.5)",
                }}
              >
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.15)", color: "#e0d7ff" }}>H0</span>
                Judge Demo Access
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}

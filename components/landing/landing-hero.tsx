"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"

// Floating particle component
function Particle({ x, y, size, duration, delay }: { x: number; y: number; size: number; duration: number; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: `radial-gradient(circle, rgba(139,92,246,0.6) 0%, rgba(79,70,229,0.2) 100%)`,
      }}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        opacity: [0.3, 0.8, 0.3],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

const PARTICLES = [
  { x: 10, y: 20, size: 8, duration: 6, delay: 0 },
  { x: 85, y: 15, size: 12, duration: 8, delay: 1 },
  { x: 20, y: 70, size: 6, duration: 7, delay: 2 },
  { x: 75, y: 65, size: 10, duration: 9, delay: 0.5 },
  { x: 50, y: 10, size: 5, duration: 5, delay: 3 },
  { x: 40, y: 85, size: 14, duration: 10, delay: 1.5 },
  { x: 90, y: 45, size: 7, duration: 6.5, delay: 2.5 },
  { x: 5, y: 50, size: 9, duration: 7.5, delay: 0.8 },
  { x: 60, y: 30, size: 4, duration: 8.5, delay: 3.5 },
  { x: 30, y: 40, size: 11, duration: 11, delay: 1.2 },
]

export function LandingHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -60])

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,70,229,0.35) 0%, transparent 70%)",
          }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.2) 0%, transparent 60%)",
          }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 10% 60%, rgba(99,102,241,0.15) 0%, transparent 60%)",
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <Particle key={i} {...p} />
        ))}
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Hero content */}
      <motion.div
        style={{ opacity, y }}
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Next-Gen Hotel Operating System
        </motion.div>

        {/* H1 with gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold leading-tight mb-6"
          style={{
            background: "linear-gradient(135deg, #ffffff 30%, #818cf8 65%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Built for 21st Century
          <br />
          Hoteliers
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Ditch the legacy spreadsheets. Innward combines real-time operations,
          market intelligence, and direct booking in one seamless interface.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white text-slate-900 font-semibold text-base hover:bg-slate-100 transition-all duration-200 shadow-lg shadow-white/10"
          >
            Start Your Free Trial
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-slate-600 text-slate-200 font-semibold text-base hover:border-indigo-500 hover:text-white transition-all duration-200"
          >
            View Demo
          </Link>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-20 flex flex-col items-center gap-2 text-slate-500 text-sm"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 border-slate-600 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-slate-400" />
          </motion.div>
          Scroll to explore
        </motion.div>
      </motion.div>
    </div>
  )
}

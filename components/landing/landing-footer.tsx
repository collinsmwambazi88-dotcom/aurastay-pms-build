"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden">
      {/* Glow background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(79,70,229,0.25) 0%, transparent 70%)",
        }}
      />

      {/* Big CTA section */}
      <div className="relative z-10 text-center px-6 py-24 max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4"
        >
          Ready to transform your property?
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight"
        >
          Ready to automate
          <br />
          your property?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed"
        >
          Join hundreds of independent hoteliers who           replaced their spreadsheets
          with Innward and grew direct revenue by 30%.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center px-12 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all duration-200 shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-500/50 hover:scale-105"
            style={{
              boxShadow: "0 0 40px rgba(79, 70, 229, 0.4), 0 0 80px rgba(79, 70, 229, 0.15)",
            }}
          >
            Get Started — It&apos;s Free
          </Link>
        </motion.div>
      </div>

      {/* Footer links */}
      <div
        className="relative z-10 border-t px-6 py-8"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">I</span>
            </div>
            <span className="text-white font-semibold text-sm">Innward</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Innward. Built for modern hoteliers.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/sign-in" className="hover:text-slate-300 transition-colors">Sign In</Link>
            <Link href="/sign-up" className="hover:text-slate-300 transition-colors">Sign Up</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

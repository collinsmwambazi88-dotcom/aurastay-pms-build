"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { BarChart3, Globe, Star, TrendingUp } from "lucide-react"

// ─── Step 1: Animated reservation Gantt chart ───────────────────────────────
function GanttVisual() {
  const rooms = [
    { name: "101", bookings: [{ start: 0, len: 3, label: "Chen" }, { start: 5, len: 4, label: "Patel" }] },
    { name: "202", bookings: [{ start: 1, len: 5, label: "Rivera" }] },
    { name: "305", bookings: [{ start: 0, len: 2, label: "Kim" }, { start: 4, len: 3, label: "Muller" }] },
    { name: "410", bookings: [{ start: 2, len: 6, label: "Osei" }] },
    { name: "512", bookings: [{ start: 3, len: 3, label: "Garcia" }] },
  ]
  const totalDays = 9
  return (
    <div className="w-full p-5 space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-xs text-slate-400 font-medium">Live Reservation Timeline</span>
      </div>
      {/* Day headers */}
      <div className="flex gap-1 pl-10 mb-1">
        {Array.from({ length: totalDays }).map((_, i) => (
          <div key={i} className="flex-1 text-center text-xs text-slate-600">{i + 1}</div>
        ))}
      </div>
      {rooms.map((room, ri) => (
        <div key={ri} className="flex items-center gap-1 h-8">
          <span className="text-xs text-slate-500 w-9 text-right shrink-0">{room.name}</span>
          <div className="flex-1 relative h-7 flex gap-1">
            {Array.from({ length: totalDays }).map((_, di) => (
              <div key={di} className="flex-1 rounded-sm bg-slate-800/50" />
            ))}
            {room.bookings.map((b, bi) => (
              <motion.div
                key={bi}
                initial={{ scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.55,
                  delay: ri * 0.12 + bi * 0.18,
                  ease: "easeOut",
                }}
                layout
                style={{
                  position: "absolute",
                  left: `calc(${(b.start / totalDays) * 100}% + 2px)`,
                  width: `calc(${(b.len / totalDays) * 100}% - 4px)`,
                  transformOrigin: "left",
                }}
                className="top-0.5 h-6 rounded-md bg-indigo-600/80 flex items-center px-2 overflow-hidden"
              >
                <span className="text-[10px] font-medium text-indigo-100 truncate">{b.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Step 2: Rate comparison bar chart ──────────────────────────────────────
function RateChartVisual() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const aurastay = [120, 135, 128, 145, 160, 175, 155]
  const comp = [110, 120, 115, 130, 140, 150, 138]
  const max = 200

  return (
    <div className="w-full p-5">
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-xs text-indigo-300">
          <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
          AuraStay
        </span>
        <span className="flex items-center gap-1.5 text-xs text-violet-300">
          <span className="w-3 h-3 rounded-sm bg-violet-700/60 inline-block" />
          Market Avg
        </span>
      </div>
      <div className="flex items-end gap-2 h-36">
        {days.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-0.5 items-end h-28">
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                style={{ height: `${(aurastay[i] / max) * 100}%`, transformOrigin: "bottom" }}
                className="flex-1 rounded-t-md bg-indigo-500"
              />
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 + 0.05 }}
                style={{ height: `${(comp[i] / max) * 100}%`, transformOrigin: "bottom" }}
                className="flex-1 rounded-t-md bg-violet-700/50"
              />
            </div>
            <span className="text-[10px] text-slate-500">{day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 3: Website builder split view ─────────────────────────────────────
function WebsiteBuilderVisual() {
  return (
    <div className="w-full p-3 flex gap-3" style={{ height: "100%", minHeight: 0 }}>
      {/* Control panel */}
      <div className="flex-1 rounded-xl bg-slate-800/80 border border-slate-700/60 p-3 space-y-2.5 overflow-hidden">
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Builder</div>
        {["Hero Title", "Primary Color", "Logo", "Hero Banner"].map((label, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="space-y-1"
          >
            <div className="text-[9px] text-slate-500">{label}</div>
            <div
              className={`h-6 rounded-md ${
                i === 1
                  ? "bg-indigo-600/40 border border-indigo-500/30"
                  : "bg-slate-700/60 border border-slate-600/40"
              }`}
            />
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-3 h-7 rounded-lg bg-indigo-600 flex items-center justify-center"
        >
          <span className="text-[10px] text-white font-semibold">Save Changes</span>
        </motion.div>
      </div>
      {/* Mobile preview — fixed width, no clipping */}
      <div
        className="rounded-2xl bg-slate-800/80 border-2 border-slate-700/60 overflow-hidden flex flex-col"
        style={{ width: 112, minWidth: 112, flexShrink: 0 }}
      >
        <div className="h-2 bg-slate-900 flex justify-center items-center">
          <div className="w-8 h-0.5 rounded-full bg-slate-600" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="h-14 bg-gradient-to-b from-indigo-700 to-indigo-900 flex items-end p-2 shrink-0"
        >
          <div>
            <div className="text-[8px] font-bold text-white">Grand Palace</div>
            <div className="text-[7px] text-indigo-200">New York</div>
          </div>
        </motion.div>
        <div className="flex-1 p-1.5 space-y-1.5 overflow-hidden">
          {["Suite King", "Studio", "Deluxe"].map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="rounded-md bg-slate-700/60 p-1.5"
            >
              <div className="text-[8px] font-medium text-slate-200 truncate">{r}</div>
              <div className="mt-0.5 h-3.5 rounded bg-indigo-600 flex items-center justify-center">
                <span className="text-[7px] text-white">Book</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Floating review cards ──────────────────────────────────────────
function ReviewCardsVisual() {
  const reviews = [
    { name: "Amara O.", text: "Seamless check-in, the team was exceptional!", stars: 5, tag: "Operations" },
    { name: "Lucas M.", text: "Best rates we have ever seen. Truly outstanding!", stars: 5, tag: "Revenue" },
    { name: "Sophie K.", text: "The direct booking was so easy and beautiful.", stars: 5, tag: "Bookings" },
  ]
  return (
    <div className="w-full p-4 flex flex-col gap-3 justify-center">
      {reviews.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.15 }}
          className="rounded-xl border border-slate-700/60 bg-slate-800/80 backdrop-blur-sm p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600/40 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300">
                {r.name[0]}
              </div>
              <span className="text-sm font-medium text-slate-200">{r.name}</span>
            </div>
            <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {r.tag}
            </span>
          </div>
          <div className="flex gap-0.5 mb-1.5">
            {Array.from({ length: r.stars }).map((_, si) => (
              <motion.svg
                key={si}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 + si * 0.06 }}
                className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </motion.svg>
            ))}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{r.text}</p>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Step definitions ────────────────────────────────────────────────────────
const STEPS = [
  {
    icon: TrendingUp,
    label: "Step 01",
    title: "Smarter Operations",
    description:
      "Replace disconnected tools with a single live dashboard. Track check-ins, housekeeping, and inventory in real-time across every room category.",
    visual: GanttVisual,
  },
  {
    icon: BarChart3,
    label: "Step 02",
    title: "Market Intelligence",
    description:
      "Monitor competitor ADR and occupancy daily. Our AI engine surfaces dynamic pricing recommendations so you always capture peak-demand revenue.",
    visual: RateChartVisual,
  },
  {
    icon: Globe,
    label: "Step 03",
    title: "Direct Booking Engine",
    description:
      "Launch a beautiful, commission-free hotel website in minutes. Accept direct reservations, collect payment via Stripe, and own your guest relationship.",
    visual: WebsiteBuilderVisual,
  },
  {
    icon: Star,
    label: "Step 04",
    title: "Guest Feedback Loop",
    description:
      "Automated welcome and farewell emails prompt guests to share feedback. Capture ratings that surface operational wins and flag service gaps instantly.",
    visual: ReviewCardsVisual,
  },
]

// Strict opacity ranges — each step has its own quadrant with dead zones between
const VISUAL_OPACITY_RANGES: [number, number, number, number][] = [
  [0,    0.05, 0.18, 0.23],
  [0.25, 0.30, 0.43, 0.48],
  [0.50, 0.55, 0.68, 0.73],
  [0.75, 0.80, 0.95, 1.00],
]

// Text opacity peaks at the midpoint of each visual quadrant
const TEXT_OPACITY_RANGES: [number, number, number, number][] = [
  [0,    0.04, 0.20, 0.24],
  [0.25, 0.29, 0.44, 0.48],
  [0.50, 0.54, 0.69, 0.73],
  [0.75, 0.79, 0.96, 1.00],
]

// ─── StepScrollText ──────────────────────────────────────────────────────────
function StepScrollText({
  step,
  index,
  containerRef,
}: {
  step: (typeof STEPS)[0]
  index: number
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const Icon = step.icon
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] })
  const [p0, p1, p2, p3] = TEXT_OPACITY_RANGES[index]

  const opacity = useTransform(scrollYProgress, [p0, p1, p2, p3], [0.1, 1, 1, 0.1])
  const y = useTransform(scrollYProgress, [p0, p1, p2, p3], [24, 0, 0, -24])

  // Position each block at its own 25% band within the scroll container
  const topPercent = index * 25

  return (
    <motion.div
      style={{ opacity, y, position: "absolute", top: `${topPercent}%` }}
      className="flex gap-4 py-10 w-full max-w-md"
    >
      <div className="mt-1 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">{step.label}</div>
        <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
        <p className="text-slate-400 leading-relaxed text-base max-w-sm">{step.description}</p>
      </div>
    </motion.div>
  )
}

// ─── StepVisualPanel ─────────────────────────────────────────────────────────
function StepVisualPanel({
  step,
  index,
  containerRef,
}: {
  step: (typeof STEPS)[0]
  index: number
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const Visual = step.visual
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] })
  const [p0, p1, p2, p3] = VISUAL_OPACITY_RANGES[index]

  const opacity = useTransform(scrollYProgress, [p0, p1, p2, p3], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [p0, p1, p2, p3], [0.96, 1, 1, 0.96])

  return (
    <motion.div
      style={{ opacity, scale, position: "absolute", inset: 0 }}
      className="flex items-center overflow-hidden"
    >
      <Visual />
    </motion.div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function LandingFeatures() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <section className="relative">
      {/* Section header */}
      <div className="text-center py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-6"
        >
          Everything in one place
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-white mb-4"
        >
          One platform.
          <span
            className="ml-3"
            style={{
              background: "linear-gradient(90deg, #818cf8, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Every tool.
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-lg max-w-xl mx-auto"
        >
          From check-in to check-out, AuraStay has every workflow covered.
        </motion.p>
      </div>

      {/* ── Desktop sticky scroll (800vh = 200vh per step) ── */}
      <div ref={containerRef} className="hidden lg:block relative" style={{ height: "800vh" }}>
        <div className="sticky top-0 h-screen flex items-stretch overflow-hidden">

          {/* Left: text triggers, absolutely positioned within their 25% bands */}
          <div className="w-1/2 relative flex flex-col justify-start px-16 xl:px-24 overflow-hidden">
            {STEPS.map((step, i) => (
              <StepScrollText key={i} step={step} index={i} containerRef={containerRef} />
            ))}
          </div>

          {/* Right: premium dark app-window container */}
          <div className="w-1/2 flex items-center justify-center p-8">
            <div
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 overflow-hidden relative"
              style={{
                minHeight: 400,
                boxShadow: "0 0 60px 8px rgba(99,102,241,0.20), 0 2px 40px 0 rgba(0,0,0,0.6)",
              }}
            >
              {/* Subtle window chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <div className="flex-1 mx-3 h-4 rounded bg-slate-800/80 border border-white/[0.06]" />
              </div>
              {/* Visual panels — stacked, each absolutely positioned */}
              <div className="relative" style={{ minHeight: 360 }}>
                {STEPS.map((step, i) => (
                  <StepVisualPanel key={i} step={step} index={i} containerRef={containerRef} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: standard vertical stack (unchanged) ── */}
      <div className="lg:hidden px-6 max-w-2xl mx-auto pb-16 space-y-12">
        {STEPS.map((step, i) => {
          const Visual = step.visual
          const Icon = step.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">{step.label}</span>
              </div>
              <h3 className="text-2xl font-bold text-white">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed">{step.description}</p>
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden" style={{ minHeight: 280 }}>
                <Visual />
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

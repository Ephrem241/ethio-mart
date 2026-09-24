"use client"

import type { ReactNode } from "react"
import { m } from "framer-motion"

// A quiet fade-and-rise as a section scrolls into view (about 400ms, once).
// It is only used below the fold: anything above it (the hero) must be visible
// immediately, so it uses plain CSS animation instead. Uses the lightweight
// `m` component — the animation features are loaded once by MotionProvider —
// and MotionConfig there turns the movement off for anyone who asked their
// system for reduced motion.
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  )
}

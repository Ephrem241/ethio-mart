"use client"

import type { ReactNode } from "react"
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion"

// One place that decides how motion behaves site-wide.
//  - LazyMotion + domAnimation: the animation features load as a separate
//    chunk instead of riding in every page's main bundle. `strict` makes any
//    component that imports the full `motion.*` (instead of the lightweight
//    `m.*`) throw in development, so the saving can't be lost by accident.
//  - reducedMotion="user": anyone whose system asks for less motion gets
//    instant state changes instead of transitions.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}

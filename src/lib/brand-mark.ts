// The Evael Store mark: a gold shopping bag with a forest "E" on its front.
// One set of shapes, drawn by the header/footer logo (logo.tsx) and by the
// generated images (icon, apple-icon, opengraph-image) — so they can't drift.
//
// All paths share one 40 × 44 viewBox. Draw order: handle (it tucks behind
// the bag), body, rim, then the "E".

export const BRAND_MARK_VIEWBOX = "0 0 40 44"
export const BRAND_MARK_RATIO = 40 / 44

export const BRAND_MARK = {
  /** Stroked: the rope handle. */
  handle: "M13 15v-4a7 7 0 0 1 14 0v4",
  handleWidth: 3,
  /** Filled: the bag, a slight trapezoid with rounded corners. */
  body: "M8.2 14h23.6a2 2 0 0 1 2 1.8l2.1 24a2.4 2.4 0 0 1-2.4 2.6H6.5a2.4 2.4 0 0 1-2.4-2.6l2.1-24a2 2 0 0 1 2-1.8z",
  /** Filled: the darker fold along the top of the bag, following its sides. */
  rim: "M8.2 14h23.6a2 2 0 0 1 2 1.8l.15 1.7H6.05l.15-1.7a2 2 0 0 1 2-1.8z",
  /** Stroked: the "E". */
  letter: "M25.5 21.5H14.5v14h11M14.5 28.5h8",
  letterWidth: 3.2,
} as const

// Hex copies of the palette in globals.css, for the image renderer, which
// can't read CSS variables. Keep the two in step.
export const BRAND_COLORS = {
  forest: "#123C35",
  forestDark: "#092A25",
  gold: "#C9A15B",
  goldRim: "#A9843F",
  goldDeep: "#8A6A2F",
  ivory: "#FAF7F0",
} as const

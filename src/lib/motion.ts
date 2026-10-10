import type { SpringOptions, Transition, Variants } from 'framer-motion'

/**
 * The house easing. Broadcast UI reads as "quick out, soft settle", so expo-out
 * carries almost every tween that is not on a spring.
 */
export const EASE_EXPO = [0.16, 1, 0.3, 1] as const

/**
 * Spring physics, typed for `useSpring` / MotionValue springs.
 *
 * Kept separate from `motionTransitions` because `useSpring` wants plain
 * `SpringOptions` (no `type` discriminant) and an object literal carrying an
 * extra `type` field fails excess-property checks.
 */
export const motionSprings = {
  springGentle: { stiffness: 170, damping: 26, mass: 0.9 },
  springSmooth: { stiffness: 200, damping: 28, mass: 0.85 },
  springSnappy: { stiffness: 380, damping: 30, mass: 0.5 },
  springMorph: { stiffness: 220, damping: 32, mass: 1 },
  springResponsive: { stiffness: 320, damping: 24, mass: 0.7 },
  springSoft: { stiffness: 150, damping: 22, mass: 0.9 },
} satisfies Record<string, SpringOptions>

/**
 * Transition presets for `motion.*` elements and `animate()`.
 *
 * The names are the contract: pick the one that matches the interaction's
 * weight rather than tuning numbers at each call site.
 */
export const motionTransitions = {
  springGentle: {
    type: 'spring',
    stiffness: 170,
    damping: 26,
    mass: 0.9,
  } as Transition,
  springSmooth: {
    type: 'spring',
    stiffness: 200,
    damping: 28,
    mass: 0.85,
  } as Transition,
  springSnappy: {
    type: 'spring',
    stiffness: 380,
    damping: 30,
    mass: 0.5,
  } as Transition,
  springMorph: {
    type: 'spring',
    stiffness: 220,
    damping: 32,
    mass: 1.0,
  } as Transition,
  springResponsive: {
    type: 'spring',
    stiffness: 320,
    damping: 24,
    mass: 0.7,
  } as Transition,
  springSoft: {
    type: 'spring',
    stiffness: 150,
    damping: 22,
    mass: 0.9,
  } as Transition,
  easeSoft: {
    duration: 0.32,
    ease: [0.22, 1, 0.36, 1] as Transition['ease'],
  } as Transition,
  easeFast: {
    duration: 0.2,
    ease: [0.2, 0, 0, 1] as Transition['ease'],
  } as Transition,
}

/**
 * Shared enter/exit variants for `AnimatePresence`.
 *
 * A single vocabulary keeps route changes, panels and reveals reading the same.
 */
export const motionVariants = {
  fadeUp: {
    initial: { opacity: 0, y: 12 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    enter: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.97 },
    enter: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
  slideDown: {
    initial: { opacity: 0, y: -8 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
} satisfies Record<string, Variants>

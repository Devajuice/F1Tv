import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Header from './Header'
import Footer from './Footer'

const VARIANTS = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
} as const

const TRANSITION = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1] as const,
}

/** Standard chrome: header, animated content slot, footer. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <motion.main
          variants={VARIANTS}
          initial="initial"
          animate="enter"
          exit="exit"
          transition={TRANSITION}
          className="relative flex-1"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(700px_240px_at_50%_0%,var(--glow-red),transparent_70%)] opacity-70"
          />
          {children}
        </motion.main>
        <Footer />
      </div>
    </>
  )
}

/** Full-bleed chrome for the video player: no header, no footer. */
export function ImmersiveLayout({ children }: { children: ReactNode }) {
  return (
    <motion.main
      variants={VARIANTS}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={TRANSITION}
      className="min-h-dvh"
    >
      {children}
    </motion.main>
  )
}

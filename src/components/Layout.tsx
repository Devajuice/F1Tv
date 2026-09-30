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
      {/* pb clears the mobile tab bar; it is display:none from lg up, where
          the floating pill returns to the top and nothing is pinned. */}
      <div className="flex flex-1 flex-col pb-32 lg:pb-0">
        <motion.main
          variants={VARIANTS}
          initial="initial"
          animate="enter"
          exit="exit"
          transition={TRANSITION}
          className="flex-1"
        >
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

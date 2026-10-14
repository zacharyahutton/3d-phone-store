'use client';

import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

const NAV_LINKS = [
  { label: 'OVERVIEW',  href: '#hero-trigger' },
  { label: 'SPECS',     href: '#section-specs' },
  { label: 'CONFIGURE', href: '#section-customizer' },
  { label: 'RESERVE',   href: '#section-checkout' },
];

export function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden,   setHidden]   = useState(false);
  const [lastY,    setLastY]    = useState(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 60);
    setHidden(y > lastY + 10 && y > 200);
    setLastY(y);
  });

  return (
    <motion.header
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: hidden ? -80 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingTop: scrolled ? '16px' : '0px' }}
    >
      <motion.nav
        layout
        animate={{
          borderRadius:    scrolled ? '9999px'                 : '0px',
          paddingLeft:     scrolled ? '30px'                   : '40px',
          paddingRight:    scrolled ? '30px'                   : '40px',
          paddingTop:      scrolled ? '12px'                   : '24px',
          paddingBottom:   scrolled ? '12px'                   : '24px',
          backgroundColor: scrolled ? 'rgba(3,3,3,0.80)'      : 'rgba(0,0,0,0)',
          borderColor:     scrolled ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0)',
          width:           scrolled ? 'auto'                   : '100%',
        }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-center gap-8 pointer-events-auto border"
        style={{ backdropFilter: scrolled ? 'blur(20px)' : 'blur(0px)' }}
      >
        <motion.div layout className="flex items-center gap-2">
          <span className="font-black text-white tracking-tighter text-base font-mono uppercase">
            TITAN
          </span>
          <span className="text-[10px] font-mono font-black tracking-widest text-amber-500 border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 rounded-full">
            PRO
          </span>
        </motion.div>

        <motion.div
          animate={{ opacity: scrolled ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="w-px h-4 bg-zinc-700"
        />

        <div className="flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <motion.a
              key={link.label}
              layout
              href={link.href}
              className="text-[11px] font-mono font-black tracking-widest text-zinc-400 hover:text-white transition-colors uppercase"
            >
              {link.label}
            </motion.a>
          ))}
        </div>

        <motion.a
          layout
          href="#section-customizer"
          className="bg-white text-black text-[11px] font-mono font-black tracking-widest uppercase rounded-full px-6 py-2.5 hover:bg-amber-500 transition-colors whitespace-nowrap shadow-lg"
        >
          {scrolled ? 'BUILD' : 'EXPLORE'}
        </motion.a>
      </motion.nav>
    </motion.header>
  );
}

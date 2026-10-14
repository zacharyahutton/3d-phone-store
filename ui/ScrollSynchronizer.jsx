'use client';
import { useEffect } from 'react';
import { useStore } from '../components/store';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function ScrollSynchronizer() {
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        useStore.getState().setScrollProgress(self.progress);
      }
    });

    return () => st.kill();
  }, []);

  return null;
}

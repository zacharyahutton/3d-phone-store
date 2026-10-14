'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let didComplete = false;
    const completeOnce = () => {
      if (didComplete) return;
      didComplete = true;
      onComplete();
    };
    const fallback = window.setTimeout(completeOnce, 2800);
    const tl = gsap.timeline({ onComplete: completeOnce });

    tl
      .fromTo(
        loaderRef.current,
        { opacity: 0, scale: 0.88 },
        { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }
      )
      .fromTo(
        labelRef.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
        '-=0.1'
      )
      .to({}, { duration: 1.0 })
      .to(loaderRef.current, { opacity: 0, scale: 0.9, y: -6, duration: 0.3, ease: 'power2.in' })
      .to(labelRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' }, '<')
      .to(overlayRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.45, ease: 'power2.inOut' });

    return () => {
      window.clearTimeout(fallback);
      tl.kill();
    };
  }, [onComplete]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .titan-loading-overlay {
              will-change: opacity;
            }
            .gooey-wrap {
              width: 200px;
              height: 52px;
              position: relative;
              overflow: hidden;
              border-bottom: 6px solid rgba(255,255,255,0.12);
              filter: url(#gooey-loader-filter);
              will-change: transform;
            }
            .gooey-wrap::before,
            .gooey-wrap::after {
              content: '';
              position: absolute;
              border-radius: 50%;
              will-change: transform;
            }
            .gooey-wrap::before {
              width: 340px;
              height: 280px;
              background: #3b82f6;
              left: -60px;
              bottom: -280px;
              animation: goo-wee1 2s linear infinite;
            }
            .gooey-wrap::after {
              width: 260px;
              height: 200px;
              background: #1e40af;
              left: -80px;
              bottom: -200px;
              animation: goo-wee2 2s linear infinite 0.75s;
            }
            @keyframes goo-wee1 {
              0% { transform: translateX(-80px) rotate(0deg); }
              100% { transform: translateX(160px) rotate(180deg); }
            }
            @keyframes goo-wee2 {
              0% { transform: translateX(-60px) rotate(0deg); }
              100% { transform: translateX(180px) rotate(180deg); }
            }
          `,
        }}
      />

      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id="gooey-loader-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 40 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        ref={overlayRef}
        className="titan-loading-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          pointerEvents: 'all',
        }}
      >
        <div ref={loaderRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="gooey-wrap" />
        </div>

        <p
          ref={labelRef}
          style={{
            marginTop: '40px',
            fontSize: '13px',
            fontFamily: 'monospace',
            fontWeight: 900,
            letterSpacing: '0.45em',
            color: '#52525b',
            textTransform: 'uppercase',
          }}
        >
          TITAN / INITIALIZING
        </p>

        <a
          href="https://github.com/zacharyahutton"
          target="_blank"
          rel="noreferrer"
          style={{
            position: 'absolute',
            bottom: '34px',
            left: '50%',
            transform: 'translateX(-50%)',
            border: '1px solid rgba(59,130,246,0.28)',
            borderRadius: '999px',
            padding: '10px 16px',
            background: 'rgba(59,130,246,0.06)',
            color: '#cbd5e1',
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 900,
            letterSpacing: '0.26em',
            textDecoration: 'none',
            textTransform: 'uppercase',
            boxShadow: '0 0 34px rgba(59,130,246,0.12)',
          }}
        >
          Built by Zachary Hutton
        </a>
      </div>
    </>
  );
}

'use client';
import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches;
    // if (!isStandalone) return;

    setShow(true);
    setTimeout(() => setReady(true), 50); // trigger scale-in
    setTimeout(() => setFadeOut(true), 1000); // start fade out
    setTimeout(() => setGone(true), 1400); // unmount
  }, []);

  if (!show || gone) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      <span
        className="font-pixel"
        style={{
          color: '#ffffff',
          fontSize: 'clamp(24px, 6vw, 40px)',
          opacity: ready ? 1 : 0,
          transform: ready ? 'scale(1)' : 'scale(0.85)',
          transition: 'transform 0.4s ease-out, opacity 0.4s ease-out',
          display: 'block',
        }}
      >
        ZLUNY
      </span>
      <span
        className="font-mono"
        style={{
          color: '#ffffff',
          fontSize: '11px',
          marginTop: '16px',
          textAlign: 'center',
          maxWidth: '260px',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.6s ease 0.2s',
        }}
      >
        Use AI. Build with it. Make it work.
      </span>
    </div>
  );
}


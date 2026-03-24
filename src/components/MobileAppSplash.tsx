"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

const SPLASH_MS = 2600;

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const standaloneMq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standaloneMq || iosStandalone;
}

export default function MobileAppSplash() {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (!isStandalonePwa()) return;

    const html = document.documentElement;
    const body = document.body;
    html.style.backgroundColor = "#000000";
    body.style.backgroundColor = "#000000";

    setVisible(true);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      html.style.backgroundColor = "";
      body.style.backgroundColor = "";
    }, SPLASH_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      html.style.backgroundColor = "";
      body.style.backgroundColor = "";
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
      }}
      aria-hidden
    >
      <div className="relative h-[229px] w-[229px] max-w-[91vw]">
        <Image
          src="/MOBILE_APP_PLASH.png"
          alt=""
          fill
          className="object-contain"
          sizes="229px"
          priority
        />
      </div>
    </div>
  );
}

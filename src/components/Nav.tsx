"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

function DesktopLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`font-mono text-sm tracking-wide hover:underline ${
        active ? "underline" : ""
      }`}
    >
      {label}
    </Link>
  );
}

export default function Nav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [hideBottomBar, setHideBottomBar] = useState(false);
  const [hideHeaderBar, setHideHeaderBar] = useState(false);

  const lastScrollYRef = useRef(0);
  const downAccumBottomRef = useRef(0);
  const downAccumHeaderRef = useRef(0);
  const upAccumBottomRef = useRef(0);
  const hasEnoughScrollRef = useRef(false);
  const isMobileRef = useRef(false);
  const hideBottomRef = useRef(false);
  const hideHeaderRef = useRef(false);

  const username =
    (session?.user?.name as string | null) ?? session?.user?.email ?? null;

  const links = [
    { href: "/", label: "Home", isActive: pathname === "/" },
    {
      href: "/courses",
      label: "Courses",
      // Active on /courses and individual course pages
      isActive: pathname === "/courses" || pathname.startsWith("/course/"),
    },
    { href: "/dictionary", label: "Dictionary", isActive: pathname === "/dictionary" },
    { href: "/copy-library", label: "Clipboard", isActive: pathname === "/copy-library" },
    { href: "/about", label: "About", isActive: pathname === "/about" },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = window.innerWidth < 768;
    isMobileRef.current = isMobile;
    lastScrollYRef.current = window.scrollY || 0;

    if (!isMobile) return;

    const onScroll = (e: Event) => {
      if (!isMobileRef.current) return;

      const target = e.target as any;
      const currentY =
        typeof target?.scrollTop === "number" ? target.scrollTop : window.scrollY || 0;
      const scrollHeight =
        typeof target?.scrollHeight === "number"
          ? target.scrollHeight
          : document.documentElement.scrollHeight;
      const clientHeight =
        typeof target?.clientHeight === "number" ? target.clientHeight : window.innerHeight;
      const hasEnough = scrollHeight - clientHeight > 300;

      // If there's not enough scroll, keep everything visible.
      if (!hasEnough) {
        downAccumBottomRef.current = 0;
        downAccumHeaderRef.current = 0;
        upAccumBottomRef.current = 0;
        hideBottomRef.current = false;
        hideHeaderRef.current = false;
        setHideBottomBar(false);
        setHideHeaderBar(false);
        lastScrollYRef.current = currentY;
        return;
      }

      const delta = currentY - lastScrollYRef.current;
      lastScrollYRef.current = currentY;

      // Reappear immediately on any upward scroll.
      if (delta < 0) {
        downAccumBottomRef.current = 0;
        downAccumHeaderRef.current = 0;
        // Require a tiny upward distance before showing again,
        // to prevent flicker from micro scroll jitter.
        upAccumBottomRef.current += Math.abs(delta);

        if (hideBottomRef.current) {
          if (upAccumBottomRef.current >= 10) {
            hideBottomRef.current = false;
            setHideBottomBar(false);
          }
        }
        // For the header, always show on upward scroll.
        // This prevents any chance of header state/ref mismatch.
        hideHeaderRef.current = false;
        setHideHeaderBar(false);
        return;
      }

      // Accumulate downward distance so we don't hide immediately.
      if (delta > 0) {
        upAccumBottomRef.current = 0;
        downAccumBottomRef.current += delta;
        downAccumHeaderRef.current += delta;

        if (!hideBottomRef.current && downAccumBottomRef.current >= 80) {
          hideBottomRef.current = true;
          setHideBottomBar(true);
        }
        if (!hideHeaderRef.current && downAccumHeaderRef.current >= 120) {
          hideHeaderRef.current = true;
          setHideHeaderBar(true);
        }
      }
    };

    // Capture so nested scroll containers on iOS still trigger updates.
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, []);

  const headerMaxHeightClass = hideHeaderBar
    ? "max-h-0"
    : "max-h-[calc(env(safe-area-inset-top,0px)+48px)]";

  return (
    <>
      <header
        className={`border-b-0 md:border-b border-black bg-white h-[calc(env(safe-area-inset-top,0px)+48px)] md:h-auto md:min-h-[calc(env(safe-area-inset-top,0px)+56px)] md:max-h-none overflow-hidden ${headerMaxHeightClass}`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          transform: hideHeaderBar ? "translateY(-100%)" : "translateY(0%)",
          transition: "transform 0.25s ease, max-height 0.25s ease",
        }}
      >
        <div className="w-full flex items-center justify-between px-4 py-0 md:max-w-5xl md:mx-auto md:py-3">
          <div className="flex items-center gap-3 pr-4">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <span className="font-pixel text-lg uppercase">ZLUNY</span>
              <Image
                src="/zluny_caterpillar_transparent.png"
                alt="ZLUNY logo"
                width={32}
                height={32}
                className="block"
                priority
              />
            </Link>
            <span className="hidden sm:inline font-mono text-[11px] text-gray-500">
              | AI for all.
            </span>
          </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-3">
          {links.map((link) => (
            <DesktopLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={link.isActive}
            />
          ))}
          <span className="font-mono text-sm text-gray-500">|</span>
          {session ? (
            <>
              <Link
                href="/settings"
                className={`font-mono text-sm tracking-wide hover:underline font-bold ${
                  pathname === "/settings" ? "underline" : ""
                }`}
              >
                {username}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="font-mono text-sm tracking-wide hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`font-mono text-sm tracking-wide hover:underline ${
                  pathname === "/login" ? "underline" : ""
                }`}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className={`font-mono text-sm tracking-wide hover:underline ${
                  pathname === "/signup" ? "underline" : ""
                }`}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile top bar actions */}
        <div className="md:hidden flex items-center gap-2">
          {session ? (
            <>
              <Link href="/settings" className="font-mono text-[10px]">
                {username ?? ""}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="font-mono text-[10px] border border-black px-2 py-1 min-h-[36px]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-mono text-[10px] border border-black px-2 py-1 min-h-[36px] flex items-center justify-center"
              >
                Login
              </Link>
            </>
          )}
        </div>
        </div>
      </header>
      <nav
        className="fixed bottom-0 left-0 right-0 border-t border-black bg-white z-50 flex flex-row md:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          transform: hideBottomBar ? "translateY(100%)" : "translateY(0%)",
          transition: "transform 0.25s ease",
          pointerEvents: hideBottomBar ? "none" : "auto",
        }}
      >
        <Link
          href="/"
          className="flex-1 flex flex-col items-center justify-center min-h-[49px] border-r border-black"
        >
          <span className="font-mono text-[18px] leading-none">⌂</span>
          <span className="font-mono text-[9px] mt-1">HOME</span>
        </Link>
        <Link
          href="/courses"
          className="flex-1 flex flex-col items-center justify-center min-h-[49px] border-r border-black"
        >
          <span className="font-mono text-[18px] leading-none">▤</span>
          <span className="font-mono text-[9px] mt-1">COURSES</span>
        </Link>
        <Link
          href="/copy-library"
          className="flex-1 flex flex-col items-center justify-center min-h-[49px] border-r border-black"
        >
          <span className="font-mono text-[18px] leading-none">⎘</span>
          <span className="font-mono text-[9px] mt-1">CLIPS</span>
        </Link>
        <Link
          href="/dictionary"
          className="flex-1 flex flex-col items-center justify-center min-h-[49px] border-r border-black"
        >
          <span className="font-mono text-[18px] leading-none">▦</span>
          <span className="font-mono text-[9px] mt-1">DICTIONARY</span>
        </Link>
        <Link
          href="/about"
          className="flex-1 flex flex-col items-center justify-center min-h-[49px]"
        >
          <span className="font-mono text-[18px] leading-none">◉</span>
          <span className="font-mono text-[9px] mt-1">ABOUT</span>
        </Link>
      </nav>
      <div
        className="md:hidden"
        style={{ height: "calc(49px + env(safe-area-inset-bottom, 0px))" }}
      />
    </>
  );
}


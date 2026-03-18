"use client";

import React, { useState } from "react";
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
  const [open, setOpen] = useState(false);

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

  return (
    <header
      className="border-b border-black"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        minHeight: "calc(env(safe-area-inset-top, 0px) + 56px)",
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
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

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="md:hidden font-mono text-sm border border-black px-3 py-1.5"
          onClick={() => setOpen((v) => !v)}
        >
          MENU
        </button>
      </div>

      {/* Mobile full-screen menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-white border-t border-black">
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-pixel text-sm w-10 h-10 flex items-center justify-center"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          <div className="max-w-5xl mx-auto px-4 py-4 space-y-3 pt-16">
            <nav className="flex flex-col gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-pixel text-xs tracking-wide ${
                    pathname === link.href ? "underline" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {session ? (
                <>
                  <Link
                    href="/settings"
                    className={`font-pixel text-xs tracking-wide ${
                      pathname === "/settings" ? "underline" : ""
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    Settings
                  </Link>
                  <div className="border-t border-black pt-2 mt-2 space-y-1">
                    {username && (
                      <div className="font-mono text-sm font-bold">{username}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        signOut();
                      }}
                      className="font-mono text-sm text-left hover:underline"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`font-pixel text-xs tracking-wide ${
                      pathname === "/login" ? "underline" : ""
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className={`font-pixel text-xs tracking-wide ${
                      pathname === "/signup" ? "underline" : ""
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}


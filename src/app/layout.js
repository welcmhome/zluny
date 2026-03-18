import "./globals.css";
import Nav from "@/components/Nav";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import { Press_Start_2P, Space_Mono } from "next/font/google";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const mono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = {
  title: "ZLUNY",
  description: "AI for all.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${pixel.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-white text-black antialiased"
        suppressHydrationWarning
      >
        <AuthSessionProvider>
          <div className="min-h-screen flex flex-col">
            <Nav />
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 font-mono border-l border-r border-black min-h-[60vh] max-md:border-l-0 max-md:border-r-0">
              {children}
            </main>
            <footer className="border-t border-black mt-8 py-4 flex justify-center">
              <p className="font-mono text-[11px] text-center text-gray-400">
                Copyright 2026{" "}
                <a
                  href="https://clonet.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Clonet
                </a>
                .
              </p>
            </footer>
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

type LikedCourse = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
};

const CATEGORY_BG: Record<string, string> = {
  "AI Workflows & Automation": "#dcfce7",
  "AI Agents & Tools": "#e0f2fe",
  "Business Operations": "#fef3c7",
  "Research & Analysis": "#f5f5f5",
  "Entrepreneurship & Strategy": "#fee2e2",
  "Coding & Development": "#e5e7eb",
  "Content & Creative": "#fce7f3",
  "Data & Structured Outputs": "#ede9fe",
};

type Props = {
  initialLiked: LikedCourse[];
};

export default function SettingsLikedSection({ initialLiked }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleUnlike(courseId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch("/api/like-course", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId }),
    });
    if (res.ok) setLiked((prev) => prev.filter((c) => c.id !== courseId));
  }

  const firstTen = liked.slice(0, 10);

  return (
    <section className="space-y-2">
      <h2 className="font-mono text-xs font-bold">
        LIKED COURSES ({liked.length})
      </h2>
      {liked.length === 0 ? (
        <p className="font-mono text-xs">NO LIKED COURSES YET.</p>
      ) : (
        <>
          <div className="border border-black font-mono text-xs">
            {firstTen.map((c, idx) => (
              <div
                key={c.id}
                className={`flex items-center justify-between px-3 py-2 gap-2 ${
                  idx < firstTen.length - 1 ? "border-b border-black" : ""
                }`}
              >
                <Link href={`/course/${c.id}`} className="hover:underline flex-1 min-w-0 font-bold">
                  {c.title}
                </Link>
                <span className="border-l border-black pl-2 shrink-0 text-[11px]">
                  {c.difficulty}
                </span>
                <span
                  className="text-[11px] px-1 border border-black shrink-0"
                  style={{ backgroundColor: CATEGORY_BG[c.category] ?? "#f5f5f5" }}
                >
                  {c.category}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleUnlike(c.id, e)}
                  className="text-[11px] underline shrink-0"
                >
                  UNLIKE
                </button>
              </div>
            ))}
          </div>
          {liked.length > 10 && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="font-mono text-xs underline"
            >
              SHOW MORE
            </button>
          )}
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-black p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-pixel text-sm">ALL LIKED COURSES</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="font-mono text-xs border border-black px-2 py-1 btn-plain"
              >
                CLOSE
              </button>
            </div>
            <ul className="overflow-y-auto flex-1 space-y-0 border border-black font-mono text-xs">
              {liked.map((c, idx) => (
                <li
                  key={c.id}
                  className={`flex items-center justify-between px-3 py-2 gap-2 ${
                    idx < liked.length - 1 ? "border-b border-black" : ""
                  }`}
                >
                  <Link
                    href={`/course/${c.id}`}
                    className="hover:underline flex-1 min-w-0 font-bold"
                    onClick={() => setModalOpen(false)}
                  >
                    {c.title}
                  </Link>
                  <span className="border-l border-black pl-2 shrink-0 text-[11px]">
                    {c.difficulty}
                  </span>
                  <span
                    className="text-[11px] px-1 border border-black shrink-0"
                    style={{ backgroundColor: CATEGORY_BG[c.category] ?? "#f5f5f5" }}
                  >
                    {c.category}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleUnlike(c.id, e)}
                    className="text-[11px] underline shrink-0"
                  >
                    UNLIKE
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

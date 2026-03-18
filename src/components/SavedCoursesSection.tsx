"use client";

import { useState } from "react";
import Link from "next/link";

type SavedCourse = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
};

function getCategoryClass(category: string): string {
  const map: Record<string, string> = {
    "AI Workflows & Automation": "category-ai-workflows",
    "AI Agents & Tools": "category-ai-agents",
    "Business Operations": "category-business",
    "Research & Analysis": "category-research",
    "Entrepreneurship & Strategy": "category-entrepreneurship",
    "Coding & Development": "category-coding",
    "Content & Creative": "category-content",
    "Data & Structured Outputs": "category-data",
  };
  return `px-2 py-0.5 border border-black text-[11px] ${map[category] ?? ""}`.trim();
}

function getDifficultyClass(difficulty: string): string {
  const d = difficulty.toLowerCase();
  if (d === "beginner") return "difficulty-beginner px-2 py-0.5 border text-[11px]";
  if (d === "intermediate") return "difficulty-intermediate px-2 py-0.5 border text-[11px]";
  if (d === "advanced") return "difficulty-advanced px-2 py-0.5 border text-[11px]";
  return "px-2 py-0.5 border border-black text-[11px]";
}

type Props = {
  initialCourses: SavedCourse[];
};

export default function SavedCoursesSection({ initialCourses }: Props) {
  const [courses, setCourses] = useState(initialCourses);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (removingId) return;
    setRemovingId(id);
    const prev = courses;
    setCourses((list) => list.filter((c) => c.id !== id));
    try {
      const res = await fetch("/api/save-course", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: id }),
      });
      if (!res.ok) setCourses(prev);
    } catch {
      setCourses(prev);
    } finally {
      setRemovingId(null);
    }
  }

  if (courses.length === 0) {
    return <p className="font-mono text-xs">NO SAVED COURSES YET.</p>;
  }

  return (
    <ul className="space-y-2">
      {courses.map((course) => (
        <li key={course.id}>
          <Link
            href={`/course/${course.id}`}
            className="flex flex-wrap items-center justify-between gap-2 border border-black p-3 font-mono text-xs block hover:bg-gray-50"
          >
            <div className="flex flex-col gap-1">
              <span className="font-bold">{course.title}</span>
              <div className="flex flex-wrap items-center gap-2">
                <span className={getCategoryClass(course.category)}>
                  {course.category}
                </span>
                <span className={getDifficultyClass(course.difficulty)}>
                  {course.difficulty}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => handleRemove(e, course.id)}
              disabled={removingId === course.id}
              className="font-mono text-[11px] underline hover:text-red-600 disabled:opacity-50"
            >
              REMOVE
            </button>
          </Link>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  courseId: string;
  initialSaved: boolean;
  initialLiked: boolean;
  initialLikeCount: number;
  isLoggedIn: boolean;
};

export default function CourseCardIcons({
  courseId,
  initialSaved,
  initialLiked,
  initialLikeCount,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [saving, setSaving] = useState(false);
  const [liking, setLiking] = useState(false);

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (saving) return;
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setSaving(true);
    const next = !saved;
    setSaved(next);
    try {
      const res = await fetch("/api/save-course", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId }),
      });
      if (!res.ok) setSaved(!next);
    } catch {
      setSaved(!next);
    } finally {
      setSaving(false);
    }
  }

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (liking) return;
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLiking(true);
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch("/api/like-course", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId }),
      });
      if (!res.ok) {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
      }
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    } finally {
      setLiking(false);
    }
  }

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={liked ? "Unlike" : "Like"}
        onClick={handleLike}
        disabled={liking}
        className="p-0 border-0 bg-transparent cursor-pointer"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={liked ? "#FF69B4" : "none"}
          stroke="black"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Classic symmetric heart shape */}
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
      <span className="font-mono text-[11px]">{likeCount}</span>
      <button
        type="button"
        aria-label={saved ? "Unsave" : "Save"}
        onClick={handleSave}
        disabled={saving}
        className="p-0 border-0 bg-transparent cursor-pointer"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={saved ? "#FFD700" : "none"}
          stroke="black"
          strokeWidth="1.5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
      </button>
    </div>
  );
}

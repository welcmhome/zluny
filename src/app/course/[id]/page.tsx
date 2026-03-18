import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import CoursePageClient from "./CoursePageClient";

const CATEGORY_CLASS: Record<string, string> = {
  "AI Workflows & Automation": "category-ai-workflows",
  "AI Agents & Tools": "category-ai-agents",
  "Business Operations": "category-business",
  "Research & Analysis": "category-research",
  "Entrepreneurship & Strategy": "category-entrepreneurship",
  "Coding & Development": "category-coding",
  "Content & Creative": "category-content",
  "Data & Structured Outputs": "category-data",
};

const DIFFICULTY_CLASS: Record<string, string> = {
  Beginner: "difficulty-beginner",
  Intermediate: "difficulty-intermediate",
  Advanced: "difficulty-advanced",
};

function parseSections(content: string): { title: string; body: string }[] {
  const trimmed = content.trim();
  if (!trimmed) return [{ title: "Section", body: "" }];
  const parts = trimmed.split(/(?=^##\s+)/m).filter(Boolean);
  return parts.map((part) => {
    const match = part.match(/^##\s+(.+?)(?:\n|$)/s);
    const title = match ? match[1].trim() : "Introduction";
    const body = match ? part.slice(match[0].length).trim() : part.trim();
    return { title, body };
  });
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CoursePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id as string | undefined;

  const client = await db.connect();
  let course: {
    id: string;
    title: string;
    category: string;
    difficulty: string;
    content: string;
    read_time: number;
  } | null = null;
  let questions: { id: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_answer: string }[] = [];
  let userSaved = false;
  let userLiked = false;
  let likeCount = 0;

  try {
    const { rows: courseRows } = await client.query(
      `SELECT id, title, category, difficulty, content, read_time
       FROM courses WHERE id = $1`,
      [id]
    );
    course = courseRows[0] ?? null;
    if (!course) {
      client.release();
      notFound();
    }

    const { rows: questionRows } = await client.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer
       FROM questions WHERE course_id = $1 ORDER BY id ASC`,
      [id]
    );
    questions = (questionRows ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      question_text: (r.question_text as string) ?? "",
      option_a: (r.option_a as string) ?? "A",
      option_b: (r.option_b as string) ?? "B",
      option_c: (r.option_c as string) ?? "C",
      option_d: (r.option_d as string) ?? "D",
      correct_answer: String(r.correct_answer ?? ""),
    }));

    if (userId) {
      const { rows: savedRows } = await client.query(
        `SELECT 1 FROM saved_courses WHERE user_id = $1 AND course_id = $2`,
        [userId, id]
      );
      userSaved = savedRows.length > 0;
      const { rows: likedRows } = await client.query(
        `SELECT 1 FROM course_likes WHERE user_id = $1 AND course_id = $2`,
        [userId, id]
      );
      userLiked = likedRows.length > 0;
    }

    const { rows: countRows } = await client.query(
      `SELECT COUNT(*)::int AS c FROM course_likes WHERE course_id = $1`,
      [id]
    );
    likeCount = countRows[0]?.c ?? 0;
  } finally {
    client.release();
  }

  const sections = parseSections(course.content);
  const categoryClass = CATEGORY_CLASS[course.category] ?? "";
  const difficultyClass = DIFFICULTY_CLASS[course.difficulty] ?? "";

  return (
    <CoursePageClient
      courseId={course.id}
      courseTitle={course.title}
      category={course.category}
      difficulty={course.difficulty}
      categoryClass={categoryClass}
      difficultyClass={difficultyClass}
      sections={sections}
      questions={questions.slice(0, 8)}
      initialSaved={userSaved}
      initialLiked={userLiked}
      initialLikeCount={likeCount}
      loggedIn={!!userId}
    />
  );
}

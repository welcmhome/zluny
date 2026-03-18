import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import CourseCardIcons from "@/components/CourseCardIcons";

const CATEGORIES = [
  "AI Workflows & Automation",
  "AI Agents & Tools",
  "Business Operations",
  "Research & Analysis",
  "Entrepreneurship & Strategy",
  "Coding & Development",
  "Content & Creative",
  "Data & Structured Outputs",
] as const;

type CourseRow = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  read_time: number;
  created_at: string;
  like_count: number;
  user_saved: boolean;
  user_liked: boolean;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

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
  return `px-2 py-0.5 border border-black ${map[category] ?? ""}`.trim();
}

function getDifficultyClass(difficulty: string): string {
  const d = difficulty.toLowerCase();
  if (d === "beginner") return "difficulty-beginner px-2 py-0.5";
  if (d === "intermediate") return "difficulty-intermediate px-2 py-0.5";
  if (d === "advanced") return "difficulty-advanced px-2 py-0.5";
  return "px-2 py-0.5";
}

function CourseCard({ course, loggedIn }: { course: CourseRow; loggedIn: boolean }) {
  return (
    <div className="border border-black p-3 font-mono text-xs relative min-h-[110px] flex flex-col">
      <div className="absolute top-3 right-3 z-10">
        <CourseCardIcons
          courseId={course.id}
          initialSaved={course.user_saved}
          initialLiked={course.user_liked}
          initialLikeCount={Number(course.like_count) ?? 0}
          isLoggedIn={loggedIn}
        />
      </div>
      <Link
        href={`/course/${course.id}`}
        className="block pr-20 flex-1 hover:text-blue-600 hover:underline hover:decoration-blue-600"
      >
        <div className="flex flex-wrap gap-2 mb-1">
          <span className={getCategoryClass(course.category)}>{course.category}</span>
          <span className={getDifficultyClass(course.difficulty)}>
            {course.difficulty}
          </span>
        </div>
        <div className="font-bold text-sm mb-1">{course.title}</div>
      </Link>
      <div className="mt-auto pt-1 flex justify-between text-[11px]">
        <span>Last updated {formatDate(course.created_at)}</span>
        <span>{course.read_time} min</span>
      </div>
    </div>
  );
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const params = searchParams ?? {};
  const categoryParam = params.category;
  const category =
    categoryParam &&
    CATEGORIES.includes(categoryParam as (typeof CATEGORIES)[number])
      ? categoryParam
      : undefined;

  const session = await auth();
  const userId = session?.user?.id as string | undefined;

  const client = await db.connect();
  let courses: CourseRow[] = [];

  try {
    const queryParams: any[] = [];
    let text = `
      SELECT
        c.id,
        c.title,
        c.category,
        c.difficulty,
        c.read_time,
        c.created_at,
        COALESCE(cl.count, 0) AS like_count,
        CASE WHEN sc.user_id IS NULL THEN FALSE ELSE TRUE END AS user_saved,
        CASE WHEN ul.user_id IS NULL THEN FALSE ELSE TRUE END AS user_liked
      FROM courses c
      LEFT JOIN (
        SELECT course_id, COUNT(*) AS count
        FROM course_likes
        GROUP BY course_id
      ) cl ON cl.course_id = c.id
      LEFT JOIN saved_courses sc
        ON sc.course_id = c.id AND sc.user_id = $1
      LEFT JOIN course_likes ul
        ON ul.course_id = c.id AND ul.user_id = $1
    `;

    if (category) {
      queryParams.push(userId ?? null, category);
      text += " WHERE c.category = $2";
    } else {
      queryParams.push(userId ?? null);
    }

    text += " ORDER BY c.created_at DESC";
    const { rows } = await client.query(text, queryParams);
    courses = rows;
  } finally {
    client.release();
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-black pb-4">
        <h1 className="font-pixel text-2xl mb-1">COURSES</h1>
        <p className="font-mono text-xs">
          Daily AI mini-courses and lessons.
        </p>
      </header>

      <section>
        <p className="font-mono text-sm mb-4">Filter by category:</p>
        <ul className="flex flex-wrap gap-2 border-b border-black pb-4 mb-6">
          <li>
            <Link
              href="/courses"
              className={`font-mono text-sm border border-black px-3 py-1 inline-block bg-white text-black btn-plain ${
                !category ? "btn-selected" : ""
              }`}
            >
              All
            </Link>
          </li>
          {CATEGORIES.map((cat) => (
            <li key={cat}>
              <Link
                href={
                  category === cat
                    ? "/courses"
                    : `/courses?category=${encodeURIComponent(cat)}`
                }
                className={`font-mono text-sm border border-black px-3 py-1 inline-block bg-white text-black btn-plain ${
                  category === cat ? "btn-selected" : ""
                }`}
              >
                {cat}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        {courses.length === 0 ? (
          <p className="font-mono text-xs">
            NO COURSES YET.{" "}
            <Link href="/" className="hover:underline">
              BACK TO HOME →
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {courses.map((course) => (
              <li key={course.id} className="w-full">
                <CourseCard course={course} loggedIn={!!userId} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}


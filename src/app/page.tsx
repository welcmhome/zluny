import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import CourseCardIcons from "@/components/CourseCardIcons";
import SavedCoursesSection from "@/components/SavedCoursesSection";

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

type CompletedRow = {
  course_id: string;
  title: string;
  difficulty: string;
  score: number;
  points_earned: number;
  completed_at: string;
};

type SavedRow = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
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

export default async function HomePage({
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
  let stats:
    | {
        total_points: number;
        courses_completed: number;
        streak: number;
      }
    | null = null;
  let completed: CompletedRow[] = [];
  let saved: SavedRow[] = [];

  try {
    // Courses with like/save state
    {
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
    }

    if (userId) {
      // Stats
      const { rows: userRows } = await client.query(
        "SELECT total_points, courses_completed FROM users WHERE id = $1",
        [userId]
      );
      const u = userRows[0];

      // Completed courses
      const { rows: attempts } = await client.query(
        `SELECT qa.course_id,
                qa.score,
                qa.points_earned,
                qa.completed_at,
                c.title,
                c.difficulty
         FROM quiz_attempts qa
         JOIN courses c ON c.id = qa.course_id
         WHERE qa.user_id = $1
         ORDER BY qa.completed_at DESC`,
        [userId]
      );

      completed = attempts.map((row: any) => ({
        course_id: row.course_id,
        title: row.title,
        difficulty: row.difficulty,
        score: row.score,
        points_earned: row.points_earned,
        completed_at: row.completed_at,
      }));

      // Streak
      const dateSet = new Set(
        attempts.map((row: any) =>
          new Date(row.completed_at).toISOString().slice(0, 10)
        )
      );
      let streak = 0;
      let current = new Date();
      const todayStr = current.toISOString().slice(0, 10);
      if (dateSet.has(todayStr)) {
        while (true) {
          const key = current.toISOString().slice(0, 10);
          if (!dateSet.has(key)) break;
          streak += 1;
          current.setDate(current.getDate() - 1);
        }
      }

      stats = {
        total_points: u?.total_points ?? 0,
        courses_completed: u?.courses_completed ?? 0,
        streak,
      };

      // Saved courses
      const { rows: savedRows } = await client.query(
        `SELECT c.id, c.title, c.category, c.difficulty
         FROM saved_courses s
         JOIN courses c ON c.id = s.course_id
         WHERE s.user_id = $1
         ORDER BY s.saved_at DESC`,
        [userId]
      );
      saved = savedRows;
    }
  } finally {
    client.release();
  }

  // Logged-out: listing view
  if (!userId || !stats) {
    return (
      <div className="space-y-6">
        <header className="border-b border-black pb-6">
          <h1 className="font-pixel text-2xl mb-2">ZLUNY</h1>
          <p className="font-mono text-xs">
            ZLUNY. Use AI. Build with it. Make it work.
          </p>
        </header>

        <section>
          <p className="font-mono text-sm mb-4">Filter by category:</p>
          <ul className="flex flex-wrap gap-2 border-b border-black pb-4 mb-6">
            <li>
              <Link
                href="/"
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
                      ? "/"
                      : `/?category=${encodeURIComponent(cat)}`
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
            <p className="font-mono text-xs">NO COURSES YET.</p>
          ) : (
            <ul className="space-y-3">
              {courses.map((course) => (
                <li key={course.id} className="w-full">
                  <CourseCard course={course} loggedIn={false} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  // Logged-in: dashboard view
  const username =
    (session?.user?.name as string | null) ??
    (session?.user?.email as string | null) ??
    "User";
  const today = new Date().toLocaleDateString();

  return (
    <div className="space-y-6">
      <header className="border-b border-black pb-4 space-y-2">
        <h1 className="font-pixel text-2xl mb-2">
          WELCOME BACK, {username.toUpperCase()}.
        </h1>
          <p className="font-mono text-sm text-gray-400">{today}</p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-black p-3">
          <p className="font-mono text-[11px] mb-1">TOTAL POINTS</p>
          <p className="font-mono text-sm">{stats.total_points}</p>
        </div>
        <div className="border border-black p-3">
          <p className="font-mono text-[11px] mb-1">COURSES COMPLETED</p>
          <p className="font-mono text-sm">{stats.courses_completed}</p>
        </div>
        <div className="border border-black p-3">
          <p className="font-mono text-[11px] mb-1">CURRENT STREAK</p>
          <p className="font-mono text-sm">{stats.streak} days</p>
        </div>
      </section>

      {/* Completed courses */}
      <section className="space-y-3">
        <h2 className="font-pixel text-sm border-b border-black pb-1">
          COMPLETED COURSES
        </h2>
        {completed.length === 0 ? (
          <p className="font-mono text-xs">
            NO COURSES COMPLETED YET.{" "}
            <Link href="/courses" className="hover:underline">
              START LEARNING →
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {completed.map((c) => (
              <li
                key={`${c.course_id}-${c.completed_at}`}
                className="border border-black p-3 font-mono text-xs"
              >
                <div className="flex flex-wrap justify-between gap-2 mb-1">
                  <Link
                    href={`/course/${c.course_id}`}
                    className="font-bold hover:underline"
                  >
                    {c.title}
                  </Link>
                  <span className={getDifficultyClass(c.difficulty)}>
                    {c.difficulty}
                  </span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span>
                    Score: {c.score}/8 · Points: {c.points_earned}
                  </span>
                  <span>{formatDate(c.completed_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Saved courses */}
      <section className="space-y-3">
        <h2 className="font-pixel text-sm border-b border-black pb-1">
          SAVED COURSES
        </h2>
        <SavedCoursesSection initialCourses={saved} />
      </section>

      {/* Continue learning */}
      <section className="pt-2 border-t border-black">
        <Link
          href="/courses"
          className="inline-block font-mono text-sm border border-black px-4 py-2 bg-white text-black btn-plain"
        >
          BROWSE ALL COURSES →
        </Link>
      </section>
    </div>
  );
}


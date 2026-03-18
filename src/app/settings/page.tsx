import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import SettingsLikedSection from "@/components/SettingsLikedSection";
import SettingsPasswordForm from "@/components/SettingsPasswordForm";
import SettingsDangerZone from "@/components/SettingsDangerZone";

type LikedCourse = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
};

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id as string | undefined;
  const username =
    (session?.user?.name as string | null) ??
    (session?.user?.email as string | null) ??
    "User";
  const email = (session?.user?.email as string | null) ?? "";

  if (!userId) {
    redirect("/login");
  }

  const client = await db.connect();
  let likedCourses: LikedCourse[] = [];

  try {
    const { rows } = await client.query(
      `SELECT c.id, c.title, c.category, c.difficulty
       FROM course_likes cl
       JOIN courses c ON c.id = cl.course_id
       WHERE cl.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    likedCourses = rows;
  } finally {
    client.release();
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-black pb-4">
        <h1 className="font-pixel text-2xl mb-2">SETTINGS</h1>
        <div className="border-t border-black pt-2 flex items-center justify-between">
          <span className="font-mono text-sm font-bold">{username}</span>
          <Link
            href="/api/auth/signout?callbackUrl=/"
            className="font-mono text-sm hover:underline"
          >
            Logout
          </Link>
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="font-mono text-xs font-bold">ACCOUNT INFO</h2>
        <div className="border border-black p-3 font-mono text-xs space-y-1">
          <p>USERNAME: {username}</p>
          <p>EMAIL: {email}</p>
        </div>
      </section>

      <SettingsLikedSection initialLiked={likedCourses} />
      <SettingsPasswordForm />
      <SettingsDangerZone username={username} />
    </div>
  );
}

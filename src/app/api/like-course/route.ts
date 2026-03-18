import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const courseId = body?.course_id ?? body?.courseId;

  if (!courseId) {
    return NextResponse.json(
      { error: "Missing course_id" },
      { status: 400 }
    );
  }

  const client = await db.connect();
  try {
    await client.query(
      `INSERT INTO course_likes (user_id, course_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, course_id) DO NOTHING`,
      [userId, courseId]
    );
  } finally {
    client.release();
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const courseId = body?.course_id ?? body?.courseId;

  if (!courseId) {
    return NextResponse.json(
      { error: "Missing course_id" },
      { status: 400 }
    );
  }

  const client = await db.connect();
  try {
    await client.query(
      `DELETE FROM course_likes
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );
  } finally {
    client.release();
  }

  return NextResponse.json({ success: true });
}


import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await auth();
  const userId = (session?.user?.id as string | undefined) ?? null;

  const body = await request.json().catch(() => null);

  const title = body?.title?.trim();
  const category = body?.category?.trim();
  const description = body?.description?.trim();
  const content = body?.content?.trim();
  const worksWith = body?.works_with?.trim();

  if (!title || !category || !description || !content || !worksWith) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const client = await db.connect();
  try {
    await client.query(
      `INSERT INTO copy_resources
       (title, category, description, content, works_with, submitted_by, approved)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
      [title, category, description, content, worksWith, userId]
    );
  } catch (err) {
    console.error("Copy resource submit error:", err);
    return NextResponse.json(
      { error: "Failed to submit resource." },
      { status: 500 }
    );
  } finally {
    client.release();
  }

  return NextResponse.json({ success: true });
}


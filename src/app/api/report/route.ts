import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await auth();
  const userId = (session?.user?.id as string | undefined) ?? null;

  const body = await request.json().catch(() => null);

  const contentType = body?.content_type as string | undefined;
  const contentId = body?.content_id as string | undefined;
  const contentName = body?.content_name as string | undefined;
  const issueType = body?.issue_type as string | undefined;
  const details = (body?.details as string | undefined) ?? null;

  if (!contentType || !contentId || !contentName || !issueType) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const client = await db.connect();
  try {
    await client.query(
      `INSERT INTO reports (content_type, content_id, content_name, issue_type, details, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [contentType, contentId, contentName, issueType, details, userId]
    );
  } catch (err) {
    console.error("Report error:", err);
    return NextResponse.json(
      { error: "Failed to submit report." },
      { status: 500 }
    );
  } finally {
    client.release();
  }

  return NextResponse.json({ success: true });
}


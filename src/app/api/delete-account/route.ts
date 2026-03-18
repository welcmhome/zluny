import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await db.connect();
  try {
    await client.query("DELETE FROM users WHERE id = $1", [userId]);
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json(
      { error: "Failed to delete account." },
      { status: 500 }
    );
  } finally {
    client.release();
  }

  return NextResponse.json({ success: true });
}


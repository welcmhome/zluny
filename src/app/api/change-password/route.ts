import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body =
    (await request.json().catch(async () => {
      // Support form-encoded fallback
      const formData = await request.formData().catch(() => null);
      if (!formData) return null;
      return {
        current_password: formData.get("current_password"),
        new_password: formData.get("new_password"),
        confirm_password: formData.get("confirm_password"),
      };
    })) ?? null;

  const currentPassword = body?.current_password as string | undefined;
  const newPassword = body?.new_password as string | undefined;
  const confirmPassword = body?.confirm_password as string | undefined;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "Missing password fields." },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match." },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const client = await db.connect();

  try {
    const {
      rows: [row],
    } = await client.query(
      "SELECT password_hash FROM user_credentials WHERE user_id = $1",
      [userId]
    );

    if (!row?.password_hash) {
      return NextResponse.json(
        { error: "No password set for this user." },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(currentPassword, row.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await client.query(
      "UPDATE user_credentials SET password_hash = $1 WHERE user_id = $2",
      [newHash, userId]
    );
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 }
    );
  } finally {
    client.release();
  }

  return NextResponse.json({ success: true });
}


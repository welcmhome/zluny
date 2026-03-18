import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const username = body?.username?.trim();
    const email = body?.email?.trim();
    const password = body?.password as string | undefined;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Missing username, email, or password." },
        { status: 400 }
      );
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const { rows: existing } = await client.query(
        "SELECT id FROM users WHERE email = $1 OR username = $2",
        [email, username]
      );
      if (existing.length > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "User with this email or username already exists." },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const {
        rows: [user],
      } = await client.query(
        "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id",
        [username, email]
      );

      await client.query(
        "INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)",
        [user.id, passwordHash]
      );

      await client.query("COMMIT");

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Signup error:", err);
      return NextResponse.json(
        { error: "Failed to create user." },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Signup parse error:", err);
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}


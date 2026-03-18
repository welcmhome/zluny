import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";

type AnswersPayload = Record<string, string>;

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const courseId = body?.course_id as string | undefined;
  const answers = body?.answers as AnswersPayload | undefined;

  if (!courseId || !answers) {
    return NextResponse.json(
      { error: "Missing course_id or answers." },
      { status: 400 }
    );
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Course difficulty
    const {
      rows: [course],
    } = await client.query(
      "SELECT difficulty FROM courses WHERE id = $1",
      [courseId]
    );
    if (!course) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const difficulty = (course.difficulty as string).toLowerCase();
    let pointsPerCorrect = 10;
    if (difficulty === "beginner") pointsPerCorrect = 5;
    else if (difficulty === "advanced") pointsPerCorrect = 15;

    // Questions
    const { rows: questions } = await client.query(
      "SELECT id, correct_answer FROM questions WHERE course_id = $1",
      [courseId]
    );

    const totalQuestions = questions.length;
    if (totalQuestions === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "No questions for this course." },
        { status: 400 }
      );
    }

    let correctCount = 0;
    for (const q of questions) {
      const given = (answers[q.id] as string | undefined)?.toUpperCase?.();
      if (given && given === q.correct_answer) {
        correctCount += 1;
      }
    }

    const pointsEarned = correctCount * pointsPerCorrect;

    await client.query(
      `INSERT INTO quiz_attempts (user_id, course_id, score, points_earned)
       VALUES ($1, $2, $3, $4)`,
      [userId, courseId, correctCount, pointsEarned]
    );

    await client.query(
      `UPDATE users
       SET total_points = total_points + $1,
           courses_completed = courses_completed + 1
       WHERE id = $2`,
      [pointsEarned, userId]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      score: correctCount,
      points_earned: pointsEarned,
      total_questions: totalQuestions,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Submit quiz error:", err);
    return NextResponse.json(
      { error: "Failed to submit quiz." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}


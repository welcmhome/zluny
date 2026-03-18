import "dotenv/config";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

async function main() {
  const client = await db.connect();

  try {
    console.log("Seeding ZLUNY demo data...");
    await client.query("BEGIN");

    // 1) Create demo user
    const email = "demo@zluny.test";
    const username = "demo";
    const passwordPlain = "password123";

    const { rows: existingUsers } = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    let userId: string;
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log("Demo user already exists:", userId);
    } else {
      const passwordHash = await bcrypt.hash(passwordPlain, 10);
      const {
        rows: [user],
      } = await client.query(
        "INSERT INTO users (username, email, total_points, courses_completed) VALUES ($1, $2, 0, 0) RETURNING id",
        [username, email]
      );
      userId = user.id;
      await client.query(
        "INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)",
        [userId, passwordHash]
      );
      console.log("Created demo user:", email, "password:", passwordPlain);
    }

    // 2) Create demo courses
    const coursesData = [
      {
        title: "Daily AI Briefing: Agents & Workflows",
        category: "AI Workflows & Automation",
        difficulty: "Beginner",
        read_time: 8,
        content: `## Overview

Welcome to ZLUNY. This course walks through a practical AI workflow using agents and simple automation.

## Why agents matter

Agents let you move from single prompts to repeatable systems that observe, decide, and act.

## Simple workflow example

Start with a trigger (new email), run an AI step (summarize + label), then push results into your tools.`,
      },
      {
        title: "Hands-on RAG: From Notes to Answers",
        category: "Data & Structured Outputs",
        difficulty: "Intermediate",
        read_time: 10,
        content: `## RAG in practice

Retrieval-Augmented Generation (RAG) combines search with generation so answers stay grounded.

## Index your notes

Chunk your notes, create embeddings, and store them in a vector database.

## Ask better questions

Use prompts that show the model how to combine retrieved context with clear reasoning steps.`,
      },
    ];

    const courseIds: string[] = [];

    for (const c of coursesData) {
      const { rows } = await client.query(
        "SELECT id FROM courses WHERE title = $1",
        [c.title]
      );
      if (rows.length > 0) {
        courseIds.push(rows[0].id);
        console.log("Course already exists:", c.title);
        continue;
      }
      const {
        rows: [course],
      } = await client.query(
        `INSERT INTO courses (title, category, content, difficulty, read_time)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [c.title, c.category, c.content, c.difficulty, c.read_time]
      );
      courseIds.push(course.id);
      console.log("Created course:", c.title);
    }

    // 3) Create simple 4-question quiz for each course
    for (const courseId of courseIds) {
      const { rows: existingQ } = await client.query(
        "SELECT id FROM questions WHERE course_id = $1",
        [courseId]
      );
      if (existingQ.length > 0) {
        console.log("Questions already exist for course", courseId);
        continue;
      }

      const questions = [
        {
          question_text: "What is the main goal of this course?",
          option_a: "To introduce practical AI workflows",
          option_b: "To teach advanced calculus",
          option_c: "To configure web servers",
          option_d: "To design logos",
          correct_answer: "A",
        },
        {
          question_text: "What does an AI agent do?",
          option_a: "Only answers one-off questions",
          option_b: "Actively observes, decides, and acts in a loop",
          option_c: "Stores files",
          option_d: "Compiles code",
          correct_answer: "B",
        },
        {
          question_text: "What does RAG stand for?",
          option_a: "Random AI Generator",
          option_b: "Retrieval-Augmented Generation",
          option_c: "Rapid Application Generation",
          option_d: "Reasoning and Generation",
          correct_answer: "B",
        },
        {
          question_text: "Why use a vector database?",
          option_a: "To store images only",
          option_b: "To host your website",
          option_c: "To quickly find semantically similar text chunks",
          option_d: "To compile TypeScript",
          correct_answer: "C",
        },
      ];

      for (const q of questions) {
        await client.query(
          `INSERT INTO questions
           (course_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            courseId,
            q.question_text,
            q.option_a,
            q.option_b,
            q.option_c,
            q.option_d,
            q.correct_answer,
          ]
        );
      }

      console.log("Created questions for course", courseId);
    }

    // 4) Copy library demo resources
    const copyResources = [
      {
        title: "Daily AI Briefing Prompt",
        category: "Prompts",
        works_with: "Claude",
        description:
          "Turn today’s AI news into a 3-bullet briefing with actions.",
        content: `You are an AI research assistant.

Task: Turn the latest AI news into a short, actionable briefing.

Steps:
1) Read the provided links or text.
2) Extract the 3 most important developments.
3) For each, give:
   - One-sentence summary
   - Why it matters for builders
   - One concrete next step I could take today.

Output format:
- [Title]
  - Summary:
  - Why it matters:
  - Next step:`,
      },
      {
        title: "Agent Design Template",
        category: "Agents",
        works_with: "Universal",
        description:
          "Structured template for defining an AI agent, tools, and safety rails.",
        content: `Goal:
- What outcome should this agent achieve?

Inputs:
- What information does it receive?

Tools:
- Which tools/APIs can it call?

Constraints:
- What is it NOT allowed to do?

Loop:
- How often should it act?
- When should it stop?`,
      },
    ];

    for (const r of copyResources) {
      const { rows } = await client.query(
        "SELECT id FROM copy_resources WHERE title = $1",
        [r.title]
      );
      if (rows.length > 0) {
        console.log("Copy resource already exists:", r.title);
        continue;
      }
      await client.query(
        `INSERT INTO copy_resources
         (title, category, description, content, works_with, submitted_by, approved)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
        [
          r.title,
          r.category,
          r.description,
          r.content,
          r.works_with,
          userId,
        ]
      );
      console.log("Created copy resource:", r.title);
    }

    await client.query("COMMIT");
    console.log("Seeding complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed error:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.end();
  }
}

main();


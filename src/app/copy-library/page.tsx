import { db } from "@/lib/db";
import Link from "next/link";
import CopyLibraryClient from "./CopyLibraryClient";

type Resource = {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  works_with: string;
};

export default async function CopyLibraryPage() {
  const client = await db.connect();
  let resources: Resource[] = [];
  try {
    const { rows } = await client.query(
      `SELECT id, title, category, description, content, works_with
       FROM copy_resources
       WHERE approved = true
       ORDER BY created_at DESC`
    );
    resources = rows;
  } finally {
    client.release();
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-black pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-pixel text-2xl mb-1">CLIPBOARD</h1>
          <p className="font-mono text-xs">
            Copy-ready prompts, agents, and templates.
          </p>
        </div>
        <Link
          href="/copy-library/submit"
          className="font-mono text-xs border border-black px-3 py-1 btn-plain"
        >
          SUBMIT A RESOURCE
        </Link>
      </header>
      <CopyLibraryClient initialResources={resources} />
    </div>
  );
}

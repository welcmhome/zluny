import Link from "next/link";
import { db } from "@/lib/db";
import CopyLibraryDetailClient from "./CopyLibraryDetailClient";
import ReportButton from "@/components/ReportButton";

const CATEGORY_BG: Record<string, string> = {
  Prompts: "#fef3c7",
  Agents: "#e0f2fe",
  Workflows: "#dcfce7",
  "Structured Outputs": "#f5f5f5",
  Developer: "#e5e7eb",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CopyLibraryDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await db.connect();
  let resource: {
    id: string;
    title: string;
    category: string;
    description: string;
    content: string;
    works_with: string;
  } | null = null;
  try {
    const { rows } = await client.query(
      `SELECT id, title, category, description, content, works_with
       FROM copy_resources
       WHERE id = $1 AND approved = true`,
      [id]
    );
    resource = rows[0] ?? null;
  } finally {
    client.release();
  }

  if (!resource) {
    return (
      <div className="space-y-4">
        <Link href="/copy-library" className="font-mono text-xs underline">
          ← BACK TO CLIPBOARD
        </Link>
        <p className="font-mono text-xs">Resource not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/copy-library" className="font-mono text-xs underline">
        ← BACK TO CLIPBOARD
      </Link>
      <header className="border-b border-black pb-4">
        <h1 className="font-pixel text-xl mb-2">{resource.title}</h1>
        <div className="flex flex-wrap gap-2 font-mono text-xs">
          <span
            className="px-2 py-0.5 border border-black"
            style={{ backgroundColor: CATEGORY_BG[resource.category] ?? "#f5f5f5" }}
          >
            {resource.category}
          </span>
          <span className="px-2 py-0.5 border border-black">
            {resource.works_with}
          </span>
        </div>
      </header>
      <p className="font-mono text-sm">{resource.description}</p>
      <div className="clipboard-code font-mono text-sm whitespace-pre-wrap">
        {resource.content}
      </div>
      <div className="flex items-center justify-between gap-2 pt-2">
        <CopyLibraryDetailClient content={resource.content} />
        <p className="font-mono text-xs text-gray-500">
          Is something wrong?{" "}
          <ReportButton
            contentType="copy_resource"
            contentId={resource.id}
            contentName={resource.title}
            label="Report"
          />
        </p>
      </div>
    </div>
  );
}

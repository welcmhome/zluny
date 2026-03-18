"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const COPY_CATEGORIES = [
  "All",
  "Prompts",
  "Agents",
  "Workflows",
  "Structured Outputs",
  "Developer",
] as const;

const CATEGORY_BG: Record<string, string> = {
  Prompts: "#fef3c7",
  Agents: "#e0f2fe",
  Workflows: "#dcfce7",
  "Structured Outputs": "#f5f5f5",
  Developer: "#e5e7eb",
};

type Resource = {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  works_with: string;
};

type Props = {
  initialResources: Resource[];
};

export default function CopyLibraryClient({ initialResources }: Props) {
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = initialResources;
    if (category !== "All") {
      list = list.filter((r) => r.category === category);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [initialResources, category, search]);

  function copyContent(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-black pb-4">
        {COPY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`font-mono text-xs border border-black px-2 py-1 btn-plain ${
              category === cat ? "btn-selected" : ""
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md font-mono text-xs border border-black px-2 py-1 bg-white text-black"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="font-mono text-xs">NO RESOURCES YET.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="border border-black p-3 font-mono text-xs"
            >
              <div>
                <div className="font-bold text-sm mb-1">{r.title}</div>
                <span
                  className="inline-block px-2 py-0.5 border border-black text-[11px] mb-1"
                  style={{
                    backgroundColor: CATEGORY_BG[r.category] ?? "#f5f5f5",
                  }}
                >
                  {r.category}
                </span>
                <span className="ml-2 text-[11px]">{r.works_with}</span>
                <p className="mt-1 text-[11px] text-gray-700 line-clamp-2">
                  {r.description.slice(0, 100)}
                  {r.description.length > 100 ? "..." : ""}
                </p>
                {/* Snippet preview area with copy icon */}
                <div className="mt-2 border border-gray-400 bg-gray-100 px-2 py-2 relative">
                  <div className="pr-6 text-[11px] whitespace-pre-wrap max-h-40 overflow-hidden">
                    {r.content}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyContent(r.id, r.content)}
                    className="absolute top-1 right-1 text-[18px] leading-none"
                    title="Copy"
                  >
                    {copiedId === r.id ? "✓" : "⎘"}
                  </button>
                </div>
                <Link
                  href={`/copy-library/${r.id}`}
                  className="text-[11px] underline mt-2 inline-block text-blue-600"
                >
                  View details →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

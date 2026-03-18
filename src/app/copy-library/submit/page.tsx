"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  "Prompts",
  "Agents",
  "Workflows",
  "Structured Outputs",
  "Developer",
];
const WORKS_WITH = ["Claude", "ChatGPT", "Cursor", "n8n", "Universal"];

export default function CopyLibrarySubmitPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [worksWith, setWorksWith] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/copy-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim(),
          works_with: worksWith.trim(),
          description: description.trim(),
          content: content.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-pixel text-2xl">SUBMIT A RESOURCE</h1>
      {success ? (
        <p className="font-mono text-xs">SUBMITTED FOR REVIEW. THANK YOU.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs max-w-xl">
          <div>
            <label htmlFor="title" className="block mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-black px-2 py-1 bg-white text-black"
            />
          </div>
          <div>
            <label htmlFor="category" className="block mb-1">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full border border-black px-2 py-1 bg-white text-black"
            >
              <option value="">Select...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="works_with" className="block mb-1">Works With</label>
            <select
              id="works_with"
              value={worksWith}
              onChange={(e) => setWorksWith(e.target.value)}
              required
              className="w-full border border-black px-2 py-1 bg-white text-black"
            >
              <option value="">Select...</option>
              {WORKS_WITH.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full border border-black px-2 py-1 bg-white text-black min-h-[80px]"
            />
          </div>
          <div>
            <label htmlFor="content" className="block mb-1">Content (full copyable content)</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full border border-black px-2 py-1 bg-white text-black min-h-[200px] font-mono"
            />
          </div>
          {error && <p className="text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-plain border border-black px-3 py-1">
            SUBMIT
          </button>
        </form>
      )}
      <Link href="/copy-library" className="font-mono text-xs underline">
        ← Back to Clipboard
      </Link>
    </div>
  );
}

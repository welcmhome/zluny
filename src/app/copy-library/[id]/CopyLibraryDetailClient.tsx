"use client";

import { useState } from "react";

type Props = {
  content: string;
};

export default function CopyLibraryDetailClient({ content }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="font-mono text-xs border border-black px-4 py-2 btn-plain w-full sm:w-auto"
    >
      {copied ? "COPIED." : "COPY TO CLIPBOARD"}
    </button>
  );
}

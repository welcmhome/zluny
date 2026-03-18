"use client";

import { useMemo, useState } from "react";

const terms = [
  {
    term: "AI Agent",
    definition: "A software system that perceives its environment, reasons about it, and takes autonomous actions to achieve a goal. Unlike chatbots, agents act in loops and use tools.",
    related: ["LLM", "MCP", "Chain of Thought"],
  },
  {
    term: "Chain of Thought",
    definition: "A prompting technique where the model is instructed to reason step by step before giving a final answer, improving accuracy on complex tasks.",
    related: ["Prompt Engineering", "Few-shot"],
  },
  {
    term: "Context Window",
    definition: "The maximum amount of text an LLM can process at once, including both input and output. Measured in tokens.",
    related: ["Tokens", "LLM"],
  },
  {
    term: "Embeddings",
    definition: "Numerical representations of text as vectors. Similar concepts have similar vectors, enabling semantic search and retrieval.",
    related: ["Vector Database", "RAG"],
  },
  {
    term: "Few-shot",
    definition: "A prompting approach where you include a small number of examples in the prompt to guide the model toward the desired output format or behavior.",
    related: ["Zero-shot", "Prompt Engineering"],
  },
  {
    term: "Fine-tuning",
    definition: "Training a pre-trained model further on a specific dataset to improve performance on a particular task or domain.",
    related: ["LLM", "Tokens"],
  },
  {
    term: "Hallucination",
    definition: "When an AI model generates text that is factually incorrect or completely fabricated but stated with confidence.",
    related: ["LLM", "RAG"],
  },
  {
    term: "Inference",
    definition: "The process of running a trained model to generate output. Distinct from training, which is where the model learns.",
    related: ["LLM", "Tokens"],
  },
  {
    term: "LLM",
    definition: "Large Language Model. A neural network trained on massive amounts of text data that can generate, summarize, translate, and reason about language.",
    related: ["Tokens", "Context Window", "Transformer"],
  },
  {
    term: "MCP",
    definition: "Model Context Protocol. A standard created by Anthropic that allows AI agents to connect to tools, APIs, and data sources in a consistent way.",
    related: ["AI Agent", "System Prompt"],
  },
  {
    term: "Multimodal",
    definition: "A model that can process multiple types of input such as text, images, audio, or video, not just text alone.",
    related: ["LLM"],
  },
  {
    term: "Neural Network",
    definition: "A computational system loosely inspired by the human brain, made of layers of connected nodes that learn patterns from data.",
    related: ["Transformer", "LLM"],
  },
  {
    term: "Prompt Engineering",
    definition: "The practice of designing and refining inputs to AI models to reliably produce desired outputs. A core skill for working with LLMs.",
    related: ["System Prompt", "Few-shot", "Chain of Thought"],
  },
  {
    term: "RAG",
    definition: "Retrieval-Augmented Generation. A technique where relevant documents are retrieved from a database and included in the prompt to ground the model's response in factual information.",
    related: ["Embeddings", "Vector Database"],
  },
  {
    term: "System Prompt",
    definition: "Instructions given to an AI model before the user conversation begins. Defines the model's persona, behavior, constraints, and output format.",
    related: ["Prompt Engineering", "AI Agent"],
  },
  {
    term: "Temperature",
    definition: "A parameter that controls randomness in model output. Low temperature produces more predictable responses, high temperature produces more varied ones.",
    related: ["LLM", "Inference"],
  },
  {
    term: "Tokens",
    definition: "The units that LLMs process text in. A token is roughly 4 characters or 0.75 words. Models have limits on how many tokens they can handle at once.",
    related: ["Context Window", "LLM"],
  },
  {
    term: "Transformer",
    definition: "The neural network architecture that underlies most modern LLMs. Introduced in 2017 in the paper Attention Is All You Need.",
    related: ["LLM", "Neural Network"],
  },
  {
    term: "Vector Database",
    definition: "A database optimized for storing and searching embeddings. Used in RAG systems to find semantically similar content quickly.",
    related: ["Embeddings", "RAG"],
  },
  {
    term: "Zero-shot",
    definition: "Asking a model to perform a task without providing any examples in the prompt, relying entirely on the model's pre-trained knowledge.",
    related: ["Few-shot", "Prompt Engineering"],
  },
];

export default function DictionaryPage() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const visibleTerms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return terms
      .filter((t) => {
        if (activeLetter && t.term[0].toUpperCase() !== activeLetter) return false;
        if (!q) return true;
        return (
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [activeLetter, search]);

  return (
    <div className="space-y-6">
      <header className="border-b border-black pb-4">
        <h1 className="font-pixel text-2xl mb-2">DICTIONARY</h1>
        <p className="font-mono text-sm">AI terms explained simply.</p>
      </header>

      {/* Filters + results layout */}
      <section className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Letter filter column (left) */}
        <div className="md:w-32 md:border-r md:border-black pr-2 md:pr-4 mb-2 md:mb-0">
          <p className="font-mono text-[11px] mb-2">Letters</p>
          <div className="flex md:flex-col flex-wrap gap-1">
            {alphabet.map((letter) => {
              const isActive = activeLetter === letter;
              const hasAny = terms.some(
                (t) => t.term[0].toUpperCase() === letter,
              );

              if (!hasAny) {
                return (
                  <span
                    key={letter}
                    className="font-mono text-[11px] px-1 text-gray-300"
                  >
                    {letter}
                  </span>
                );
              }

              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() =>
                    setActiveLetter((prev) => (prev === letter ? null : letter))
                  }
                  className={`font-mono text-sm px-1 text-left ${
                    isActive
                      ? "font-bold underline"
                      : "hover:underline"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + list (right) */}
        <div className="flex-1 space-y-3">
          <div>
            <input
              type="text"
              placeholder="Search by term or definition..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md font-mono text-sm border border-black px-2 py-1 bg-white text-black"
            />
          </div>

          {visibleTerms.length === 0 ? (
            <p className="font-mono text-sm">
              NO MATCHES. TRY A DIFFERENT TERM.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleTerms.map(({ term, definition, related }) => (
                <article
                  key={term}
                  className="font-mono text-sm border-b border-black pb-2"
                >
                  <h2 className="font-bold text-sm mb-1">{term}</h2>
                  <p className="text-sm">{definition}</p>
                  {related && related.length > 0 && (
                    <p className="mt-1 text-gray-500 text-[11px]">
                      Related: {related.join(", ")}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

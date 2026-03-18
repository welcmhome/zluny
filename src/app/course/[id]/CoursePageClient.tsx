"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import ReportButton from "@/components/ReportButton";

type Section = { title: string; body: string };

type Question = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
};

type Props = {
  courseId: string;
  courseTitle: string;
  category: string;
  difficulty: string;
  categoryClass: string;
  difficultyClass: string;
  sections: Section[];
  questions: Question[];
  initialSaved: boolean;
  initialLiked: boolean;
  initialLikeCount: number;
  loggedIn: boolean;
};

const WORDS_PER_CHUNK = 150;

export default function CoursePageClient({
  courseId,
  courseTitle,
  category,
  difficulty,
  categoryClass,
  difficultyClass,
  sections,
  questions,
  initialSaved,
  initialLiked,
  initialLikeCount,
  loggedIn,
}: Props) {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [saved, setSaved] = useState(initialSaved);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [readSections, setReadSections] = useState<Set<number>>(new Set());
  const [maxUnlockedSection, setMaxUnlockedSection] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; points_earned: number; total_questions: number } | null>(null);
  const [audioSection, setAudioSection] = useState<number | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPaused, setAudioPaused] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioChunkIndex, setAudioChunkIndex] = useState(0);
  const chunksRef = useState<string[]>([])[0];

  // The first two parsed sections are intro / table of contents.
  // Drop them entirely so the course starts at the real Section 1.
  // Also strip any leading "Section X —" prefix from the remaining titles.
  const effectiveSections = useMemo(() => {
    const core = sections.length > 2 ? sections.slice(2) : sections;
    return core.map((s) => ({
      ...s,
      title: s.title.replace(/^Section\s+\d+\s*[—-]\s*/i, "").trim(),
    }));
  }, [sections]);

  const totalSections = effectiveSections.length;
  const allRead = totalSections > 0 && readSections.size >= totalSections;

  const markSectionRead = useCallback((idx: number) => {
    setReadSections((prev) => new Set(prev).add(idx));
  }, []);

  useEffect(() => {
    markSectionRead(currentSection);
  }, [currentSection, markSectionRead]);

  // Stop audio when changing sections (matches old reader behavior)
  useEffect(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setAudioSection(null);
    setAudioPlaying(false);
    setAudioPaused(false);
    setAudioProgress(0);
    setAudioChunkIndex(0);
  }, [currentSection]);

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    const method = saved ? "DELETE" : "POST";
    fetch("/api/save-course", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId }),
    }).then((res) => {
      if (res.ok) setSaved(!saved);
    });
  }

  function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    const method = liked ? "DELETE" : "POST";
    fetch("/api/like-course", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId }),
    }).then((res) => {
      if (res.ok) {
        setLiked(!liked);
        setLikeCount((c) => c + (liked ? -1 : 1));
      }
    });
  }

  function chunkText(text: string, wordsPerChunk: number): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const out: string[] = [];
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      out.push(words.slice(i, i + wordsPerChunk).join(" "));
    }
    return out.length ? out : [""];
  }

  function playSectionFromChunk(sectionIndex: number, startChunk: number) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const section = effectiveSections[sectionIndex];
    if (!section?.body) return;

    window.speechSynthesis.cancel();

    const chunks = chunkText(section.body, WORDS_PER_CHUNK);
    chunksRef.length = 0;
    chunksRef.push(...chunks);

    const safeStart = Math.min(Math.max(startChunk, 0), chunks.length - 1);
    setAudioSection(sectionIndex);
    setAudioChunkIndex(safeStart);
    setAudioProgress(
      chunks.length ? (safeStart / chunks.length) * 100 : 0,
    );
    setAudioPlaying(true);
    setAudioPaused(false);

    let chunkIdx = safeStart;
    const speakNext = () => {
      if (chunkIdx >= chunks.length) {
        setAudioPlaying(false);
        setAudioSection(null);
        setAudioProgress(100);
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks[chunkIdx]);
      u.rate = audioSpeed;
      u.onend = () => {
        chunkIdx += 1;
        setAudioChunkIndex(chunkIdx);
        setAudioProgress(
          chunks.length ? (chunkIdx / chunks.length) * 100 : 100,
        );
        if (chunkIdx < chunks.length) speakNext();
        else {
          setAudioPlaying(false);
          setAudioSection(null);
        }
      };
      window.speechSynthesis.speak(u);
    };
    speakNext();
  }

  function playSection(sectionIndex: number) {
    playSectionFromChunk(sectionIndex, 0);
  }

  function pauseAudio() {
    if (typeof window === "undefined") return;
    window.speechSynthesis.pause();
    setAudioPaused(true);
  }

  function resumeAudio() {
    if (typeof window === "undefined") return;
    window.speechSynthesis.resume();
    setAudioPaused(false);
  }

  function stopAudio() {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setAudioPlaying(false);
    setAudioSection(null);
    setAudioPaused(false);
  }

  function setSpeed(s: number) {
    // Update desired speed; new value is applied for the *next* chunk.
    // We deliberately do NOT cancel/restart the whole section so playback
    // continues from the current position.
    setAudioSpeed(s);
  }

  async function submitQuiz() {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    const res = await fetch("/api/submit-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId, answers: quizAnswers }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.score !== undefined) {
      setQuizSubmitted(true);
      setQuizResult({
        score: data.score,
        points_earned: data.points_earned ?? 0,
        total_questions: data.total_questions ?? questions.length,
      });
    }
  }

  const totalNavSections = totalSections + 1; // content sections + quiz
  const isQuizSection = currentSection === totalSections;
  const section = isQuizSection ? undefined : effectiveSections[currentSection];
  const isAudioThisSection = audioSection === currentSection;
  const percent =
    totalNavSections > 0 ? Math.round(((currentSection + 1) / totalNavSections) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Title + simple meta row */}
      <header className="pt-2 flex flex-wrap items-center justify-between gap-2 border-b border-black pb-2">
        <div>
          <h1 className="font-pixel text-xl">{courseTitle}</h1>
        </div>
        <div className="flex flex-wrap gap-1 font-mono text-[11px]">
          <span className={`px-2 py-0.5 border ${categoryClass}`}>{category}</span>
          <span className={`px-2 py-0.5 ${difficultyClass}`}>{difficulty}</span>
        </div>
      </header>

      {/* Main lesson area */}
      <div className="bg-white p-4 space-y-4">
        {/* Progress row: square block bar on all screens; no "PROGRESS" on mobile; one label on mobile (section count only) */}
        <div className="font-mono text-xs flex flex-wrap items-center justify-between gap-2 sm:gap-4 border-b border-black pb-2">
          <span className="shrink-0 hidden md:inline">PROGRESS</span>
          {/* Mobile: same square blocks, centered + scrollable; no PROGRESS word; only SECTION X OF Y (no %) */}
          <div className="w-full md:hidden flex flex-col items-center gap-1">
            <div className="flex gap-[2px] overflow-x-auto py-1 px-2 max-w-full justify-center">
              {Array.from({ length: totalNavSections }, (_, i) => (
                <div
                  key={i}
                  className={`w-5 h-4 border border-black shrink-0 ${
                    i <= currentSection
                      ? "bg-black"
                      : "bg-white bg-[repeating-linear-gradient(45deg,#ffffff_0,#ffffff_2px,#e5e5e5_2px,#e5e5e5_4px)]"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px]">
              {currentSection + 1} OF {totalNavSections}
            </span>
          </div>
          {/* Desktop: chunky block grid */}
          <div className="flex-1 min-w-0 hidden md:flex justify-center">
            <div className="flex gap-[2px] overflow-x-auto px-2 py-1 bg-white">
              {Array.from({ length: totalNavSections }, (_, i) => (
                <div
                  key={i}
                  className={`w-7 h-5 border border-black shrink-0 ${
                    i <= currentSection
                      ? "bg-black"
                      : "bg-white bg-[repeating-linear-gradient(45deg,#ffffff_0,#ffffff_2px,#e5e5e5_2px,#e5e5e5_4px)]"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="hidden md:block text-right shrink-0">
            <div>
              SECTION {currentSection + 1} OF {totalNavSections}
            </div>
            <div>{percent}%</div>
          </div>
        </div>

        {/* Two-column layout: sections list + reader */}
        <div className="flex gap-4">
          {/* Sections sidebar (numbers only: Section 1, 2, ...; intro/contents removed in effectiveSections) */}
          <aside className="w-56 p-3 font-mono text-xs hidden md:block border-r border-black">
            <h2 className="font-pixel text-sm mb-2">Sections</h2>
            <ul className="space-y-1 list-none">
              {effectiveSections.map((_, i) => {
                const locked = i > maxUnlockedSection;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        if (!locked) setCurrentSection(i);
                      }}
                      className={`text-left w-full ${
                        locked
                          ? "text-gray-300 cursor-not-allowed"
                          : currentSection === i
                          ? "font-bold"
                          : "hover:underline"
                      }`}
                    >
                      Section {i + 1}
                    </button>
                  </li>
                );
              })}
              <li>
                {(() => {
                  const quizLocked = totalSections > maxUnlockedSection;
                  return (
                    <button
                      type="button"
                      disabled={quizLocked}
                      onClick={() => {
                        if (!quizLocked) setCurrentSection(totalSections);
                      }}
                      className={`text-left w-full ${
                        quizLocked
                          ? "text-gray-300 cursor-not-allowed"
                          : currentSection === totalSections
                          ? "font-bold"
                          : "hover:underline"
                      }`}
                    >
                      Quiz
                    </button>
                  );
                })()}
              </li>
            </ul>
          </aside>

          {/* Section reader or quiz */}
          <main className="flex-1 min-w-0 font-mono text-xs">
            <div>
              {/* Header bar: section title or Quiz + like/save */}
              <div className="flex items-center justify-between border-b border-black px-3 py-2 gap-2">
                <div className="font-mono text-xs font-bold">
                  {isQuizSection ? "Quiz" : (section?.title ?? courseTitle)}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleLike}
                    className="flex items-center gap-1"
                    aria-label="Like"
                  >
                    <LikeIcon filled={liked} />
                    <span className="font-mono text-xs">{likeCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    aria-label="Save"
                  >
                    <SaveRibbonIcon filled={saved} />
                  </button>
                </div>
              </div>

              {/* Content: reader for sections 1–N, quiz only for section N+1 */}
              <div className="p-3 space-y-3">
                {isQuizSection ? (
                  /* Quiz section: no lesson content here */
                  totalSections >= 0 && (
                    <>
                      {!quizSubmitted ? (
                        <div className="space-y-4">
                          {questions.map((q) => (
                            <div key={q.id} className="font-mono text-xs space-y-2">
                              <p className="font-bold">
                                {q.question_text || "Question"}
                              </p>
                              <div className="flex flex-col gap-1">
                                {["A", "B", "C", "D"].map((opt) => {
                                  const optionText =
                                    (q as Record<string, string>)[
                                      `option_${opt.toLowerCase()}`
                                    ] ?? opt;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() =>
                                        setQuizAnswers((prev) => ({
                                          ...prev,
                                          [q.id]: opt,
                                        }))
                                      }
                                      className={`text-left border border-black px-2 py-1 btn-plain ${
                                        quizAnswers[q.id] === opt
                                          ? "bg-black text-white"
                                          : ""
                                      }`}
                                    >
                                      {opt}. {optionText}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={submitQuiz}
                            className="font-mono text-xs border border-black px-4 py-2 btn-plain"
                          >
                            SUBMIT QUIZ
                          </button>
                        </div>
                      ) : (
                        quizResult && (
                          <div className="font-mono text-xs space-y-1">
                            <p>
                              Score: {quizResult.score}/
                              {quizResult.total_questions}
                            </p>
                            <p>Points earned: {quizResult.points_earned}</p>
                            {quizResult.score === quizResult.total_questions && (
                              <p className="font-bold">PERFECT SCORE.</p>
                            )}
                          </div>
                        )
                      )}
                    </>
                  )
                ) : (
                  section && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (isAudioThisSection && audioPlaying) stopAudio();
                          else playSection(currentSection);
                        }}
                        className="font-mono text-xs underline"
                      >
                        {isAudioThisSection && audioPlaying
                          ? "⏹ STOP"
                          : "▶ LISTEN TO SECTION"}
                      </button>

                      <div className="course-lesson-body font-mono text-xs prose prose-sm max-w-none">
                        <ReactMarkdown>{section.body}</ReactMarkdown>
                      </div>
                    </>
                  )
                )}
              </div>
            </div>

            {/* Bottom-right Previous/Next and report link */}
            <div className="mt-4 flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSection((prev) => Math.max(0, prev - 1))
                  }
                  className="border border-black px-3 py-1 bg-white text-black font-mono text-xs"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSection((prev) => {
                      const next = Math.min(totalSections, prev + 1);
                      setMaxUnlockedSection((m) => Math.max(m, next));
                      return next;
                    })
                  }
                  className="border border-black px-3 py-1 bg-black text-white font-mono text-xs"
                >
                  Next
                </button>
              </div>
              <div className="font-mono text-xs text-gray-500">
                Is something wrong?{" "}
                <ReportButton
                  contentType="course"
                  contentId={courseId}
                  contentName={courseTitle}
                  label="Report"
                />
              </div>
            </div>
          </main>
        </div>
      </div>
      {/* Global audio player bar fixed to bottom when listening */}
      {audioSection !== null && audioPlaying && (
        <div className="fixed inset-x-0 bottom-0 border-t border-black bg-white z-40">
          <div className="max-w-5xl mx-auto px-4 py-2 font-mono text-xs space-y-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold">
                Playing: Section {audioSection + 1}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    stopAudio();
                    playSection(audioSection);
                  }}
                  className="border border-black px-2 py-0.5 btn-plain"
                >
                  ⏮ restart
                </button>
                <button
                  type="button"
                  onClick={audioPaused ? resumeAudio : pauseAudio}
                  className="border border-black px-2 py-0.5 btn-plain"
                >
                  {audioPaused ? "▶ play" : "⏸ pause"}
                </button>
                <button
                  type="button"
                  onClick={stopAudio}
                  className="border border-black px-2 py-0.5 btn-plain"
                >
                  ⏹ stop
                </button>
                <span className="flex gap-1">
                  {[0.5, 1, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      className={`border border-black px-1 py-0.5 ${
                        audioSpeed === s
                          ? "bg-black text-white"
                          : "btn-plain"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </span>
              </div>
            </div>
            <div
              className="w-full h-2.5 border border-black bg-white cursor-pointer"
              onClick={(e) => {
                if (
                  audioSection === null ||
                  chunksRef.length === 0 ||
                  typeof window === "undefined"
                ) {
                  return;
                }
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.min(Math.max(clickX / rect.width, 0), 1);
                const targetChunk = Math.floor(ratio * chunksRef.length);
                playSectionFromChunk(audioSection, targetChunk);
              }}
            >
              <div
                className="h-full bg-black"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveRibbonIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      {filled ? (
        <path fill="#FFD700" stroke="#FFD700" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
      ) : (
        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
      )}
    </svg>
  );
}

function LikeIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill={filled ? "#FF69B4" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Classic symmetric heart matching card icons */}
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

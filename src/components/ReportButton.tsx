"use client";

import { useState } from "react";

const ISSUE_TYPES = [
  "Misinformation or inaccurate content",
  "Outdated information",
  "Broken or incomplete content",
  "Inappropriate or offensive content",
  "Copyright concern",
  "Other",
];

type Props = {
  contentType: "course" | "copy_resource";
  contentId: string;
  contentName: string;
  label?: string;
  underline?: boolean;
  /** Use black text for the trigger (default gray) */
  triggerBlack?: boolean;
};

const CONTENT_TYPE_LABELS: Record<Props["contentType"], string> = {
  course: "courses",
  copy_resource: "clipboard",
};

export default function ReportButton({
  contentType,
  contentId,
  contentName,
  label = "Is something wrong? Report",
  underline = false,
  triggerBlack = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [otherDescription, setOtherDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) return;
    if (selectedType === "Other" && !otherDescription.trim()) return;
    setSubmitting(true);
    try {
      const detailsToSend =
        selectedType === "Other"
          ? otherDescription.trim() + (details.trim() ? "\n\n" + details.trim() : "")
          : details.trim() || undefined;
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          content_name: contentName,
          issue_type: selectedType,
          details: detailsToSend,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          setSelectedType(null);
          setDetails("");
          setOtherDescription("");
        }, 2000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`font-mono text-xs hover:underline ${triggerBlack ? "text-black" : "text-gray-500"} ${underline ? "underline" : ""}`}
      >
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 md:items-center md:justify-center">
          <div
            className="bg-white text-black border border-black p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto md:relative"
            style={{
              paddingTop: "calc(16px + env(safe-area-inset-top, 0px))",
              paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSelectedType(null);
                setDetails("");
                setOtherDescription("");
              }}
              className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center border border-black font-mono text-sm md:w-8 md:h-8"
              aria-label="Close report modal"
            >
              ✕
            </button>
            <h2 className="font-pixel text-sm mb-2">REPORT AN ISSUE</h2>
            <p className="font-mono text-xs mb-1">
              <span className="font-bold">Reporting</span>: {contentName}
            </p>
            <p className="font-mono text-xs mb-4">
              <span className="font-bold">Category</span>: {CONTENT_TYPE_LABELS[contentType]}
            </p>
            {success ? (
              <p className="font-mono text-xs">REPORT SUBMITTED. THANK YOU.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="font-mono text-xs">
                  <p className="mb-2 font-bold">Issue type:</p>
                  <div className="flex flex-col gap-1">
                    {ISSUE_TYPES.filter((t) => t !== "Other").map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedType(type)}
                        className={`text-left border border-black px-2 py-1 ${
                          selectedType === type ? "btn-selected" : "btn-plain"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                    <input
                      type="text"
                      value={selectedType === "Other" ? otherDescription : ""}
                      onChange={(e) => {
                        setSelectedType("Other");
                        setOtherDescription(e.target.value);
                      }}
                      onFocus={() => setSelectedType("Other")}
                      placeholder="Other — type your issue here"
                      className="w-full border border-black px-2 py-1 font-mono text-xs bg-white text-black placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="report-details" className="font-mono text-xs block mb-1">
                    Details (optional)
                  </label>
                  <textarea
                    id="report-details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Tell us more (optional)..."
                    className="w-full border border-black p-2 font-mono text-xs bg-white text-black min-h-[80px]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setSelectedType(null);
                      setDetails("");
                      setOtherDescription("");
                    }}
                    className="font-mono text-xs border border-black px-3 py-1 btn-plain"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !selectedType ||
                      submitting ||
                      (selectedType === "Other" && !otherDescription.trim())
                    }
                    className="font-mono text-xs border border-black px-3 py-1 btn-plain disabled:opacity-50"
                  >
                    SUBMIT REPORT
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

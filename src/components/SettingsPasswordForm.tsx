"use client";

import { useState } from "react";

export default function SettingsPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: "PASSWORD UPDATED." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.error ?? "Failed to update password." });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-2">
      <h2 className="font-mono text-xs font-bold">CHANGE PASSWORD</h2>
      <form
        onSubmit={handleSubmit}
        className="border border-black p-3 font-mono text-xs space-y-2"
      >
        <div className="space-y-1">
          <label htmlFor="current_password">Current Password</label>
          <input
            id="current_password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full border border-black px-2 py-1 bg-white text-black"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="new_password">New Password</label>
          <input
            id="new_password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full border border-black px-2 py-1 bg-white text-black"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirm_password">Confirm New Password</label>
          <input
            id="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border border-black px-2 py-1 bg-white text-black"
          />
        </div>
        {message && (
          <p className={message.type === "error" ? "text-red-600" : ""}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="border border-black px-4 py-2 bg-white text-black btn-plain disabled:opacity-50"
        >
          UPDATE PASSWORD
        </button>
      </form>
    </section>
  );
}

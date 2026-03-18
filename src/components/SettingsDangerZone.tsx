"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  username: string;
};

const CONFIRM_PREFIX = "delete ";

export default function SettingsDangerZone({ username }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const phrase = `${CONFIRM_PREFIX}${username}`;
  const canDelete = confirmText === phrase;

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/delete-account", { method: "DELETE" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-2">
      <h2 className="font-mono text-xs font-bold">
        DANGER ZONE
      </h2>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="border border-red-600 text-red-600 px-4 py-2 font-mono text-xs bg-transparent hover:bg-red-600 hover:text-white"
      >
        DELETE ACCOUNT
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-black p-6 max-w-md w-full mx-4">
            <h3 className="font-mono text-xs font-bold text-red-600 mb-2">
              ARE YOU SURE? THIS CANNOT BE UNDONE.
            </h3>
            <p className="font-mono text-xs mb-2">
              Type the following to confirm:
            </p>
            <div className="border border-black p-2 font-mono text-xs mb-2">
              {phrase}
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type here..."
              className="w-full border border-black px-2 py-1 font-mono text-xs bg-white text-black mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setConfirmText("");
                }}
                className="font-mono text-xs border border-black px-3 py-1 btn-plain"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                className={`font-mono text-xs px-3 py-1 border ${
                  canDelete
                    ? "border-red-600 text-red-600 bg-transparent hover:bg-red-600 hover:text-white"
                    : "border-gray-400 text-gray-400 bg-gray-100 cursor-not-allowed"
                }`}
              >
                YES, DELETE MY ACCOUNT
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

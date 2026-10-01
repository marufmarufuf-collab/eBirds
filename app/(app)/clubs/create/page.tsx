"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { createClub } from "@/lib/actions/clubs";

export default function CreateClubPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createClub(name, description);
      if (result.error) return setError(result.error);
      router.push(`/clubs/${result.id}`);
    });
  }

  return (
    <main className="px-5 py-10 max-w-2xl">
      <h1 className="display text-2xl mb-6">Create a club</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="text-sm mb-1 block">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="Tashkent Running Club" />
        </div>
        <div>
          <label className="text-sm mb-1 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" placeholder="Who this is for, what you do…" />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending && <Spinner />} {pending ? "Creating…" : "Create club"}
        </button>
      </form>
    </main>
  );
}

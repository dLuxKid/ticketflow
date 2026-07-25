"use client";

import { useEffect, useState, useTransition } from "react";

import { getEventGuests, importGuests, queryGuests } from "@/utils/actions";

/**
 * Guest-list manager for an invite_only / hybrid event. Paste or type a CSV
 * (name,email,vip,plusOnes) and issue invites; the backend emails each new guest a
 * scannable QR. The current list refreshes after an import.
 */

type Guest = {
  _id: string;
  name: string;
  email: string;
  vip: boolean;
  plusOnes: number;
};

type ImportResult = {
  added: string[];
  skipped: string[];
  failed: { email: string; error: string }[];
  invalidRows: { line: number; raw: string }[];
};

type QueryAnswer = {
  action: "list" | "count";
  count: number;
  guests: { name: string; email: string; vip: boolean }[];
};

export default function GuestManager({ eventId }: { eventId: string }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [csv, setCsv] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<QueryAnswer | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [asking, startAsking] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const loadGuests = () =>
    getEventGuests(eventId).then((res) => {
      if (res?.status === "success") setGuests(res.data.guests ?? []);
    });

  useEffect(() => {
    loadGuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleImport = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await importGuests(eventId, { csv });
      if (res?.status === "success") {
        setResult(res.data as ImportResult);
        setCsv("");
        await loadGuests();
      } else {
        setError(res?.message ?? "Import failed. Check the format and try again.");
      }
    });
  };

  const handleAsk = () => {
    setQueryError(null);
    setAnswer(null);
    startAsking(async () => {
      const res = await queryGuests(eventId, question);
      if (res?.status === "success") {
        setAnswer(res.data as QueryAnswer);
      } else {
        setQueryError(
          res?.message ?? "Couldn't understand that question. Try rephrasing it.",
        );
      }
    });
  };

  return (
    <section className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-2xl font-bold">Guest list</h1>
      <p className="mb-6 text-sm text-gray-500">
        Paste a CSV with columns <code>name,email,vip,plusOnes</code>. Each new guest is
        emailed a single-use QR invite.
      </p>

      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder={"name,email,vip,plusOnes\nAda Lovelace,ada@example.com,yes,1"}
        rows={6}
        className="mb-3 w-full rounded-lg border border-gray-200 p-3 font-mono text-sm"
      />

      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={handleImport}
          disabled={pending || csv.trim() === ""}
          className="rounded-lg bg-[#6528F7] px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Importing…" : "Import & send invites"}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {result && (
        <div className="mb-6 rounded-lg border border-gray-100 p-4 text-sm">
          <p className="text-green-600">Added: {result.added.length}</p>
          {result.skipped.length > 0 && (
            <p className="text-gray-500">
              Skipped (already invited): {result.skipped.length}
            </p>
          )}
          {result.failed.length > 0 && (
            <p className="text-red-600">Failed: {result.failed.length}</p>
          )}
          {result.invalidRows.length > 0 && (
            <p className="text-amber-600">
              Unparseable rows: {result.invalidRows.length}
            </p>
          )}
        </div>
      )}

      <div className="mb-8 rounded-lg border border-gray-100 p-4">
        <h2 className="mb-2 text-lg font-semibold">Ask about your guest list</h2>
        <p className="mb-3 text-sm text-gray-500">
          Try &ldquo;who hasn&apos;t arrived&rdquo; or &ldquo;how many VIPs have
          arrived&rdquo;.
        </p>
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="who hasn't arrived?"
            className="flex-1 rounded-lg border border-gray-200 p-2 text-sm"
          />
          <button
            onClick={handleAsk}
            disabled={asking || question.trim() === ""}
            className="rounded-lg bg-[#6528F7] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {asking ? "Asking…" : "Ask"}
          </button>
        </div>

        {queryError && (
          <p className="mt-3 text-sm text-red-600">{queryError}</p>
        )}

        {answer && (
          <div className="mt-3 text-sm">
            <p className="font-medium">
              {answer.action === "count"
                ? `${answer.count} guest${answer.count === 1 ? "" : "s"}`
                : `${answer.count} guest${answer.count === 1 ? "" : "s"} found`}
            </p>
            {answer.action === "list" && answer.guests.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-gray-600">
                {answer.guests.map((g) => (
                  <li key={g.email}>
                    {g.name} {g.vip && "(VIP)"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <h2 className="mb-3 text-lg font-semibold">
        Invited guests ({guests.length})
      </h2>
      {guests.length === 0 ? (
        <p className="text-sm text-gray-500">No guests yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">VIP</th>
                <th className="py-2">+1s</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {guests.map((g) => (
                <tr key={g._id}>
                  <td className="py-2">{g.name}</td>
                  <td className="py-2">{g.email}</td>
                  <td className="py-2">{g.vip ? "Yes" : "—"}</td>
                  <td className="py-2 tabular-nums">{g.plusOnes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

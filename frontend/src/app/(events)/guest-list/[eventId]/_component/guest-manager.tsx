"use client";

import PageHeader from "@/components/ui/page-header";
import {
  eraseGuest,
  getEventGuests,
  importGuests,
  queryGuests,
} from "@/utils/actions";
import { eventTabs } from "@/utils/event-tabs";
import { readGuestsFromFile } from "@/utils/guest-import";
import { useEffect, useState, useTransition } from "react";

/**
 * Guest-list manager for an invite_only / hybrid event. Two ways in: a one-guest-at-a-time
 * form (the common case) and a CSV bulk-import for large lists - both call the same
 * backend import endpoint, just with a one-item array vs. a parsed CSV string. Each new
 * guest is emailed a single-use QR invite; the list refreshes after either path.
 */

type Guest = {
  _id: string;
  name: string;
  email: string;
  vip: boolean;
  plusOnes: number;
  erasedAt?: string;
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

export default function GuestManager({
  eventId,
  hasGuestList = false,
}: {
  eventId: string;
  /** Whether this event has a guest list, so the tab strip can omit it. */
  hasGuestList?: boolean;
}) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [csv, setCsv] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualVip, setManualVip] = useState(false);
  const [manualPlusOnes, setManualPlusOnes] = useState(0);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualAdding, startManualAdd] = useTransition();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<QueryAnswer | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [asking, startAsking] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [erasing, setErasing] = useState<string | null>(null);

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
    // startTransition's callback must be () => void - the async work runs in an inner
    // IIFE rather than making the callback itself async (which would return a Promise).
    startTransition(() => {
      void (async () => {
        const res = await importGuests(eventId, { csv });
        if (res?.status === "success") {
          setResult(res.data as ImportResult);
          setCsv("");
          await loadGuests();
        } else {
          setError(
            res?.message ?? "Import failed. Check the format and try again.",
          );
        }
      })();
    });
  };

  const handleAddOne = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    setResult(null);
    startManualAdd(() => {
      void (async () => {
        const res = await importGuests(eventId, {
          guests: [
            {
              name: manualName.trim(),
              email: manualEmail.trim(),
              vip: manualVip,
              plusOnes: manualPlusOnes,
            },
          ],
        });
        if (res?.status === "success") {
          setResult(res.data as ImportResult);
          setManualName("");
          setManualEmail("");
          setManualVip(false);
          setManualPlusOnes(0);
          await loadGuests();
        } else {
          setManualError(
            res?.message ?? "Couldn't add this guest. Check the details.",
          );
        }
      })();
    });
  };

  const handleErase = async (guest: Guest) => {
    const confirmed = window.confirm(
      `Erase ${guest.name}'s personal data (name and email)? This can't be undone. Their admission record and stats are kept, but their identity is removed.`,
    );
    if (!confirmed) return;

    setErasing(guest._id);
    const res = await eraseGuest(eventId, guest._id);
    setErasing(null);
    if (res?.status === "success") {
      await loadGuests();
    } else {
      setError(res?.message ?? "Couldn't erase this guest's data. Try again.");
    }
  };

  // const handleFile = async (file: File) => {
  //   setError(null);
  //   setResult(null);
  //   try {
  //     // Dynamically import SheetJS so it stays out of the initial page bundle - it only
  //     // loads when someone actually picks a spreadsheet.
  //     const res = await axios.get(file.webkitRelativePath, {
  //       responseType: "arraybuffer",
  //     });
  //     const workbook = XLSX.read(res.data);
  //     const worksheets = workbook.SheetNames.map((name) => ({
  //       sheetName: name,
  //       data: XLSX.utils.sheet_to_json(workbook.Sheets[name]),
  //     }));
  //     const XLSX = await import("xlsx");
  //     const buf = await file.arrayBuffer();
  //     const wb = XLSX.read(buf, { type: "array" });
  //     const sheet = wb.Sheets[wb.SheetNames[0]];
  //     const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
  //       defval: "",
  //     });

  //     // Map columns case-insensitively so "Name"/"name"/"EMAIL" all work.
  //     const pick = (row: Record<string, unknown>, keys: string[]) => {
  //       const found = Object.keys(row).find((k) =>
  //         keys.includes(k.trim().toLowerCase()),
  //       );
  //       return found ? String(row[found]).trim() : "";
  //     };

  //     const guests = rows
  //       .map((row) => ({
  //         name: pick(row, ["name", "full name", "guest"]),
  //         email: pick(row, ["email", "e-mail", "email address"]),
  //         vip: /^(true|yes|1|vip)$/i.test(pick(row, ["vip"])),
  //         plusOnes:
  //           Number.parseInt(pick(row, ["plusones", "plus ones", "+1s"]), 10) ||
  //           0,
  //       }))
  //       .filter((g) => g.name && g.email);

  //     if (guests.length === 0) {
  //       setError(
  //         "No valid rows found. The sheet needs Name and Email columns (a header row).",
  //       );
  //       return;
  //     }

  //     startTransition(() => {
  //       void (async () => {
  //         const res = await importGuests(eventId, { guests });
  //         if (res?.status === "success") {
  //           setResult(res.data as ImportResult);
  //           await loadGuests();
  //         } else {
  //           setError(
  //             res?.message ?? "Import failed. Check the file and try again.",
  //           );
  //         }
  //       })();
  //     });
  //   } catch {
  //     setError(
  //       "Couldn't read that file. Use a .xlsx, .xls or .csv spreadsheet.",
  //     );
  //   }
  // };

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);

    try {
      const guestList = await readGuestsFromFile(file);

      startTransition(() => {
        void (async () => {
          try {
            const res = await importGuests(eventId, { guests: guestList });
            if (res?.status === "success") {
              setResult(res.data as ImportResult);
              await loadGuests();
            } else {
              setError(
                res?.message ?? "Import failed. Check the file and try again.",
              );
            }
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Import failed. Check the file and try again.",
            );
          }
        })();
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't read that file. Use a .xlsx, .xls or .csv spreadsheet.",
      );
    }
  };

  const handleAsk = () => {
    setQueryError(null);
    setAnswer(null);
    startAsking(() => {
      void (async () => {
        const res = await queryGuests(eventId, question);
        if (res?.status === "success") {
          setAnswer(res.data as QueryAnswer);
        } else {
          setQueryError(
            res?.message ??
              "Couldn't understand that question. Try rephrasing it.",
          );
        }
      })();
    });
  };

  return (
    <section className="flex-center flex-col w-full max-w-screen-md mx-auto gap-6 py-10 px-4">
      <PageHeader
        eyebrow="TicketFlow"
        title="Guest list"
        subtitle="Add guests one at a time, or import a whole list at once. Each new guest is emailed a single-use QR invite."
        tabs={eventTabs(eventId, "guests", hasGuestList)}
      />

      <div className="w-full rounded-big bg-main-white shadow shadow-black/10 p-4 sm:p-6">
        <h2 className="sub-title-text text-main-black mb-4">Add a guest</h2>
        <form onSubmit={handleAddOne} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="manual-name"
                className="text-sm font-semibold text-main-black mb-1 block"
              >
                Name
              </label>
              <input
                id="manual-name"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full rounded-md border border-main-purple bg-sec-grey px-4 h-12 text-sm text-main-black"
              />
            </div>
            <div>
              <label
                htmlFor="manual-email"
                className="text-sm font-semibold text-main-black mb-1 block"
              >
                Email
              </label>
              <input
                id="manual-email"
                type="email"
                required
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="ada@example.com"
                className="w-full rounded-md border border-main-purple bg-sec-grey px-4 h-12 text-sm text-main-black"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label
              htmlFor="manual-plusones"
              className="flex items-center gap-2 text-sm text-main-black"
            >
              Plus-ones
              <input
                id="manual-plusones"
                type="number"
                min={0}
                value={manualPlusOnes}
                onChange={(e) =>
                  setManualPlusOnes(Math.max(0, Number(e.target.value)))
                }
                className="w-20 rounded-md border border-main-purple bg-sec-grey px-3 h-10 text-sm text-main-black"
              />
            </label>
            <label
              htmlFor="manual-vip"
              className="flex items-center gap-2 cursor-pointer text-sm text-main-black"
            >
              <input
                id="manual-vip"
                type="checkbox"
                className="cursor-pointer hidden peer"
                checked={manualVip}
                onChange={(e) => setManualVip(e.target.checked)}
              />
              <span className="bg-transparent peer-checked:bg-main-purple border border-main-purple h-5 w-5 rounded-sm inline-block" />
              VIP
            </label>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={
                manualAdding || !manualName.trim() || !manualEmail.trim()
              }
              className="bg-main-purple text-main-white px-6 py-2 md:px-9 md:py-3 text-base rounded-big font-medium"
            >
              {manualAdding ? "Adding…" : "Add guest & send invite"}
            </button>
            {manualError && (
              <span role="alert" className="error-text">
                {manualError}
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="w-full rounded-big bg-main-white shadow shadow-black/10 p-4 sm:p-6">
        <h2 className="sub-title-text text-main-black mb-1">Bulk import</h2>
        <p className="body-text text-main-black/60 mb-4">
          For adding many guests at once - otherwise use &ldquo;Add a
          guest&rdquo; above.
        </p>

        <label
          htmlFor="guest-file"
          className="text-sm font-semibold text-main-black mb-1 block"
        >
          Upload a spreadsheet (Excel or CSV)
        </label>
        <input
          id="guest-file"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = ""; // allow re-selecting the same file
          }}
          className="block w-full text-sm text-main-black file:mr-4 file:rounded-big file:border-0 file:bg-main-purple file:px-5 file:py-2 file:text-main-white file:font-medium file:cursor-pointer"
        />
        <p className="text-xs text-main-black/60 mt-1 mb-5">
          Needs <span className="font-semibold">Name</span> and{" "}
          <span className="font-semibold">Email</span> columns (a header row).
          Optional: VIP, plusOnes.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <span className="h-px flex-1 bg-main-light-grey/50" />
          <span className="text-xs uppercase tracking-wide text-main-black/40">
            or paste CSV
          </span>
          <span className="h-px flex-1 bg-main-light-grey/50" />
        </div>

        <label
          htmlFor="guest-csv"
          className="text-sm font-semibold text-main-black mb-1 block"
        >
          Guest list CSV
        </label>
        <textarea
          id="guest-csv"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={
            "name,email,vip,plusOnes\nAda Lovelace,ada@example.com,yes,1"
          }
          rows={6}
          aria-describedby="guest-csv-hint"
          className="w-full rounded-md border border-main-purple bg-sec-grey p-3 font-mono text-sm text-main-black"
        />
        <p id="guest-csv-hint" className="text-xs text-main-black/60 mt-1 mb-4">
          One guest per line. A header row is optional.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleImport}
            disabled={pending || csv.trim() === ""}
            aria-busy={pending}
            className="bg-main-purple text-main-white px-6 py-2 md:px-9 md:py-3 text-base rounded-big font-medium"
          >
            {pending ? "Importing…" : "Import & send invites"}
          </button>
          {error && (
            <span role="alert" className="error-text">
              {error}
            </span>
          )}
        </div>

        <div aria-live="polite" role="status">
          {result && (
            <div className="mt-4 rounded-md bg-main-grey-bg p-4 text-sm flex flex-col gap-1">
              <p className="text-green-700 font-medium">
                Added: {result.added.length}
              </p>
              {result.skipped.length > 0 && (
                <p className="text-main-black/60">
                  Skipped (already invited): {result.skipped.length}
                </p>
              )}
              {result.failed.length > 0 && (
                <p className="text-main-error-red">
                  Failed: {result.failed.length}
                </p>
              )}
              {result.invalidRows.length > 0 && (
                <p className="text-amber-700">
                  Unparseable rows: {result.invalidRows.length}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full rounded-big bg-main-white shadow shadow-black/10 p-4 sm:p-6">
        <h2 className="sub-title-text text-main-black mb-1">
          Ask about your guest list
        </h2>
        <label htmlFor="guest-question" className="sr-only">
          Ask a question about your guest list
        </label>
        <p
          id="guest-question-hint"
          className="body-text text-main-black/60 mb-3"
        >
          Try &ldquo;who hasn&apos;t arrived&rdquo; or &ldquo;how many VIPs have
          arrived&rdquo;.
        </p>
        <div className="flex gap-3">
          <input
            id="guest-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="who hasn't arrived?"
            aria-describedby="guest-question-hint"
            className="flex-1 rounded-md border border-main-purple bg-sec-grey px-4 h-12 text-sm text-main-black"
          />
          <button
            type="button"
            onClick={handleAsk}
            disabled={asking || question.trim() === ""}
            aria-busy={asking}
            className="bg-main-purple text-main-white px-6 text-sm rounded-big font-medium shrink-0"
          >
            {asking ? "Asking…" : "Ask"}
          </button>
        </div>

        <div aria-live="polite" role="status">
          {queryError && (
            <p role="alert" className="error-text mt-3">
              {queryError}
            </p>
          )}

          {answer && (
            <div className="mt-3 text-sm">
              <p className="font-medium text-main-black">
                {answer.action === "count"
                  ? `${answer.count} guest${answer.count === 1 ? "" : "s"}`
                  : `${answer.count} guest${answer.count === 1 ? "" : "s"} found`}
              </p>
              {answer.action === "list" && answer.guests.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-main-black/70">
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
      </div>

      <div className="w-full rounded-big bg-main-white shadow shadow-black/10 p-4 sm:p-6">
        <h2 className="sub-title-text text-main-black mb-4">
          Invited guests ({guests.length})
        </h2>
        {guests.length === 0 ? (
          <p className="body-text text-main-black/60">No guests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-main-black/60">
                <tr>
                  <th scope="col" className="py-2 pr-4">
                    Name
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    Email
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    VIP
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    +1s
                  </th>
                  <th scope="col" className="py-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-main-light-grey/40">
                {guests.map((g) => (
                  <tr key={g._id}>
                    <td className="py-3 pr-4 text-main-black">{g.name}</td>
                    <td className="py-3 pr-4 text-main-black/80">{g.email}</td>
                    <td className="py-3 pr-4 text-main-black/80">
                      {g.vip ? "Yes" : "-"}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-main-black/80">
                      {g.plusOnes}
                    </td>
                    <td className="py-3 text-right">
                      {g.erasedAt ? (
                        <span className="text-xs text-main-black/50">
                          Data erased
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleErase(g)}
                          disabled={erasing === g._id}
                          aria-label={`Erase ${g.name}'s personal data`}
                          className="text-xs text-main-error-red underline decoration-dotted underline-offset-2"
                        >
                          {erasing === g._id ? "Erasing…" : "Erase data"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

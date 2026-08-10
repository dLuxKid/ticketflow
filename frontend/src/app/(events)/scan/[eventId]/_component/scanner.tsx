"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { scanTicket } from "@/utils/actions";
import PageHeader from "@/components/ui/page-header";
import { eventTabs } from "@/utils/event-tabs";

/**
 * Door scanner - the usher-facing UI for Phase 2's atomic scan-and-admit endpoint.
 *
 * Uses the browser's native BarcodeDetector API when available (Chrome/Edge/Android) to
 * read a QR code straight from the camera feed - no extra dependency, since installing one
 * on this project's shared node_modules has twice caused real corruption this session (see
 * IMPLEMENTATION_PROMPT.md / commit history). Manual code entry is ALWAYS available
 * alongside the camera, not just as a fallback for unsupported browsers (Safari/Firefox
 * don't implement BarcodeDetector yet) - it's also how you'd demo this without a printed
 * QR in front of a camera.
 */

type ScanResult = {
  outcome: "admitted";
  ticketType?: string;
  name?: string;
  /** Admitted past the venue's safe occupancy, on a supervisor's authority. */
  overridden?: boolean;
} | null;

type ScanError = { message: string } | null;

/**
 * A refusal the usher can act on rather than just read: the venue is at its safe occupancy,
 * and a supervisor may admit anyway. Held separately from `error` because it must NOT clear
 * on the usual timer - the guest is standing there and the decision belongs to a person.
 */
type CapacityPrompt = { code: string } | null;

const SCAN_INTERVAL_MS = 400;
const RESULT_DISPLAY_MS = 2500;

// BarcodeDetector isn't in the standard lib.dom.d.ts yet in every TS/lib version.
type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

export default function Scanner({
  eventId,
  hasGuestList = false,
}: {
  eventId: string;
  /** Whether this event has a guest list, so the tab strip can omit it. */
  hasGuestList?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanningRef = useRef(false);
  const cooldownRef = useRef(false);

  const [cameraSupported, setCameraSupported] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [error, setError] = useState<ScanError>(null);
  const [capacityPrompt, setCapacityPrompt] = useState<CapacityPrompt>(null);

  const submitCode = useCallback(
    async (code: string, overrideCapacity = false) => {
      const trimmed = code.trim();
      if (!trimmed || cooldownRef.current) return;
      cooldownRef.current = true;
      setBusy(true);
      setResult(null);
      setError(null);
      setCapacityPrompt(null);

      const res = await scanTicket(trimmed, undefined, overrideCapacity);
      setBusy(false);

      if (res?.status === "success") {
        setResult({
          outcome: "admitted",
          ticketType: res.data?.booking?.ticketType,
          name: res.data?.booking?.name,
          overridden: overrideCapacity,
        });
      } else if (res?.code === "at_capacity") {
        // Branching on the server's stable code, not its wording. Hold the scanner here:
        // no auto-clear and no cooldown release, so the camera cannot admit the next person
        // in the queue while this decision is still open.
        setCapacityPrompt({ code: trimmed });
        return;
      } else {
        setError({ message: res?.message ?? "Scan failed. Try again." });
      }

      setTimeout(() => {
        setResult(null);
        setError(null);
        cooldownRef.current = false;
      }, RESULT_DISPLAY_MS);
    },
    [],
  );

  /** Supervisor confirmed: re-scan the same code, this time authorising the override. */
  const confirmOverride = useCallback(() => {
    const pending = capacityPrompt;
    if (!pending) return;
    setCapacityPrompt(null);
    cooldownRef.current = false; // release so submitCode is not rejected by its own guard
    void submitCode(pending.code, true);
  }, [capacityPrompt, submitCode]);

  const cancelOverride = useCallback(() => {
    setCapacityPrompt(null);
    cooldownRef.current = false;
  }, []);

  // Camera + BarcodeDetector loop
  useEffect(() => {
    const BarcodeDetectorCtor = (
      window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike }
    ).BarcodeDetector;

    if (!BarcodeDetectorCtor) {
      setCameraSupported(false);
      return;
    }
    setCameraSupported(true);
    detectorRef.current = new BarcodeDetectorCtor({ formats: ["qr_code"] });

    let stream: MediaStream | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }

        intervalId = setInterval(async () => {
          if (scanningRef.current || cooldownRef.current || !videoRef.current) return;
          scanningRef.current = true;
          try {
            const codes = await detectorRef.current!.detect(videoRef.current);
            if (codes.length > 0) {
              void submitCode(codes[0].rawValue);
            }
          } catch {
            // A single failed detection frame isn't worth surfacing to the usher.
          } finally {
            scanningRef.current = false;
          }
        }, SCAN_INTERVAL_MS);
      })
      .catch(() => {
        setCameraError(
          "Camera access was denied or unavailable. Use manual code entry below.",
        );
      });

    return () => {
      if (intervalId) clearInterval(intervalId);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [submitCode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitCode(manualCode);
    setManualCode("");
  };

  return (
    <section className="flex-center flex-col w-full max-w-screen-sm mx-auto gap-6 py-10 px-4">
      <PageHeader
        eyebrow="TicketFlow"
        title="Scan tickets"
        subtitle="Point the camera at a guest's QR code, or type their code below."
        tabs={eventTabs(eventId, "scan", hasGuestList)}
      />

      {cameraSupported ? (
        <div className="relative w-full aspect-square max-w-sm rounded-big overflow-hidden bg-main-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 border-4 border-main-purple/60 rounded-big pointer-events-none" />
        </div>
      ) : (
        <div className="w-full rounded-big bg-main-grey-bg p-6 text-center">
          <p className="body-text text-main-black/70">
            This browser doesn&apos;t support in-browser QR scanning. Use manual code entry
            below.
          </p>
        </div>
      )}

      {cameraError && (
        <p role="alert" className="error-text">
          {cameraError}
        </p>
      )}

      <form onSubmit={handleManualSubmit} className="w-full flex gap-3">
        <label htmlFor="manual-code" className="sr-only">
          Ticket code
        </label>
        <input
          id="manual-code"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Enter ticket code manually"
          className="flex-1 rounded-md border border-main-purple bg-sec-grey px-4 h-12 text-sm text-main-black"
        />
        <button
          type="submit"
          disabled={busy || manualCode.trim() === ""}
          className="bg-main-purple text-main-white px-6 rounded-big font-medium shrink-0"
        >
          {busy ? "Checking…" : "Admit"}
        </button>
      </form>

      {capacityPrompt && (
        <div
          role="alertdialog"
          aria-modal="false"
          aria-labelledby="capacity-title"
          aria-describedby="capacity-desc"
          className="w-full rounded-big bg-amber-50 border-2 border-amber-500 p-6 text-center"
        >
          <p id="capacity-title" className="text-2xl font-bold text-amber-900">
            ⚠ Venue at capacity
          </p>
          <p id="capacity-desc" className="mt-2 body-text text-amber-900/80">
            This event has reached its safe occupancy limit. Admitting another
            person exceeds it. Only continue if a supervisor authorises it -
            the override is recorded against your account.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={cancelOverride}
              className="px-6 h-12 rounded-big border border-main-black/20 font-medium text-main-black focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              Do not admit
            </button>
            <button
              type="button"
              onClick={confirmOverride}
              disabled={busy}
              className="px-6 h-12 rounded-big bg-amber-600 text-main-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-700"
            >
              {busy ? "Admitting…" : "Override and admit"}
            </button>
          </div>
        </div>
      )}

      <div aria-live="assertive" role="status" className="w-full">
        {result && (
          <div
            className={`w-full rounded-big p-6 text-center border ${
              result.overridden
                ? "bg-amber-50 border-amber-300"
                : "bg-green-50 border-green-200"
            }`}
          >
            <p
              className={`text-2xl font-bold ${
                result.overridden ? "text-amber-900" : "text-green-700"
              }`}
            >
              {result.overridden ? "✓ Admitted over capacity" : "✓ Admitted"}
            </p>
            {result.name && (
              <p
                className={`mt-1 body-text ${
                  result.overridden ? "text-amber-900/80" : "text-green-800"
                }`}
              >
                {result.name}
                {result.ticketType ? ` - ${result.ticketType}` : ""}
              </p>
            )}
            {result.overridden && (
              <p className="mt-2 text-sm text-amber-900/70">
                Recorded as a capacity override in the event audit log.
              </p>
            )}
          </div>
        )}
        {error && (
          <div className="w-full rounded-big bg-main-error-red/5 border border-main-error-red/30 p-6 text-center">
            <p className="text-2xl font-bold text-main-error-red">✕ Rejected</p>
            <p className="mt-1 body-text text-main-black/70">{error.message}</p>
          </div>
        )}
      </div>
    </section>
  );
}

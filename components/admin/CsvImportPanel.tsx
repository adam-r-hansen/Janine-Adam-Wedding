"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import Panel from "@/components/Panel";
import {
  confirmCsvImport,
  previewCsvImport,
  type ImportPreview,
} from "@/app/admin/(dashboard)/guest-list/actions";

interface ImportResults {
  partiesCreated: number;
  guestsAdded: number;
  duplicatesSkipped: number;
}

export default function CsvImportPanel() {
  const [csvText, setCsvText] = useState("");
  const [previewedText, setPreviewedText] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStale = preview !== null && previewedText !== csvText;

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ""));
      setPreview(null);
      setResults(null);
      setError(null);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handlePreview() {
    setError(null);
    setResults(null);
    startTransition(async () => {
      const result = await previewCsvImport(csvText);
      if ("preview" in result) {
        setPreview(result.preview);
        setPreviewedText(csvText);
      } else {
        setError(result.error);
        setPreview(null);
      }
    });
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmCsvImport(csvText);
      if ("results" in result) {
        setResults(result.results);
        setPreview(null);
        setPreviewedText(null);
        setCsvText("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Panel className="flex flex-col gap-4 p-5 sm:p-6">
      <div>
        <h3 className="font-heading text-lg text-accent">Import from CSV</h3>
        <p className="mt-1 text-sm text-foreground/70">
          Two columns: <code>party</code> and <code>full_name</code>, one row
          per person. Safe to run more than once — existing parties and
          guests won&apos;t be duplicated.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={handleFileChange}
          className="hidden"
          id="csv-file-input"
        />
        <label
          htmlFor="csv-file-input"
          className="w-fit cursor-pointer rounded-full border border-dahlia/20 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 dark:border-cream/20"
        >
          Upload a CSV file
        </label>
        <span className="text-xs text-foreground/60">or paste it below</span>
      </div>

      <textarea
        value={csvText}
        onChange={(e) => {
          setCsvText(e.target.value);
          setResults(null);
        }}
        placeholder={"party,full_name\nThe Smith Family,Jane Smith\nThe Smith Family,John Smith"}
        rows={6}
        className="rounded-lg border border-dahlia/20 bg-cream px-3 py-2 font-mono text-xs text-foreground dark:border-cream/20 dark:bg-night"
      />

      {error && (
        <p className="text-sm font-medium text-dahlia dark:text-ember">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handlePreview}
          disabled={isPending || csvText.trim() === ""}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream disabled:opacity-60 dark:text-night"
        >
          Preview Import
        </button>
        {preview && !isStale && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-full border border-dahlia/20 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-60 dark:border-cream/20"
          >
            Confirm Import
          </button>
        )}
      </div>

      {isStale && (
        <p className="text-xs italic text-foreground/60">
          The text changed — preview it again before confirming.
        </p>
      )}

      {results && (
        <Panel className="p-4">
          <p className="text-sm font-medium text-pine">
            Done — {results.partiesCreated} new{" "}
            {results.partiesCreated === 1 ? "party" : "parties"},{" "}
            {results.guestsAdded} new{" "}
            {results.guestsAdded === 1 ? "guest" : "guests"} added,{" "}
            {results.duplicatesSkipped} skipped as{" "}
            {results.duplicatesSkipped === 1 ? "a duplicate" : "duplicates"}.
          </p>
        </Panel>
      )}

      {preview && !isStale && (
        <div className="flex flex-col gap-3 border-t border-dahlia/10 pt-4 dark:border-cream/10">
          <p className="text-sm font-medium text-foreground/90">
            Found {preview.totals.parties}{" "}
            {preview.totals.parties === 1 ? "party" : "parties"} (
            {preview.totals.newParties} new) and {preview.totals.guests}{" "}
            {preview.totals.guests === 1 ? "person" : "people"} (
            {preview.totals.newGuests} new,{" "}
            {preview.totals.duplicates} already on the list).
          </p>

          {preview.problems.length > 0 && (
            <div className="rounded-lg border border-dahlia/20 p-3 dark:border-cream/20">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/70">
                Problem rows — not imported
              </p>
              <ul className="mt-1 flex flex-col gap-0.5 text-xs text-foreground/80">
                {preview.problems.map((problem, i) => (
                  <li key={i}>
                    Line {problem.line}: {problem.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {preview.parties.map((party) => (
              <div
                key={party.label}
                className="rounded-lg border border-dahlia/10 p-3 dark:border-cream/10"
              >
                <p className="text-sm font-medium text-accent">
                  {party.label}
                  {party.isNewParty && (
                    <span className="ml-2 rounded-full bg-gold/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-night/70">
                      New party
                    </span>
                  )}
                </p>
                <ul className="mt-1 flex flex-col gap-0.5 text-xs text-foreground/80">
                  {party.guests.map((guest, i) => (
                    <li key={i}>
                      {guest.fullName}
                      {guest.isDuplicate && (
                        <span className="ml-2 italic text-foreground/50">
                          already on the list — will be skipped
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

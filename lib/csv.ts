// A small hand-rolled CSV reader for the guest-list import — real
// spreadsheet exports need: quoted fields that contain commas (with ""
// as an escaped quote inside them), a header row in any capitalization,
// blank/trailing rows, and stray whitespace around values.

export interface CsvRow {
  party: string;
  fullName: string;
}

export interface CsvParseProblem {
  line: number;
  reason: string;
}

export interface CsvParseResult {
  rows: CsvRow[];
  problems: CsvParseProblem[];
}

export function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export function parseGuestListCsv(text: string): CsvParseResult {
  const allLines = text.split(/\r\n|\r|\n/);
  const rows: CsvRow[] = [];
  const problems: CsvParseProblem[] = [];

  let partyIndex = 0;
  let nameIndex = 1;
  let headerLineIndex: number | null = null;

  // Only the first non-blank line is ever considered as a possible header.
  for (let i = 0; i < allLines.length; i++) {
    if (allLines[i].trim() === "") continue;
    const fields = splitCsvLine(allLines[i]).map((f) => f.trim().toLowerCase());
    const pIdx = fields.indexOf("party");
    const nIdx = fields.indexOf("full_name");
    if (pIdx !== -1 && nIdx !== -1) {
      partyIndex = pIdx;
      nameIndex = nIdx;
      headerLineIndex = i;
    }
    break;
  }

  for (let i = 0; i < allLines.length; i++) {
    if (i === headerLineIndex) continue;

    const rawLine = allLines[i];
    if (rawLine.trim() === "") continue;

    const fields = splitCsvLine(rawLine).map((f) => f.trim());
    const party = fields[partyIndex] ?? "";
    const fullName = fields[nameIndex] ?? "";

    if (!party && !fullName) continue;

    if (!party || !fullName) {
      problems.push({
        line: i + 1,
        reason: !party ? "Missing party name" : "Missing person's name",
      });
      continue;
    }

    rows.push({ party, fullName });
  }

  return { rows, problems };
}

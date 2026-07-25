/**
 * Minimal CSV parser for a guest list. Pure and dependency-free so it is trivially
 * unit-tested. Accepts an optional header row (name,email,vip,plusOnes in any order); if no
 * header is detected the columns are assumed to be name,email,vip,plusOnes.
 *
 * Quoted fields (allowing embedded commas) and CRLF line endings are supported. Blank lines
 * are skipped. Rows missing a name or email are returned in `invalid` rather than thrown, so
 * the caller can report them without failing the whole import.
 *
 * @param {string} text - raw CSV
 * @returns {{ guests: Array<{name,email,vip,plusOnes}>, invalid: Array<{line:number,raw:string}> }}
 */
export const parseGuestCsv = (text) => {
  const guests = [];
  const invalid = [];
  if (!text || typeof text !== 'string') return { guests, invalid };

  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { guests, invalid };

  let start = 0;
  let order = ['name', 'email', 'vip', 'plusOnes'];

  const firstCells = splitCsvLine(lines[0]).map((c) => c.trim().toLowerCase());
  const looksLikeHeader =
    firstCells.includes('name') || firstCells.includes('email');
  if (looksLikeHeader) {
    order = firstCells;
    start = 1;
  }

  for (let i = start; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const row = {};
    order.forEach((key, idx) => {
      row[key] = (cells[idx] ?? '').trim();
    });

    const name = row.name?.trim();
    const email = row.email?.trim().toLowerCase();
    if (!name || !email) {
      invalid.push({ line: i + 1, raw: lines[i] });
      continue;
    }

    guests.push({
      name,
      email,
      vip: /^(true|yes|1|vip)$/i.test(row.vip ?? ''),
      plusOnes: Number.parseInt(row.plusOnes, 10) || 0,
    });
  }

  return { guests, invalid };
};

/** Splits a single CSV line, honouring double-quoted fields. */
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

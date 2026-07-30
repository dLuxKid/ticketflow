import * as XLSX from "xlsx";

export interface GuestRow {
  name: string;
  email: string;
  vip: boolean;
  plusOnes: number;
}

export const readGuestsFromFile = async (file: File): Promise<GuestRow[]> => {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error("The file appears to be empty.");
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    if (rows.length === 0) {
      throw new Error("No data rows found in the spreadsheet.");
    }

    const guests = rows
      .map(parseGuestRow)
      .filter((guest): guest is GuestRow => guest !== null);

    if (guests.length === 0) {
      throw new Error(
        "No valid guest entries found. Ensure your spreadsheet has 'Name' and 'Email' columns with at least one complete row.",
      );
    }

    return guests;
  } catch (error) {
    if (error instanceof Error) {
      throw error; // Re-throw with original message
    }
    throw new Error(
      "Couldn't read that file. Use a .xlsx, .xls or .csv spreadsheet.",
    );
  }
};

export const parseGuestRow = (
  row: Record<string, unknown>,
): GuestRow | null => {
  const name = extractColumnValue(row, ["name", "full name", "guest name"]);
  const email = extractColumnValue(row, ["email", "e-mail", "email address"]);

  if (!name || !email) return null;

  const vipValue = extractColumnValue(row, ["vip"]);
  const vip = /^(true|yes|1|vip)$/i.test(vipValue);

  const plusOnesValue = extractColumnValue(row, [
    "plusones",
    "plus ones",
    "+1s",
  ]);
  const plusOnes = Math.max(0, Number.parseInt(plusOnesValue, 10) || 0);

  return { name, email, vip, plusOnes };
};

export const extractColumnValue = (
  row: Record<string, unknown>,
  columnVariations: string[],
): string => {
  const lowerVariations = columnVariations.map((col) => col.toLowerCase());
  const foundKey = Object.keys(row).find((key) =>
    lowerVariations.includes(key.toLowerCase()),
  );
  return foundKey ? String(row[foundKey]).trim() : "";
};

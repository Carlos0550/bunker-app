export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
export function normalizeProductName(name: string): string {
  return normalizeText(name);
}
export function areTextsEqual(text1: string, text2: string): boolean {
  return normalizeText(text1) === normalizeText(text2);
}

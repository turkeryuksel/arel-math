export function isValidNumericAnswer(value: number | string): boolean {
  const text = String(value).trim();
  return /^-?\d+(?:[.,]\d+)?$/.test(text) && Number.isFinite(Number(text.replace(",", ".")));
}

/** Compare ordinary decimal answers without accepting JavaScript number syntax. */
export function isAnswerCorrect(given: number | string, expected: number | string): boolean {
  const normalize = (value: number | string) => String(value).trim().toLocaleLowerCase("tr-TR");
  const actual = normalize(given);
  const target = normalize(expected);
  if (!actual || !target) return false;
  if (isValidNumericAnswer(actual) && isValidNumericAnswer(target)) {
    const a = Number(actual.replace(",", "."));
    const b = Number(target.replace(",", "."));
    return Number.isFinite(a) && Number.isFinite(b) && a === b;
  }
  return actual === target;
}

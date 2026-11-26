/** Zufallshilfen ohne crypto.randomUUID (fehlt auf älteren Handys). */

export function randomInt(maxExclusive: number): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

export function randomHex(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += randomInt(16).toString(16);
  return out;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Buchstaben ohne die verwechselbaren O und I (Ziffern kommen gar nicht vor). */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_BLOCKLIST = /SS|HH|SA|FUCK|CUNT|HURE|KACK|KOTZ|ANAL|SEX|PUFF|NUTT|FUT|DRECK|ARSCH/;

export function makeRoomCode(): string {
  for (;;) {
    let code = '';
    for (let i = 0; i < 4; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    if (!CODE_BLOCKLIST.test(code)) return code;
  }
}

/** Normalisiert Eingaben wie „ab cd“ oder „AB0D“ zu einem gültigen Code (oder ''). */
export function normalizeRoomCode(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .filter((c) => CODE_ALPHABET.includes(c))
    .join('')
    .slice(0, 4);
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z]{4}$/.test(code) && code.split('').every((c) => CODE_ALPHABET.includes(c));
}

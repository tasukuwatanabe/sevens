const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}

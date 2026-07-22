/**
 * UUID v4 generator for client-side ids (dev/mock persistence). Production ids come from Postgres
 * `gen_random_uuid()`. Uses Math.random — acceptable for local dev, not for cryptographic use.
 */
export function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

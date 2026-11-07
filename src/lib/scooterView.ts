/** In-memory map instance and monotonic request number; never a stored user identifier. */
export function scooterView(value: string | null | undefined): { id: string; sequence: number } | undefined {
  const match = value?.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.([1-9][0-9]{0,11})$/);
  return match ? { id: match[1], sequence: Number(match[2]) } : undefined;
}

/** Drops measurements that were cleared (stored as null). */
export function cleanMeasurements<T extends { measurements?: unknown }>(
  profile: T
): T {
  const m = (profile.measurements ?? {}) as Record<string, number | null>
  return {
    ...profile,
    measurements: Object.fromEntries(
      Object.entries(m).filter(([, v]) => v !== null && v !== undefined)
    ),
  }
}

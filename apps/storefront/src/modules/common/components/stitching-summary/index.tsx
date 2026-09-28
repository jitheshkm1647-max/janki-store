const MODE_LABEL: Record<string, string> = {
  saved_profile: "Saved measurements",
  studio_visit: "Measured at the studio",
  sample_garment: "Fit copied from your garment",
}

/** Short summary of custom stitching details stored on a cart/order line. */
export default function StitchingSummary({
  metadata,
}: {
  metadata?: Record<string, unknown> | null
}) {
  if (!metadata?.stitching) {
    return null
  }

  const mode = String(metadata.measurement_mode ?? "")
  const profile = metadata.measurement_profile_name as string | undefined
  const notes = metadata.design_notes as string | undefined
  const neededBy = metadata.needed_by as string | undefined

  return (
    <div
      className="mt-1 flex flex-col gap-0.5 text-[12.5px] text-janki-muted"
      data-testid="stitching-summary"
    >
      <span>
        <span className="font-semibold text-janki-wine">Custom fit</span>
        {" · "}
        {MODE_LABEL[mode] ?? "Measurements to follow"}
        {profile ? ` (${profile})` : ""}
      </span>
      {notes && <span className="line-clamp-2">Notes: {notes}</span>}
      {neededBy && (
        <span>
          Needed by{" "}
          {new Date(neededBy).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      )}
    </div>
  )
}

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { MEASUREMENT_LABELS } from "../lib/api"

type StitchingMeta = {
  stitching?: boolean
  measurement_mode?: string
  measurement_profile_name?: string
  measurements?: Record<string, number>
  measurement_unit?: string
  design_notes?: string
  reference_link?: string
  needed_by?: string
}

const OrderStitchingWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const items = (order.items ?? []).filter(
    (i) => (i.metadata as StitchingMeta | null)?.stitching
  )

  if (!items.length) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Custom stitching job cards</Heading>
      </div>
      {items.map((item) => {
        const m = item.metadata as StitchingMeta
        return (
          <div key={item.id} className="px-6 py-4">
            <Text weight="plus">
              {item.product_title} · {item.variant_title}
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Measurements:{" "}
              {m.measurement_mode === "studio_visit"
                ? "Customer will visit the studio"
                : m.measurement_mode === "sample_garment"
                  ? "Customer will send a well-fitting sample garment"
                  : `Saved profile "${m.measurement_profile_name ?? ""}" (${m.measurement_unit ?? "in"})`}
            </Text>
            {m.measurements && (
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                {Object.entries(m.measurements).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <Text size="small" className="text-ui-fg-subtle">
                      {MEASUREMENT_LABELS[k] ?? k}
                    </Text>
                    <Text size="small">{v}</Text>
                  </div>
                ))}
              </div>
            )}
            {m.design_notes && (
              <Text size="small" className="mt-2">
                Design notes: {m.design_notes}
              </Text>
            )}
            {m.reference_link && (
              <Text size="small">Reference: {m.reference_link}</Text>
            )}
            {m.needed_by && (
              <Text size="small">
                Needed by: {new Date(m.needed_by).toLocaleDateString("en-IN")}
              </Text>
            )}
          </div>
        )
      })}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderStitchingWidget

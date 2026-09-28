import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminCustomer, DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { adminFetch, MEASUREMENT_LABELS } from "../lib/api"

type Profile = {
  id: string
  name: string
  unit: string
  measurements: Record<string, number>
  notes: string | null
  updated_at: string
}

const CustomerMeasurementsWidget = ({
  data: customer,
}: DetailWidgetProps<AdminCustomer>) => {
  const { data, isLoading } = useQuery({
    queryKey: ["customer-measurements", customer.id],
    queryFn: () =>
      adminFetch<{ measurement_profiles: Profile[] }>(
        `/admin/customers/${customer.id}/measurements`
      ),
  })

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Measurements</Heading>
      </div>
      {isLoading && <Text className="px-6 py-4">Loading...</Text>}
      {data?.measurement_profiles.length === 0 && (
        <Text className="px-6 py-4 text-ui-fg-subtle" size="small">
          No saved measurements.
        </Text>
      )}
      {data?.measurement_profiles.map((p) => (
        <div key={p.id} className="px-6 py-4">
          <Text weight="plus">
            {p.name}{" "}
            <span className="text-ui-fg-subtle">({p.unit === "cm" ? "cm" : "inches"})</span>
          </Text>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
            {Object.entries(p.measurements).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <Text size="small" className="text-ui-fg-subtle">
                  {MEASUREMENT_LABELS[k] ?? k}
                </Text>
                <Text size="small">{v}</Text>
              </div>
            ))}
          </div>
          {p.notes && (
            <Text size="small" className="mt-2 text-ui-fg-subtle">
              {p.notes}
            </Text>
          )}
        </div>
      ))}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "customer.details.after",
})

export default CustomerMeasurementsWidget

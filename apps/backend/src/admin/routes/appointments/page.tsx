import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CalendarSolid } from "@medusajs/icons"
import {
  Badge,
  Container,
  Heading,
  Select,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { adminFetch, APPOINTMENT_TYPE_LABELS } from "../../lib/api"

type Appointment = {
  id: string
  type: string
  status: string
  name: string
  phone: string
  email: string | null
  preferred_date: string
  preferred_slot: string
  event_date: string | null
  budget_range: string | null
  notes: string | null
}

const STATUSES = ["requested", "confirmed", "completed", "cancelled", "no_show"]

const statusColor: Record<string, "orange" | "green" | "blue" | "red" | "grey"> = {
  requested: "orange",
  confirmed: "blue",
  completed: "green",
  cancelled: "grey",
  no_show: "red",
}

const AppointmentsPage = () => {
  const [status, setStatus] = useState<string>("all")
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", status],
    queryFn: () =>
      adminFetch<{ appointments: Appointment[]; count: number }>(
        `/admin/appointments?limit=200${status !== "all" ? `&status=${status}` : ""}`
      ),
  })

  const update = useMutation({
    mutationFn: (vars: { id: string; status: string }) =>
      adminFetch(`/admin/appointments/${vars.id}`, {
        method: "POST",
        body: { status: vars.status },
      }),
    onSuccess: () => {
      toast.success("Appointment updated")
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Appointments</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Bridal consultations, measurement visits and fittings booked from
            the website.
          </Text>
        </div>
        <div className="w-48">
          <Select value={status} onValueChange={setStatus}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All statuses</Select.Item>
              {STATUSES.map((s) => (
                <Select.Item key={s} value={s}>
                  {s.replace("_", " ")}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Event date</Table.HeaderCell>
              <Table.HeaderCell>Notes</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading && (
              <Table.Row>
                <Table.Cell>Loading...</Table.Cell>
              </Table.Row>
            )}
            {data?.appointments.map((a) => (
              <Table.Row key={a.id}>
                <Table.Cell>
                  {new Date(a.preferred_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {a.preferred_slot}
                  </Text>
                </Table.Cell>
                <Table.Cell>{APPOINTMENT_TYPE_LABELS[a.type] ?? a.type}</Table.Cell>
                <Table.Cell>
                  {a.name}
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {a.phone}
                    {a.email ? ` · ${a.email}` : ""}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  {a.event_date
                    ? new Date(a.event_date).toLocaleDateString("en-IN")
                    : "-"}
                  {a.budget_range && (
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      Budget {a.budget_range}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell className="max-w-xs whitespace-normal">
                  {a.notes ?? "-"}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Badge color={statusColor[a.status] ?? "grey"} size="2xsmall">
                      {a.status.replace("_", " ")}
                    </Badge>
                    <Select
                      size="small"
                      value={a.status}
                      onValueChange={(v) => update.mutate({ id: a.id, status: v })}
                    >
                      <Select.Trigger className="w-32">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {STATUSES.map((s) => (
                          <Select.Item key={s} value={s}>
                            {s.replace("_", " ")}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
            {data && data.appointments.length === 0 && (
              <Table.Row>
                <Table.Cell>No appointments yet.</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Appointments",
  icon: CalendarSolid,
})

export default AppointmentsPage

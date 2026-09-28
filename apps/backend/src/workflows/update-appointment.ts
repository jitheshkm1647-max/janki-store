import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import {
  updateAppointmentStep,
  UpdateAppointmentStepInput,
} from "./steps/update-appointment"

export const updateAppointmentWorkflow = createWorkflow(
  "update-appointment",
  (input: UpdateAppointmentStepInput) => {
    const appointment = updateAppointmentStep(input)

    const eventData = transform({ appointment }, ({ appointment }) => ({
      id: appointment.id,
      status: appointment.status,
    }))

    emitEventStep({
      eventName: "appointment.updated",
      data: eventData,
    })

    return new WorkflowResponse(appointment)
  }
)

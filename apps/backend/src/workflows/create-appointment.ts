import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import {
  createAppointmentStep,
  CreateAppointmentStepInput,
} from "./steps/create-appointment"

export const createAppointmentWorkflow = createWorkflow(
  "create-appointment",
  (input: CreateAppointmentStepInput) => {
    const appointment = createAppointmentStep(input)

    const eventData = transform({ appointment }, ({ appointment }) => ({
      id: appointment.id,
    }))

    emitEventStep({
      eventName: "appointment.created",
      data: eventData,
    })

    return new WorkflowResponse(appointment)
  }
)

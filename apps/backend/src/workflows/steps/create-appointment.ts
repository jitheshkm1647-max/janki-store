import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { STITCHING_MODULE } from "../../modules/stitching"
import StitchingModuleService from "../../modules/stitching/service"

export type CreateAppointmentStepInput = {
  type: string
  name: string
  phone: string
  email?: string | null
  customer_id?: string | null
  preferred_date: Date
  preferred_slot: string
  event_date?: Date | null
  budget_range?: string | null
  notes?: string | null
}

export const createAppointmentStep = createStep(
  "create-appointment",
  async (input: CreateAppointmentStepInput, { container }) => {
    const service: StitchingModuleService = container.resolve(STITCHING_MODULE)
    const appointment = await service.createAppointments(input as never)
    return new StepResponse(appointment, appointment.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: StitchingModuleService = container.resolve(STITCHING_MODULE)
    await service.deleteAppointments(id)
  }
)

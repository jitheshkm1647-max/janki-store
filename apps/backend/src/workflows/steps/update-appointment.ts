import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { STITCHING_MODULE } from "../../modules/stitching"
import StitchingModuleService from "../../modules/stitching/service"

export type UpdateAppointmentStepInput = {
  id: string
  status?: string
  preferred_date?: Date
  preferred_slot?: string
  staff_notes?: string | null
}

export const updateAppointmentStep = createStep(
  "update-appointment",
  async (input: UpdateAppointmentStepInput, { container }) => {
    const service: StitchingModuleService = container.resolve(STITCHING_MODULE)
    const previous = await service.retrieveAppointment(input.id)
    const updated = await service.updateAppointments(input as never)
    return new StepResponse(updated, previous)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const service: StitchingModuleService = container.resolve(STITCHING_MODULE)
    await service.updateAppointments({
      id: previous.id,
      status: previous.status,
      preferred_date: previous.preferred_date,
      preferred_slot: previous.preferred_slot,
      staff_notes: previous.staff_notes,
    } as never)
  }
)

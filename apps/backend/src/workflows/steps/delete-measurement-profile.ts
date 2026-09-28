import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { STITCHING_MODULE } from "../../modules/stitching"
import StitchingModuleService from "../../modules/stitching/service"

export const deleteMeasurementProfileStep = createStep(
  "delete-measurement-profile",
  async (input: { id: string; customer_id: string }, { container }) => {
    const service: StitchingModuleService = container.resolve(STITCHING_MODULE)
    const profile = await service.retrieveMeasurementProfile(input.id)
    if (profile.customer_id !== input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Measurement profile not found"
      )
    }
    await service.softDeleteMeasurementProfiles(input.id)
    return new StepResponse(input.id, input.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: StitchingModuleService = container.resolve(STITCHING_MODULE)
    await service.restoreMeasurementProfiles(id)
  }
)

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { STITCHING_MODULE } from "../../modules/stitching"
import StitchingModuleService from "../../modules/stitching/service"

export type UpsertMeasurementProfileStepInput = {
  id?: string
  customer_id: string
  name: string
  unit: "in" | "cm"
  measurements: Record<string, number>
  notes?: string | null
}

type ProfileSnapshot = {
  id: string
  name: string
  unit: "in" | "cm"
  measurements: Record<string, unknown>
  notes: string | null
}

type Compensation = { createdId?: string; previous?: ProfileSnapshot }

export type MeasurementProfileResult = ProfileSnapshot & {
  customer_id: string
}

export const upsertMeasurementProfileStep = createStep(
  "upsert-measurement-profile",
  async (
    input: UpsertMeasurementProfileStepInput,
    { container }
  ): Promise<StepResponse<MeasurementProfileResult, Compensation>> => {
    const service: StitchingModuleService = container.resolve(STITCHING_MODULE)

    if (!input.id) {
      const created = await service.createMeasurementProfiles({
        customer_id: input.customer_id,
        name: input.name,
        unit: input.unit,
        measurements: input.measurements,
        notes: input.notes ?? null,
      })
      return new StepResponse(
        created as MeasurementProfileResult,
        { createdId: created.id }
      )
    }

    const previous = await service.retrieveMeasurementProfile(input.id)
    if (previous.customer_id !== input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Measurement profile not found"
      )
    }

    // JSON columns are merged on update, so clear measurements that were
    // removed in the form by setting them to null explicitly.
    const cleared = Object.fromEntries(
      Object.keys((previous.measurements ?? {}) as Record<string, unknown>).map(
        (key) => [key, null]
      )
    )

    const updated = await service.updateMeasurementProfiles({
      id: input.id,
      name: input.name,
      unit: input.unit,
      measurements: { ...cleared, ...input.measurements },
      notes: input.notes ?? null,
    })

    return new StepResponse(updated as MeasurementProfileResult, {
      previous: {
        id: previous.id,
        name: previous.name,
        unit: previous.unit,
        measurements: previous.measurements as Record<string, unknown>,
        notes: previous.notes,
      },
    })
  },
  async (comp: Compensation | undefined, { container }) => {
    if (!comp) {
      return
    }
    const service: StitchingModuleService = container.resolve(STITCHING_MODULE)
    if (comp.createdId) {
      await service.deleteMeasurementProfiles(comp.createdId)
    }
    if (comp.previous) {
      await service.updateMeasurementProfiles(comp.previous)
    }
  }
)

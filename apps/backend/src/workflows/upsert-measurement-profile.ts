import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  upsertMeasurementProfileStep,
  UpsertMeasurementProfileStepInput,
} from "./steps/upsert-measurement-profile"

export const upsertMeasurementProfileWorkflow = createWorkflow(
  "upsert-measurement-profile",
  (input: UpsertMeasurementProfileStepInput) => {
    const profile = upsertMeasurementProfileStep(input)
    return new WorkflowResponse(profile)
  }
)
